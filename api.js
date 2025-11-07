// --- File: app.js ---
// នេះគឺជា Controller ស្នូល (Main) សម្រាប់កម្មវិធីទាំងមូល

// --- 1. Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import * as UI from './app-ui.js';
import * as Store from './app-firestore.js';
import * as FaceScanner from './face-scanner.js';
import * as API from './api.js';
import * as Utils from './utils.js'; // ប្រើសម្រាប់ Geolocation

// --- 2. Global State ---
let db, auth;
let currentUser = null;
let allUsersData = [];
let selectedUserId = null;
let currentReturnRequestId = null;
let historyUnsubscribe = null;
let outHistoryUnsubscribe = null;
let isEditing = false; // គ្រប់គ្រង State របស់ Edit Modal

// --- Hard-coded Configs (Local) ---
const firebaseConfig = { apiKey: "AIzaSyDjr_Ha2RxOWEumjEeSdluIW3JmyM76mVk", authDomain: "dipermisstion.firebaseapp.com", projectId: "dipermisstion", storageBucket: "dipermisstion.firebasestorage.app", messagingSenderId: "512999406057", appId: "1:512999406057:web:953a281ab9dde7a9a0f378", measurementId: "G-KDPHXZ7H4B" };
const allowedAreaCoords = [ [11.417052769150015, 104.76508285291308], [11.417130005964497, 104.76457396198742], [11.413876386899489, 104.76320488118378], [11.41373800267192, 104.76361527709159] ];
const LOCATION_FAILURE_MESSAGE = "ការបញ្ជាក់ចូលមកវិញ បរាជ័យ។ \n\nប្រហែលទូរស័ព្ទអ្នកមានបញ្ហា ការកំណត់បើ Live Location ដូច្នោះអ្នកមានជម្រើសមួយទៀតគឺអ្នកអាចទៅបញ្ជាក់ដោយផ្ទាល់នៅការិយាល័យអគារ B ជាមួយក្រុមការងារលោកគ្រូ ដារ៉ូ។";


// --- 3. Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. ភ្ជាប់ UI Elements ទាំងអស់
    UI.assignElements(); 

    // 2. ភ្ជាប់ Firebase
    try {
        setLogLevel('debug');
        if (!firebaseConfig.projectId) throw new Error("projectId not provided in firebase.initializeApp.");
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // 3. កំណត់ Collection Paths
        const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const leavePath = `/artifacts/${canvasAppId}/public/data/leave_requests`;
        const outPath = `/artifacts/${canvasAppId}/public/data/out_requests`;
        
        // 4. ផ្តួចផ្តើម (Initialize) ម៉ូឌុល Firestore
        Store.initializeFirestore(db, leavePath, outPath);

        // 5. ភ្ជាប់ Event Listeners ទាំងអស់
        bindAppEventListeners();

        // 6. ចាប់ផ្តើម Auth Flow
        setupAuthListener();

        // 7. ព្យាយាម Sign In
        await signInAnonymously(auth);
        console.log("Firebase Auth: Initial Anonymous Sign-In successful (or already signed in).");

    } catch (e) {
        console.error("Critical Firebase Initialization/Auth Error:", e);
        UI.showCriticalError(`Critical Error: មិនអាចតភ្ជាប់ Firebase បានទេ។ ${e.message}។ សូម Refresh ម្ដងទៀត។`);
    }
});

/**
 * ភ្ជាប់ Auth State Listener
 */
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Firebase Auth state changed. User UID:", user.uid);
            
            // ពិនិត្យ In-App Browser
            const isClient = () => { const ua = navigator.userAgent || navigator.vendor || window.opera; return ( (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1) || (ua.indexOf('Twitter') > -1) || (ua.indexOf('Telegram') > -1) || (ua.indexOf('WebView') > -1) || (ua.indexOf('wv') > -1) ); };
            UI.showInAppWarning(isClient());

            if (!isClient()) {
                // 1. ទាញយក Face Models
                if (typeof faceapi !== 'undefined') {
                    FaceScanner.loadFaceApiModels(
                        document.getElementById('model-status'), // ត្រូវតែហៅ (call) Element ដោយផ្ទាល់
                        () => {
                            // === BUG FIX: ពេល Model load រួច, ពិនិត្យប៊ូតុង Scan ឡើងវិញ ===
                            UI.updateScanButtonState(selectedUserId); 
                        }
                    );
                } else {
                    console.error("Face-API.js មិនអាចទាញយកបានត្រឹមត្រូវទេ។");
                    UI.setFaceModelStatus('Error: មិនអាចទាញយក Library ស្កេនមុខបាន');
                }

                // 2. ពិនិត្យ "Remember Me"
                const rememberedUser = localStorage.getItem('leaveAppUser');
                if (rememberedUser) {
                    try {
                        const parsedUser = JSON.parse(rememberedUser);
                        if (parsedUser && parsedUser.id) {
                            console.log("Found remembered user:", parsedUser.id);
                            handleLoginSuccess(parsedUser); // Login ភ្លាម
                            initializeAppFlow(true); // ទាញយក Users នៅ Background
                            return;
                        }
                    } catch (e) { localStorage.removeItem('leaveAppUser'); }
                }

                // 3. User មិនទាន់ Login (Normal Flow)
                console.log("No remembered user found, starting normal app flow.");
                initializeAppFlow(false);
            }

        } else {
            console.log("Firebase Auth: No user signed in. Attempting anonymous sign-in...");
            signInAnonymously(auth).catch(anonError => {
                console.error("Error during automatic anonymous sign-in attempt:", anonError);
                UI.showCriticalError(`Critical Error: មិនអាច Sign In បានទេ។ ${anonError.message}។ សូម Refresh ម្ដងទៀត។`);
            });
        }
    });
}

/**
 * ផ្តួចផ្តើម (Initialize) កម្មវិធី និងទាញយកទិន្នន័យ
 */
function initializeAppFlow(isRememberedUser) {
    console.log(`initializeAppFlow called (remembered: ${isRememberedUser}).`);
    if (!isRememberedUser) {
        UI.setLoginLoading(true);
    }
    handleFetchUsers();
}

/**
 * ភ្ជាប់ (Bind) រាល់ Events ពី UI ទៅកាន់ Controller Functions
 */
function bindAppEventListeners() {
    UI.bindEventListeners(
        (pageId) => UI.navigateTo(pageId), // onNavigate
        handleLogout,                     // onLogout
        handleScanFace,                   // onScanFace
        handleCancelScan,                 // onCancelScan
        // === START: MODIFICATION (Fix Login Error) ===
        handleOpenLeave,                  // onOpenLeave (NEW)
        handleSubmitLeave,                // onSubmitLeave
        () => UI.navigateTo('page-home'), // onCancelLeave
        handleOpenOut,                    // onOpenOut (NEW)
        handleSubmitOut,                  // onSubmitOut
        () => UI.navigateTo('page-home'), // onCancelOut
        // === END: MODIFICATION ===
        UI.openDailyAttendancePage,       // onOpenAttendance
        UI.closeDailyAttendancePage,      // onCloseAttendance
        handleOpenEdit,                   // onOpenEdit
        handleSubmitEdit,                 // onSubmitEdit
        handleCancelEdit,                 // onCancelEdit
        UI.openDeleteModal,               // onOpenDelete
        handleSubmitDelete,               // onSubmitDelete
        UI.closeDeleteModal,              // onCancelDelete
        handleOpenReturn,                 // onOpenReturn
        handleCancelReturn,               // onCancelReturn
        handleOpenInvoice,                // onOpenInvoice
        UI.hideInvoiceModal,              // onCloseInvoice
        UI.shareInvoiceAsImage,           // onShareInvoice
        handleHistoryTap                  // onHistoryTap
    );
}


// --- 4. Controller Functions (The "Glue") ---

/**
 * ទាញយកទិន្នន័យបុគ្គលិកពី API និង Populate Dropdown
 */
async function handleFetchUsers() {
    try {
        allUsersData = await API.fetchUsers();
        UI.populateUserDropdown(allUsersData, (id) => {
            selectedUserId = id;
            FaceScanner.clearReferenceDescriptor();
            // === BUG FIX: ពេល User ជ្រើសរើស, ពិនិត្យប៊ូតុង Scan ឡើងវិញ ===
            UI.updateScanButtonState(selectedUserId); 
        });
        UI.setLoginLoading(false); // លាក់ Loading, បង្ហាញ Form
    } catch (error) {
        console.error("Failed to fetch users:", error);
        UI.setLoginError("Error: មិនអាចទាញយកទិន្នន័យបាន");
    }
}

/**
 * ដំណើរការពេល Login ជោគជ័យ
 */
function handleLoginSuccess(user) {
    currentUser = user;
    const rememberMeCheckbox = document.getElementById('remember-me'); // ត្រូវតែ get element នេះដោយផ្ទាល់
    if (rememberMeCheckbox && rememberMeCheckbox.checked) {
        localStorage.setItem('leaveAppUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('leaveAppUser');
    }
    UI.showLoggedInState(user);
    setupHistoryListeners();
}

/**
 * ដំណើរការពេល Logout
 */
function handleLogout() {
    currentUser = null;
    selectedUserId = null; // សំខាន់
    FaceScanner.clearReferenceDescriptor();
    localStorage.removeItem('leaveAppUser');
    UI.showLoggedOutState(); // នេះនឹង disable ប៊ូតុង Scan
    if (historyUnsubscribe) historyUnsubscribe();
    if (outHistoryUnsubscribe) outHistoryUnsubscribe();
    historyUnsubscribe = null;
    outHistoryUnsubscribe = null;
    isEditing = false;
}

/**
 * ចាប់ផ្តើមស្តាប់ (Listen) ប្រវត្តិ (History) ពី Firestore
 */
function setupHistoryListeners() {
    if (historyUnsubscribe) historyUnsubscribe();
    if (outHistoryUnsubscribe) outHistoryUnsubscribe();

    const userId = currentUser.id;
    if (!userId) return;

    // Listener សម្រាប់ Leave
    historyUnsubscribe = Store.listenToLeaveHistory(
        userId,
        (snapshot) => { // onSnapshotCallback
            UI.renderHistoryList(
                snapshot, 
                document.getElementById('history-container-leave'), 
                document.getElementById('history-placeholder-leave'), 
                'leave',
                () => isEditing // បញ្ជូន Callback function សម្រាប់ពិនិត្យ state
            );
        },
        (error) => { // onErrorCallback
            console.error("Error listening to LEAVE history:", error);
            document.getElementById('history-placeholder-leave').innerHTML = `<p class="text-red-500">Error: មិនអាចទាញយកប្រវត្តិបានទេ</p>`;
        }
    );

    // Listener សម្រាប់ Out
    outHistoryUnsubscribe = Store.listenToOutHistory(
        userId,
        (snapshot) => { // onSnapshotCallback
            UI.renderHistoryList(
                snapshot,
                document.getElementById('history-container-out'),
                document.getElementById('history-placeholder-out'),
                'out',
                () => isEditing // បញ្ជូន Callback function សម្រាប់ពិនិត្យ state
            );
        },
        (error) => { // onErrorCallback
            console.error("Error listening to OUT history:", error);
            document.getElementById('history-placeholder-out').innerHTML = `<p class="text-red-500">Error: មិនអាចទាញយកប្រវត្តិបានទេ</p>`;
        }
    );
}

// --- Event Handlers (ភ្ជាប់ទៅ UI.bindEventListeners) ---

async function handleScanFace() {
    console.log("Controller: handleScanFace");
    if (!selectedUserId) {
        UI.showCustomAlert("Error", "សូមជ្រើសរើសអត្តលេខរបស់អ្នកជាមុនសិន");
        return;
    }
    const user = allUsersData.find(u => u.id === selectedUserId);
    if (!user || !user.photo) {
        UI.showCustomAlert("Error", "មិនអាចទាញយករូបថតយោងរបស់អ្នកបានទេ។ សូមទាក់ទង IT Support។");
        return;
    }
    
    UI.showFaceScanModal(true);
    UI.setScanStatus('កំពុងព្យាយាមបើកកាមេរ៉ា...');
    
    try {
        UI.setScanStatus('កំពុងវិភាគរូបថតយោង...');
        const referenceDescriptor = await FaceScanner.getReferenceDescriptor(user.photo);
        
        UI.setScanStatus('កំពុងស្នើសុំបើកកាមេរ៉ា...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        
        const videoEl = UI.getScanVideoElement();
        if (videoEl) videoEl.srcObject = stream;
        UI.setScanStatus('សូមដាក់មុខរបស់អ្នកឲ្យចំរង្វង់');
        
        FaceScanner.stopAdvancedFaceAnalysis(); // Clear old loops

        const onSuccess = () => {
            console.log("Controller: Login Scan Success!");
            handleLoginSuccess(user); // ដំណើរការ Login
            setTimeout(() => UI.showFaceScanModal(false), 1000);
        };

        FaceScanner.startAdvancedFaceAnalysis(
            videoEl,
            document.getElementById('scan-status'),
            document.getElementById('scan-debug'),
            referenceDescriptor,
            onSuccess
        );

    } catch (error) {
        console.error("Error during face scan process:", error);
        UI.setScanStatus(`Error: ${error.message}`);
        handleCancelScan(); // Stop video etc.
        setTimeout(() => {
            UI.showFaceScanModal(false);
            UI.showCustomAlert("បញ្ហាស្កេនមុខ", `មានបញ្ហា៖\n${error.message}\nសូមប្រាកដថាអ្នកបានអនុញ្ញាតឲ្យប្រើកាមេរ៉ា។`);
        }, 1500);
    }
}

function handleCancelScan() {
    FaceScanner.stopAdvancedFaceAnalysis();
    const videoEl = UI.getScanVideoElement();
    if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
    }
    FaceScanner.clearReferenceDescriptor();
    console.log("Reference Descriptor Cleared on Cancel.");
    UI.showFaceScanModal(false);
}

// === START: MODIFICATION (Fix Login Error) ===
function handleOpenLeave() {
    if (!currentUser) {
        UI.showCustomAlert("Error", "សូម Login ជាមុនសិន។");
        return;
    }
    UI.showLeaveRequestForm(currentUser);
}

function handleOpenOut() {
    if (!currentUser) {
        UI.showCustomAlert("Error", "សូម Login ជាមុនសិន។");
        return;
    }
    UI.showOutRequestForm(currentUser);
}
// === END: MODIFICATION ===

async function handleSubmitLeave() {
    if (!currentUser) return UI.showCustomAlert("Error", "User មិនត្រឹមត្រូវ");
    
    const requestDataUI = UI.getLeaveRequestData();
    if (!requestDataUI) return; 

    UI.setLeaveRequestLoading(true);

    try {
        const requestId = `leave_${Date.now()}`;
        const finalRequestData = {
            userId: currentUser.id,
            name: currentUser.name,
            department: currentUser.department || 'N/A',
            photo: currentUser.photo || null,
            duration: requestDataUI.duration,
            reason: requestDataUI.reason,
            startDate: requestDataUI.startDate,
            endDate: requestDataUI.endDate,
            status: 'pending',
            requestedAt: serverTimestamp(),
            requestId: requestId,
            firestoreUserId: auth.currentUser ? auth.currentUser.uid : 'unknown_auth_user'
        };

        await Store.submitLeaveRequest(finalRequestData, requestDataUI.dateStringForTelegram);
        
        UI.setLeaveRequestLoading(false);
        UI.showCustomAlert('ជោគជ័យ!', 'សំណើរបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ!', 'success');
        UI.navigateTo('page-history');
    } catch (error) {
        console.error("Error submitting leave request:", error);
        UI.setLeaveRequestLoading(false);
        UI.showCustomAlert("Error", `មានបញ្ហាពេលបញ្ជូនសំណើ: ${error.message}`);
    }
}

async function handleSubmitOut() {
    if (!currentUser) return UI.showCustomAlert("Error", "User មិនត្រឹមត្រូវ");
    
    const requestDataUI = UI.getOutRequestData();
    if (!requestDataUI) return;

    UI.setOutRequestLoading(true);

    try {
        const requestId = `out_${Date.now()}`;
        const finalRequestData = {
            userId: currentUser.id,
            name: currentUser.name,
            department: currentUser.department || 'N/A',
            photo: currentUser.photo || null,
            duration: requestDataUI.duration,
            reason: requestDataUI.reason,
            startDate: requestDataUI.startDate,
            endDate: requestDataUI.endDate,
            status: 'pending',
            requestedAt: serverTimestamp(),
            requestId: requestId,
            firestoreUserId: auth.currentUser ? auth.currentUser.uid : 'unknown_auth_user'
        };

        await Store.submitOutRequest(finalRequestData);
        
        UI.setOutRequestLoading(false);
        UI.showCustomAlert('ជោគជ័យ!', 'សំណើរបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ!', 'success');
        UI.navigateTo('page-history');
    } catch (error) {
        console.error("Error submitting out request:", error);
        UI.setOutRequestLoading(false);
        UI.showCustomAlert("Error", `មានបញ្ហាពេលបញ្ជូនសំណើ: ${error.message}`);
    }
}

async function handleOpenEdit(requestId, type) {
    isEditing = true;
    UI.clearAllPendingTimers();
    UI.setEditModalLoading(true); 
    
    try {
        const data = await Store.setRequestStatusToEditing(requestId, type);
        UI.openEditModal(data, type); 
    } catch (e) {
        console.error("Error opening edit modal:", e);
        UI.setEditModalError(`Error: ${e.message}`);
        isEditing = false;
    }
}

async function handleCancelEdit() {
    isEditing = false;
    const requestId = document.getElementById('edit-request-id').value;
    const type = (document.getElementById('edit-modal-title').textContent.includes("ឈប់")) ? 'leave' : 'out';
    await Store.revertRequestStatusToPending(requestId, type);
    UI.closeEditModal();
}

async function handleSubmitEdit() {
    const editData = UI.getEditModalData(); 
    if (!editData) return; 
    UI.setEditModalLoading(true);
    const requestId = document.getElementById('edit-request-id').value;
    const type = (document.getElementById('edit-modal-title').textContent.includes("ឈប់")) ? 'leave' : 'out';

    try {
        await Store.submitRequestEdit(requestId, type, editData.newDuration, editData.newReason);
        UI.closeEditModal();
    } catch (e) {
        console.error("Error submitting edit:", e);
        UI.setEditModalError(`Error: ${e.message}`);
    } finally {
        UI.setEditModalLoading(false);
        isEditing = false; 
    }
}

async function handleSubmitDelete() {
    const requestId = document.getElementById('delete-request-id').value;
    const type = document.getElementById('delete-collection-type').value;

    UI.setDeleteModalLoading(true);
    try {
        await Store.deleteRequest(requestId, type);
        UI.closeDeleteModal();
    } catch (e) {
        console.error("Error deleting document:", e);
        UI.showCustomAlert("Error", `មិនអាចលុបបានទេ។ ${e.message}`);
    } finally {
        UI.setDeleteModalLoading(false);
    }
}

async function handleOpenReturn(requestId) {
    console.log("Controller: handleOpenReturn", requestId);
    if (!currentUser || !currentUser.photo) {
        UI.showCustomAlert("Error", "មិនអាចទាញយករូបថតយោងរបស់អ្នកបានទេ។");
        return;
    }
    
    currentReturnRequestId = requestId; 
    UI.openReturnScanModal(true);
    UI.setReturnScanStatus('កំពុងព្យាយាមបើកកាមេរ៉ា...');
    
    try {
        UI.setReturnScanStatus('កំពុងវិភាគរូបថតយោង...');
        const referenceDescriptor = await FaceScanner.getReferenceDescriptor(currentUser.photo);
        
        UI.setReturnScanStatus('កំពុងស្នើសុំបើកកាមេរ៉ា...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        
        const videoEl = UI.getReturnVideoElement();
        if (videoEl) videoEl.srcObject = stream;
        UI.setReturnScanStatus('សូមដាក់មុខរបស់អ្នកឲ្យចំរង្វង់');
        
        FaceScanner.stopAdvancedFaceAnalysis(); 

        FaceScanner.startAdvancedFaceAnalysis(
            videoEl,
            document.getElementById('return-scan-status'),
            document.getElementById('return-scan-debug'),
            referenceDescriptor,
            handleReturnFaceScanSuccess 
        );

    } catch (error) {
        console.error("Error during return scan process:", error);
        UI.setReturnScanStatus(`Error: ${error.message}`);
        handleCancelReturn(); 
        setTimeout(() => {
            UI.closeReturnScanModal();
            UI.showCustomAlert("បញ្ហាស្កេនមុខ", `មានបញ្ហា៖\n${error.message}\nសូមប្រាកដថាអ្នកបានអនុញ្ញាតឲ្យប្រើកាមេរ៉ា។`);
        }, 1500);
    }
}

function handleCancelReturn() {
    FaceScanner.stopAdvancedFaceAnalysis();
    const videoEl = UI.getReturnVideoElement();
    if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
    }
    currentReturnRequestId = null;
    UI.closeReturnScanModal();
}

function handleReturnFaceScanSuccess() {
    console.log("Controller: Return Scan Success. Checking location...");
    UI.setReturnScanStatus('ស្កេនមុខជោគជ័យ!\nកំពុងស្នើសុំទីតាំង...', 'សូមអនុញ្ញាតឲ្យប្រើ Location');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
        });
    } else {
        console.error("Geolocation is not supported.");
        UI.showCustomAlert("បញ្ហាទីតាំង", LOCATION_FAILURE_MESSAGE);
        handleCancelReturn();
    }
}

async function onLocationSuccess(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    console.log(`Location found: ${userLat}, ${userLng}`);
    UI.setReturnScanStatus('បានទីតាំង! កំពុងពិនិត្យ...', `Lat: ${userLat.toFixed(6)}, Lng: ${userLng.toFixed(6)}`);

    const isInside = Utils.isPointInPolygon([userLat, userLng], allowedAreaCoords);
    
    if (isInside) {
        console.log("User is INSIDE.");
        UI.setReturnScanStatus('ទីតាំងត្រឹមត្រូវ! កំពុងរក្សាទុក...');
        try {
            await Store.updateReturnStatus(currentReturnRequestId);
            UI.showCustomAlert("ជោគជ័យ!", "បញ្ជាក់ការចូលមកវិញ បានជោគជ័យ!", "success");
        } catch (e) {
            console.error("Error updating Firestore return status:", e);
            UI.showCustomAlert("Error", `មានបញ្ហាពេលរក្សាទុក: ${e.message}`);
        } finally {
            handleCancelReturn();
        }
    } else {
        console.log("User is OUTSIDE.");
        UI.setReturnScanStatus('ទីតាំងមិនត្រឹមត្រូវ។');
        UI.showCustomAlert("បញ្ហាទីតាំង", LOCATION_FAILURE_MESSAGE);
        handleCancelReturn();
    }
}

function onLocationError(error) {
    console.error(`Geolocation Error (${error.code}): ${error.message}`);
    UI.setReturnScanStatus('មិនអាចទាញយកទីតាំងបានទេ។');
    UI.showCustomAlert("បញ្ហាទីតាំង", LOCATION_FAILURE_MESSAGE);
    handleCancelReturn();
}

async function handleOpenInvoice(requestId, type) {
    if (!db || !requestId || !type) { return UI.showCustomAlert("Error", "មិនអាចបើកវិក័យប័ត្របានទេ (Missing ID or Type)"); }
    
    const collectionPath = (type === 'leave') ? leaveRequestsCollectionPath : outRequestsCollectionPath; 
    if (!collectionPath) { return UI.showCustomAlert("Error", "មិនអាចបើកវិក័យប័ត្របានទេ (Invalid Collection Path)"); }

    try {
        const docRef = doc(db, collectionPath, requestId); 
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("រកមិនឃើញសំណើរនេះទេ។");
        }
        UI.openInvoiceModal(docSnap.data(), type); // បញ្ជូន Data ទៅ UI
    } catch (error) {
        console.error("Error opening/populating invoice modal:", error);
        UI.hideInvoiceModal();
        UI.showCustomAlert("Error", `មិនអាចផ្ទុកទិន្នន័យវិក័យប័ត្របានទេ: ${error.message}`);
    }
}

function handleHistoryTap(event) {
    const invoiceBtn = event.target.closest('.invoice-btn');
    const returnBtn = event.target.closest('.return-btn');
    const editBtn = event.target.closest('.edit-btn');
    const deleteBtn = event.target.closest('.delete-btn');

    if (invoiceBtn) {
        event.preventDefault();
        handleOpenInvoice(invoiceBtn.dataset.id, invoiceBtn.dataset.type);
    } else if (returnBtn) {
        event.preventDefault();
        handleOpenReturn(returnBtn.dataset.id);
    } else if (editBtn) {
        event.preventDefault();
        handleOpenEdit(editBtn.dataset.id, editBtn.dataset.type);
    } else if (deleteBtn) {
        event.preventDefault();
        UI.openDeleteModal(deleteBtn.dataset.id, deleteBtn.dataset.type);
    }
}

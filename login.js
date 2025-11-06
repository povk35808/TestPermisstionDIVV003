// --- Import ពី File ជំនួយរួម ---
import { db, auth, GVIZ_URL } from './firebase-config.js';
import { setupSearchableDropdown, showCustomAlert, hideCustomAlert } from './firebase-config.js';

// --- Global State (សម្រាប់ Login) ---
let allUsersData = [], selectedUserId = null;
let userReferenceDescriptor = null;

// --- START: Face Analysis State ---
let isFaceAnalysisRunning = false;
let lastFaceCheck = 0;
const FACE_CHECK_INTERVAL = 500;
// --- END: Face Analysis State ---

// --- Element References (សម្រាប់ Login) ---
let userSearchInput, userDropdown, userSearchError, scanFaceBtn, modelStatusEl, faceScanModal, video, scanStatusEl, scanDebugEl, cancelScanBtn, loginFormContainer, inAppWarning, dataLoadingIndicator, rememberMeCheckbox, loginPage, criticalErrorDisplay, customAlertOkBtn;


// --- App Initialization (សម្រាប់ Login) ---
document.addEventListener('DOMContentLoaded', async () => {

    // --- Assign Element References ---
    userSearchInput = document.getElementById('user-search');
    userDropdown = document.getElementById('user-dropdown');
    userSearchError = document.getElementById('user-search-error');
    scanFaceBtn = document.getElementById('scan-face-btn');
    modelStatusEl = document.getElementById('model-status');
    faceScanModal = document.getElementById('face-scan-modal');
    video = document.getElementById('video');
    scanStatusEl = document.getElementById('scan-status');
    scanDebugEl = document.getElementById('scan-debug');
    cancelScanBtn = document.getElementById('cancel-scan-btn');
    loginFormContainer = document.getElementById('login-form-container');
    inAppWarning = document.getElementById('in-app-warning');
    dataLoadingIndicator = document.getElementById('data-loading-indicator');
    rememberMeCheckbox = document.getElementById('remember-me');
    loginPage = document.getElementById('page-login');
    criticalErrorDisplay = document.getElementById('critical-error-display');
    customAlertOkBtn = document.getElementById('custom-alert-ok-btn');

    // --- Add Listeners ---
    if (customAlertOkBtn) customAlertOkBtn.addEventListener('click', hideCustomAlert);
    if (scanFaceBtn) scanFaceBtn.addEventListener('click', startFaceScan);
    if (cancelScanBtn) cancelScanBtn.addEventListener('click', () => {
        stopFaceScan();
        userReferenceDescriptor = null; // CRITICAL FIX
        console.log("Reference Descriptor Cleared on Cancel.");
        if (faceScanModal) faceScanModal.classList.add('hidden');
    });

    // --- Setup Dropdown (Empty first) ---
    setupSearchableDropdown('user-search', 'user-dropdown', [], (id) => {
        selectedUserId = id;
        userReferenceDescriptor = null; // CRITICAL FIX
        console.log("Reference Descriptor Cleared on User Select.");
        if (scanFaceBtn) scanFaceBtn.disabled = (id === null || !modelStatusEl || modelStatusEl.textContent !== 'Model ស្កេនមុខបានទាញយករួចរាល់');
        console.log("Selected User ID:", selectedUserId);
    });
    
    // --- Main App Logic (Login) ---
    function isClient() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        return ((ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1) || (ua.indexOf('Twitter') > -1) || (ua.indexOf('Telegram') > -1) || (ua.indexOf('WebView') > -1) || (ua.indexOf('wv') > -1));
    }

    if (isClient()) {
        console.log("Detected In-App Browser.");
        if (inAppWarning) inAppWarning.classList.remove('hidden');
        if (modelStatusEl) modelStatusEl.textContent = 'សូមបើកក្នុង Browser ពេញលេញ';
        if (dataLoadingIndicator) dataLoadingIndicator.classList.add('hidden');
    } else {
        console.log("Detected Full Browser.");
        if (inAppWarning) inAppWarning.classList.add('hidden');

        // --- CRITICAL CHANGE: Check for remembered user ---
        const rememberedUser = localStorage.getItem('leaveAppUser');
        if (rememberedUser) {
            try {
                const parsedUser = JSON.parse(rememberedUser);
                if (parsedUser && parsedUser.id) {
                    console.log("Found remembered user. Redirecting to main.html...");
                    // --- REDIRECT ---
                    window.location.href = 'main.html';
                    return; // Stop executing code on this page
                }
            } catch (e) {
                localStorage.removeItem('leaveAppUser');
            }
        }
        
        console.log("No remembered user found, starting normal login flow.");
        // Load face-api and users
        if (typeof faceapi !== 'undefined') {
            if (scanFaceBtn) scanFaceBtn.disabled = true;
            loadFaceApiModels();
        } else {
            console.error("Face-API.js មិនអាចទាញយកបានត្រឹមត្រូវទេ។");
            if (modelStatusEl) modelStatusEl.textContent = 'Error: មិនអាចទាញយក Library ស្កេនមុខបាន';
        }
        initializeAppFlow();
    }
});

function initializeAppFlow() {
    console.log("initializeAppFlow called (for non-remembered user).");
    console.log("Fetching users for initial login...");
    if (dataLoadingIndicator) dataLoadingIndicator.classList.remove('hidden');
    fetchUsers();
}

async function fetchUsers() {
    console.log("Fetching users from Google Sheet...");
    try {
        const response = await fetch(GVIZ_URL);
        if (!response.ok) throw new Error(`Google Sheet fetch failed: ${response.status}`);
        const text = await response.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
        if (!match || !match[1]) throw new Error("ទម្រង់ការឆ្លើយតបពី Google Sheet មិនត្រឹមត្រូវ");
        const json = JSON.parse(match[1]);
        if (json.table && json.table.rows && json.table.rows.length > 0) {
            allUsersData = json.table.rows.map(row => ({
                id: row.c?.[0]?.v ?? null,
                name: row.c?.[1]?.v ?? null,
                photo: row.c?.[2]?.v ?? null,
                gender: row.c?.[3]?.v ?? null,
                group: row.c?.[4]?.v ?? null,
                department: row.c?.[5]?.v ?? null
            }));
            console.log(`Fetched ${allUsersData.length} users.`);
            populateUserDropdown(allUsersData, 'user-search', 'user-dropdown', (id) => {
                selectedUserId = id;
                userReferenceDescriptor = null; // CRITICAL FIX
                console.log("Reference Descriptor Cleared on populateUserDropdown.");
                if (scanFaceBtn) scanFaceBtn.disabled = (id === null || !modelStatusEl || modelStatusEl.textContent !== 'Model ស្កេនមុខបានទាញយករួចរាល់');
                console.log("Selected User ID:", selectedUserId);
            });
            if (dataLoadingIndicator) dataLoadingIndicator.classList.add('hidden');
            if (loginFormContainer) loginFormContainer.classList.remove('hidden');
        } else {
            throw new Error("រកមិនឃើញទិន្នន័យអ្នកប្រើប្រាស់");
        }
    } catch (error) {
        console.error("Error ពេលទាញយកទិន្នន័យ Google Sheet:", error);
        if (dataLoadingIndicator) {
            dataLoadingIndicator.innerHTML = `<p class="text-red-600 font-semibold">Error: មិនអាចទាញយកទិន្នន័យបាន</p><p class="text-gray-600 text-sm mt-1">សូមពិនិត្យអ៊ីនធឺណិត និង Refresh ម្ដងទៀត។</p>`;
            dataLoadingIndicator.classList.remove('hidden');
        }
    }
}

function populateUserDropdown(users, inputId, dropdownId, onSelectCallback) {
    const userItems = users.filter(user => user.id && user.name).map(user => ({
        text: `${user.id} - ${user.name}`,
        value: user.id
    }));
    setupSearchableDropdown(inputId, dropdownId, userItems, onSelectCallback, false);
}

// --- Face Scan Logic (Login) ---
async function loadFaceApiModels() {
    // ... (កូដ​ loadFaceApiModels ដូច​ដើម)
    if (!modelStatusEl) return; try { console.log("Loading face-api models (SsdMobilenetv1)..."); modelStatusEl.textContent = 'កំពុងទាញយក Model ស្កេនមុខ...'; await Promise.all([ faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'), faceapi.nets.faceLandmark68TinyNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'), faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'), ]); modelStatusEl.textContent = 'Model ស្កេនមុខបានទាញយករួចរាល់'; console.log("Face-api models loaded successfully (SsdMobilenetv1)."); if (scanFaceBtn) scanFaceBtn.disabled = (selectedUserId === null); } catch (error) { console.error("Error ពេលទាញយក Model របស់ face-api:", error); modelStatusEl.textContent = 'Error: មិនអាចទាញយក Model បាន'; }
}

async function getReferenceDescriptor(userPhotoUrl) {
    // ... (កូដ​ getReferenceDescriptor ដូច​ដើម)
    if (userReferenceDescriptor) { console.log("Using cached reference descriptor."); return userReferenceDescriptor; } if (!userPhotoUrl) throw new Error("Missing user photo URL"); console.log("Fetching and computing new reference descriptor (SsdMobilenetv1)..."); let referenceImage; try { const img = new Image(); img.crossOrigin = 'anonymous'; img.src = userPhotoUrl; await new Promise((resolve, reject) => { img.onload = () => resolve(); img.onerror = (err) => reject(new Error('Failed to fetch (មិនអាចទាញយករូបថតយោងបាន)។ សូមប្រាកដថា Link រូបថតត្រឹមត្រូវ។')); }); referenceImage = img; } catch (fetchError) { throw fetchError; } let referenceDetection; try { const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }); referenceDetection = await faceapi.detectSingleFace(referenceImage, options) .withFaceLandmarks(true) .withFaceDescriptor(); if (!referenceDetection) throw new Error('រកមិនឃើញមុខនៅក្នុងរូបថតយោង'); } catch (descriptorError) { console.error("Descriptor Error:", descriptorError); throw new Error('មិនអាចវិភាគមុខពីរូបថតយោងបានទេ (រូបថតអាចមិនច្បាស់)។'); } userReferenceDescriptor = referenceDetection.descriptor; return userReferenceDescriptor;
}

function stopAdvancedFaceAnalysis() {
    // ... (កូដ​ stopAdvancedFaceAnalysis ដូច​ដើម)
    console.log("Stopping Advanced Face Analysis..."); isFaceAnalysisRunning = false;
}

function startAdvancedFaceAnalysis(videoElement, statusElement, debugElement, referenceDescriptor, onSuccessCallback) {
    // ... (កូដ​ startAdvancedFaceAnalysis ដូច​ដើម)
    console.log("Starting Advanced Face Analysis (rAF)..."); isFaceAnalysisRunning = true; lastFaceCheck = 0; const VERIFICATION_THRESHOLD = 0.5; const MIN_WIDTH_PERCENT = 0.3; const MAX_WIDTH_PERCENT = 0.7; const CENTER_TOLERANCE_PERCENT = 0.2; const videoWidth = videoElement.clientWidth || 320; const videoCenterX = videoWidth / 2; const minPixelWidth = videoWidth * MIN_WIDTH_PERCENT; const maxPixelWidth = videoWidth * MAX_WIDTH_PERCENT; const centerTolerancePixels = videoWidth * CENTER_TOLERANCE_PERCENT; console.log(`Analysis Rules: Threshold=<${VERIFICATION_THRESHOLD}, minWidth=${minPixelWidth}px, maxWidth=${maxPixelWidth}px`); async function analysisLoop(timestamp) { if (!isFaceAnalysisRunning) return; if (timestamp - lastFaceCheck < FACE_CHECK_INTERVAL) { requestAnimationFrame(analysisLoop); return; } lastFaceCheck = timestamp; try { if (!videoElement || videoElement.readyState < 3) { requestAnimationFrame(analysisLoop); return; } const detections = await faceapi.detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })) .withFaceLandmarks(true) .withFaceDescriptor(); if (!detections) { statusElement.textContent = 'រកមិនឃើញផ្ទៃមុខ...'; debugElement.textContent = ''; } else { const box = detections.detection.box; const faceCenterX = box.x + box.width / 2; if (box.width < minPixelWidth) { statusElement.textContent = 'សូមរំកលមុខមកជិតបន្តិច'; debugElement.textContent = `ទំហំ: ${Math.round(box.width)}px (តូចពេក)`; } else if (box.width > maxPixelWidth) { statusElement.textContent = 'សូមរំកលមុខថយក្រោយបន្តិច'; debugElement.textContent = `ទំហំ: ${Math.round(box.width)}px (ធំពេក)`; } else if (Math.abs(faceCenterX - videoCenterX) > centerTolerancePixels) { statusElement.textContent = 'សូមដាក់មុខនៅចំកណ្តាល'; const distanceToCenter = Math.abs(faceCenterX - videoCenterX); debugElement.textContent = ` lệch: ${Math.round(distanceToCenter)}px`; } else { statusElement.textContent = 'រកឃើញ! កំពុងផ្ទៀងផ្ទាត់...'; const distance = faceapi.euclideanDistance(referenceDescriptor, detections.descriptor); debugElement.textContent = `ចំងាយ: ${distance.toFixed(2)} (ត្រូវតែ < ${VERIFICATION_THRESHOLD})`; if (distance < VERIFICATION_THRESHOLD) { statusElement.textContent = 'ផ្ទៀងផ្ទាត់ជោគជ័យ!'; isFaceAnalysisRunning = false; onSuccessCallback(); return; } else { statusElement.textContent = 'មុខមិនត្រឹមត្រូវ... សូមព្យាយាមម្តងទៀត'; } } } } catch (error) { console.error("Error during face analysis rAF loop:", error); statusElement.textContent = 'មានបញ្ហាពេលវិភាគ...'; } requestAnimationFrame(analysisLoop); } requestAnimationFrame(analysisLoop);
}

async function startFaceScan() {
    // ... (កូដ​ startFaceScan ដូច​ដើម... រហូតដល់ onSuccess)
    console.log("startFaceScan called."); if (!selectedUserId) { showCustomAlert("Error", "សូមជ្រើសរើសអត្តលេខរបស់អ្នកជាមុនសិន"); return; } const user = allUsersData.find(u => u.id === selectedUserId); if (!user || !user.photo) { showCustomAlert("Error", "មិនអាចទាញយករូបថតយោងរបស់អ្នកបានទេ។ សូមទាក់ទង IT Support។"); return; } if (faceScanModal) faceScanModal.classList.remove('hidden'); if (scanStatusEl) scanStatusEl.textContent = 'កំពុងព្យាយាមបើកកាមេរ៉ា...'; try { if (scanStatusEl) scanStatusEl.textContent = 'កំពុងវិភាគរូបថតយោង...'; const referenceDescriptor = await getReferenceDescriptor(user.photo); if (scanStatusEl) scanStatusEl.textContent = 'កំពុងស្នើសុំបើកកាមេរ៉ា...'; const stream = await navigator.mediaDevices.getUserMedia({ video: {} }); if (video) video.srcObject = stream; if (scanStatusEl) scanStatusEl.textContent = 'សូមដាក់មុខរបស់អ្នកឲ្យចំកាមេរ៉ា'; stopAdvancedFaceAnalysis(); 
        // --- កំណត់អ្វីដែលត្រូវធ្វើនៅពេលជោគជ័យ ---
        const onSuccess = () => {
            console.log("Login Scan Success!");
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
            
            // --- CRITICAL CHANGE: ហៅ loginUser() ---
            loginUser(user); // ប្រើ 'user' object ពេញ មិនមែនតែ ID ទេ
            
            setTimeout(() => {
                if (faceScanModal) faceScanModal.classList.add('hidden');
            }, 1000);
        };

        // ... (កូដ​ startAdvancedFaceAnalysis ដូច​ដើម)
        startAdvancedFaceAnalysis( video, scanStatusEl, scanDebugEl, referenceDescriptor, onSuccess ); 
    } catch (error) { 
        // ... (កូដ​ catch error ដូច​ដើម)
        console.error("Error during face scan process:", error); if (scanStatusEl) scanStatusEl.textContent = `Error: ${error.message}`; stopFaceScan(); setTimeout(() => { if (faceScanModal) faceScanModal.classList.add('hidden'); showCustomAlert("បញ្ហាស្កេនមុខ", `មានបញ្ហា៖\n${error.message}\nសូមប្រាកដថាអ្នកបានអនុញ្ញាតឲ្យប្រើកាមេរ៉ា។`); }, 1500); 
    }
}

function stopFaceScan() {
    // ... (កូដ​ stopFaceScan ដូច​ដើម)
    stopAdvancedFaceAnalysis(); if (video && video.srcObject) { video.srcObject.getTracks().forEach(track => track.stop()); video.srcObject = null; }
}

// --- CRITICAL CHANGE: loginUser ឥឡូវ Redirect ---
function loginUser(user) {
    if (!user) {
        showCustomAlert("Login Error", "មានបញ្ហា Login: រកមិនឃើញទិន្នន័យអ្នកប្រើប្រាស់");
        return;
    }
    
    if (rememberMeCheckbox && rememberMeCheckbox.checked) {
        // រក្សាទុក User object ទាំងមូល
        localStorage.setItem('leaveAppUser', JSON.stringify(user));
        console.log("User remembered in localStorage.");
    } else {
        localStorage.removeItem('leaveAppUser');
    }

    // --- ផ្លាស់ប្តូរពីការលាក់/បង្ហាញ DIV ទៅជាការបើកទំព័រថ្មី ---
    console.log("Login successful. Redirecting to main.html...");
    window.location.href = 'main.html';
}

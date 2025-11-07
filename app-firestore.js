// --- File: app-firestore.js ---
// នេះគឺជា Module ថ្មី សម្រាប់គ្រប់គ្រងរាល់ប្រតិបត្តិការជាមួយ Firestore

import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as API from './api.js'; // សម្រាប់ផ្ញើសារ Telegram
import * as Utils from './utils.js'; // សម្រាប់ format កាលបរិច្ឆេទ

let db, leaveRequestsCollectionPath, outRequestsCollectionPath;

/**
 * [EXPORT] កំណត់ (Initialize) នូវ Database instance និង Collection paths
 */
export function initializeFirestore(database, leavePath, outPath) {
    db = database;
    leaveRequestsCollectionPath = leavePath;
    outRequestsCollectionPath = outPath;
    console.log("Firestore Service Initialized.");
}

/**
 * [EXPORT] បញ្ជូនសំណើ (Leave) ទៅ Firestore
 */
export async function submitLeaveRequest(requestData, dateString) {
    if (!db || !leaveRequestsCollectionPath) throw new Error("Firestore DB or Collection Path is not initialized.");
    
    const requestRef = doc(db, leaveRequestsCollectionPath, requestData.requestId);
    await setDoc(requestRef, requestData);
    console.log("Firestore (leave) write successful.");

    // ផ្ញើសារទៅ Telegram
    let message = `<b>🔔 សំណើសុំច្បាប់ឈប់សម្រាក 🔔</b>\n\n`;
    message += `<b>ឈ្មោះ:</b> ${requestData.name} (${requestData.userId})\n`;
    message += `<b>ផ្នែក:</b> ${requestData.department}\n`;
    message += `<b>រយៈពេល:</b> ${requestData.duration}\n`;
    message += `<b>កាលបរិច្ឆេទ:</b> ${dateString}\n`;
    message += `<b>មូលហេតុ:</b> ${requestData.reason}\n\n`;
    message += `(សូមចូល Firestore ដើម្បីពិនិត្យ ID: \`${requestData.requestId}\`)`;
    await API.sendTelegramNotification(message);
}

/**
 * [EXPORT] បញ្ជូនសំណើ (Out) ទៅ Firestore
 */
export async function submitOutRequest(requestData) {
    if (!db || !outRequestsCollectionPath) throw new Error("Firestore DB or Out Collection Path is not initialized.");
    
    const requestRef = doc(db, outRequestsCollectionPath, requestData.requestId);
    await setDoc(requestRef, requestData);
    console.log("Firestore (out) write successful.");

    // ផ្ញើសារទៅ Telegram
    let message = `<b>🔔 សំណើសុំច្បាប់ចេញក្រៅ 🔔</b>\n\n`;
    message += `<b>ឈ្មោះ:</b> ${requestData.name} (${requestData.userId})\n`;
    message += `<b>ផ្នែក:</b> ${requestData.department}\n`;
    message += `<b>រយៈពេល:</b> ${requestData.duration}\n`;
    message += `<b>កាលបរិច្ឆេទ:</b> ${requestData.startDate}\n`;
    message += `<b>មូលហេតុ:</b> ${requestData.reason}\n\n`;
    message += `(សូមចូល Firestore ដើម្បីពិនិត្យ ID: \`${requestData.requestId}\`)`;
    await API.sendTelegramNotification(message);
}

/**
 * [EXPORT] ចាប់ផ្តើមស្តាប់ (Listen) ប្រវត្តិ (Leave)
 */
export function listenToLeaveHistory(userId, onSnapshotCallback, onErrorCallback) {
    if (!db) return null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    try {
        const leaveQuery = query(collection(db, leaveRequestsCollectionPath), 
            where("userId", "==", userId), 
            where("requestedAt", ">=", startTimestamp), 
            where("requestedAt", "<", endTimestamp)
        );
        console.log("Querying Leave Requests for current month...");
        return onSnapshot(leaveQuery, onSnapshotCallback, onErrorCallback);
    } catch (e) {
        console.error("Failed to create LEAVE history query:", e);
        onErrorCallback(e);
        return null;
    }
}

/**
 * [EXPORT] ចាប់ផ្តើមស្តាប់ (Listen) ប្រវត្តិ (Out)
 */
export function listenToOutHistory(userId, onSnapshotCallback, onErrorCallback) {
    if (!db) return null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    try {
        const outQuery = query(collection(db, outRequestsCollectionPath), 
            where("userId", "==", userId), 
            where("requestedAt", ">=", startTimestamp), 
            where("requestedAt", "<", endTimestamp)
        );
        console.log("Querying Out Requests for current month...");
        return onSnapshot(outQuery, onSnapshotCallback, onErrorCallback);
    } catch (e) {
        console.error("Failed to create OUT history query:", e);
        onErrorCallback(e);
        return null;
    }
}

/**
 * [EXPORT] ផ្លាស់ប្តូរ Status ទៅជា 'editing' និងទាញយកទិន្នន័យ
 */
export async function setRequestStatusToEditing(requestId, type) {
    if (!db) throw new Error("DB not initialized");
    const collectionPath = (type === 'leave') ? leaveRequestsCollectionPath : outRequestsCollectionPath;
    if (!collectionPath) throw new Error("Collection path not found");
    
    const requestRef = doc(db, collectionPath, requestId);
    await updateDoc(requestRef, { status: 'editing' });
    console.log("Request status set to 'editing'");
    
    const docSnap = await getDoc(requestRef);
    if (!docSnap.exists()) throw new Error("Document not found");
    return docSnap.data();
}

/**
 * [EXPORT] ផ្លាស់ប្តូរ Status ត្រឡប់ទៅ 'pending' វិញ (ពេល Cancel Edit)
 */
export async function revertRequestStatusToPending(requestId, type) {
    if (!db) return console.error("DB not initialized");
    const collectionPath = (type === 'leave') ? leaveRequestsCollectionPath : outRequestsCollectionPath;
    if (requestId && collectionPath) {
        try {
            const requestRef = doc(db, collectionPath, requestId);
            await updateDoc(requestRef, { status: 'pending' });
            console.log("Edit cancelled, status reverted to 'pending'");
        } catch (e) {
            console.error("Error reverting status on edit cancel:", e);
        }
    }
}

/**
 * [EXPORT] បញ្ជូន (Submit) ការកែសម្រួល (Edit)
 */
export async function submitRequestEdit(requestId, type, newDuration, newReason) {
    if (!db) throw new Error("DB not initialized");
    const collectionPath = (type === 'leave') ? leaveRequestsCollectionPath : outRequestsCollectionPath;
    if (!collectionPath) throw new Error("Collection path not found");

    // 1. យក Date fields ពី UI (ដែលត្រូវបាន update ដោយ ui-manager.js)
    const editLeaveDateSingle = document.getElementById('edit-leave-date-single');
    const editLeaveDateStart = document.getElementById('edit-leave-date-start');
    const editLeaveDateEnd = document.getElementById('edit-leave-date-end');

    // 2. គណនាកាលបរិច្ឆេទថ្មី (ជា Format dd-Mmm-yyyy សម្រាប់ Firestore)
    const isSingleDay = (type === 'out') || singleDayLeaveDurations.includes(newDuration);
    let finalStartDate, finalEndDate, dateStringForTelegram;

    if (isSingleDay) {
        let singleDateVal = editLeaveDateSingle.value; 
        if (!singleDateVal || !Utils.parseDdMmmYyyyToInputFormat(singleDateVal)) { 
            singleDateVal = Utils.formatDateToDdMmmYyyy(editLeaveDateStart.value); 
        }
        finalStartDate = singleDateVal;
        finalEndDate = singleDateVal;
        dateStringForTelegram = finalStartDate; 
    } else {
        finalStartDate = Utils.formatDateToDdMmmYyyy(editLeaveDateStart.value); 
        finalEndDate = Utils.formatDateToDdMmmYyyy(editLeaveDateEnd.value); 
        dateStringForTelegram = `ពី ${Utils.formatInputDateToDb(editLeaveDateStart.value)} ដល់ ${Utils.formatInputDateToDb(editLeaveDateEnd.value)}`; 
    }

    // 3. Update ទៅកាន់ Firestore
    const requestRef = doc(db, collectionPath, requestId);
    await updateDoc(requestRef, {
        duration: newDuration,
        reason: newReason.trim(),
        startDate: finalStartDate,
        endDate: finalEndDate,
        status: 'pending',
        requestedAt: serverTimestamp()
    });
    console.log("Edit submitted, status set to 'pending' with new duration/dates");

    // 4. ផ្ញើសារទៅ Telegram
    let message = `<b>🔔 សំណើត្រូវបានកែសម្រួល 🔔</b>\n\n`;
    message += `<b>ID:</b> \`${requestId}\`\n`;
    message += `<b>រយៈពេលថ្មី:</b> ${newDuration}\n`;
    message += `<b>មូលហេតុថ្មី:</b> ${newReason.trim()}\n`;
    message += `<b>កាលបរិច្ឆេទ:</b> ${dateStringForTelegram}\n\n`;
    message += `(សំណើនេះ ឥឡូវនេះ ស្ថិតក្នុងស្ថានភាព 'pending' ឡើងវិញ)`;
    await API.sendTelegramNotification(message);
}

/**
 * [EXPORT] លុបសំណើ (Delete Request)
 */
export async function deleteRequest(requestId, type) {
    if (!db || !requestId || !type) throw new Error("Cannot delete: Missing info");
    const collectionPath = (type === 'leave') ? leaveRequestsCollectionPath : outRequestsCollectionPath;
    if (!collectionPath) throw new Error("Invalid collection type");
    
    console.log("Attempting to delete doc:", requestId, "from:", collectionPath);
    const requestRef = doc(db, collectionPath, requestId);
    await deleteDoc(requestRef);
    console.log("Document successfully deleted!");
}

/**
 * [EXPORT] Update ស្ថានភាពការចូលមកវិញ (Return Status)
 */
export async function updateReturnStatus(requestId) {
    if (!db || !outRequestsCollectionPath) throw new Error("DB or Out Path not initialized");
    if (!requestId) throw new Error("Cannot update return status: No request ID");

    const docRef = doc(db, outRequestsCollectionPath, requestId);
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const returnedAtString = `${time} ${date}`;
    
    await updateDoc(docRef, {
        returnStatus: "បានចូលមកវិញ",
        returnedAt: returnedAtString
    });
    console.log("Return status updated successfully.");
}

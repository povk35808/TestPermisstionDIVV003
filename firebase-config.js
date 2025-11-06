// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, getDoc, collection, query, where, onSnapshot, serverTimestamp, Timestamp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Enable Firestore debug logging
setLogLevel('debug');

// --- Hard-coded Firebase Config ---
const firebaseConfig = { apiKey: "AIzaSyDjr_Ha2RxOWEumjEeSdluIW3JmyM76mVk", authDomain: "dipermisstion.firebaseapp.com", projectId: "dipermisstion", storageBucket: "dipermisstion.firebasestorage.app", messagingSenderId: "512999406057", appId: "1:512999406057:web:953a281ab9dde7a9a0f378", measurementId: "G-KDPHXZ7H4B" };

// --- Initialize Firebase & Export Instances ---
let db, auth;
let leaveRequestsCollectionPath, outRequestsCollectionPath;

try {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Setup collection paths
    const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    leaveRequestsCollectionPath = `/artifacts/${canvasAppId}/public/data/leave_requests`;
    outRequestsCollectionPath = `/artifacts/${canvasAppId}/public/data/out_requests`;
    
    console.log("Firebase initialized. Signing in anonymously...");
    // Sign in automatically
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Firebase Auth: User is signed in with UID:", user.uid);
        } else {
            console.log("Firebase Auth: No user. Attempting anonymous sign-in...");
            signInAnonymously(auth).catch(anonError => {
                console.error("Error during automatic anonymous sign-in attempt:", anonError);
            });
        }
    });

} catch (e) {
    console.error("CRITICAL FIREBASE INIT ERROR:", e);
    const errorDisplay = document.getElementById('critical-error-display');
    if(errorDisplay) {
        errorDisplay.classList.remove('hidden');
        errorDisplay.textContent = `Critical Error: មិនអាចតភ្ជាប់ Firebase បានទេ។ ${e.message}។ សូម Refresh ម្ដងទៀត។`;
    }
}

// --- Export Firebase Instances and Paths ---
export { db, auth, leaveRequestsCollectionPath, outRequestsCollectionPath };


// --- Export Google Sheet & Bot Config ---
export const GVIZ_URL = `https://docs.google.com/spreadsheets/d/1_Kgl8UQXRsVATt_BOHYQjVWYKkRIBA12R-qnsBoSUzc/gviz/tq?sheet=${encodeURIComponent('បញ្ជឺឈ្មោះរួម')}&tq=${encodeURIComponent('SELECT E, L, AA, N, G, S WHERE E IS NOT NULL OFFSET 0')}`;
export const BOT_TOKEN = '8284240201:AAEDRGHDcuoQAhkWk7km6I-9csZNbReOPHw';
export const CHAT_ID = '1487065922';

// --- Export Location Config ---
export const allowedAreaCoords = [ [11.417052769150015, 104.76508285291308], [11.417130005964497, 104.76457396198742], [11.413876386899489, 104.76320488118378], [11.41373800267192, 104.76361527709159] ];
export const LOCATION_FAILURE_MESSAGE = "ការបញ្ជាក់ចូលមកវិញ បរាជ័យ។ \n\nប្រហែលទូរស័ព្ទអ្នកមានបញ្ហា ការកំណត់បើ Live Location ដូច្នោះអ្នកមានជម្រើសមួយទៀតគឺអ្នកអាចទៅបញ្ជាក់ដោយផ្ទាល់នៅការិយាល័យអគារ B ជាមួយក្រុមការងារលោកគ្រូ ដារ៉ូ។";

// --- Export Duration/Reason Constants ---
export const leaveDurations = ["មួយព្រឹក", "មួយរសៀល", "មួយយប់", "មួយថ្ងៃ", "មួយថ្ងៃកន្លះ", "ពីរថ្ងៃ", "ពីរថ្ងៃកន្លះ", "បីថ្ងៃ", "បីថ្ងៃកន្លះ", "បួនថ្ងៃ", "បួនថ្ងៃកន្លះ", "ប្រាំថ្ងៃ", "ប្រាំថ្ងៃកន្លះ", "ប្រាំមួយថ្ងៃ", "ប្រាំមួយថ្ងៃកន្លះ", "ប្រាំពីរថ្ងៃ"];
export const leaveDurationItems = leaveDurations.map(d => ({ text: d, value: d }));
export const leaveReasons = ["ឈឺក្បាល", "ចុកពោះ", "គ្រុនក្ដៅ", "ផ្ដាសាយ"];
export const leaveReasonItems = leaveReasons.map(r => ({ text: r, value: r }));
export const singleDayLeaveDurations = ["មួយព្រឹក", "មួយរសៀល", "មួយយប់", "មួយថ្ងៃ"];
export const outDurations = ["មួយព្រឹក", "មួយរសៀល", "មួយថ្ងៃ"];
export const outDurationItems = outDurations.map(d => ({ text: d, value: d }));
export const outReasons = ["ទៅផ្សារ", "ទៅកាត់សក់", "ទៅភ្នំពេញ", "ទៅពេទ្យ", "ទៅយកអីវ៉ាន់"];
export const outReasonItems = outReasons.map(r => ({ text: r, value: r }));
export const durationToDaysMap = { "មួយថ្ងៃកន្លះ": 1.5, "ពីរថ្ងៃ": 2, "ពីរថ្ងៃកន្លះ": 2.5, "បីថ្ងៃ": 3, "បីថ្ងៃកន្លះ": 3.5, "បួនថ្ងៃ": 4, "បួនថ្ងៃកន្លះ": 4.5, "ប្រាំថ្ងៃ": 5, "ប្រាំថ្ងៃកន្លះ": 5.5, "ប្រាំមួយថ្ងៃ": 6, "ប្រាំមួយថ្ងៃកន្លះ": 6.5, "ប្រាំពីរថ្ងៃ": 7 };


// --- Export Date Helper Functions ---
export function getTodayString(format = 'yyyy-mm-dd') {
    // ... (កូដ​ដូច​ដើម)
    const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0'); if (format === 'dd/mm/yyyy') return `${dd}/${mm}/${yyyy}`; return `${yyyy}-${mm}-${dd}`;
}
export function formatDbDateToInput(dbDate) {
    // ... (កូដ​ដូច​ដើម)
    if (!dbDate || dbDate.split('/').length !== 3) return getTodayString(); const parts = dbDate.split('/'); return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
export function formatInputDateToDb(inputDate) {
    // ... (កូដ​ដូច​ដើម)
    if (!inputDate || inputDate.split('-').length !== 3) return getTodayString('dd/mm/yyyy'); const parts = inputDate.split('-'); return `${parts[2]}/${parts[1]}-${parts[0]}`;
}
export function addDays(startDateStr, days) {
    // ... (កូដ​ដូច​ដើម)
    try { const date = new Date(startDateStr); if (isNaN(date.getTime())) return getTodayString(); date.setDate(date.getDate() + Math.ceil(days) - 1); const yyyy = date.getFullYear(); const mm = String(date.getMonth() + 1).padStart(2, '0'); const dd = String(date.getDate()).padStart(2, '0'); return `${yyyy}-${mm}-${dd}`; } catch (e) { console.error("Error in addDays:", e); return getTodayString(); }
}
export function formatFirestoreTimestamp(timestamp, format = 'HH:mm dd/MM/yyyy') {
    // ... (កូដ​ដូច​ដើម)
    let date; if (!timestamp) return ""; if (timestamp instanceof Date) date = timestamp; else if (timestamp.toDate) date = timestamp.toDate(); else if (typeof timestamp === 'string') { date = new Date(timestamp); if (isNaN(date.getTime())) return ""; } else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000); else return ""; const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); if (format === 'HH:mm' || format === 'time') return `${hours}:${minutes}`; if (format === 'dd/MM/yyyy' || format === 'date') return `${day}/${month}/${year}`; return `${hours}:${minutes} ${day}/${month}/${year}`;
}
export function parseReturnedAt_(returnedAtString) {
    // ... (កូដ​ដូច​ដើម)
    if (!returnedAtString || typeof returnedAtString !== 'string') return { date: "", time: "" }; const parts = returnedAtString.split(' '); if (parts.length === 2) return { time: parts[0], date: parts[1] }; return { date: returnedAtString, time: "" };
}
export function formatDateToDdMmmYyyy(dateString) {
    // ... (កូដ​ដូច​ដើម)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; let date; if (dateString.includes('/') && dateString.split('/').length === 3) { const parts = dateString.split('/'); date = new Date(parts[2], parts[1] - 1, parts[0]); } else { date = new Date(); } if (isNaN(date.getTime())) date = new Date(); const day = String(date.getDate()).padStart(2, '0'); const month = monthNames[date.getMonth()]; const year = date.getFullYear(); return `${day}-${month}-${year}`;
}
export function parseDdMmmYyyyToInputFormat(ddMmmYyyy) {
    // ... (កូដ​ដូច​ដើម)
    if (!ddMmmYyyy || ddMmmYyyy.split('-').length !== 3) return getTodayString(); const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; const parts = ddMmmYyyy.split('-'); if(parts.length !== 3) return getTodayString(); const day = parts[0]; const monthIndex = monthNames.indexOf(parts[1]); const year = parts[2]; if (monthIndex === -1) return getTodayString(); const mm = String(monthIndex + 1).padStart(2, '0'); return `${year}-${mm}-${day}`;
}


// --- Export Shared Helper Functions (Dropdown, Alert, Telegram) ---
export function setupSearchableDropdown(inputId, dropdownId, items, onSelectCallback, allowCustom = false) {
    // ... (កូដ​ដូច​ដើម)
    const searchInput = document.getElementById(inputId); const dropdown = document.getElementById(dropdownId); if (!searchInput || !dropdown) { console.error(`Dropdown elements not found: inputId=${inputId}, dropdownId=${dropdownId}`); return; } function populateDropdown(filter = '') { dropdown.innerHTML = ''; const filteredItems = items.filter(item => item.text && item.text.toLowerCase().includes(filter.toLowerCase())); if (filteredItems.length === 0 && !allowCustom && inputId !== 'user-search') { dropdown.classList.add('hidden'); return; } filteredItems.forEach(item => { const itemEl = document.createElement('div'); itemEl.textContent = item.text; itemEl.dataset.value = item.value; itemEl.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'; itemEl.addEventListener('mousedown', (e) => { e.preventDefault(); searchInput.value = item.text; dropdown.classList.add('hidden'); if (onSelectCallback) onSelectCallback(item.value); console.log(`Selected dropdown item: ${item.text} (value: ${item.value})`); }); dropdown.appendChild(itemEl); }); dropdown.classList.remove('hidden'); } searchInput.addEventListener('input', () => { const currentValue = searchInput.value; populateDropdown(currentValue); const exactMatch = items.find(item => item.text === currentValue); const selection = exactMatch ? exactMatch.value : (allowCustom ? currentValue : null); if (onSelectCallback) onSelectCallback(selection); }); searchInput.addEventListener('focus', () => { populateDropdown(searchInput.value); }); searchInput.addEventListener('blur', () => { setTimeout(() => { dropdown.classList.add('hidden'); const currentValue = searchInput.value; const validItem = items.find(item => item.text === currentValue); if (validItem) { if (onSelectCallback) onSelectCallback(validItem.value); } else if (allowCustom && currentValue.trim() !== '') { if (onSelectCallback) onSelectCallback(currentValue); } else if (inputId !== 'user-search') { console.log(`Invalid selection on ${inputId}: ${currentValue}`); if (onSelectCallback) onSelectCallback(null); } }, 150); });
}

export async function sendTelegramNotification(message) {
    // ... (កូដ​ដូច​ដើម)
    console.log("Sending Telegram notification..."); try { const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`; const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' }) }); if (!res.ok) { const errBody = await res.text(); console.error("Telegram API error:", res.status, errBody); } else { console.log("Telegram notification sent successfully."); } } catch (e) { console.error("Failed to send Telegram message:", e); }
}

export function showCustomAlert(title, message, type = 'warning') {
    // ... (កូដ​ដូច​ដើម)
    const customAlertModal = document.getElementById('custom-alert-modal'); const customAlertTitle = document.getElementById('custom-alert-title'); const customAlertMessage = document.getElementById('custom-alert-message'); const customAlertIconSuccess = document.getElementById('custom-alert-icon-success'); const customAlertIconWarning = document.getElementById('custom-alert-icon-warning'); if (!customAlertModal) return; if (customAlertTitle) customAlertTitle.textContent = title; if (customAlertMessage) customAlertMessage.textContent = message; if (type === 'success') { if (customAlertIconSuccess) customAlertIconSuccess.classList.remove('hidden'); if (customAlertIconWarning) customAlertIconWarning.classList.add('hidden'); } else { if (customAlertIconSuccess) customAlertIconSuccess.classList.add('hidden'); if (customAlertIconWarning) customAlertIconWarning.classList.remove('hidden'); } customAlertModal.classList.remove('hidden');
}

export function hideCustomAlert() {
    // ... (កូដ​ដូច​ដើម)
    const customAlertModal = document.getElementById('custom-alert-modal');
    if (customAlertModal) customAlertModal.classList.add('hidden');
}

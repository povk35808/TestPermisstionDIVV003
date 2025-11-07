// --- File: app-ui.js ---
// នេះគឺជា Module ថ្មី សម្រាប់គ្រប់គ្រងរាល់ការផ្លាស់ប្តូរ UI (DOM Manipulation)

import * as Utils from './utils.js'; // សម្រាប់ format កាលបរិច្ឆេទ
import * as API from './api.js'; // សម្រាប់ផ្ញើសារ Telegram (ក្នុង Timers)

// --- Element References ---
let userSearchInput, userDropdown, userSearchError, scanFaceBtn, modelStatusEl, faceScanModal, video, scanStatusEl, scanDebugEl, cancelScanBtn, loginFormContainer, inAppWarning, dataLoadingIndicator, rememberMeCheckbox, mainAppContainer, homeUserName, loginPage, bottomNav, userPhotoEl, userNameEl, userIdEl, userGenderEl, userGroupEl, userDepartmentEl, logoutBtn, navButtons, pages, mainContent, requestLeavePage, openLeaveRequestBtn, cancelLeaveRequestBtn, submitLeaveRequestBtn, leaveDurationSearchInput, leaveDurationDropdownEl, leaveSingleDateContainer, leaveDateRangeContainer, leaveSingleDateInput, leaveStartDateInput, leaveEndDateInput, leaveRequestErrorEl, leaveRequestLoadingEl, leaveReasonSearchInput, leaveReasonDropdownEl, historyContainer, historyPlaceholder, criticalErrorDisplay, historyTabLeave, historyTabOut, historyContainerLeave, historyContainerOut, historyPlaceholderLeave, historyPlaceholderOut, historyContent, editModal, editModalTitle, editForm, editRequestId, editDurationSearchInput, editDurationDropdownEl, editSingleDateContainer, editLeaveDateSingle, editDateRangeContainer, editLeaveDateStart, editLeaveDateEnd, editReasonSearchInput, editReasonDropdownEl, editErrorEl, editLoadingEl, submitEditBtn, cancelEditBtn, deleteModal, deleteConfirmBtn, cancelDeleteBtn, deleteRequestId, deleteCollectionType, openOutRequestBtn, requestOutPage, cancelOutRequestBtn, submitOutRequestBtn, outRequestErrorEl, outRequestLoadingEl, outDurationSearchInput, outDurationDropdownEl, outReasonSearchInput, outReasonDropdownEl, outDateInput, returnScanModal, returnVideo, returnScanStatusEl, returnScanDebugEl, cancelReturnScanBtn, customAlertModal, customAlertTitle, customAlertMessage, customAlertOkBtn, customAlertIconWarning, customAlertIconSuccess, invoiceModal, closeInvoiceModalBtn, invoiceModalTitle, invoiceContentWrapper, invoiceContent, invoiceUserName, invoiceUserId, invoiceUserDept, invoiceRequestType, invoiceDuration, invoiceDates, invoiceReason, invoiceStatus, invoiceApprover, invoiceDecisionTime, invoiceRequestId, invoiceReturnInfo, invoiceReturnStatus, invoiceReturnTime, shareInvoiceBtn, invoiceShareStatus, pendingStatusAlert, pendingStatusMessage, openDailyAttendanceBtn, attendancePage, closeAttendancePageBtn, attendanceIframe;

// --- UI Constants ---
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

// --- UI State ---
let currentHistoryTab = 'leave';
let touchstartX = 0, touchendX = 0, isSwiping = false;
let pendingAlertTimer20s = null; 
let pendingAlertTimer50s = null; 
let pendingAlertTimer120s = null; 
let toastDisplayTimer = null;

/**
 * [EXPORT] ភ្ជាប់ (Assign) គ្រប់ Element References ទាំងអស់
 */
export function assignElements() {
    userSearchInput = document.getElementById('user-search'); userDropdown = document.getElementById('user-dropdown'); userSearchError = document.getElementById('user-search-error'); scanFaceBtn = document.getElementById('scan-face-btn'); modelStatusEl = document.getElementById('model-status'); faceScanModal = document.getElementById('face-scan-modal'); video = document.getElementById('video'); scanStatusEl = document.getElementById('scan-status'); scanDebugEl = document.getElementById('scan-debug'); cancelScanBtn = document.getElementById('cancel-scan-btn'); loginFormContainer = document.getElementById('login-form-container'); inAppWarning = document.getElementById('in-app-warning'); dataLoadingIndicator = document.getElementById('data-loading-indicator'); rememberMeCheckbox = document.getElementById('remember-me'); mainAppContainer = document.getElementById('main-app-container'); homeUserName = document.getElementById('home-user-name'); loginPage = document.getElementById('page-login'); bottomNav = document.getElementById('bottom-navigation'); userPhotoEl = document.getElementById('user-photo'); userNameEl = document.getElementById('user-name'); userIdEl = document.getElementById('user-id'); userGenderEl = document.getElementById('user-gender'); userGroupEl = document.getElementById('user-group'); userDepartmentEl = document.getElementById('user-department'); logoutBtn = document.getElementById('logout-btn'); navButtons = document.querySelectorAll('.nav-btn');
    mainContent = document.getElementById('main-content'); criticalErrorDisplay = document.getElementById('critical-error-display'); requestLeavePage = document.getElementById('page-request-leave'); openLeaveRequestBtn = document.getElementById('open-leave-request-btn'); cancelLeaveRequestBtn = document.getElementById('cancel-leave-request-btn'); submitLeaveRequestBtn = document.getElementById('submit-leave-request-btn'); leaveDurationSearchInput = document.getElementById('leave-duration-search'); leaveDurationDropdownEl = document.getElementById('leave-duration-dropdown'); leaveSingleDateContainer = document.getElementById('leave-single-date-container'); leaveDateRangeContainer = document.getElementById('leave-date-range-container'); leaveSingleDateInput = document.getElementById('leave-date-single'); leaveStartDateInput = document.getElementById('leave-date-start'); leaveEndDateInput = document.getElementById('leave-date-end'); leaveRequestErrorEl = document.getElementById('leave-request-error'); leaveRequestLoadingEl = document.getElementById('leave-request-loading'); leaveReasonSearchInput = document.getElementById('leave-reason-search'); leaveReasonDropdownEl = document.getElementById('leave-reason-dropdown'); historyContainer = document.getElementById('history-container'); historyPlaceholder = document.getElementById('history-placeholder'); historyTabLeave = document.getElementById('history-tab-leave'); historyTabOut = document.getElementById('history-tab-out'); historyContainerLeave = document.getElementById('history-container-leave'); historyContainerOut = document.getElementById('history-container-out'); historyPlaceholderLeave = document.getElementById('history-placeholder-leave'); historyPlaceholderOut = document.getElementById('history-placeholder-out'); historyContent = document.getElementById('history-content'); editModal = document.getElementById('edit-modal'); editModalTitle = document.getElementById('edit-modal-title'); editForm = document.getElementById('edit-form'); editRequestId = document.getElementById('edit-request-id'); editDurationSearchInput = document.getElementById('edit-duration-search'); editDurationDropdownEl = document.getElementById('edit-duration-dropdown'); editSingleDateContainer = document.getElementById('edit-single-date-container'); editLeaveDateSingle = document.getElementById('edit-leave-date-single'); editDateRangeContainer = document.getElementById('edit-date-range-container'); editLeaveDateStart = document.getElementById('edit-leave-date-start'); editLeaveDateEnd = document.getElementById('edit-leave-date-end'); editReasonSearchInput = document.getElementById('edit-reason-search'); editReasonDropdownEl = document.getElementById('edit-reason-dropdown'); editErrorEl = document.getElementById('edit-error'); editLoadingEl = document.getElementById('edit-loading'); submitEditBtn = document.getElementById('submit-edit-btn'); cancelEditBtn = document.getElementById('cancel-edit-btn'); deleteModal = document.getElementById('delete-modal'); deleteConfirmBtn = document.getElementById('delete-confirm-btn'); cancelDeleteBtn = document.getElementById('cancel-delete-btn'); deleteRequestId = document.getElementById('delete-request-id'); deleteCollectionType = document.getElementById('delete-collection-type'); openOutRequestBtn = document.getElementById('open-out-request-btn'); requestOutPage = document.getElementById('page-request-out'); cancelOutRequestBtn = document.getElementById('cancel-out-request-btn'); submitOutRequestBtn = document.getElementById('submit-out-request-btn'); outRequestErrorEl = document.getElementById('out-request-error'); outRequestLoadingEl = document.getElementById('out-request-loading'); outDurationSearchInput = document.getElementById('out-duration-search'); outDurationDropdownEl = document.getElementById('out-duration-dropdown'); outReasonSearchInput = document.getElementById('out-reason-search'); outReasonDropdownEl = document.getElementById('out-reason-dropdown'); outDateInput = document.getElementById('out-date-single'); returnScanModal = document.getElementById('return-scan-modal'); returnVideo = document.getElementById('return-video'); returnScanStatusEl = document.getElementById('return-scan-status'); returnScanDebugEl = document.getElementById('return-scan-debug'); cancelReturnScanBtn = document.getElementById('cancel-return-scan-btn'); customAlertModal = document.getElementById('custom-alert-modal'); customAlertTitle = document.getElementById('custom-alert-title'); customAlertMessage = document.getElementById('custom-alert-message'); customAlertOkBtn = document.getElementById('custom-alert-ok-btn'); customAlertIconWarning = document.getElementById('custom-alert-icon-warning'); customAlertIconSuccess = document.getElementById('custom-alert-icon-success'); invoiceModal = document.getElementById('invoice-modal'); closeInvoiceModalBtn = document.getElementById('close-invoice-modal-btn'); invoiceModalTitle = document.getElementById('invoice-modal-title'); invoiceContentWrapper = document.getElementById('invoice-content-wrapper'); invoiceContent = document.getElementById('invoice-content'); invoiceUserName = document.getElementById('invoice-user-name'); invoiceUserId = document.getElementById('invoice-user-id'); invoiceUserDept = document.getElementById('invoice-user-dept'); invoiceRequestType = document.getElementById('invoice-request-type'); invoiceDuration = document.getElementById('invoice-duration'); invoiceDates = document.getElementById('invoice-dates'); invoiceReason = document.getElementById('invoice-reason'); invoiceStatus = document.getElementById('invoice-status'); invoiceApprover = document.getElementById('invoice-approver'); invoiceDecisionTime = document.getElementById('invoice-decision-time'); invoiceRequestId = document.getElementById('invoice-request-id'); invoiceReturnInfo = document.getElementById('invoice-return-info'); invoiceReturnStatus = document.getElementById('invoice-return-status'); invoiceReturnTime = document.getElementById('invoice-return-time'); shareInvoiceBtn = document.getElementById('share-invoice-btn'); invoiceShareStatus = document.getElementById('invoice-share-status');
    pendingStatusAlert = document.getElementById('pending-status-alert');
    pendingStatusMessage = document.getElementById('pending-status-message');
    openDailyAttendanceBtn = document.getElementById('open-daily-attendance-btn');
    attendancePage = document.getElementById('page-daily-attendance');
    closeAttendancePageBtn = document.getElementById('close-attendance-page-btn');
    attendanceIframe = document.getElementById('attendance-iframe');
    pages = ['page-home', 'page-history', 'page-account', 'page-help', 'page-request-leave', 'page-request-out', 'page-daily-attendance'];
    console.log("UI Elements Assigned.");
}

/**
 * [EXPORT] ភ្ជាប់ (Bind) គ្រប់ Event Listeners ទាំងអស់
 */
export function bindEventListeners(
    onNavigate, onLogout, onScanFace, onCancelScan, 
    // === START: MODIFICATION (Add new handlers) ===
    onOpenLeave, onSubmitLeave, onCancelLeave, 
    onOpenOut, onSubmitOut, onCancelOut,
    // === END: MODIFICATION ===
    onOpenAttendance, onCloseAttendance,
    onOpenEdit, onSubmitEdit, onCancelEdit,
    onOpenDelete, onSubmitDelete, onCancelDelete,
    onOpenReturn, onCancelReturn,
    onOpenInvoice, onCloseInvoice, onShareInvoice,
    onHistoryTap
) {
    // Nav
    if (navButtons) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pageToNavigate = button.dataset.page;
                if (pageToNavigate) onNavigate(pageToNavigate);
            });
        });
    }
    // Auth
    if (logoutBtn) logoutBtn.addEventListener('click', onLogout);
    if (scanFaceBtn) scanFaceBtn.addEventListener('click', onScanFace);
    if (cancelScanBtn) cancelScanBtn.addEventListener('click', onCancelScan);

    // === START: MODIFICATION (Use new handlers) ===
    // Leave Form
    if (openLeaveRequestBtn) openLeaveRequestBtn.addEventListener('click', onOpenLeave);
    if (cancelLeaveRequestBtn) cancelLeaveRequestBtn.addEventListener('click', onCancelLeave);
    if (submitLeaveRequestBtn) submitLeaveRequestBtn.addEventListener('click', onSubmitLeave);

    // Out Form
    if (openOutRequestBtn) openOutRequestBtn.addEventListener('click', onOpenOut);
    if (cancelOutRequestBtn) cancelOutRequestBtn.addEventListener('click', onCancelOut);
    if (submitOutRequestBtn) submitOutRequestBtn.addEventListener('click', onSubmitOut);
    // === END: MODIFICATION ===

    // Attendance Page
    if (openDailyAttendanceBtn) openDailyAttendanceBtn.addEventListener('click', onOpenAttendance);
    if (closeAttendancePageBtn) closeAttendancePageBtn.addEventListener('click', onCloseAttendance);

    // Modals (Edit, Delete, Return, Invoice)
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', onCancelEdit);
    if (submitEditBtn) submitEditBtn.addEventListener('click', onSubmitEdit);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', onCancelDelete);
    if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', onSubmitDelete);
    if (cancelReturnScanBtn) cancelReturnScanBtn.addEventListener('click', onCancelReturn);
    if (closeInvoiceModalBtn) closeInvoiceModalBtn.addEventListener('click', onCloseInvoice);
    if (shareInvoiceBtn) shareInvoiceBtn.addEventListener('click', onShareInvoice);

    // Modals (Alerts)
    if (customAlertOkBtn) customAlertOkBtn.addEventListener('click', hideCustomAlert);

    // History Page (Tabs & Swipe)
    if (historyTabLeave) historyTabLeave.addEventListener('click', () => showHistoryTab('leave'));
    if (historyTabOut) historyTabOut.addEventListener('click', () => showHistoryTab('out'));
    if (historyContent) {
        historyContent.addEventListener('touchstart', handleTouchStart, false);
        historyContent.addEventListener('touchmove', handleTouchMove, false);
        historyContent.addEventListener('touchend', handleTouchEnd, false);
    }
    // History Card Buttons (Event Delegation)
    if (historyContainerLeave) historyContainerLeave.addEventListener('touchstart', onHistoryTap, { passive: false });
    if (historyContainerOut) historyContainerOut.addEventListener('touchstart', onHistoryTap, { passive: false });

    console.log("UI Event Listeners Bound.");
}

// --- Page Navigation ---
export function navigateTo(pageId) {
    console.log("Navigating to page:", pageId);
    pages.forEach(page => {
        const pageEl = document.getElementById(page);
        if (pageEl) pageEl.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden'); 

    const isFullScreenPage = pageId === 'page-request-leave' || pageId === 'page-request-out' || pageId === 'page-daily-attendance';

    if (bottomNav && mainContent) {
        if (isFullScreenPage) {
            bottomNav.classList.add('hidden');
            mainContent.classList.remove('pb-20'); 
        } else {
            bottomNav.classList.remove('hidden');
            mainContent.classList.add('pb-20'); 
        }
    }
    
    if (navButtons) {
        navButtons.forEach(btn => {
            if (btn.dataset.page === pageId) {
                btn.classList.add('text-blue-600');
                btn.classList.remove('text-gray-500');
            } else {
                btn.classList.add('text-gray-500');
                btn.classList.remove('text-blue-600');
            }
        });
    }
    if (mainContent) mainContent.scrollTop = 0;
    if (pageId === 'page-history') showHistoryTab('leave');
}

// --- History Page ---
function showHistoryTab(tabName, fromSwipe = false) {
    if (tabName === currentHistoryTab && !fromSwipe) return;
    console.log(`Switching history tab to: ${tabName}`);
    currentHistoryTab = tabName;
    if (tabName === 'leave') {
        if (historyTabLeave) historyTabLeave.classList.add('border-blue-600', 'text-blue-600');
        if (historyTabLeave) historyTabLeave.classList.remove('border-transparent', 'text-gray-500');
        if (historyTabOut) historyTabOut.classList.add('border-transparent', 'text-gray-500');
        if (historyTabOut) historyTabOut.classList.remove('border-blue-600', 'text-blue-600');
        if (historyContainerLeave) historyContainerLeave.classList.remove('hidden');
        if (historyContainerOut) historyContainerOut.classList.add('hidden');
    } else {
        if (historyTabLeave) historyTabLeave.classList.remove('border-blue-600', 'text-blue-600');
        if (historyTabLeave) historyTabLeave.classList.add('border-transparent', 'text-gray-500');
        if (historyTabOut) historyTabOut.classList.add('border-blue-600', 'text-blue-600');
        if (historyTabOut) historyTabOut.classList.remove('border-transparent', 'text-gray-500');
        if (historyContainerLeave) historyContainerLeave.classList.add('hidden');
        if (historyContainerOut) historyContainerOut.classList.remove('hidden');
    }
    if (historyContent) historyContent.scrollTop = 0;
}
function handleTouchStart(evt) { const firstTouch = evt.touches[0]; touchstartX = firstTouch.clientX; isSwiping = true; }
function handleTouchMove(evt) { if (!isSwiping) return; const touch = evt.touches[0]; touchendX = touch.clientX; }
function handleTouchEnd(evt) {
    if (!isSwiping) return;
    isSwiping = false;
    const threshold = 50;
    const swipedDistance = touchendX - touchstartX;
    if (Math.abs(swipedDistance) > threshold) {
        if (swipedDistance < 0) {
            console.log("Swiped Left");
            showHistoryTab('out', true);
        } else {
            console.log("Swiped Right");
            showHistoryTab('leave', true);
        }
    } else {
        console.log("Swipe distance too short or vertical scroll.");
    }
    touchstartX = 0;
    touchendX = 0;
}
function getSortPriority(status) { 
    switch(status) { 
        case 'pending': return 1; 
        case 'editing': return 2; 
        case 'approved': return 3; 
        case 'rejected': return 4; 
        default: return 5; 
    } 
}
function renderHistoryCard(request, type) { 
    if (!request || !request.requestId) return ''; 
    let statusColor, statusText, decisionInfo = ''; 
    switch(request.status) { 
        case 'approved': statusColor = 'bg-green-100 text-green-800'; statusText = 'បានយល់ព្រម'; if (request.decisionAt) decisionInfo = `<p class="text-xs text-green-600 mt-1">នៅម៉ោង: ${Utils.formatFirestoreTimestamp(request.decisionAt, 'time')}</p>`; break; 
        case 'rejected': statusColor = 'bg-red-100 text-red-800'; statusText = 'បានបដិសធ'; if (request.decisionAt) decisionInfo = `<p class="text-xs text-red-600 mt-1">នៅម៉ោង: ${Utils.formatFirestoreTimestamp(request.decisionAt, 'time')}</p>`; break; 
        case 'editing': statusColor = 'bg-blue-100 text-blue-800'; statusText = 'កំពុងកែសម្រួល'; break; 
        default: statusColor = 'bg-yellow-100 text-yellow-800'; statusText = 'កំពុងរង់ចាំ'; 
    } 
    const dateString = (request.startDate === request.endDate) ? request.startDate : (request.startDate && request.endDate ? `${request.startDate} ដល់ ${request.endDate}` : 'N/A'); 
    const showActions = (request.status === 'pending' || request.status === 'editing'); 
    let returnInfo = ''; 
    let returnButton = ''; 
    if (type === 'out') { 
        if (request.returnStatus === 'បានចូលមកវិញ') returnInfo = `<p class="text-sm font-semibold text-green-700 mt-2">✔️ បានចូលមកវិញ: ${request.returnedAt || ''}</p>`; 
        else if (request.status === 'approved') returnButton = `<button data-id="${request.requestId}" class="return-btn w-full mt-3 py-2 px-3 bg-green-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-green-700">បញ្ជាក់ចូលមកវិញ</button>`; 
    } 
    let invoiceButton = ''; 
    if (request.status === 'approved') invoiceButton = `<button data-id="${request.requestId}" data-type="${type}" class="invoice-btn mt-3 py-1.5 px-3 bg-indigo-100 text-indigo-700 rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-200 w-full sm:w-auto">ពិនិត្យមើលវិក័យប័ត្រ</button>`; 
    return `<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4"><div class="flex justify-between items-start"><span class="font-semibold text-gray-800">${request.duration || 'N/A'}</span><span class="text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}">${statusText}</span></div><p class="text-sm text-gray-600 mt-1">${dateString}</p><p class="text-sm text-gray-500 mt-1"><b>មូលហេតុ:</b> ${request.reason || 'មិនបានបញ្ជាក់'}</p>${decisionInfo}${returnInfo}<div class="mt-3 pt-3 border-t border-gray-100"><div class="flex flex-wrap justify-between items-center gap-2"><p class="text-xs text-gray-400">ID: ${request.requestId}</p>${showActions ? `<div class="flex space-x-2"><button data-id="${request.requestId}" data-type="${type}" class="edit-btn p-1 text-blue-600 hover:text-blue-800"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button data-id="${request.requestId}" data-type="${type}" class="delete-btn p-1 text-red-600 hover:text-red-800"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>` : ''}${invoiceButton}</div>${returnButton}</div></div>`; 
}

/**
 * [EXPORT] បង្ហាញ បញ្ជីប្រវត្តិ និងចាប់ផ្តើម Timer
 */
export function renderHistoryList(snapshot, container, placeholder, type, isEditingCallback) {
    if (!container || !placeholder) return;
    const requests = []; 
    clearAllPendingTimers(); // Clear timers on any update

    if (snapshot.empty) {
        placeholder.classList.remove('hidden');
        container.innerHTML = '';
    } else {
        placeholder.classList.add('hidden');
        container.innerHTML = '';
        snapshot.forEach(doc => requests.push(doc.data()));
        requests.sort((a, b) => {
            const priorityA = getSortPriority(a.status);
            const priorityB = getSortPriority(b.status);
            if (priorityA !== priorityB) return priorityA - priorityB;
            const timeA = a.requestedAt?.toMillis() ?? 0;
            const timeB = b.requestedAt?.toMillis() ?? 0;
            return timeB - timeA;
        });

        // --- Pending Alert Logic ---
        if (requests.length > 0) {
            const topRequest = requests[0];
            const historyPage = document.getElementById('page-history'); // Check if user is on history page

            if (topRequest.status === 'pending') {
                const requestedAtTime = topRequest.requestedAt?.toMillis();
                if (requestedAtTime) {
                    const now = Date.now();
                    const pendingDurationMs = now - requestedAtTime; 
                    const pendingDurationSec = pendingDurationMs / 1000;
                    console.log(`Top request is pending for ${pendingDurationSec.toFixed(0)} seconds.`);

                    // 1. Timer 20s
                    if (pendingDurationSec < 20) {
                        const timeTo20s = (20 - pendingDurationSec) * 1000;
                        console.log(`Scheduling 20s timer in ${timeTo20s.toFixed(0)}ms`);
                        pendingAlertTimer20s = setTimeout(() => {
                            if (isEditingCallback()) return console.log("20s Timer: Canceled (User is editing).");
                            if (historyPage && historyPage.classList.contains('hidden')) return console.log("20s Timer: Canceled (Not on history page).");
                            showPendingAlert("សំណើររបស់អ្នកមានការយឺតយ៉ាវបន្តិចប្រហែល Admin ជាប់រវល់ការងារច្រើន ឬសំណើររបស់អ្នកមានបញ្ហាខុសលក្ខខ័ណ្ឌអ្វីមួយ!");
                        }, timeTo20s);
                    }

                    // 2. Timer 50s
                    if (pendingDurationSec < 50) {
                        const timeTo50s = (50 - pendingDurationSec) * 1000;
                        console.log(`Scheduling 50s timer in ${timeTo50s.toFixed(0)}ms`);
                        pendingAlertTimer50s = setTimeout(() => {
                            if (isEditingCallback()) return console.log("50s Timer: Canceled (User is editing).");
                            if (historyPage && historyPage.classList.contains('hidden')) return console.log("50s Timer: Canceled (Not on history page).");
                            showPendingAlert("សូមរង់ចាំបន្តិច! ប្រព័ន្ធនិងផ្ដល់សារស្វ័យប្រវត្តិរលឹកដល់ Admin ពីសំណើររបស់អ្នក!");
                            let reminderMsg = `<b>🔔 REMINDER (50s) 🔔</b>\n\nRequest <b>(ID: ${topRequest.requestId})</b> from <b>${topRequest.name}</b> is still pending.`;
                            API.sendTelegramNotification(reminderMsg); 
                        }, timeTo50s);
                    }

                    // 3. Timer 120s (2 minutes)
                    if (pendingDurationSec < 120) {
                        const timeTo120s = (120 - pendingDurationSec) * 1000;
                        console.log(`Scheduling 120s timer in ${timeTo120s.toFixed(0)}ms`);
                        pendingAlertTimer120s = setTimeout(() => {
                            if (isEditingCallback()) return console.log("120s Timer: Canceled (User is editing).");
                            if (historyPage && historyPage.classList.contains('hidden')) return console.log("120s Timer: Canceled (Not on history page).");
                            showPendingAlert("សូមរង់ចាំបន្តិច! ប្រព័ន្ធនិងផ្ដល់សារស្វ័យប្រវត្តិរលឹកដល់ Admin ពីសំណើររបស់អ្នក!");
                            let reminderMsg = `<b>🔔 SECOND REMINDER (2min) 🔔</b>\n\nRequest <b>(ID: ${topRequest.requestId})</b> from <b>${topRequest.name}</b> has been pending for 2 minutes. Please check.`;
                            API.sendTelegramNotification(reminderMsg); 
                        }, timeTo120s);
                    }
                }
            }
        }
        // --- End Pending Alert Logic ---

        requests.forEach(request => container.innerHTML += renderHistoryCard(request, type));
    }

    // Update Home Screen Buttons
    if (type === 'leave') {
        const hasPendingLeave = !snapshot.empty && (requests[0].status === 'pending' || requests[0].status === 'editing');
        updateLeaveButtonState(hasPendingLeave);
    } else if (type === 'out') {
        let hasActiveOut = false;
        if (!snapshot.empty) {
            if (requests[0].status === 'pending' || requests[0].status === 'editing') {
                hasActiveOut = true;
            } else {
                hasActiveOut = requests.some(r => r.status === 'approved' && r.returnStatus !== 'បានចូលមកវិញ');
            }
        }
        updateOutButtonState(hasActiveOut);
    }
}

// --- Home Page Button State ---
function updateLeaveButtonState(isDisabled) {
    if (!openLeaveRequestBtn) return; 
    const leaveBtnText = openLeaveRequestBtn.querySelector('p.text-xs');
    if (isDisabled) {
        openLeaveRequestBtn.disabled = true;
        openLeaveRequestBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-100');
        openLeaveRequestBtn.classList.remove('bg-blue-50', 'hover:bg-blue-100');
        if (leaveBtnText) leaveBtnText.textContent = 'មានសំណើកំពុងរង់ចាំ';
    } else {
        openLeaveRequestBtn.disabled = false;
        openLeaveRequestBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-100');
        openLeaveRequestBtn.classList.add('bg-blue-50', 'hover:bg-blue-100');
        if (leaveBtnText) leaveBtnText.textContent = 'ឈប់សម្រាក';
    }
}
function updateOutButtonState(isDisabled) {
    if (!openOutRequestBtn) return;
    const outBtnText = openOutRequestBtn.querySelector('p.text-xs');
    if (isDisabled) {
        openOutRequestBtn.disabled = true;
        openOutRequestBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-100');
        openOutRequestBtn.classList.remove('bg-green-50', 'hover:bg-green-100');
        if (outBtnText) outBtnText.textContent = 'មានសំណើកំពុងដំណើរការ';
    } else {
        openOutRequestBtn.disabled = false;
        openOutRequestBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-100');
        openOutRequestBtn.classList.add('bg-green-50', 'hover:bg-green-100');
        if (outBtnText) outBtnText.textContent = 'ចេញក្រៅផ្ទាល់ខ្លួន';
    }
}

// --- Auth UI ---
export function showLoggedInState(user) {
    populateAccountPage(user);
    if (homeUserName) homeUserName.textContent = user.name || '...';
    if (loginPage) loginPage.classList.add('hidden');
    if (mainAppContainer) mainAppContainer.classList.remove('hidden');
    if (criticalErrorDisplay) criticalErrorDisplay.classList.add('hidden');
    navigateTo('page-home');
}
export function showLoggedOutState() {
    if (loginPage) loginPage.classList.remove('hidden');
    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (userPhotoEl) userPhotoEl.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=User';
    if (userNameEl) userNameEl.textContent = '...';
    if (userIdEl) userIdEl.textContent = '...';
    if (userSearchInput) userSearchInput.value = '';
    if (scanFaceBtn) scanFaceBtn.disabled = true;
    clearAllPendingTimers();
}
export function setLoginLoading(isLoading) {
    if (isLoading) {
        if (dataLoadingIndicator) dataLoadingIndicator.classList.remove('hidden');
    } else {
        if (dataLoadingIndicator) dataLoadingIndicator.classList.add('hidden');
        if (loginFormContainer) loginFormContainer.classList.remove('hidden');
    }
}
export function setLoginError(message) {
    if (dataLoadingIndicator) {
        dataLoadingIndicator.innerHTML = `<p class="text-red-600 font-semibold">${message}</p><p class="text-gray-600 text-sm mt-1">សូមពិនិត្យអ៊ីនធឺណិត និង Refresh ម្ដងទៀត។</p>`;
        dataLoadingIndicator.classList.remove('hidden');
    }
}
function populateAccountPage(user) {
    if (!user) return;
    if (userPhotoEl && user.photo) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = user.photo;
        img.onload = () => userPhotoEl.src = img.src;
        img.onerror = () => userPhotoEl.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=គ្មានរូប';
    } else if (userPhotoEl) {
        userPhotoEl.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=User';
    }
    if (userNameEl) userNameEl.textContent = user.name || 'មិនមាន';
    if (userIdEl) userIdEl.textContent = user.id || 'មិនមាន';
    if (userGenderEl) userGenderEl.textContent = user.gender || 'មិនមាន';
    if (userGroupEl) userGroupEl.textContent = user.group || 'មិនមាន';
    if (userDepartmentEl) userDepartmentEl.textContent = user.department || 'មិនមាន';
}
export function showInAppWarning(isClient) {
    if (isClient) {
        if (inAppWarning) inAppWarning.classList.remove('hidden');
        if (modelStatusEl) modelStatusEl.textContent = 'សូមបើកក្នុង Browser ពេញលេញ';
        if (dataLoadingIndicator) dataLoadingIndicator.classList.add('hidden');
    } else {
        if (inAppWarning) inAppWarning.classList.add('hidden');
    }
}

// === START: MODIFICATION (Fix Button Logic) ===
/**
 * [NEW] អនុគមន៍ថ្មី សម្រាប់គ្រប់គ្រងប៊ូតុង Scan
 */
export function updateScanButtonState(selectedId) {
    if (!scanFaceBtn || !modelStatusEl) {
        console.warn("Scan button or model status element not found yet.");
        return;
    }
    
    const modelsLoaded = (modelStatusEl.textContent === 'Model ស្កេនមុខបានទាញយករួចរាល់');
    const userSelected = (selectedId !== null && selectedId !== '');
    
    console.log(`Updating scan button: ModelsLoaded=${modelsLoaded}, UserSelected=${userSelected} (ID: ${selectedId})`);
    
    scanFaceBtn.disabled = !(modelsLoaded && userSelected);
}

/**
 * [MODIFIED] អនុគមន៍នេះ គ្រាន់តែ Set Text, មិនគ្រប់គ្រងប៊ូតុងទៀតទេ
 */
export function setFaceModelStatus(status) {
    if (status && modelStatusEl) modelStatusEl.textContent = status;
}
// === END: MODIFICATION ===

export function showFaceScanModal(show) {
    if (show) {
        if (faceScanModal) faceScanModal.classList.remove('hidden');
    } else {
        if (faceScanModal) faceScanModal.classList.add('hidden');
    }
}
export function getScanVideoElement() { return video; }
export function setScanStatus(status, debug = '') {
    if (scanStatusEl) scanStatusEl.textContent = status;
    if (scanDebugEl) scanDebugEl.textContent = debug;
}
export function showCriticalError(message) {
    if(criticalErrorDisplay) { 
        criticalErrorDisplay.classList.remove('hidden');
        criticalErrorDisplay.textContent = message;
    }
    if(loginPage) loginPage.classList.add('hidden');
}

// --- Request Forms UI ---
// === START: MODIFICATION (Remove currentUser check) ===
export function showLeaveRequestForm(currentUser) {
    // Check ត្រូវបានធ្វើឡើងใน app.js 
    // if (!currentUser) return showCustomAlert("Error", "សូម Login ជាមុនសិន។");
    
    const reqPhoto = document.getElementById('request-leave-user-photo');
    const reqName = document.getElementById('request-leave-user-name');
    const reqId = document.getElementById('request-leave-user-id');
    const reqDept = document.getElementById('request-leave-user-department');
    if(reqPhoto) reqPhoto.src = currentUser.photo || 'https://placehold.co/60x60/e2e8f0/64748b?text=User';
    if(reqName) reqName.textContent = currentUser.name;
    if(reqId) reqId.textContent = currentUser.id;
    if(reqDept) reqDept.textContent = currentUser.department || 'មិនមាន';
    if (leaveDurationSearchInput) leaveDurationSearchInput.value = '';
    if (leaveReasonSearchInput) leaveReasonSearchInput.value = '';
    if (leaveSingleDateContainer) leaveSingleDateContainer.classList.add('hidden');
    if (leaveDateRangeContainer) leaveDateRangeContainer.classList.add('hidden');
    if (leaveRequestErrorEl) leaveRequestErrorEl.classList.add('hidden');
    if (leaveRequestLoadingEl) leaveRequestLoadingEl.classList.add('hidden');
    if (submitLeaveRequestBtn) submitLeaveRequestBtn.disabled = false;
    navigateTo('page-request-leave');
}
export function showOutRequestForm(currentUser) {
    // Check ត្រូវបានធ្វើឡើងใน app.js 
    // if (!currentUser) return showCustomAlert("Error", "សូម Login ជាមុនសិន។");

    const reqPhoto = document.getElementById('request-out-user-photo');
    const reqName = document.getElementById('request-out-user-name');
    const reqId = document.getElementById('request-out-user-id');
    const reqDept = document.getElementById('request-out-user-department');
    if(reqPhoto) reqPhoto.src = currentUser.photo || 'https://placehold.co/60x60/e2e8f0/64748b?text=User';
    if(reqName) reqName.textContent = currentUser.name;
    if(reqId) reqId.textContent = currentUser.id;
    if(reqDept) reqDept.textContent = currentUser.department || 'មិនមាន';
    if (outDurationSearchInput) outDurationSearchInput.value = '';
    if (outReasonSearchInput) outReasonSearchInput.value = '';
    if (outDateInput) outDateInput.value = Utils.getTodayString('dd/mm/yyyy');
    if (outRequestErrorEl) outRequestErrorEl.classList.add('hidden');
    if (outRequestLoadingEl) outRequestLoadingEl.classList.add('hidden');
    if (submitOutRequestBtn) submitOutRequestBtn.disabled = false;
    navigateTo('page-request-out');
}
// === END: MODIFICATION ===

export function getLeaveRequestData() {
    const duration = leaveDurations.includes(leaveDurationSearchInput.value) ? leaveDurationSearchInput.value : null;
    const reason = leaveReasonSearchInput.value;
    if (!duration) {
        if (leaveRequestErrorEl) { leaveRequestErrorEl.textContent = 'សូមជ្រើសរើស "រយៈពេល" ឲ្យបានត្រឹមត្រូវ (ពីក្នុងបញ្ជី)។'; leaveRequestErrorEl.classList.remove('hidden'); } 
        return null;
    }
    if (!reason || reason.trim() === '') {
        if (leaveRequestErrorEl) { leaveRequestErrorEl.textContent = 'សូមបំពេញ "មូលហេតុ" ជាមុនសិន។'; leaveRequestErrorEl.classList.remove('hidden'); } 
        return null;
    }
    if (leaveRequestErrorEl) leaveRequestErrorEl.classList.add('hidden');

    const isSingleDay = singleDayLeaveDurations.includes(duration);
    const startDateInputVal = isSingleDay ? (leaveSingleDateInput ? leaveSingleDateInput.value : Utils.getTodayString('dd/mm/yyyy')) : (leaveStartDateInput ? Utils.formatInputDateToDb(leaveStartDateInput.value) : Utils.getTodayString('dd/mm/yyyy'));
    const endDateInputVal = isSingleDay ? startDateInputVal : (leaveEndDateInput ? Utils.formatInputDateToDb(leaveEndDateInput.value) : Utils.getTodayString('dd/mm/yyyy'));

    if (new Date(Utils.formatDbDateToInput(endDateInputVal)) < new Date(Utils.formatDbDateToInput(startDateInputVal))) {
        if (leaveRequestErrorEl) { leaveRequestErrorEl.textContent = '"ថ្ងៃបញ្ចប់" មិនអាចនៅមុន "ថ្ងៃចាប់ផ្តើម" បានទេ។'; leaveRequestErrorEl.classList.remove('hidden'); } 
        return null;
    }
    
    const dateStringForTelegram = (startDateInputVal === endDateInputVal) ? startDateInputVal : `ពី ${startDateInputVal} ដល់ ${endDateInputVal}`;
    
    return {
        duration: duration,
        reason: reason.trim(),
        startDate: Utils.formatDateToDdMmmYyyy(startDateInputVal),
        endDate: Utils.formatDateToDdMmmYyyy(endDateInputVal),
        dateStringForTelegram: dateStringForTelegram
    };
}
export function getOutRequestData() {
    const duration = outDurations.includes(outDurationSearchInput.value) ? outDurationSearchInput.value : null;
    const reason = outReasonSearchInput.value;

    if (!duration) {
        if (outRequestErrorEl) { outRequestErrorEl.textContent = 'សូមជ្រើសរើស "រយៈពេល" ឲ្យបានត្រឹមត្រូវ (ពីក្នុងបញ្ជី)។'; outRequestErrorEl.classList.remove('hidden'); }
        return null;
    }
    if (!reason || reason.trim() === '') {
        if (outRequestErrorEl) { outRequestErrorEl.textContent = 'សូមបំពេញ "មូលហេតុ" ជាមុនសិន។'; outRequestErrorEl.classList.remove('hidden'); }
        return null;
    }
    if (outRequestErrorEl) outRequestErrorEl.classList.add('hidden');

    const dateVal = outDateInput ? outDateInput.value : Utils.getTodayString('dd/mm/yyyy');
    
    return {
        duration: duration,
        reason: reason.trim(),
        startDate: Utils.formatDateToDdMmmYyyy(dateVal),
        endDate: Utils.formatDateToDdMmmYyyy(dateVal)
    };
}
export function setLeaveRequestLoading(isLoading) {
    if (isLoading) {
        if (leaveRequestLoadingEl) leaveRequestLoadingEl.classList.remove('hidden');
        if (submitLeaveRequestBtn) submitLeaveRequestBtn.disabled = true;
    } else {
        if (leaveRequestLoadingEl) leaveRequestLoadingEl.classList.add('hidden');
        if (submitLeaveRequestBtn) submitLeaveRequestBtn.disabled = false;
    }
}
export function setOutRequestLoading(isLoading) {
    if (isLoading) {
        if (outRequestLoadingEl) outRequestLoadingEl.classList.remove('hidden');
        if (submitOutRequestBtn) submitOutRequestBtn.disabled = true;
    } else {
        if (outRequestLoadingEl) outRequestLoadingEl.classList.add('hidden');
        if (submitOutRequestBtn) submitOutRequestBtn.disabled = false;
    }
}

// --- Modals (Alerts, Edit, Delete, Return, Invoice) ---
export function showCustomAlert(title, message, type = 'warning') { if (!customAlertModal) return; if (customAlertTitle) customAlertTitle.textContent = title; if (customAlertMessage) customAlertMessage.textContent = message; if (type === 'success') { if (customAlertIconSuccess) customAlertIconSuccess.classList.remove('hidden'); if (customAlertIconWarning) customAlertIconWarning.classList.add('hidden'); } else { if (customAlertIconSuccess) customAlertIconSuccess.classList.add('hidden'); if (customAlertIconWarning) customAlertIconWarning.classList.remove('hidden'); } customAlertModal.classList.remove('hidden'); }
export function hideCustomAlert() { if (customAlertModal) customAlertModal.classList.add('hidden'); }
function showPendingAlert(message) { if (!pendingStatusAlert || !pendingStatusMessage) return; if (toastDisplayTimer) clearTimeout(toastDisplayTimer); pendingStatusMessage.textContent = message; pendingStatusAlert.classList.remove('hidden'); toastDisplayTimer = setTimeout(() => { hidePendingAlert(); }, 5000); }
function hidePendingAlert() { if (toastDisplayTimer) clearTimeout(toastDisplayTimer); toastDisplayTimer = null; if (pendingStatusAlert) pendingStatusAlert.classList.add('hidden'); }
export function clearAllPendingTimers() { if (pendingAlertTimer20s) clearTimeout(pendingAlertTimer20s); if (pendingAlertTimer50s) clearTimeout(pendingAlertTimer50s); if (pendingAlertTimer120s) clearTimeout(pendingAlertTimer120s); pendingAlertTimer20s = null; pendingAlertTimer50s = null; pendingAlertTimer120s = null; hidePendingAlert(); }

export function openEditModal(data, type) {
    if (editLoadingEl) editLoadingEl.classList.add('hidden'); 
    if (editErrorEl) editErrorEl.classList.add('hidden'); 
    if (editModal) editModal.classList.remove('hidden'); 

    if (editModalTitle) editModalTitle.textContent = (type === 'leave') ? "កែសម្រួលច្បាប់ឈប់" : "កែសម្រួលច្បាប់ចេញក្រៅ"; 
    if (editRequestId) editRequestId.value = data.requestId; 
    if (editReasonSearchInput) editReasonSearchInput.value = data.reason || ''; 
    if (editDurationSearchInput) editDurationSearchInput.value = data.duration; 

    const currentDurationItems = (type === 'leave' ? leaveDurationItems : outDurationItems);
    const currentReasonItems = (type === 'leave' ? leaveReasonItems : outReasonItems);
    
    setupSearchableDropdown(
        'edit-duration-search', 
        'edit-duration-dropdown', 
        currentDurationItems, 
        (duration) => { updateEditDateFields(duration, type); }, 
        false
    );
    setupSearchableDropdown(
        'edit-reason-search', 
        'edit-reason-dropdown', 
        currentReasonItems, 
        () => {},
        true
    );

    if (type === 'leave') { 
        if (singleDayLeaveDurations.includes(data.duration)) { 
            if (editSingleDateContainer) editSingleDateContainer.classList.remove('hidden'); 
            if (editDateRangeContainer) editDateRangeContainer.classList.add('hidden'); 
            if (editLeaveDateSingle) editLeaveDateSingle.value = data.startDate; 
        } else { 
            if (editSingleDateContainer) editSingleDateContainer.classList.add('hidden'); 
            if (editDateRangeContainer) editDateRangeContainer.classList.remove('hidden'); 
            if (editLeaveDateStart) editLeaveDateStart.value = Utils.parseDdMmmYyyyToInputFormat(data.startDate); 
            if (editLeaveDateEnd) editLeaveDateEnd.value = Utils.parseDdMmmYyyyToInputFormat(data.endDate); 
        } 
    } else { 
        if (editSingleDateContainer) editSingleDateContainer.classList.remove('hidden'); 
        if (editDateRangeContainer) editDateRangeContainer.classList.add('hidden'); 
        if (editLeaveDateSingle) editLeaveDateSingle.value = data.startDate; 
    } 
    
    if (editLoadingEl) editLoadingEl.classList.add('hidden');
}
export function setEditModalLoading(isLoading) {
    if (isLoading) {
        if (editLoadingEl) editLoadingEl.classList.remove('hidden');
        if (editErrorEl) editErrorEl.classList.add('hidden');
    } else {
        if (editLoadingEl) editLoadingEl.classList.add('hidden');
    }
}
export function setEditModalError(message) {
    if(editErrorEl) { 
        editErrorEl.textContent = message;
        editErrorEl.classList.remove('hidden'); 
    } 
}
export function getEditModalData() {
    const type = (editModalTitle.textContent.includes("ឈប់")) ? 'leave' : 'out'; 
    const newDuration = (type === 'leave' ? leaveDurations : outDurations).includes(editDurationSearchInput.value) ? editDurationSearchInput.value : null;
    const newReason = editReasonSearchInput.value; 

    if (!newDuration) {
        setEditModalError("សូមជ្រើសរើស \"រយៈពេល\" ឲ្យបានត្រឹមត្រូវ (ពីក្នុងបញ្ជី)។");
        return null;
    }
    if (!newReason || newReason.trim() === '') { 
        setEditModalError("មូលហេតុមិនអាចទទេបានទេ។");
        return null; 
    }
    return { newDuration, newReason };
}
export function closeEditModal() { if (editModal) editModal.classList.add('hidden'); }
export function openDeleteModal(requestId, type) { if (deleteRequestId) deleteRequestId.value = requestId; if (deleteCollectionType) deleteCollectionType.value = type; if (deleteModal) deleteModal.classList.remove('hidden'); }
export function closeDeleteModal() { if (deleteModal) deleteModal.classList.add('hidden'); }
export function setDeleteModalLoading(isLoading) {
    if (!deleteConfirmBtn) return;
    if (isLoading) {
        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = 'កំពុងលុប...';
    } else {
        deleteConfirmBtn.disabled = false;
        deleteConfirmBtn.textContent = 'យល់ព្រមលុប';
    }
}
export function openReturnScanModal() { if (returnScanModal) returnScanModal.classList.remove('hidden'); }
export function closeReturnScanModal() { if (returnScanModal) returnScanModal.classList.add('hidden'); }
export function getReturnVideoElement() { return returnVideo; }
export function setReturnScanStatus(status, debug = '') {
    if (returnScanStatusEl) returnScanStatusEl.textContent = status;
    if (returnScanDebugEl) returnScanDebugEl.textContent = debug;
}
export function hideInvoiceModal() { if (invoiceModal) invoiceModal.classList.add('hidden'); if (invoiceShareStatus) invoiceShareStatus.textContent = ''; if (shareInvoiceBtn) shareInvoiceBtn.disabled = false; }
export function openInvoiceModal(data, type) {
    if (!invoiceModal) { console.error("Invoice modal element not found!"); return; } 
    invoiceModal.classList.remove('hidden'); 
    if(invoiceUserName) invoiceUserName.textContent='កំពុងទាញយក...'; 
    
    const requestTypeText = (type === 'leave') ? 'ច្បាប់ឈប់សម្រាក' : 'ច្បាប់ចេញក្រៅ'; 
    const decisionTimeText = Utils.formatFirestoreTimestamp(data.decisionAt || data.requestedAt); 
    const dateRangeText = (data.startDate === data.endDate) ? data.startDate : `${data.startDate} ដល់ ${data.endDate}`; 
    
    if(invoiceModalTitle) invoiceModalTitle.textContent = `វិក័យប័ត្រ - ${requestTypeText}`; 
    if(invoiceUserName) invoiceUserName.textContent = data.name || 'N/A'; 
    if(invoiceUserId) invoiceUserId.textContent = data.userId || 'N/A'; 
    if(invoiceUserDept) invoiceUserDept.textContent = data.department || 'N/A'; 
    if(invoiceRequestType) invoiceRequestType.textContent = requestTypeText; 
    if(invoiceDuration) invoiceDuration.textContent = data.duration || 'N/A'; 
    if(invoiceDates) invoiceDates.textContent = dateRangeText; 
    if(invoiceReason) invoiceReason.textContent = data.reason || 'N/Examples/N/A'; 
    if(invoiceApprover) invoiceApprover.textContent = "លោកគ្រូ ពៅ ដារ៉ូ"; 
    if(invoiceDecisionTime) invoiceDecisionTime.textContent = decisionTimeText; 
    if(invoiceRequestId) invoiceRequestId.textContent = data.requestId || 'N/A'; 
    
    if (type === 'out' && data.returnStatus === 'បានចូលមកវិញ') { 
        if (invoiceReturnStatus) invoiceReturnStatus.textContent = data.returnStatus; 
        if (invoiceReturnTime) invoiceReturnTime.textContent = data.returnedAt || 'N/A'; 
        if (invoiceReturnInfo) invoiceReturnInfo.classList.remove('hidden'); 
    } else { 
        if (invoiceReturnInfo) invoiceReturnInfo.classList.add('hidden'); 
    } 
    
    if(shareInvoiceBtn) { 
        shareInvoiceBtn.dataset.requestId = data.requestId || 'N/A'; 
        shareInvoiceBtn.dataset.userName = data.name || 'User'; 
        shareInvoiceBtn.dataset.requestType = requestTypeText; 
        shareInvoiceBtn.disabled = false; 
    } 
    console.log("Invoice modal populated.");
}
export async function shareInvoiceAsImage() {
    if (!invoiceContent || typeof html2canvas === 'undefined' || !shareInvoiceBtn) {
        showCustomAlert("Error", "មុខងារ Share មិនទាន់រួចរាល់ ឬ Library បាត់។");
        return;
    }
    if(invoiceShareStatus) invoiceShareStatus.textContent = 'កំពុងបង្កើតរូបភាព...';
    shareInvoiceBtn.disabled = true;
    try {
        if(invoiceContentWrapper) invoiceContentWrapper.scrollTop = 0;
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(invoiceContent, { scale: 2, useCORS: true, logging: false });
        canvas.toBlob(async (blob) => {
            if (!blob) { throw new Error("មិនអាចបង្កើតរូបភាព Blob បានទេ។"); }
            if(invoiceShareStatus) invoiceShareStatus.textContent = 'កំពុងព្យាយាម Share...';
            
            if (navigator.share && navigator.canShare) {
                const fileName = `Invoice_${shareInvoiceBtn.dataset.requestId || 'details'}.png`;
                const file = new File([blob], fileName, { type: blob.type });
                const shareData = {
                    files: [file],
                    title: `វិក័យប័ត្រសុំច្បាប់ (${shareInvoiceBtn.dataset.requestType || ''})`,
                    text: `វិក័យប័ត្រសុំច្បាប់សម្រាប់ ${shareInvoiceBtn.dataset.userName || ''} (ID: ${shareInvoiceBtn.dataset.requestId || ''})`,
                };
                if (navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        console.log('Invoice shared successfully via Web Share API');
                        if(invoiceShareStatus) invoiceShareStatus.textContent = 'Share ជោគជ័យ!';
                    } catch (err) {
                        console.error('Web Share API error:', err);
                        if(invoiceShareStatus) invoiceShareStatus.textContent = 'Share ត្រូវបានបោះបង់។';
                        if (err.name !== 'AbortError') showCustomAlert("Share Error", "មិនអាច Share បានតាម Web Share API។ សូមព្យាយាមម្តងទៀត។");
                    }
                } else {
                    console.warn('Web Share API cannot share this data.');
                    if(invoiceShareStatus) invoiceShareStatus.textContent = 'មិនអាច Share file បាន។';
                    showCustomAlert("Share Error", "Browser នេះមិនគាំទ្រការ Share file ទេ។ សូមធ្វើការ Screenshot ដោយដៃ។");
                }
            } else {
                console.warn('Web Share API not supported.');
                if(invoiceShareStatus) invoiceShareStatus.textContent = 'Web Share មិនដំណើរការ។';
                showCustomAlert("សូម Screenshot", "Browser នេះមិនគាំទ្រ Web Share API ទេ។ សូមធ្វើការ Screenshot វិក័យប័ត្រនេះដោយដៃ រួច Share ទៅ Telegram។");
            }
            shareInvoiceBtn.disabled = false;
        }, 'image/png');
    } catch (error) {
        console.error("Error generating or sharing invoice image:", error);
        if(invoiceShareStatus) invoiceShareStatus.textContent = 'Error!';
        showCustomAlert("Error", `មានបញ្ហាក្នុងការបង្កើត ឬ Share រូបភាព: ${error.message}`);
        shareInvoiceBtn.disabled = false;
    }
}

// --- Attendance Page ---
export function openDailyAttendancePage() {
    console.log("Opening Daily Attendance page...");
    if (attendanceIframe) {
        attendanceIframe.src = 'https://darotrb0-bit.github.io/MMKDailyattendance/';
    }
    navigateTo('page-daily-attendance');
}
export function closeDailyAttendancePage() {
    console.log("Closing Daily Attendance page...");
    if (attendanceIframe) {
        attendanceIframe.src = 'about:blank'; 
    }
    navigateTo('page-home');
}

// --- Dropdown Logic ---
export function setupSearchableDropdown(inputId, dropdownId, items, onSelectCallback, allowCustom = false) {
    const searchInput = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!searchInput || !dropdown) {
        console.error(`Dropdown elements not found: inputId=${inputId}, dropdownId=${dropdownId}`);
        return;
    }
    
    const MAX_RESULTS_TO_SHOW = 20;

    function populateDropdown(filter = '') {
        dropdown.innerHTML = '';
        const filterLower = filter.toLowerCase();

        if (filterLower === '' && inputId === 'user-search') {
            const itemEl = document.createElement('div');
            itemEl.textContent = `សូមវាយ ID ឬ ឈ្មោះ (ទិន្នន័យសរុប ${items.length} នាក់)`;
            itemEl.className = 'px-4 py-2 text-gray-500 text-sm italic';
            dropdown.appendChild(itemEl);
            dropdown.classList.remove('hidden');
            return;
        }

        const filteredItems = items.filter(item => item.text && item.text.toLowerCase().includes(filterLower));

        if (filteredItems.length === 0) {
            if (filterLower !== '' || (filterLower === '' && inputId !== 'user-search')) {
                const itemEl = document.createElement('div');
                itemEl.textContent = 'រកមិនឃើញ...';
                itemEl.className = 'px-4 py-2 text-gray-500 text-sm italic';
                dropdown.appendChild(itemEl);
                dropdown.classList.remove('hidden');
            } else {
                dropdown.classList.add('hidden');
            }
            return;
        }
        
        const itemsToShow = filteredItems.slice(0, MAX_RESULTS_TO_SHOW);

        itemsToShow.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.textContent = item.text;
            itemEl.dataset.value = item.value;
            itemEl.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
            itemEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                searchInput.value = item.text;
                dropdown.classList.add('hidden');
                if (onSelectCallback) onSelectCallback(item.value);
                console.log(`Selected dropdown item: ${item.text} (value: ${item.value})`);
            });
            dropdown.appendChild(itemEl);
        });

        if (filteredItems.length > MAX_RESULTS_TO_SHOW) {
            const moreEl = document.createElement('div');
            moreEl.textContent = `... និង ${filteredItems.length - MAX_RESULTS_TO_SHOW} ផ្សេងទៀត`;
            moreEl.className = 'px-4 py-2 text-gray-400 text-xs italic';
            dropdown.appendChild(moreEl);
        }

        dropdown.classList.remove('hidden');
    }

    searchInput.addEventListener('input', () => {
        const currentValue = searchInput.value;
        populateDropdown(currentValue);
        const exactMatch = items.find(item => item.text === currentValue);
        const selection = exactMatch ? exactMatch.value : (allowCustom ? currentValue : null);
        if (onSelectCallback) onSelectCallback(selection);
    });

    searchInput.addEventListener('focus', () => {
        populateDropdown(searchInput.value);
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            dropdown.classList.add('hidden');
            const currentValue = searchInput.value;
            const validItem = items.find(item => item.text === currentValue);
            if (validItem) {
                if (onSelectCallback) onSelectCallback(validItem.value);
            } else if (allowCustom && currentValue.trim() !== '') {
                if (onSelectCallback) onSelectCallback(currentValue);
            } else if (inputId !== 'user-search') {
                console.log(`Invalid selection on ${inputId}: ${currentValue}`);
                if (onSelectCallback) onSelectCallback(null);
            }
        }, 150);
    });
}
export function populateUserDropdown(users, onSelectCallback) { 
    const userItems = users.filter(user => user.id && user.name).map(user => ({ text: `${user.id} - ${user.name}`, value: user.id })); 
    setupSearchableDropdown('user-search', 'user-dropdown', userItems, onSelectCallback, false); 
}
function updateEditDateFields(duration, type) {
    console.log(`Updating edit date fields for duration: ${duration}, type: ${type}`);
    if (!editSingleDateContainer || !editDateRangeContainer || !editLeaveDateSingle || !editLeaveDateStart || !editLeaveDateEnd) {
        console.error("Date input elements not found for Edit form.");
        return;
    }
    if (type === 'out') {
        editSingleDateContainer.classList.remove('hidden');
        editDateRangeContainer.classList.add('hidden');
        return;
    }
    if (!duration) {
        editSingleDateContainer.classList.add('hidden');
        editDateRangeContainer.classList.add('hidden');
        return;
    }
    if (singleDayLeaveDurations.includes(duration)) {
        editSingleDateContainer.classList.remove('hidden');
        editDateRangeContainer.classList.add('hidden');
        if (editLeaveDateStart.value) {
            editLeaveDateSingle.value = Utils.formatDateToDdMmmYyyy(editLeaveDateStart.value);
        }
    } else {
        editSingleDateContainer.classList.add('hidden');
        editDateRangeContainer.classList.remove('hidden');
        let startDateInputVal;
        if (editLeaveDateStart.value) {
            startDateInputVal = editLeaveDateStart.value;
        } else {
            startDateInputVal = Utils.parseDdMmmYyyyToInputFormat(editLeaveDateSingle.value);
            editLeaveDateStart.value = startDateInputVal; 
        }
        const days = durationToDaysMap[duration] ?? 1;
        const endDateValue = Utils.addDays(startDateInputVal, days);
        editLeaveDateEnd.value = endDateValue; 
    }
}

// --- File: face-scanner.js ---
// === MODIFICATION: បានប្តូរទៅប្រើ TinyFaceDetector ដើម្បីល្បឿន ===

// --- Internal State & Constants ---
let userReferenceDescriptor = null;
let isFaceAnalysisRunning = false;
let lastFaceCheck = 0;
// === MODIFICATION: ប្តូរពី 500ms ទៅ 250ms ព្រោះ TinyDetector លឿនជាង ===
const FACE_CHECK_INTERVAL = 250; 

/**
 * មុខងារសម្រាប់បិទ tracks របស់វីដេអូ (បិទកាមេរ៉ា)
 * @param {HTMLVideoElement} videoElement - ធាតុ <video>
 */
function stopVideoTracks(videoElement) {
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

/**
 * [EXPORT] ជម្រះ "កូនសោគោល" (Reference Descriptor) ដែលបានរក្សាទុក
 */
export function clearReferenceDescriptor() {
    userReferenceDescriptor = null;
    console.log("Reference Descriptor Cleared via module function.");
}

/**
 * [EXPORT] ទាញយក Face-API Models ពី CDN
 * @param {HTMLElement} modelStatusEl - ធាតុ <p> សម្រាប់បង្ហាញស្ថានភាព Model
 * @param {Function} onReadyCallback - Function ដែលត្រូវហៅ (call) ពេល Model រួចរាល់
 */
export async function loadFaceApiModels(modelStatusEl, onReadyCallback) {
    if (!modelStatusEl) return;
    try {
        // === MODIFICATION: ប្តូរទៅទាញយក TinyFaceDetector ===
        console.log("Loading face-api models (TinyFaceDetector)...");
        modelStatusEl.textContent = 'កំពុងទាញយក Model ស្កេនមុខ...';
        await Promise.all([
            // --- ប្តូរទៅប្រើ Model ស្រាល និងលឿនជាងមុន ---
            faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'),
            
            // --- Model ទាំងពីរនេះ នៅដដែល ---
            faceapi.nets.faceLandmark68TinyNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'),
            faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'),
        ]);
        modelStatusEl.textContent = 'Model ស្កេនមុខបានទាញយករួចរាល់';
        // === MODIFICATION: បាន Update Log ===
        console.log("Face-api models loaded successfully (TinyFaceDetector).");
        if (onReadyCallback) onReadyCallback();
    } catch (error) {
        console.error("Error ពេលទាញយក Model របស់ face-api:", error);
        modelStatusEl.textContent = 'Error: មិនអាចទាញយក Model បាន';
    }
}

/**
 * [EXPORT] បង្កើត "កូនសោគោល" ពី URL រូបថតយោង
 * @param {string} userPhotoUrl - URL របស់រូបថត
 * @returns {faceapi.L2EuclideanDistance} - កូនសោគោល (Descriptor)
 */
export async function getReferenceDescriptor(userPhotoUrl) {
    if (userReferenceDescriptor) {
        console.log("Using cached reference descriptor.");
        return userReferenceDescriptor;
    }
    if (!userPhotoUrl) throw new Error("Missing user photo URL");

    // === MODIFICATION: បាន Update Log ===
    console.log("Fetching and computing new reference descriptor (TinyFaceDetector)...");
    let referenceImage;
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = userPhotoUrl;
        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (err) => reject(new Error('Failed to fetch (មិនអាចទាញយករូបថតយោងបាន)។ សូមប្រាកដថា Link រូបថតត្រឹមត្រូវ។'));
        });
        referenceImage = img;
    } catch (fetchError) {
        throw fetchError;
    }

    let referenceDetection;
    try {
        // === MODIFICATION: ប្តូរទៅប្រើ TinyFaceDetectorOptions ===
        // យើងប្រើ inputSize: 224 ដើម្បីឲ្យវារកមុខបានល្អ (ទំហំតូចជាងមុន តែលឿន)
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
        referenceDetection = await faceapi.detectSingleFace(referenceImage, options)
            .withFaceLandmarks(true)
            .withFaceDescriptor();
        if (!referenceDetection) throw new Error('រកមិនឃើញមុខនៅក្នុងរូបថតយោង');
    } catch (descriptorError) {
        console.error("Descriptor Error:", descriptorError);
        throw new Error('មិនអាចវិភាគមុខពីរូបថតយោងបានទេ (រូបថតអាចមិនច្បាស់)។');
    }
    userReferenceDescriptor = referenceDetection.descriptor;
    return userReferenceDescriptor;
}

/**
 * [EXPORT] បញ្ឈប់ Loop វិភាគផ្ទៃមុខ (rAF)
 */
export function stopAdvancedFaceAnalysis() {
    console.log("Stopping Advanced Face Analysis...");
    isFaceAnalysisRunning = false;
}

/**
 * [EXPORT] ចាប់ផ្តើមការវិភាគផ្ទៃមុខកម្រិតខ្ពស់ ដោយប្រើ requestAnimationFrame
 * @param {HTMLVideoElement} videoElement - ធាតុ <video>
 * @param {HTMLElement} statusElement - ធាតុ <p> សម្រាប់បង្ហាញសារ
 * @param {HTMLElement} debugElement - ធាតុ <p> សម្រាប់បង្ហាញ debug
 * @param {faceapi.L2EuclideanDistance} referenceDescriptor - "កូនសោគោល" សម្រាប់ប្រៀបធៀប
 * @param {Function} onSuccessCallback - Function ដែលត្រូវហៅ (call) នៅពេលផ្ទៀងផ្ទាត់ជោគជ័យ
 */
export function startAdvancedFaceAnalysis(videoElement, statusElement, debugElement, referenceDescriptor, onSuccessCallback) {
    console.log("Starting Advanced Face Analysis (rAF)...");
    isFaceAnalysisRunning = true;
    lastFaceCheck = 0; // Reset ម៉ោងពិនិត្យចុងក្រោយ

    // --- កំណត់ "ច្បាប់" សម្រាប់ផ្ទៃមុខ ---
    // === MODIFICATION: ប្រើ 0.5 ដដែល ព្រោះវាជាកម្រិតសុវត្ថិភាពល្អ ===
    const VERIFICATION_THRESHOLD = 0.5;
    const MIN_WIDTH_PERCENT = 0.3;
    const MAX_WIDTH_PERCENT = 0.7;
    const CENTER_TOLERANCE_PERCENT = 0.2;

    const videoWidth = videoElement.clientWidth || 320;
    const videoCenterX = videoWidth / 2;
    const minPixelWidth = videoWidth * MIN_WIDTH_PERCENT;
    const maxPixelWidth = videoWidth * MAX_WIDTH_PERCENT;
    const centerTolerancePixels = videoWidth * CENTER_TOLERANCE_PERCENT;

    console.log(`Analysis Rules: Threshold=<${VERIFICATION_THRESHOLD}, minWidth=${minPixelWidth}px, maxWidth=${maxPixelWidth}px`);
    
    // === MODIFICATION: បង្កើត TinyFaceDetectorOptions ម្តងបានហើយ ===
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });

    // --- បង្កើត Loop ថ្មី ដោយប្រើ requestAnimationFrame ---
    async function analysisLoop(timestamp) {
        if (!isFaceAnalysisRunning) return; // បញ្ឈប់ Loop

        if (timestamp - lastFaceCheck < FACE_CHECK_INTERVAL) {
            requestAnimationFrame(analysisLoop);
            return;
        }
        lastFaceCheck = timestamp;

        try {
            if (!videoElement || videoElement.readyState < 3) {
                requestAnimationFrame(analysisLoop);
                return;
            }

            // === MODIFICATION: ប្តូរទៅប្រើ detectorOptions របស់ TinyDetector ===
            const detections = await faceapi.detectSingleFace(videoElement, detectorOptions)
                .withFaceLandmarks(true)
                .withFaceDescriptor();

            if (!detections) {
                statusElement.textContent = 'រកមិនឃើញផ្ទៃមុខ...';
                debugElement.textContent = '';
            } else {
                const box = detections.detection.box;
                const faceCenterX = box.x + box.width / 2;

                if (box.width < minPixelWidth) {
                    statusElement.textContent = 'សូមរំកលមុខមកជិតបន្តិច';
                    debugElement.textContent = `ទំហំ: ${Math.round(box.width)}px (តូចពេក)`;
                }
                else if (box.width > maxPixelWidth) {
                    statusElement.textContent = 'សូមរំកលមុខថយក្រោយបន្តិច';
                    debugElement.textContent = `ទំហំ: ${Math.round(box.width)}px (ធំពេក)`;
                }
                else if (Math.abs(faceCenterX - videoCenterX) > centerTolerancePixels) {
                    statusElement.textContent = 'សូមដាក់មុខនៅចំកណ្តាល';
                    const distanceToCenter = Math.abs(faceCenterX - videoCenterX);
                    debugElement.textContent = ` lệch: ${Math.round(distanceToCenter)}px`;
                }
                else {
                    statusElement.textContent = 'រកឃើញ! កំពុងផ្ទៀងផ្ទាត់...';
                    const distance = faceapi.euclideanDistance(referenceDescriptor, detections.descriptor);
                    
                    debugElement.textContent = `ចំងាយ: ${distance.toFixed(2)} (ត្រូវតែ < ${VERIFICATION_THRESHOLD})`;

                    if (distance < VERIFICATION_THRESHOLD) {
                        statusElement.textContent = 'ផ្ទៀងផ្ទាត់ជោគជ័យ!';
                        isFaceAnalysisRunning = false; // បញ្ឈប់ Loop
                        stopVideoTracks(videoElement); // បិទកាមេរ៉ា
                        onSuccessCallback(); // ហៅ Function ជោគជ័យ
                        return; // --- ចេញពី Loop ---
                    } else {
                        statusElement.textContent = 'មុខមិនត្រឹមត្រូវ... សូមព្យាយាមម្តងទៀត';
                    }
                }
            }
        
        } catch (error) {
            console.error("Error during face analysis rAF loop:", error);
            statusElement.textContent = 'មានបញ្ហាពេលវិភាគ...';
        }
        
        // បន្ត Loop ទៅ Frame បន្ទាប់
        requestAnimationFrame(analysisLoop);
    }

    // --- ចាប់ផ្តើម Loop ---
    requestAnimationFrame(analysisLoop);
}

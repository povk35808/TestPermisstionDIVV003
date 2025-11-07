// --- File: api.js ---
// នេះគឺជា Module ថ្មី សម្រាប់គ្រប់គ្រងរាល់ការហៅ (call) ទៅកាន់ API ខាងក្រៅ

// --- Configs សម្រាប់ API ---
const SHEET_ID = '1_Kgl8UQXRsVATt_BOHYQjVWYKkRIBA12R-qnsBoSUzc';
const SHEET_NAME = 'បញ្ជឺឈ្មោះរួម';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tq=${encodeURIComponent('SELECT E, L, AA, N, G, S WHERE E IS NOT NULL OFFSET 0')}`;

const BOT_TOKEN = '8284240201:AAEDRGHDcuoQAhkWk7km6I-9csZNbReOPHw';
const CHAT_ID = '1487065922';

/**
 * [EXPORT] ទាញយកបញ្ជីឈ្មោះបុគ្គលិកទាំងអស់ពី Google Sheet
 * @returns {Array<object>} បញ្ជីបុគ្គលិក
 */
export async function fetchUsers() {
    console.log("Fetching users from Google Sheet (via api.js)...");
    try {
        const response = await fetch(GVIZ_URL);
        if (!response.ok) throw new Error(`Google Sheet fetch failed: ${response.status}`);
        
        const text = await response.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
        if (!match || !match[1]) throw new Error("ទម្រង់ការឆ្លើយតបពី Google Sheet មិនត្រឹមត្រូវ");
        
        const json = JSON.parse(match[1]);
        if (json.table && json.table.rows && json.table.rows.length > 0) {
            const allUsersData = json.table.rows.map(row => ({
                id: row.c?.[0]?.v ?? null,
                name: row.c?.[1]?.v ?? null,
                photo: row.c?.[2]?.v ?? null,
                gender: row.c?.[3]?.v ?? null,
                group: row.c?.[4]?.v ?? null,
                department: row.c?.[5]?.v ?? null
            }));
            console.log(`Fetched ${allUsersData.length} users (from api.js).`);
            return allUsersData;
        } else {
            throw new Error("រកមិនឃើញទិន្នន័យអ្នកប្រើប្រាស់");
        }
    } catch (error) {
        console.error("Error ពេលទាញយកទិន្នន័យ Google Sheet:", error);
        // ត្រឡប់ Error ទៅឲ្យ app.js ជាអ្នកដោះស្រាយ
        throw error; 
    }
}

/**
 * [EXPORT] ផ្ញើសារទៅកាន់ Telegram Bot
 * @param {string} message - សារដែលត្រូវផ្ញើ (ជា HTML)
 */
export async function sendTelegramNotification(message) {
    console.log("Sending Telegram notification (via api.js)...");
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        if (!res.ok) {
            const errBody = await res.text();
            console.error("Telegram API error:", res.status, errBody);
        } else {
            console.log("Telegram notification sent successfully.");
        }
    } catch (e) {
        console.error("Failed to send Telegram message:", e);
    }
}

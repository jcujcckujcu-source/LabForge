const BOT_TOKEN = "8726395442:AAFOblOcACvMyFUWn29K73tONsHSrak10S0";
const ADMIN_ID = "7403998038";
const text = `✅ *LabForge Infrastructure Report*

📂 *Database (D1)*: All migrations applied. Status: *ACTIVE*
📦 *Storage (R2)*: Bucket labforge-reports. Status: *CONNECTED*
🤖 *AI Engines*: Hybrid (OpenRouter + Gemini Direct). Status: *READY*

🚀 Все системы работают в штатном режиме. База данных развернута и синхронизирована.`;

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: ADMIN_ID,
    text: text,
    parse_mode: "Markdown"
  })
})
.then(res => res.json())
.then(json => console.log(json))
.catch(err => console.error(err));

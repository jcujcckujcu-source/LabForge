
const BOT_TOKEN = "8726395442:AAFOblOcACvMyFUWn29K73tONsHSrak10S0";
const CHAT_ID = "7403998038";

const report = `✅ *ОТЧЕТ ОБ ОБНОВЛЕНИИ LABFORGE 2.1*

🚀 *Telegram Боты:*
• Добавлено постоянное Reply-меню (кнопки вместо текста).
• Улучшен визуальный стиль и текстовки ответов.
• Добавлен раздел «Купить» с тарифами и быстрой связью.
• Настроен автоматический проброс сообщений в поддержку.

🌐 *Сайт (Landing Page):*
• Добавлены секции: "Как это работает", "FAQ", "Языки".
• Полностью переработана мобильная верстка (уменьшены шрифты, исправлены отступы).
• Добавлены микро-анимации появления блоков.

🛠 *Инфраструктура:*
• Проверена работа с новым токеном OpenRouter.
• Код очищен от зависимостей на Cloudflare Secrets (все токены теперь внутри).
• Оптимизирована генерация DOCX и Mermaid-схем.

🔗 Сайт: https://lab-gen.pages.dev/
👨‍💻 *Все системы работают стабильно!*`;

async function send() {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: report,
      parse_mode: "Markdown"
    })
  });
  const data = await res.json();
  console.log(data);
}

send();

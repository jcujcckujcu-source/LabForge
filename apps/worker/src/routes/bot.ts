import { Hono } from "hono";

const BOT_TOKEN = "8608070484:AAFzqPh-XYQnkL6dnDKgpFlA9JxLJrHnkFc";
const bot = new Hono<any>();

async function sendMessage(chatId: number, text: string, extra: any = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text, 
      parse_mode: "Markdown",
      ...extra
    }),
  });
}

// Постоянное меню для пользователя
const USER_KEYBOARD = {
  keyboard: [
    [{ text: "🔑 УСТАНОВИТЬ ПАРОЛЬ" }, { text: "👤 МОЙ ПРОФИЛЬ" }],
    [{ text: "🆘 ПОДДЕРЖКА" }, { text: "💎 КУПИТЬ" }]
  ],
  resize_keyboard: true
};

bot.post("/webhook", async (c) => {
  const update = await c.req.json();
  const msg = update.message;
  if (!msg) return c.json({ ok: true });

  const chatId = msg.chat.id;
  const rawText = (msg.text || "").trim();
  const cmd = rawText.toUpperCase();
  const username = msg.from.username ? `@${msg.from.username}` : (msg.from.first_name || "User");

  // Проверяем текущее состояние пользователя
  const userRecord = await c.env.DB.prepare("SELECT state FROM telegram_users WHERE chat_id = ? LIMIT 1")
    .bind(chatId.toString()).first() as any;
  const state = userRecord?.state || "";

  // Если ждем пароль — сохраняем его
  if (state === "awaiting_password" && !rawText.startsWith("/")) {
    const newPassword = rawText;
    
    await c.env.DB.prepare("INSERT INTO telegram_users (username, chat_id, password, state) VALUES (?, ?, ?, '') ON CONFLICT(username) DO UPDATE SET password = ?, state = ''")
      .bind(username, chatId.toString(), newPassword, newPassword).run();

    await c.env.DB.prepare("UPDATE users SET password = ? WHERE telegram_id = ?")
      .bind(newPassword, chatId.toString()).run();

    await sendMessage(chatId, 
      "✅ *ПАРОЛЬ УСПЕШНО СОХРАНЕН!*\n\n" +
      "Теперь вы можете войти на сайт [lab-gen.pages.dev](https://lab-gen.pages.dev)\n\n" +
      `👤 Логин: \`${username}\` \n` +
      `🔑 Пароль: \`${newPassword}\``,
      { reply_markup: USER_KEYBOARD }
    );
    return c.json({ ok: true });
  }

  if (cmd === "/START") {
    await sendMessage(chatId, 
      "🚀 *Добро пожаловать в LabForge 2.0!*\n\n" +
      "Я помогу тебе сгенерировать идеальную лабораторную работу за 30 секунд.\n\n" +
      "✨ *Что я умею:*\n" +
      "• Пишу чистый код (C#, Python, Java, C++)\n" +
      "• Рисую Mermaid-диаграммы\n" +
      "• Собираю отчет в Word (DOCX)\n" +
      "• Отвечаю на контрольные вопросы\n\n" +
      "👇 *Используй меню ниже для навигации:*",
      { reply_markup: USER_KEYBOARD }
    );
  } else if (cmd === "🔑 УСТАНОВИТЬ ПАРОЛЬ" || cmd === "/PASSWORD") {
    await c.env.DB.prepare("INSERT INTO telegram_users (username, chat_id, state) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET state = ?, chat_id = ?")
      .bind(username, chatId.toString(), "awaiting_password", "awaiting_password", chatId.toString()).run();
    
    await sendMessage(chatId, "🔑 *ВВЕДИТЕ НОВЫЙ ПАРОЛЬ:*\n\nОтправьте в следующем сообщении пароль, который хотите использовать для входа на сайт.");
    return c.json({ ok: true });
  } else if (cmd === "👤 МОЙ ПРОФИЛЬ" || cmd === "/ME" || cmd === "/PROFILE") {
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE telegram_id = ?").bind(chatId.toString()).first() as any;
    if (!user) {
      await sendMessage(chatId, "❌ *Аккаунт не найден.*\n\nНажмите «🔐 ПОЛУЧИТЬ КОД», чтобы зарегистрироваться на сайте.");
      return c.json({ ok: true });
    }

    const history = await c.env.DB.prepare("SELECT topic as title FROM lab_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 3")
      .bind(user.id).all();

    const historyText = history.results.length > 0 
      ? history.results.map((h: any) => `🔹 _${h.title}_`).join("\n")
      : "_История пуста_";

    await sendMessage(chatId, 
      `👤 *ВАШ ЛИЧНЫЙ КАБИНЕТ*\n\n` +
      `🆔 ID: \`${chatId}\` \n` +
      `💎 Баланс: *${user.generations_left}* лаб\n\n` +
      `📚 *Последние работы:*\n${historyText}\n\n` +
      `🔗 *Ваша реф. ссылка:* \`https://lab-gen.pages.dev?ref=${chatId}\``,
      { 
        reply_markup: {
          inline_keyboard: [[{ text: "💎 ПОПОЛНИТЬ БАЛАНС", url: "https://t.me/vwzz1" }]]
        } 
      }
    );
  } else if (cmd === "💎 КУПИТЬ" || cmd === "/BUY") {
     await sendMessage(chatId, 
      "💎 *ПОПОЛНЕНИЕ БАЛАНСА*\n\n" +
      "Одна генерация — это полный отчет: код, скриншоты, диаграммы и файл DOCX.\n\n" +
      "💳 *Тарифы:*\n" +
      "• 1 лаба — 99₽\n" +
      "• 5 лаб — 399₽ (Выгода 20%)\n" +
      "• 10 лаб — 699₽ (Выгода 30%)\n\n" +
      "Для оплаты напишите администратору 👇",
      { 
        reply_markup: {
          inline_keyboard: [[{ text: "👨‍💻 НАПИСАТЬ АДМИНУ", url: "https://t.me/vwzz1" }]]
        } 
      }
     );
  } else if (cmd === "🆘 ПОДДЕРЖКА" || cmd === "/SUPPORT") {
    const supportText = rawText.split(/\s+/).slice(1).join(" ");
    if (!supportText) {
      await sendMessage(chatId, 
        "📝 *СЛУЖБА ПОДДЕРЖКИ*\n\n" +
        "Напишите ваш вопрос прямо после команды или просто отправьте сообщение.\n\n" +
        "*Пример:* `/support Не скачивается файл`"
      );
      return c.json({ ok: true });
    }

    const PROMO_BOT_TOKEN = "8726395442:AAFOblOcACvMyFUWn29K73tONsHSrak10S0";
    const adminId = "7403998038";
    
    await fetch(`https://api.telegram.org/bot${PROMO_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: adminId, 
        text: `🆘 *ОБРАЩЕНИЕ*\n\nОт: \`${chatId}\`\nТекст: ${supportText}`, 
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "💬 ОТВЕТИТЬ", callback_data: `reply:${chatId}` }]]
        }
      }),
    });

    await sendMessage(chatId, "✅ *Сообщение доставлено!* Мы ответим вам в ближайшее время.");
  } else {
    // Если это просто текст — воспринимаем как обращение в поддержку
    if (!rawText.startsWith("/")) {
       await sendMessage(chatId, "🔄 _Пересылаю ваше сообщение в поддержку..._");
       const PROMO_BOT_TOKEN = "8726395442:AAFOblOcACvMyFUWn29K73tONsHSrak10S0";
       const adminId = "7403998038";
       await fetch(`https://api.telegram.org/bot${PROMO_BOT_TOKEN}/sendMessage`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ chat_id: adminId, text: `📩 *СООБЩЕНИЕ*\n\nОт: \`${chatId}\`\nТекст: ${rawText}`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "💬 ОТВЕТИТЬ", callback_data: `reply:${chatId}` }]] } }),
       });
       await sendMessage(chatId, "✅ *Отправлено!*");
    } else {
       await sendMessage(chatId, "❓ *Неизвестная команда.*\nИспользуйте меню для навигации.", { reply_markup: USER_KEYBOARD });
    }
  }

  return c.json({ ok: true });
});

export default bot;

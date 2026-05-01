import { Hono } from "hono";

const PROMO_BOT_TOKEN = "8726395442:AAFOblOcACvMyFUWn29K73tONsHSrak10S0";
const bot = new Hono<any>();

async function sendMessage(chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${PROMO_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (e) {
    console.error("Failed to send message:", e);
  }
}

bot.post("/webhook", async (c) => {
  try {
    const update = await c.req.json();
    
    // Обработка кнопок (Callback Query)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data;
      const adminId = cb.from.id;

      if (data.startsWith("reply:")) {
        const targetId = data.split(":")[1];
        await sendMessage(adminId, `Чтобы ответить пользователю, введите:\n\n\`/ans ${targetId} \``);
      }
      return c.json({ ok: true });
    }

    const msg = update.message;
    if (!msg) return c.json({ ok: true });

    const chatId = msg.chat.id;
    const rawText = (msg.text || "").trim();
    const parts = rawText.split(/\s+/);
    const cmd = parts[0].toLowerCase().split("@")[0];

    if (cmd === "/id") {
       await sendMessage(chatId, `Your ID: \`${chatId}\``);
       return c.json({ ok: true });
    }

    if (cmd === "/start") {
      await sendMessage(chatId, "🛠 *Панель промокодов.*\n\nИспользуйте `/promocode <число>`");
      return c.json({ ok: true });
    }

    if (cmd === "/promocode") {
      const adminId = "7403998038";
      
      if (String(chatId) !== adminId) {
        await sendMessage(chatId, `⛔ *Отказ.* Ваш ID (\`${chatId}\`) не админский.`);
        return c.json({ ok: true });
      }

      const amount = parseInt(parts[1]);
      if (isNaN(amount) || amount <= 0) {
        await sendMessage(chatId, "❌ *Ошибка.* Нужно число. Пример: `/promocode 10`.");
        return c.json({ ok: true });
      }

      const promo = "LAB-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      try {
        await c.env.DB.prepare(
          "INSERT INTO promo_codes (code, credits, used) VALUES (?, ?, 0)"
        ).bind(promo, amount).run();

        await sendMessage(chatId, `✅ *Готово!*\n\nКод: \`${promo}\`\nЗапросов: *${amount}*`);
      } catch (dbErr: any) {
        await sendMessage(chatId, `❌ *Ошибка базы:* ${dbErr.message}`);
      }
      return c.json({ ok: true });
    }

    if (cmd === "/stats") {
      const adminId = "7403998038";
      if (String(chatId) !== adminId) return c.json({ ok: true });

      const userCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first("count");
      const labCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM lab_reports").first("count");
      const promoCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM promo_codes WHERE used = 1").first("count");

      await sendMessage(chatId, 
        `📊 *СТАТИСТИКА LABFORGE*\n\n` +
        `👥 Всего пользователей: *${userCount}*\n` +
        `📝 Сгенерировано лаб: *${labCount}*\n` +
        `🎫 Использовано промо: *${promoCount}*`
      );
      return c.json({ ok: true });
    }

    if (cmd === "/addcredits") {
      const adminId = "7403998038";
      if (String(chatId) !== adminId) return c.json({ ok: true });

      const targetId = parts[1];
      const amount = parseInt(parts[2]);

      if (!targetId || isNaN(amount)) {
        await sendMessage(chatId, "❌ Ошибка. Формат: `/addcredits <telegram_id> <количество>`");
        return c.json({ ok: true });
      }

      const res = await c.env.DB.prepare("UPDATE users SET generations_left = generations_left + ? WHERE telegram_id = ?")
        .bind(amount, targetId).run();

      if (res.meta.changes > 0) {
        await sendMessage(chatId, `✅ Начислено *${amount}* запросов пользователю \`${targetId}\``);
      } else {
        await sendMessage(chatId, "❌ Пользователь не найден в базе.");
      }
      return c.json({ ok: true });
    }

    if (cmd === "/broadcast") {
      const adminId = "7403998038";
      if (String(chatId) !== adminId) return c.json({ ok: true });

      const text = rawText.substring(rawText.indexOf(" ") + 1);
      if (!text || text === "/broadcast") {
        await sendMessage(chatId, "❌ Введите текст рассылки.");
        return c.json({ ok: true });
      }

      const users = await c.env.DB.prepare("SELECT telegram_id FROM users").all();
      let count = 0;

      for (const u of (users.results as any)) {
         const MAIN_BOT_TOKEN = "8608070484:AAFzqPh-XYQnkL6dnDKgpFlA9JxLJrHnkFc";
         try {
           await fetch(`https://api.telegram.org/bot${MAIN_BOT_TOKEN}/sendMessage`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ chat_id: u.telegram_id, text, parse_mode: "Markdown" }),
           });
           count++;
         } catch (e) {}
      }

      await sendMessage(chatId, `📢 Рассылка завершена. Получили: *${count}* чел.`);
      return c.json({ ok: true });
    }

    if (cmd === "/users") {
      const adminId = "7403998038";
      if (String(chatId) !== adminId) return c.json({ ok: true });

      const users = await c.env.DB.prepare("SELECT telegram_id, created_at FROM users ORDER BY created_at DESC LIMIT 5").all();
      const userList = users.results.map((u: any) => `• \`${u.telegram_id}\` (${u.created_at})`).join("\n");

      await sendMessage(chatId, `👥 *ПОСЛЕДНИЕ ПОЛЬЗОВАТЕЛИ:*\n\n${userList}`);
      return c.json({ ok: true });
    }

    if (cmd === "/ans") {
      const adminId = "7403998038";
      if (String(chatId) !== adminId) return c.json({ ok: true });

      const targetId = parts[1];
      const text = rawText.substring(rawText.indexOf(parts[2]));

      if (!targetId || !text) {
        await sendMessage(chatId, "❌ Ошибка. Формат: `/ans <ID> <текст>`");
        return c.json({ ok: true });
      }

      const MAIN_BOT_TOKEN = "8608070484:AAFzqPh-XYQnkL6dnDKgpFlA9JxLJrHnkFc";
      await fetch(`https://api.telegram.org/bot${MAIN_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: targetId, 
          text: `🔔 *ОТВЕТ ПОДДЕРЖКИ:*\n\n${text}`, 
          parse_mode: "Markdown" 
        }),
      });

      await sendMessage(chatId, `✅ Ответ отправлен пользователю \`${targetId}\``);
      return c.json({ ok: true });
    }

    return c.json({ ok: true });

  } catch (globalErr: any) {
    console.error("Bot Global Error:", globalErr);
    return c.json({ ok: true });
  }
});

export default bot;

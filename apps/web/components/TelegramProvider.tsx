"use client";

import { useEffect, useState } from "react";

export function TelegramProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Динамическая загрузка скрипта
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.ready();
          tg.expand();
          if (tg.initData) {
            document.body.classList.add("mini-app");
          }
        }
      } catch (e) {
        console.error("Telegram init error:", e);
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}

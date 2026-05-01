import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NeuralBackground } from "../components/NeuralBackground";

import { TelegramProvider } from "../components/TelegramProvider";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "LabForge — AI-Генератор лабораторных работ",
  description:
    "Профессиональный инструмент для автоматической генерации лабораторных работ по программированию (C#, Python, Java, C++). Автоматический код, Mermaid диаграммы и экспорт в DOCX.",
  keywords: ["лабораторная работа", "генератор кода", "AI", "C#", "Python", "Mermaid", "DOCX", "ГОСТ"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <TelegramProvider />
        <NeuralBackground />
        {children}
      </body>
    </html>
  );
}

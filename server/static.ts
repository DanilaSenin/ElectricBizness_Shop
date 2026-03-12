import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// Функция для раздачи статических файлов клиентской части приложения
export function serveStatic(app: Express) {
  // Определяем абсолютный путь к папке со собранным клиентом
  const distPath = path.resolve(__dirname, "public");

  // Проверяем, существует ли папка со сборкой
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Подключаем middleware для раздачи статических файлов
  // Например: HTML, CSS, JS, изображения и другие ресурсы
  app.use(express.static(distPath));

  // Если запрашиваемый файл не найден среди статических ресурсов,
  // отдаём index.html
  // Это нужно для корректной работы клиентской маршрутизации SPA
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
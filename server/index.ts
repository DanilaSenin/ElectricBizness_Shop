import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// Создаём экземпляр Express-приложения
const app = express();

// Создаём HTTP-сервер на основе Express-приложения
const httpServer = createServer(app);

// Расширяем тип IncomingMessage, добавляя поле rawBody
// Это нужно, чтобы можно было сохранять исходное тело запроса
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Подключаем middleware для обработки JSON-запросов
app.use(
  express.json({
    // Сохраняем "сырое" тело запроса до парсинга
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Подключаем middleware для обработки данных из form-urlencoded
app.use(express.urlencoded({ extended: false }));

// Функция логирования сообщений с отметкой времени и источником
export function log(message: string, source = "express") {
  // Форматируем текущее время
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Выводим сообщение в консоль
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Middleware для логирования API-запросов
app.use((req, res, next) => {
  // Запоминаем время начала обработки запроса
  const start = Date.now();

  // Сохраняем путь запроса
  const path = req.path;

  // Переменная для хранения JSON-ответа
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Сохраняем оригинальный метод res.json
  const originalResJson = res.json;

  // Переопределяем res.json, чтобы перехватывать тело ответа
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // После завершения ответа выполняем логирование
  res.on("finish", () => {
    // Вычисляем длительность обработки запроса
    const duration = Date.now() - start;

    // Логируем только API-запросы
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Если есть JSON-ответ, добавляем его в лог
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Выводим строку лога
      log(logLine);
    }
  });

  // Передаём управление следующему middleware
  next();
});

// Самозапускающаяся асинхронная функция для инициализации приложения
(async () => {
  // Регистрируем маршруты приложения
  await registerRoutes(httpServer, app);

  // Глобальный обработчик ошибок
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    // Определяем HTTP-статус ошибки
    const status = err.status || err.statusCode || 500;

    // Определяем текст сообщения об ошибке
    const message = err.message || "Internal Server Error";

    // Выводим ошибку в консоль
    console.error("Internal Server Error:", err);

    // Если заголовки уже отправлены, передаём ошибку дальше
    if (res.headersSent) {
      return next(err);
    }

    // Отправляем клиенту JSON с сообщением об ошибке
    return res.status(status).json({ message });
  });

  // В production-режиме раздаём статические файлы клиента
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // В development-режиме подключаем Vite для разработки
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Получаем порт из переменной окружения PORT
  // Если порт не задан, используем 5000
  const port = parseInt(process.env.PORT || "5000", 10);

  // Запускаем HTTP-сервер
  httpServer.listen(
    { port, host: "127.0.0.1" },
    () => log(`serving on port ${port}`),
  );
})();
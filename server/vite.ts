import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

// Создаём логгер Vite для вывода сообщений в консоль
const viteLogger = createLogger();

// Функция настройки Vite в режиме разработки
export async function setupVite(server: Server, app: Express) {
  // Параметры сервера Vite
  const serverOptions = {
    // Включаем режим middleware, чтобы Vite работал внутри Express
    middlewareMode: true,

    // Настройка HMR (горячей перезагрузки) через существующий HTTP-сервер
    hmr: { server, path: "/vite-hmr" },

    // Разрешаем обращения с любых хостов
    allowedHosts: true as const,
  };

  // Создаём экземпляр Vite-сервера
  const vite = await createViteServer({
    ...viteConfig,

    // Отключаем чтение внешнего vite.config файла,
    // так как конфигурация передаётся напрямую
    configFile: false,

    // Подменяем логгер, чтобы при ошибке завершать процесс
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },

    // Передаём параметры dev-сервера
    server: serverOptions,

    // Указываем, что приложение пользовательское, а не стандартное SPA/MPA Vite
    appType: "custom",
  });

  // Подключаем Vite middleware к Express
  app.use(vite.middlewares);

  // Обработчик всех остальных маршрутов:
  // для них будет возвращаться index.html
  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Абсолютный путь к шаблону index.html клиентской части
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Каждый раз заново читаем index.html с диска,
      // чтобы изменения подхватывались без перезапуска
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Добавляем случайный параметр к main.tsx,
      // чтобы избежать проблем с кэшированием
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Позволяем Vite обработать HTML
      const page = await vite.transformIndexHtml(url, template);

      // Возвращаем готовую HTML-страницу клиенту
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // Исправляем stack trace ошибки для удобства отладки
      vite.ssrFixStacktrace(e as Error);

      // Передаём ошибку дальше в обработчик Express
      next(e);
    }
  });
}
import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// Список серверных зависимостей, которые нужно включить в сборку,
// чтобы уменьшить количество системных вызовов openat(2)
// и ускорить холодный старт приложения
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Основная функция полной сборки проекта
async function buildAll() {
  // Удаляем старую директорию dist перед новой сборкой
  await rm("dist", { recursive: true, force: true });

  // Запускаем сборку клиентской части приложения через Vite
  console.log("building client...");
  await viteBuild();

  // Запускаем сборку серверной части приложения через esbuild
  console.log("building server...");

  // Читаем package.json, чтобы получить список зависимостей проекта
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));

  // Объединяем обычные и dev-зависимости в один массив
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  // Формируем список внешних зависимостей:
  // все зависимости, которых нет в allowlist, будут исключены из бандла
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  // Сборка серверного кода
  await esbuild({
    // Точка входа серверной части
    entryPoints: ["server/index.ts"],

    // Указываем, что сборка предназначена для Node.js
    platform: "node",

    // Включаем bundling — объединение файлов в один выходной файл
    bundle: true,

    // Формат выходного файла CommonJS
    format: "cjs",

    // Путь к итоговому собранному файлу
    outfile: "dist/index.cjs",

    // Подменяем значение NODE_ENV на production во время сборки
    define: {
      "process.env.NODE_ENV": '"production"',
    },

    // Включаем минификацию итогового кода
    minify: true,

    // Зависимости, которые не будут включены в бандл
    external: externals,

    // Уровень логирования процесса сборки
    logLevel: "info",
  });
}

// Запускаем сборку и обрабатываем возможные ошибки
buildAll().catch((err) => {
  // Выводим ошибку в консоль
  console.error(err);

  // Завершаем процесс с кодом ошибки
  process.exit(1);
});
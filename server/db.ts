//Подключение к БД

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Из библиотеки pg получаем класс Pool для работы с пулом соединений PostgreSQL
const { Pool } = pg;

// Проверяем, задана ли переменная окружения с адресом базы данных
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Создаём пул соединений с PostgreSQL
// Это позволяет эффективно переиспользовать подключения к базе данных
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Инициализируем Drizzle ORM, передавая пул соединений и схему базы данных
export const db = drizzle(pool, { schema });
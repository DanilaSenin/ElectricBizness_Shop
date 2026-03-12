import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Экспортируем всё, что связано с моделью пользователей и аутентификацией
export * from "./models/auth";

// Импортируем таблицу пользователей
import { users } from "./models/auth";

// Таблица товаров
export const products = pgTable("products", {
  // Уникальный идентификатор товара
  id: serial("id").primaryKey(),

  // Название товара
  name: text("name").notNull(),

  // Описание товара
  description: text("description").notNull(),

  // Цена товара
  // Хранится в копейках/центах для точности вычислений
  price: integer("price").notNull(),

  // Ссылка на изображение товара
  imageUrl: text("image_url").notNull(),

  // Категория товара
  category: text("category").notNull(),

  // Флаг доступности товара
  isAvailable: boolean("is_available").default(true),

  // Дата создания записи
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица заказов
export const orders = pgTable("orders", {
  // Уникальный идентификатор заказа
  id: serial("id").primaryKey(),

  // Идентификатор пользователя, которому принадлежит заказ
  // Ссылается на users.id
  userId: text("user_id").notNull(),

  // Общая сумма заказа
  // Также хранится в копейках/центах
  totalAmount: integer("total_amount").notNull(),

  // Статус заказа:
  // pending, processing, completed, cancelled
  status: text("status").notNull(),

  // Дата создания заказа
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица позиций заказа
export const orderItems = pgTable("order_items", {
  // Уникальный идентификатор позиции заказа
  id: serial("id").primaryKey(),

  // Идентификатор заказа
  // Ссылается на orders.id
  orderId: integer("order_id").notNull(),

  // Идентификатор товара
  // Ссылается на products.id
  productId: integer("product_id").notNull(),

  // Количество единиц товара
  quantity: integer("quantity").notNull(),

  // Цена товара на момент оформления заказа
  // Хранится отдельно, чтобы сохранить историю цены
  priceAtTime: integer("price_at_time").notNull(),
});

// Таблица аналитики
export const analytics = pgTable("analytics", {
  // Уникальный идентификатор события аналитики
  id: serial("id").primaryKey(),

  // Идентификатор пользователя
  // Может быть null для анонимных посетителей
  userId: varchar("user_id"),

  // Страница, на которой произошло событие
  page: text("page").notNull(),

  // Тип действия, например: view, click, purchase
  action: text("action"),

  // Дополнительные данные в виде JSON-строки или текста
  metadata: text("metadata"),

  // Дата и время события
  timestamp: timestamp("timestamp").defaultNow(),
});

// Связи таблицы товаров:
// один товар может встречаться во многих позициях заказов
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// Связи таблицы заказов:
// один заказ принадлежит одному пользователю
// и содержит много позиций заказа
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

// Связи таблицы позиций заказа:
// каждая позиция связана с одним заказом и одним товаром
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Схема для вставки товара
// Поля id и createdAt исключены, так как создаются автоматически
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
});

// Схема для вставки заказа
// Поля id и createdAt также исключены
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true
});

// Схема для вставки позиции заказа
// Поле id исключено
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});

// Схема для вставки события аналитики
// Поля id и timestamp исключены, так как формируются автоматически
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true
});

// Тип данных товара при чтении из базы
export type Product = typeof products.$inferSelect;

// Тип данных товара при вставке
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Тип данных заказа при чтении из базы
export type Order = typeof orders.$inferSelect;

// Тип данных заказа при вставке
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Тип данных позиции заказа при чтении из базы
export type OrderItem = typeof orderItems.$inferSelect;

// Тип данных позиции заказа при вставке
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Тип данных аналитического события при чтении из базы
export type Analytics = typeof analytics.$inferSelect;

// Тип данных аналитического события при вставке
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// Тип одного элемента корзины, который приходит в запросе
export type CartItemRequest = {
  productId: number;
  quantity: number;
};

// Тип запроса на оформление заказа
export type CheckoutRequest = {
  items: CartItemRequest[];
};

// Тип ответа с товаром
export type ProductResponse = Product;

// Тип ответа с заказом и вложенными товарами
export type OrderResponse = Order & {
  items: (OrderItem & { product: Product })[];
};

// Тип ответа со статистикой продаж
export type SalesStatsResponse = {
  totalSales: number;
  orderCount: number;
  byCategory: { category: string; amount: number }[];
  byStatus: { status: string; count: number }[];
};
import { db } from "./db";
import {
  products,
  orders,
  orderItems,
  analytics,
  users,
  type InsertProduct,
  type InsertOrder,
  type InsertOrderItem,
  type ProductResponse,
  type OrderResponse,
  type InsertAnalytics,
  type SalesStatsResponse,
  type UpsertUser,
  type User
} from "@shared/schema";
import { eq, desc, asc, ilike, and } from "drizzle-orm";

// Интерфейс хранилища данных приложения
export interface IStorage {
  // Методы для работы с товарами
  getProducts(search?: string, category?: string, sortBy?: string): Promise<ProductResponse[]>;
  getProduct(id: number): Promise<ProductResponse | undefined>;
  createProduct(product: InsertProduct): Promise<ProductResponse>;

  // Методы для работы с заказами
  getOrdersByUser(userId: string): Promise<OrderResponse[]>;
  getOrder(id: number): Promise<OrderResponse | undefined>;
  createOrder(
    userId: string,
    orderData: {
      totalAmount: number,
      status: string,
      items: { productId: number, quantity: number, priceAtTime: number }[]
    }
  ): Promise<OrderResponse>;

  // Методы для работы с аналитикой
  logVisit(data: InsertAnalytics): Promise<void>;
  getSalesStats(): Promise<SalesStatsResponse>;
  getDetailedStats(): Promise<any>;

  // Метод обновления профиля пользователя
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
}

// Реализация хранилища данных через PostgreSQL + Drizzle ORM
export class DatabaseStorage implements IStorage {
  // Получение списка товаров с фильтрацией и сортировкой
  async getProducts(search?: string, category?: string, sortBy?: string): Promise<ProductResponse[]> {
    // Начинаем построение запроса к таблице товаров
    let query = db.select().from(products);

    // Массив условий фильтрации
    const conditions = [];

    // Если задан поисковый запрос, ищем по имени товара
    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    // Если задана категория, фильтруем по категории
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Если есть хотя бы одно условие, объединяем их через AND
    if (conditions.length > 0) {
      let combinedCondition = conditions[0];
      for (let i = 1; i < conditions.length; i++) {
        combinedCondition = and(combinedCondition, conditions[i]) as any;
      }
      query = query.where(combinedCondition) as any;
    }

    // Применяем сортировку
    if (sortBy === "price_asc") {
      query = query.orderBy(asc(products.price)) as any;
    } else if (sortBy === "price_desc") {
      query = query.orderBy(desc(products.price)) as any;
    } else {
      // По умолчанию сортируем по дате создания, начиная с новых
      query = query.orderBy(desc(products.createdAt)) as any;
    }

    // Выполняем запрос и возвращаем товары
    return await query;
  }

  // Получение одного товара по идентификатору
  async getProduct(id: number): Promise<ProductResponse | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  // Создание нового товара
  async createProduct(product: InsertProduct): Promise<ProductResponse> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Получение всех заказов пользователя
  async getOrdersByUser(userId: string): Promise<OrderResponse[]> {
    // Получаем все заказы пользователя, начиная с самых новых
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const result: OrderResponse[] = [];

    // Для каждого заказа подгружаем его товары
    for (const order of userOrders) {
      const items = await db.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        product: products
      }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      // Добавляем заказ вместе с его позициями в результат
      result.push({ ...order, items } as OrderResponse);
    }

    return result;
  }

  // Получение одного заказа по id
  async getOrder(id: number): Promise<OrderResponse | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    // Если заказ не найден, возвращаем undefined
    if (!order) return undefined;

    // Загружаем товары, входящие в заказ
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceAtTime: orderItems.priceAtTime,
      product: products
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return { ...order, items } as OrderResponse;
  }

  // Создание нового заказа
  async createOrder(
    userId: string,
    orderData: { totalAmount: number, status: string, items: { productId: number, quantity: number, priceAtTime: number }[] }
  ): Promise<OrderResponse> {
    // Используем транзакцию, чтобы заказ и его позиции записались атомарно
    return await db.transaction(async (tx) => {
      // Создаём сам заказ
      const [order] = await tx.insert(orders).values({
        userId,
        totalAmount: orderData.totalAmount,
        status: orderData.status
      }).returning();

      // Подготавливаем позиции заказа к вставке
      const itemsToInsert = orderData.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      }));

      // Сохраняем все позиции заказа
      await tx.insert(orderItems).values(itemsToInsert);

      // Сразу загружаем сохранённые позиции вместе с товарами
      const items = await tx.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        product: products
      }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      // Возвращаем полностью сформированный заказ
      return { ...order, items } as OrderResponse;
    });
  }

  // Сохранение события аналитики
  async logVisit(data: InsertAnalytics): Promise<void> {
    await db.insert(analytics).values(data);
  }

  // Получение базовой статистики продаж
  async getSalesStats(): Promise<SalesStatsResponse> {
    // Загружаем все заказы
    const allOrders = await db.select().from(orders);

    // Вычисляем общую сумму продаж
    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Считаем количество заказов по статусам
    const byStatus: Record<string, number> = {};
    allOrders.forEach(o => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    });

    // Загружаем все позиции заказов вместе с категориями товаров
    const allOrderItems = await db.select({
      amount: orderItems.priceAtTime,
      quantity: orderItems.quantity,
      category: products.category
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id));

    // Считаем выручку по категориям
    const byCategory: Record<string, number> = {};
    allOrderItems.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + (item.amount * item.quantity);
    });

    // Возвращаем агрегированную статистику
    return {
      totalSales,
      orderCount: allOrders.length,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count }))
    };
  }

  // Получение подробной статистики для графиков и аналитики
  async getDetailedStats() {
    // Загружаем все заказы и все аналитические события
    const allOrders = await db.select().from(orders);
    const allAnalytics = await db.select().from(analytics);

    // Общая выручка и количество заказов
    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = allOrders.length;

    // Средний чек
    const avgCheck = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

    // Уникальные посетители за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVisits = allAnalytics.filter(
      a => a.timestamp && new Date(a.timestamp) >= thirtyDaysAgo
    );

    const uniqueVisitors30d = new Set(
      recentVisits.map(a => a.userId || a.page + "_anon")
    ).size;

    // Общее число событий/просмотров
    const totalPageViews = allAnalytics.length;

    // Подготовка данных по выручке и заказам за последние 12 месяцев
    const salesByMonth: Record<string, number> = {};
    const ordersByMonth: Record<string, number> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      salesByMonth[key] = 0;
      ordersByMonth[key] = 0;
    }

    // Заполняем данные по выручке и заказам
    allOrders.forEach(o => {
      if (!o.createdAt) return;

      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (salesByMonth[key] !== undefined) {
        salesByMonth[key] += o.totalAmount;
        ordersByMonth[key] = (ordersByMonth[key] || 0) + 1;
      }
    });

    // Подготовка данных по посещаемости за последние 12 месяцев
    const visitsByMonth: Record<string, number> = {};
    for (const key of Object.keys(salesByMonth)) visitsByMonth[key] = 0;

    // Заполняем данные по посещениям
    allAnalytics.forEach(a => {
      if (!a.timestamp) return;

      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (visitsByMonth[key] !== undefined) visitsByMonth[key]++;
    });

    // Список кратких названий месяцев на русском языке
    const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

    // Формируем массив данных для графика выручки и заказов
    const salesChart = Object.entries(salesByMonth).map(([key, value]) => {
      const [year, month] = key.split("-");
      return {
        month: `${MONTHS_RU[parseInt(month) - 1]} ${year}`,
        sales: value,
        orders: ordersByMonth[key] || 0
      };
    });

    // Формируем массив данных для графика посещаемости
    const visitsChart = Object.entries(visitsByMonth).map(([key, value]) => {
      const [year, month] = key.split("-");
      return {
        month: `${MONTHS_RU[parseInt(month) - 1]} ${year}`,
        visits: value
      };
    });

    // Считаем выручку по категориям
    const allOrderItems = await db.select({
      amount: orderItems.priceAtTime,
      quantity: orderItems.quantity,
      category: products.category
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id));

    const byCategory: Record<string, number> = {};
    allOrderItems.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + (item.amount * item.quantity);
    });

    // Возвращаем подробную статистику
    return {
      totalSales,
      orderCount,
      avgCheck,
      uniqueVisitors30d,
      totalPageViews,
      salesChart,
      visitsChart,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    };
  }

  // Обновление данных пользователя
  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return user;
  }
}

// Экземпляр хранилища, используемый в приложении
export const storage = new DatabaseStorage();
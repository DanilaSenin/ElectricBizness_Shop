//Работа с БД (запросы)

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

export interface IStorage {
  // Products
  getProducts(search?: string, category?: string, sortBy?: string): Promise<ProductResponse[]>;
  getProduct(id: number): Promise<ProductResponse | undefined>;
  createProduct(product: InsertProduct): Promise<ProductResponse>;

  // Orders
  getOrdersByUser(userId: string): Promise<OrderResponse[]>;
  getOrder(id: number): Promise<OrderResponse | undefined>;
  createOrder(userId: string, orderData: { totalAmount: number, status: string, items: { productId: number, quantity: number, priceAtTime: number }[] }): Promise<OrderResponse>;

  // Analytics
  logVisit(data: InsertAnalytics): Promise<void>;
  getSalesStats(): Promise<SalesStatsResponse>;
  getDetailedStats(): Promise<any>;
  getUserStats(userId: string): Promise<any>;

  // User Profile
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(search?: string, category?: string, sortBy?: string): Promise<ProductResponse[]> {
    let query = db.select().from(products);
    const conditions = [];

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (conditions.length > 0) {
      let combinedCondition = conditions[0];
      for (let i = 1; i < conditions.length; i++) {
        combinedCondition = and(combinedCondition, conditions[i]) as any;
      }
      query = query.where(combinedCondition) as any;
    }

    if (sortBy === 'price_asc') {
      query = query.orderBy(asc(products.price)) as any;
    } else if (sortBy === 'price_desc') {
      query = query.orderBy(desc(products.price)) as any;
    } else {
      query = query.orderBy(desc(products.createdAt)) as any;
    }

    return await query;
  }

  async getProduct(id: number): Promise<ProductResponse | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<ProductResponse> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getOrdersByUser(userId: string): Promise<OrderResponse[]> {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));

    const result: OrderResponse[] = [];
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

      result.push({ ...order, items } as OrderResponse);
    }

    return result;
  }

  async getOrder(id: number): Promise<OrderResponse | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

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

  async createOrder(userId: string, orderData: { totalAmount: number, status: string, items: { productId: number, quantity: number, priceAtTime: number }[] }): Promise<OrderResponse> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        userId,
        totalAmount: orderData.totalAmount,
        status: orderData.status
      }).returning();

      const itemsToInsert = orderData.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      }));

      await tx.insert(orderItems).values(itemsToInsert);

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

      return { ...order, items } as OrderResponse;
    });
  }

  async logVisit(data: InsertAnalytics): Promise<void> {
    await db.insert(analytics).values(data);
  }

  async getSalesStats(): Promise<SalesStatsResponse> {
    const allOrders = await db.select().from(orders);
    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const byStatus: Record<string, number> = {};
    allOrders.forEach(o => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    });

    const allOrderItems = await db.select({
      amount: orderItems.priceAtTime,
      quantity: orderItems.quantity,
      category: products.category
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id));

    const byCategory: Record<string, number> = {};
    allOrderItems.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + (item.amount * item.quantity);
    });

    return {
      totalSales,
      orderCount: allOrders.length,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count }))
    };
  }

  async getDetailedStats() {
    const allOrders = await db.select().from(orders);
    const allAnalytics = await db.select().from(analytics);

    // Total revenue & orders
    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = allOrders.length;
    const avgCheck = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

    // Unique visitors last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentVisits = allAnalytics.filter(a => a.timestamp && new Date(a.timestamp) >= thirtyDaysAgo);
    const uniqueVisitors30d = new Set(recentVisits.map(a => a.userId || a.page + '_anon')).size;
    const totalPageViews = allAnalytics.length;

    // Sales by month (last 12 months)
    const salesByMonth: Record<string, number> = {};
    const ordersByMonth: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      salesByMonth[key] = 0;
      ordersByMonth[key] = 0;
    }
    allOrders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (salesByMonth[key] !== undefined) {
        salesByMonth[key] += o.totalAmount;
        ordersByMonth[key] = (ordersByMonth[key] || 0) + 1;
      }
    });

    // Visits by month (last 12 months)
    const visitsByMonth: Record<string, number> = {};
    for (const key of Object.keys(salesByMonth)) visitsByMonth[key] = 0;
    allAnalytics.forEach(a => {
      if (!a.timestamp) return;
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (visitsByMonth[key] !== undefined) visitsByMonth[key]++;
    });

    const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const salesChart = Object.entries(salesByMonth).map(([key, value]) => {
      const [year, month] = key.split('-');
      return { month: `${MONTHS_RU[parseInt(month) - 1]} ${year}`, sales: value, orders: ordersByMonth[key] || 0 };
    });
    const visitsChart = Object.entries(visitsByMonth).map(([key, value]) => {
      const [year, month] = key.split('-');
      return { month: `${MONTHS_RU[parseInt(month) - 1]} ${year}`, visits: value };
    });

    // By category
    const allOrderItems = await db.select({
      amount: orderItems.priceAtTime,
      quantity: orderItems.quantity,
      category: products.category
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id));
    const byCategory: Record<string, number> = {};
    allOrderItems.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + (item.amount * item.quantity);
    });

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

  async getUserStats(userId: string) {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
    const totalSales = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = userOrders.length;
    const avgCheck = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

    const allUserOrderIds = userOrders.map((o) => o.id);
    const allUserItems = allUserOrderIds.length > 0
      ? await db.select({
        orderId: orderItems.orderId,
        amount: orderItems.priceAtTime,
        quantity: orderItems.quantity,
        category: products.category,
      })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
      : [];

    const filteredItems = allUserItems.filter((i) => allUserOrderIds.includes(i.orderId));

    const byCategory: Record<string, number> = {};
    filteredItems.forEach((item) => {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.amount * item.quantity;
    });

    return {
      totalSales,
      orderCount,
      avgCheck,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    };
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
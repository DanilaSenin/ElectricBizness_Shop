import { db } from "./db";
import {
  products,
  orders,
  orderItems,
  type InsertProduct,
  type InsertOrder,
  type InsertOrderItem,
  type ProductResponse,
  type OrderResponse
} from "@shared/schema";
import { eq, desc, asc, like, ilike, and } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(search?: string, category?: string, sortBy?: string): Promise<ProductResponse[]>;
  getProduct(id: number): Promise<ProductResponse | undefined>;
  createProduct(product: InsertProduct): Promise<ProductResponse>;
  
  // Orders
  getOrdersByUser(userId: string): Promise<OrderResponse[]>;
  getOrder(id: number): Promise<OrderResponse | undefined>;
  createOrder(userId: string, orderData: { totalAmount: number, status: string, items: { productId: number, quantity: number, priceAtTime: number }[] }): Promise<OrderResponse>;
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
      // Create a single condition combining all filters
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
    } else { // newest
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
    // Need a transaction for creating order and items
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
      
      // Fetch the created order with items to return
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
}

export const storage = new DatabaseStorage();
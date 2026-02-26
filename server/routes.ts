import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication before registering other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed data function
  async function seedProducts() {
    const existing = await storage.getProducts();
    if (existing.length === 0) {
      await storage.createProduct({
        name: "Смартфон TechPro X1",
        description: "Мощный смартфон с отличной камерой и большим экраном.",
        price: 4990000, // 49,900.00
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
        category: "Электроника"
      });
      await storage.createProduct({
        name: "Беспроводные наушники SoundMax",
        description: "Наушники с активным шумоподавлением и чистым звуком.",
        price: 1250000,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
        category: "Электроника"
      });
      await storage.createProduct({
        name: "Кофемашина Barista Home",
        description: "Автоматическая кофемашина для приготовления идеального эспрессо.",
        price: 3499000,
        imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=800&auto=format&fit=crop",
        category: "Бытовая техника"
      });
      await storage.createProduct({
        name: "Умные часы FitTrack 5",
        description: "Отслеживание активности, пульсометр, влагозащита.",
        price: 890000,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
        category: "Электроника"
      });
      await storage.createProduct({
        name: "Робот-пылесос CleanBot Ultra",
        description: "Умный помощник по дому с функцией влажной уборки.",
        price: 2100000,
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
        category: "Бытовая техника"
      });
      await storage.createProduct({
        name: "Рюкзак Urban Explorer",
        description: "Стильный городской рюкзак с отделением для ноутбука.",
        price: 550000,
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
        category: "Аксессуары"
      });
    }
  }

  // Call seed async (fire and forget)
  seedProducts().catch(console.error);

  app.get(api.products.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      
      const products = await storage.getProducts(search, category, sortBy);
      res.json(products);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get(api.orders.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const order = await storage.getOrder(Number(req.params.id));
      const userId = req.user.claims.sub;
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(order);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.orders.create.input.parse(req.body);
      
      if (!input.items || input.items.length === 0) {
        return res.status(400).json({ message: "Order must have items" });
      }
      
      let totalAmount = 0;
      const itemsWithPrice = [];
      
      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        if (!product.isAvailable) {
          return res.status(400).json({ message: `Product ${product.name} is not available` });
        }
        
        const price = product.price;
        totalAmount += price * item.quantity;
        itemsWithPrice.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTime: price
        });
      }
      
      const order = await storage.createOrder(userId, {
        totalAmount,
        status: "pending",
        items: itemsWithPrice
      });
      
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
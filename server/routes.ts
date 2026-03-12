import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

// Функция регистрации всех маршрутов приложения
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Сначала настраиваем аутентификацию,
  // чтобы защищённые маршруты работали корректно
  await setupAuth(app);

  // Регистрируем маршруты, связанные с текущим пользователем
  registerAuthRoutes(app);

  // Функция начального заполнения базы тестовыми товарами
  async function seedProducts() {
    // Получаем уже существующие товары
    const existing = await storage.getProducts();

    // Если товаров нет, создаём стартовый набор
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

  // Запускаем заполнение товаров асинхронно без ожидания завершения
  seedProducts().catch(console.error);

  // Маршрут получения списка товаров
  app.get(api.products.list.path, async (req, res) => {
    try {
      // Получаем параметры фильтрации и сортировки из query-строки
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;

      // Загружаем товары с учётом фильтров
      const products = await storage.getProducts(search, category, sortBy);

      // Возвращаем список товаров
      res.json(products);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Маршрут получения одного товара по id
  app.get(api.products.get.path, async (req, res) => {
    try {
      // Получаем товар по идентификатору из URL
      const product = await storage.getProduct(Number(req.params.id));

      // Если товар не найден, возвращаем 404
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Возвращаем найденный товар
      res.json(product);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Маршрут получения всех заказов текущего пользователя
  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    try {
      // Получаем id пользователя из сессии
      const userId = (req.session as any).userId;

      // Загружаем заказы пользователя
      const orders = await storage.getOrdersByUser(userId);

      // Возвращаем список заказов
      res.json(orders);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Маршрут получения конкретного заказа по id
  app.get(api.orders.get.path, isAuthenticated, async (req: any, res) => {
    try {
      // Получаем заказ по id
      const order = await storage.getOrder(Number(req.params.id));

      // Получаем id текущего пользователя
      const userId = (req.session as any).userId;

      // Если заказ не найден, возвращаем 404
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Если заказ принадлежит не текущему пользователю, запрещаем доступ
      if (order.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Возвращаем заказ
      res.json(order);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Маршрут создания нового заказа
  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    try {
      // Получаем id текущего пользователя из сессии
      const userId = (req.session as any).userId;

      // Валидируем входные данные заказа через схему API
      const input = api.orders.create.input.parse(req.body);

      // Заказ должен содержать хотя бы один товар
      if (!input.items || input.items.length === 0) {
        return res.status(400).json({ message: "Order must have items" });
      }

      // Общая сумма заказа
      let totalAmount = 0;

      // Массив товаров с ценой на момент оформления
      const itemsWithPrice = [];

      // Проходим по всем товарам заказа
      for (const item of input.items) {
        // Загружаем товар из хранилища
        const product = await storage.getProduct(item.productId);

        // Если товар не найден, возвращаем ошибку
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }

        // Если товар недоступен, запрещаем оформление
        if (!product.isAvailable) {
          return res.status(400).json({ message: `Product ${product.name} is not available` });
        }

        // Цена товара на момент покупки
        const price = product.price;

        // Увеличиваем общую сумму заказа
        totalAmount += price * item.quantity;

        // Сохраняем позицию заказа с зафиксированной ценой
        itemsWithPrice.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtTime: price
        });
      }

      // Создаём заказ в хранилище
      const order = await storage.createOrder(userId, {
        totalAmount,
        status: "pending",
        items: itemsWithPrice
      });

      // Логируем событие покупки для аналитики
      await storage.logVisit({
        page: "/checkout",
        action: "purchase",
        metadata: JSON.stringify({ orderId: order.id, totalAmount }),
        userId
      });

      // Возвращаем созданный заказ
      res.status(201).json(order);
    } catch (err) {
      // Если ошибка связана с валидацией Zod, возвращаем 400 и детали ошибки
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }

      // Логируем прочие ошибки
      console.error(err);

      // Возвращаем внутреннюю ошибку сервера
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Маршрут логирования аналитических событий
  app.post(api.analytics.log.path, async (req: any, res) => {
    try {
      // Валидируем входные данные аналитики
      const input = api.analytics.log.input.parse(req.body);

      // Сохраняем событие посещения или действия
      await storage.logVisit({
        ...input,
        userId: (req.session as any)?.userId || null,
      });

      // Успешный ответ без тела
      res.status(204).end();
    } catch (e) {
      // Если данные невалидны, возвращаем 400
      res.status(400).end();
    }
  });

  // Маршрут получения базовой статистики продаж
  app.get(api.analytics.stats.path, async (req, res) => {
    try {
      // Загружаем агрегированную статистику
      const stats = await storage.getSalesStats();

      // Возвращаем статистику
      res.json(stats);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Маршрут получения детальной статистики
  app.get("/api/analytics/detailed", async (req, res) => {
    try {
      // Загружаем детальную статистику
      const stats = await storage.getDetailedStats();

      // Возвращаем данные
      res.json(stats);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to fetch detailed stats" });
    }
  });

  // Маршрут обновления профиля пользователя
  app.patch("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      // Получаем id текущего пользователя
      const userId = (req.session as any).userId;

      // Используем authStorage для обновления пользователя
      // чтобы изменения применялись в правильной таблице
      const { authStorage } = await import("./replit_integrations/auth/storage");

      // Обновляем данные пользователя
      const user = await authStorage.updateUser(userId, req.body);

      // Возвращаем обновлённый объект пользователя
      res.json(user);
    } catch (e) {
      console.error("Profile update error:", e);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Возвращаем HTTP-сервер
  return httpServer;
}
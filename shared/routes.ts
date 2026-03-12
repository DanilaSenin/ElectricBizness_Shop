import { z } from 'zod';
import { insertProductSchema, insertOrderSchema } from './schema';

// Набор схем ошибок API
export const errorSchemas = {
  // Ошибка валидации входных данных
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),

  // Ошибка "не найдено"
  notFound: z.object({
    message: z.string(),
  }),

  // Внутренняя ошибка сервера
  internal: z.object({
    message: z.string(),
  }),

  // Ошибка авторизации
  unauthorized: z.object({
    message: z.string(),
  })
};

// Схема товара
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  category: z.string(),
  isAvailable: z.boolean().nullable(),
  createdAt: z.any().nullable(),
});

// Схема позиции заказа вместе с вложенным объектом товара
const OrderItemWithProductSchema = z.object({
  id: z.number(),
  orderId: z.number(),
  productId: z.number(),
  quantity: z.number(),
  priceAtTime: z.number(),
  product: ProductSchema,
});

// Схема заказа вместе с массивом его позиций
const OrderWithItemsSchema = z.object({
  id: z.number(),
  userId: z.string(),
  totalAmount: z.number(),
  status: z.string(),
  createdAt: z.any().nullable(),
  items: z.array(OrderItemWithProductSchema),
});

// Описание API приложения
export const api = {
  products: {
    // Маршрут получения списка товаров
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,

      // Схема входных query-параметров
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
      }).optional(),

      // Возможные ответы сервера
      responses: {
        200: z.array(ProductSchema),
      },
    },

    // Маршрут получения одного товара по id
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,

      // Возможные ответы сервера
      responses: {
        200: ProductSchema,
        404: errorSchemas.notFound,
      },
    },
  },

  orders: {
    // Маршрут получения списка заказов пользователя
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,

      // Возможные ответы
      responses: {
        200: z.array(OrderWithItemsSchema),
        401: errorSchemas.unauthorized,
      },
    },

    // Маршрут получения одного заказа по id
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,

      // Возможные ответы
      responses: {
        200: OrderWithItemsSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },

    // Маршрут создания нового заказа
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,

      // Схема входных данных для создания заказа
      input: z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
      }),

      // Возможные ответы
      responses: {
        201: OrderWithItemsSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },

  analytics: {
    // Маршрут логирования аналитического события
    log: {
      method: 'POST' as const,
      path: '/api/analytics' as const,

      // Схема входных данных аналитики
      input: z.object({
        page: z.string(),
        action: z.string().optional(),
        metadata: z.string().optional(),
      }),

      // Возможные ответы
      responses: {
        204: z.void(),
      },
    },

    // Маршрут получения статистики продаж
    stats: {
      method: 'GET' as const,
      path: '/api/analytics/stats' as const,

      // Возможные ответы
      responses: {
        200: z.object({
          totalSales: z.number(),
          orderCount: z.number(),
          byCategory: z.array(z.object({
            category: z.string(),
            amount: z.number()
          })),
          byStatus: z.array(z.object({
            status: z.string(),
            count: z.number()
          })),
        }),
      },
    },
  },
};

// Функция подстановки параметров в URL-маршрут
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;

  // Если параметры переданы, заменяем плейсхолдеры вида :id на реальные значения
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }

  return url;
}

// Тип входных данных для создания товара
export type ProductInput = z.infer<typeof insertProductSchema>;

// Тип входных данных для создания заказа
export type OrderInput = z.infer<typeof api.orders.create.input>;
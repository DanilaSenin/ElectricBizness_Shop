import { z } from 'zod';
import { insertProductSchema, insertOrderSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

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

const OrderItemWithProductSchema = z.object({
  id: z.number(),
  orderId: z.number(),
  productId: z.number(),
  quantity: z.number(),
  priceAtTime: z.number(),
  product: ProductSchema,
});

const OrderWithItemsSchema = z.object({
  id: z.number(),
  userId: z.string(),
  totalAmount: z.number(),
  status: z.string(),
  createdAt: z.any().nullable(),
  items: z.array(OrderItemWithProductSchema),
});

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
      }).optional(),
      responses: {
        200: z.array(ProductSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: ProductSchema,
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      responses: {
        200: z.array(OrderWithItemsSchema),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
      responses: {
        200: OrderWithItemsSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
      }),
      responses: {
        201: OrderWithItemsSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProductInput = z.infer<typeof insertProductSchema>;
export type OrderInput = z.infer<typeof api.orders.create.input>;

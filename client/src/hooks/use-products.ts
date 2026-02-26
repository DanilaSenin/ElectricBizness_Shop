import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useProducts(params?: { search?: string; category?: string; sortBy?: string }) {
  return useQuery({
    queryKey: [api.products.list.path, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const url = `${api.products.list.path}${queryString}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch products');
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch product');
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

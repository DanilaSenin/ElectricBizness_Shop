//Аутентификация

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/use-cart";
import { useCookieBanner } from "@/hooks/use-cookie-banner";

export function useAuth() {
  const queryClient = useQueryClient();
  const showCookieBanner = useCookieBanner((state) => state.show);

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user");
        if (res.status === 401) return null;
        return res.json();
      } catch (e) {
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (user) => {
      useCart.getState().clearCart();
      queryClient.setQueryData(["/api/auth/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/my-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      showCookieBanner();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: (user) => {
      useCart.getState().clearCart();
      queryClient.setQueryData(["/api/auth/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/my-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      showCookieBanner();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      useCart.getState().clearCart();
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/analytics/my-stats"] });
      queryClient.removeQueries({ queryKey: ["/api/orders"] });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

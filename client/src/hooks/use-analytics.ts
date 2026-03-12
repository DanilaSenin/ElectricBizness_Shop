import { useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function useAnalytics() {
  const [location] = useLocation();

  useEffect(() => {

    const logPageView = async () => {
      try {
        await apiRequest("POST", "/api/analytics", {
          page: location,
          action: "view",
          metadata: JSON.stringify({ referrer: document.referrer, userAgent: navigator.userAgent })
        });
      } catch (e) {

      }
    };

    logPageView();
  }, [location]);

  const logAction = async (action: string, metadata?: any) => {
    try {
      await apiRequest("POST", "/api/analytics", {
        page: location,
        action,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      });
    } catch (e) {

    }
  };

  return { logAction };
}

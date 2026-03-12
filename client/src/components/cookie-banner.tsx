import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useCookieBanner } from "@/hooks/use-cookie-banner";

const FIRST_VISIT_KEY = "cookie_first_visit_done";

export function CookieBanner() {
  const { visible, show, hide } = useCookieBanner();

  useEffect(() => {
    const alreadySeen = localStorage.getItem(FIRST_VISIT_KEY);
    if (!alreadySeen) {
      const timer = setTimeout(() => show(), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(FIRST_VISIT_KEY, "true");
    hide();
  };

  const decline = () => {
    localStorage.setItem(FIRST_VISIT_KEY, "true");
    hide();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border shadow-2xl rounded-2xl p-5 max-w-xl w-full flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
          Мы используем файлы <span className="text-foreground font-medium">cookie</span> для улучшения работы сайта, анализа трафика и персонализации контента. Продолжая использовать сайт, вы соглашаетесь с{" "}
          <span className="text-primary cursor-pointer hover:underline">политикой конфиденциальности</span>.
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none rounded-xl"
            onClick={decline}
          >
            Отклонить
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none rounded-xl"
            onClick={accept}
          >
            Принять
          </Button>
        </div>
      </div>
    </div>
  );
}

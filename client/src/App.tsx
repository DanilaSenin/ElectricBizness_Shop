import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Catalog from "@/pages/catalog";
import ProductDetails from "@/pages/product-details";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import Statistics from "@/pages/statistics";
import { CookieBanner } from "@/components/cookie-banner";

import { useAnalytics } from "@/hooks/use-analytics";

// Компонент маршрутизации приложения
function Router() {
  // Подключение пользовательского хука аналитики
  useAnalytics();

  return (
    // Общий макет приложения: шапка, содержимое страницы и подвал
    <Layout>
      {/* Switch отображает только первый маршрут, который совпал с текущим URL */}
      <Switch>
        {/* Главная страница */}
        <Route path="/" component={Home} />

        {/* Страница каталога товаров */}
        <Route path="/catalog" component={Catalog} />

        {/* Страница подробной информации о товаре */}
        <Route path="/product/:id" component={ProductDetails} />

        {/* Страница корзины */}
        <Route path="/cart" component={Cart} />

        {/* Страница оформления заказа */}
        <Route path="/checkout" component={Checkout} />

        {/* Страница личного кабинета */}
        <Route path="/profile" component={Profile} />

        {/* Страница авторизации и регистрации */}
        <Route path="/auth" component={AuthPage} />

        {/* Страница статистики */}
        <Route path="/statistics" component={Statistics} />

        {/* Если ни один маршрут не подошёл, показываем страницу 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Корневой компонент приложения
function App() {
  return (
    // Провайдер React Query для работы с серверными запросами и кешем
    <QueryClientProvider client={queryClient}>
      {/* Провайдер всплывающих подсказок */}
      <TooltipProvider>
        {/* Глобальный контейнер для уведомлений */}
        <Toaster />

        {/* Основной роутер приложения */}
        <Router />

        {/* Баннер согласия на использование cookie */}
        <CookieBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Экспорт корневого компонента приложения
export default App;
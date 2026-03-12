import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Package, LogOut, Clock, User as UserIcon, Save, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Компонент страницы профиля пользователя
export default function Profile() {
  // Хук для программного перехода между страницами
  const [, setLocation] = useLocation();

  // Получаем данные пользователя, состояние авторизации и методы работы с ней
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
    isLoggingOut
  } = useAuth();

  // Загружаем историю заказов пользователя
  const { data: orders, isLoading: ordersLoading } = useOrders();

  // Загружаем статистику продаж
  const { data: stats } = useQuery({ queryKey: [api.analytics.stats.path] });

  // Хук для отображения уведомлений
  const { toast } = useToast();

  // Локальное состояние, показывающее, идёт ли обновление профиля
  const [isUpdating, setIsUpdating] = useState(false);

  // Инициализация формы редактирования профиля
  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      birthDate: user?.birthDate || "",
    },
  });

  // Если пользователь не авторизован и загрузка авторизации завершена,
  // перенаправляем его на страницу входа
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Обработчик обновления данных профиля
  const onUpdateProfile = async (data: any) => {
    setIsUpdating(true);

    try {
      // Отправляем PATCH-запрос на обновление профиля
      await apiRequest("PATCH", "/api/user", data);

      // После успешного обновления сбрасываем кеш данных пользователя
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // Показываем уведомление об успешном сохранении
      toast({ title: "Успех", description: "Профиль обновлен" });
    } catch (e) {
      // В случае ошибки показываем уведомление
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive"
      });
    } finally {
      // Снимаем состояние загрузки в любом случае
      setIsUpdating(false);
    }
  };

  // Обработчик выхода из аккаунта
  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Пока данные авторизации загружаются, показываем скелетоны
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Если пользователя нет, ничего не рендерим
  if (!user) return null;

  // Функция для выбора бейджа статуса заказа
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Ожидает
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            В обработке
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
            Доставлен
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Отменен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-muted/10 min-h-[calc(100vh-4rem)] pb-24">
      {/* Верхний блок профиля с основной информацией о пользователе */}
      <div className="bg-primary pt-12 pb-24 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Аватар пользователя или первая буква имени/логина */}
            <div className="w-20 h-20 bg-primary-foreground/10 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-primary-foreground/20 overflow-hidden">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()
              )}
            </div>

            {/* Имя и логин пользователя */}
            <div>
              <h1 className="font-display text-3xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-primary-foreground/70 mt-1">@{user.username}</p>
            </div>
          </div>

          {/* Кнопка выхода из аккаунта */}
          <Button
            variant="outline"
            className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Основной блок страницы профиля */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка: данные пользователя и статистика */}
          <div className="space-y-6">
            {/* Карточка редактирования профиля */}
            <Card className="rounded-3xl shadow-xl border-border/50">
              <CardHeader>
                <CardTitle>Данные пользователя</CardTitle>
                <CardDescription>Редактирование профиля</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={form.handleSubmit(onUpdateProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Поле имени */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Имя</Label>
                      <Input id="firstName" {...form.register("firstName")} />
                    </div>

                    {/* Поле фамилии */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Фамилия</Label>
                      <Input id="lastName" {...form.register("lastName")} />
                    </div>

                    {/* Поле телефона */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input id="phone" {...form.register("phone")} />
                    </div>

                    {/* Поле города */}
                    <div className="space-y-2">
                      <Label htmlFor="city">Город</Label>
                      <Input id="city" {...form.register("city")} />
                    </div>

                    {/* Поле адреса */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Адрес</Label>
                      <Input id="address" {...form.register("address")} />
                    </div>

                    {/* Поле даты рождения */}
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Дата рождения</Label>
                      <Input id="birthDate" {...form.register("birthDate")} />
                    </div>
                  </div>

                  {/* Кнопка сохранения данных профиля */}
                  <Button type="submit" className="w-full rounded-xl" disabled={isUpdating}>
                    <Save className="mr-2 h-4 w-4" /> Сохранить
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Карточка статистики продаж */}
            <Card className="rounded-3xl shadow-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Статистика продаж
                </CardTitle>
              </CardHeader>

              <CardContent>
                {stats ? (
                  <div className="space-y-4">
                    {/* Общее количество заказов */}
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Всего заказов
                      </p>
                      <p className="text-2xl font-bold">{stats.orderCount}</p>
                    </div>

                    {/* Общая сумма продаж */}
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Общая сумма
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(stats.totalSales)}
                      </p>
                    </div>

                    {/* Разбивка продаж по категориям */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">По категориям:</p>
                      {stats.byCategory.map((cat: any) => (
                        <div key={cat.category} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{cat.category}</span>
                          <span className="font-semibold">{formatPrice(cat.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Заглушки на время загрузки статистики
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка: история заказов */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden h-full">
              {/* Заголовок блока истории заказов */}
              <div className="p-6 sm:p-8 border-b bg-muted/10">
                <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  История заказов
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Просмотр всех ваших покупок
                </p>
              </div>
              
              <div className="p-6 sm:p-8">
                {ordersLoading ? (
                  // Заглушки во время загрузки заказов
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  // Состояние, когда заказов ещё нет
                  <div className="text-center py-20">
                    <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Заказов пока нет</h3>
                    <p className="text-muted-foreground mb-8">
                      Начните покупки в нашем каталоге!
                    </p>
                    <Button
                      onClick={() => setLocation("/catalog")}
                      size="lg"
                      className="rounded-full px-8"
                    >
                      Перейти в каталог
                    </Button>
                  </div>
                ) : (
                  // Список заказов пользователя
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 bg-background group"
                      >
                        {/* Верхняя часть карточки заказа */}
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                          <div>
                            <div className="font-bold text-lg">Заказ #{order.id}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
                                locale: ru,
                              })}
                            </div>
                          </div>

                          {/* Сумма заказа и статус */}
                          <div className="flex items-center gap-4">
                            <div className="font-bold text-xl text-primary">
                              {formatPrice(order.totalAmount)}
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        
                        {/* Сетка товаров внутри заказа */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="group/item relative">
                              {/* Изображение товара */}
                              <div className="aspect-square bg-muted rounded-2xl overflow-hidden border group-hover/item:border-primary/50 transition-colors">
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                />
                              </div>

                              {/* Бейдж с количеством единиц товара */}
                              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                                {item.quantity}
                              </div>

                              {/* Название товара */}
                              <div className="mt-2 text-[10px] text-muted-foreground line-clamp-1 font-medium">
                                {item.product.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
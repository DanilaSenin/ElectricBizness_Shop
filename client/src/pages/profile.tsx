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
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, logout, isLoggingOut } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/analytics/my-stats"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const onUpdateProfile = async (data: any) => {
    setIsUpdating(true);
    try {
      await apiRequest("PATCH", "/api/user", data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Успех", description: "Профиль обновлен" });
    } catch (e) {
      toast({ title: "Ошибка", description: "Не удалось обновить профиль", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ожидает</Badge>;
      case 'processing': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">В обработке</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Доставлен</Badge>;
      case 'cancelled': return <Badge variant="destructive">Отменен</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-muted/10 min-h-[calc(100vh-4rem)] pb-24">
      <div className="bg-primary pt-12 pb-24 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary-foreground/10 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-primary-foreground/20 overflow-hidden">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="w-full h-full object-cover" />
              ) : (
                (user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-primary-foreground/70 mt-1">@{user.username}</p>
            </div>
          </div>
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-xl border-border/50">
              <CardHeader>
                <CardTitle>Данные пользователя</CardTitle>
                <CardDescription>Редактирование профиля</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onUpdateProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Имя</Label>
                      <Input id="firstName" {...form.register("firstName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Фамилия</Label>
                      <Input id="lastName" {...form.register("lastName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input id="phone" {...form.register("phone")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Город</Label>
                      <Input id="city" {...form.register("city")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Адрес</Label>
                      <Input id="address" {...form.register("address")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Дата рождения</Label>
                      <Input id="birthDate" {...form.register("birthDate")} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={isUpdating}>
                    <Save className="mr-2 h-4 w-4" /> Сохранить
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Статистика продаж
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Всего заказов</p>
                      <p className="text-2xl font-bold">{stats.orderCount}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Общая сумма</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(stats.totalSales)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Средний чек</p>
                      <p className="text-2xl font-bold">{formatPrice(stats.avgCheck)}</p>
                    </div>
                    {stats.byCategory?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">По категориям:</p>
                        {stats.byCategory.map((cat: any) => (
                          <div key={cat.category} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{cat.category}</span>
                            <span className="font-semibold">{formatPrice(cat.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden h-full">
              <div className="p-6 sm:p-8 border-b bg-muted/10">
                <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  История заказов
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Просмотр всех ваших покупок</p>
              </div>

              <div className="p-6 sm:p-8">
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-20">
                    <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Заказов пока нет</h3>
                    <p className="text-muted-foreground mb-8">Начните покупки в нашем каталоге!</p>
                    <Button onClick={() => setLocation("/catalog")} size="lg" className="rounded-full px-8">Перейти в каталог</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 bg-background group">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                          <div>
                            <div className="font-bold text-lg">Заказ #{order.id}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="font-bold text-xl text-primary">{formatPrice(order.totalAmount)}</div>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="group/item relative">
                              <div className="aspect-square bg-muted rounded-2xl overflow-hidden border group-hover/item:border-primary/50 transition-colors">
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                                {item.quantity}
                              </div>
                              <div className="mt-2 text-[10px] text-muted-foreground line-clamp-1 font-medium">{item.product.name}</div>
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

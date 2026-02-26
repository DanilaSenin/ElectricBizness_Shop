import { useEffect } from "react";
import { useLocation } from "wouter";
import { Package, LogOut, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, logout, isLoggingOut } = useAuth();
  
  // Only fetch orders if authenticated
  const { data: orders, isLoading: ordersLoading } = useOrders();

  // Handle protected route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
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
                (user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-primary-foreground/70 mt-1">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl -mt-12 relative z-10">
        <div className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden">
          <div className="p-6 sm:p-8 border-b">
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              История заказов
            </h2>
          </div>
          
          <div className="p-6 sm:p-8">
            {ordersLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">У вас пока нет заказов</h3>
                <p className="text-muted-foreground mb-6">Сделайте свой первый заказ прямо сейчас!</p>
                <Button onClick={() => setLocation("/catalog")}>Перейти в каталог</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-2xl p-6 hover:border-primary/30 transition-colors bg-background">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                      <div>
                        <div className="font-medium text-lg">Заказ #{order.id}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-xl">{formatPrice(order.totalAmount)}</div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="group relative">
                          <div className="aspect-square bg-muted rounded-xl overflow-hidden border">
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute -top-2 -right-2 bg-foreground text-background text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                            {item.quantity}
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
  );
}

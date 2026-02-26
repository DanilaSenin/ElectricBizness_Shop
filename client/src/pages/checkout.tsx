import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, getTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Redirect if empty cart
  if (items.length === 0 && !createOrder.isSuccess) {
    setLocation("/cart");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему для оформления заказа.",
        variant: "destructive"
      });
      // Save intent, redirect to login
      window.location.href = "/api/login";
      return;
    }

    const orderInput = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    createOrder.mutate(orderInput, {
      onSuccess: () => {
        clearCart();
        toast({
          title: "Заказ успешно оформлен",
          description: "Мы свяжемся с вами в ближайшее время.",
        });
      },
      onError: (err) => {
        toast({
          title: "Ошибка",
          description: err.message || "Не удалось оформить заказ. Попробуйте позже.",
          variant: "destructive"
        });
      }
    });
  };

  if (createOrder.isSuccess) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-4">Спасибо за заказ!</h1>
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Ваш заказ успешно оформлен. Вы можете отслеживать его статус в личном кабинете.
        </p>
        <div className="flex gap-4">
          <Link href="/profile">
            <Button size="lg" className="rounded-full">Личный кабинет</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="rounded-full">Продолжить покупки</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
      <Link href="/cart" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад в корзину
      </Link>

      <h1 className="font-display text-4xl font-bold mb-10">Оформление заказа</h1>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Form */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/50 shadow-sm">
          <h2 className="font-display text-2xl font-bold mb-6">Данные доставки</h2>
          {!isAuthenticated && (
            <div className="bg-muted p-4 rounded-xl mb-6 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Войдите для быстрого оформления</p>
                <p className="text-xs text-muted-foreground">Ваши данные заполнятся автоматически, а заказ сохранится в истории.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/login"}>Войти</Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">ФИО получателя</Label>
              <Input 
                id="name" 
                placeholder="Иванов Иван Иванович" 
                className="h-12 bg-background"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+7 (999) 000-00-00" 
                className="h-12 bg-background"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Адрес доставки</Label>
              <Input 
                id="address" 
                placeholder="г. Москва, ул. Пушкина, д. 1, кв. 1" 
                className="h-12 bg-background"
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                required
              />
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 rounded-xl text-base font-semibold mt-4"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Оформляем...</>
              ) : (
                `Оплатить ${formatPrice(getTotal())}`
              )}
            </Button>
          </form>
        </div>

        {/* Mini Cart Summary */}
        <div className="bg-muted/30 p-6 sm:p-8 rounded-3xl border border-border/50">
          <h3 className="font-display font-bold text-xl mb-6">Ваш заказ</h3>
          <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {items.map(({product, quantity}) => (
              <div key={product.id} className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-card rounded-lg overflow-hidden shrink-0 border">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">{quantity} шт.</p>
                </div>
                <div className="font-semibold text-sm">
                  {formatPrice(product.price * quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="h-px bg-border my-6" />
          <div className="flex justify-between items-center">
            <span className="font-medium">Итого к оплате</span>
            <span className="font-bold text-2xl text-primary">{formatPrice(getTotal())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

// Компонент страницы оформления заказа
export default function Checkout() {
  // Хук для программного перехода между страницами
  const [, setLocation] = useLocation();

  // Получаем данные корзины и методы для работы с ней
  const { items, getTotal, clearCart } = useCart();

  // Получаем информацию о том, авторизован ли пользователь
  const { isAuthenticated } = useAuth();

  // Хук для создания заказа
  const createOrder = useCreateOrder();

  // Хук для вывода уведомлений
  const { toast } = useToast();

  // Локальное состояние формы доставки
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Если корзина пуста и заказ ещё не был успешно создан,
  // перенаправляем пользователя обратно в корзину
  if (items.length === 0 && !createOrder.isSuccess) {
    setLocation("/cart");
    return null;
  }

  // Обработчик отправки формы оформления заказа
  const handleSubmit = (e: React.FormEvent) => {
    // Отменяем стандартную перезагрузку страницы при отправке формы
    e.preventDefault();

    // Если пользователь не авторизован, показываем ошибку и отправляем на вход
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему для оформления заказа.",
        variant: "destructive"
      });

      // Перенаправление на страницу авторизации
      window.location.href = "/api/login";
      return;
    }

    // Подготавливаем данные заказа для отправки на сервер
    const orderInput = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    // Выполняем создание заказа
    createOrder.mutate(orderInput, {
      // Обработка успешного создания заказа
      onSuccess: () => {
        // После успешного оформления очищаем корзину
        clearCart();

        // Показываем уведомление об успехе
        toast({
          title: "Заказ успешно оформлен",
          description: "Мы свяжемся с вами в ближайшее время.",
        });

        // Перенаправляем пользователя в личный кабинет
        setLocation("/profile");
      },

      // Обработка ошибки создания заказа
      onError: (err: any) => {
        // Формируем текст ошибки:
        // если ошибка связана с авторизацией — показываем специальное сообщение,
        // иначе используем текст ошибки с сервера или стандартное сообщение
        const message = err.status === 401
          ? "Пожалуйста, войдите в аккаунт для оформления заказа."
          : (err.message || "Не удалось оформить заказ. Попробуйте позже.");

        // Показываем уведомление об ошибке
        toast({
          title: "Ошибка",
          description: message,
          variant: "destructive"
        });

        // Если ошибка связана с отсутствием авторизации, переходим на страницу входа
        if (err.status === 401) {
          setLocation("/auth");
        }
      }
    });
  };

  // Если заказ успешно оформлен, показываем экран подтверждения
  if (createOrder.isSuccess) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
        {/* Иконка успешного оформления заказа */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        {/* Заголовок успешного оформления */}
        <h1 className="font-display text-4xl font-bold mb-4">Спасибо за заказ!</h1>

        {/* Описание дальнейших действий */}
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Ваш заказ успешно оформлен. Вы можете отслеживать его статус в личном кабинете.
        </p>

        {/* Кнопки перехода в личный кабинет или обратно в каталог */}
        <div className="flex gap-4">
          <Link href="/profile">
            <Button size="lg" className="rounded-full">Личный кабинет</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="rounded-full">
              Продолжить покупки
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
      {/* Ссылка возврата в корзину */}
      <Link
        href="/cart"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад в корзину
      </Link>

      {/* Заголовок страницы */}
      <h1 className="font-display text-4xl font-bold mb-10">Оформление заказа</h1>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Блок формы оформления заказа */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/50 shadow-sm">
          <h2 className="font-display text-2xl font-bold mb-6">Данные доставки</h2>

          {/* Подсказка для неавторизованных пользователей */}
          {!isAuthenticated && (
            <div className="bg-muted p-4 rounded-xl mb-6 flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Войдите для быстрого оформления</p>
                <p className="text-xs text-muted-foreground">
                  Ваши данные заполнятся автоматически, а заказ сохранится в истории.
                </p>
              </div>

              {/* Кнопка быстрого перехода к авторизации */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/api/login"}
              >
                Войти
              </Button>
            </div>
          )}

          {/* Форма ввода данных доставки */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Поле ФИО получателя */}
            <div className="space-y-2">
              <Label htmlFor="name">ФИО получателя</Label>
              <Input
                id="name"
                placeholder="Иванов Иван Иванович"
                className="h-12 bg-background"
                value={form.name}
                // Обновляем состояние формы при изменении поля
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Поле телефона */}
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 000-00-00"
                className="h-12 bg-background"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            {/* Поле адреса доставки */}
            <div className="space-y-2">
              <Label htmlFor="address">Адрес доставки</Label>
              <Input
                id="address"
                placeholder="г. Москва, ул. Пушкина, д. 1, кв. 1"
                className="h-12 bg-background"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>

            {/* Кнопка отправки формы */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 rounded-xl text-base font-semibold mt-4"
              // Пока идёт отправка заказа, кнопка блокируется
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <>
                  {/* Иконка загрузки во время оформления */}
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Оформляем...
                </>
              ) : (
                // Если загрузки нет, показываем итоговую сумму к оплате
                `Оплатить ${formatPrice(getTotal())}`
              )}
            </Button>
          </form>
        </div>

        {/* Блок краткой сводки по заказу */}
        <div className="bg-muted/30 p-6 sm:p-8 rounded-3xl border border-border/50">
          <h3 className="font-display font-bold text-xl mb-6">Ваш заказ</h3>

          {/* Список товаров в заказе */}
          <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 items-center">
                {/* Миниатюра товара */}
                <div className="w-16 h-16 bg-card rounded-lg overflow-hidden shrink-0 border">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Название товара и количество */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">{quantity} шт.</p>
                </div>

                {/* Стоимость позиции */}
                <div className="font-semibold text-sm">
                  {formatPrice(product.price * quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Разделительная линия */}
          <div className="h-px bg-border my-6" />

          {/* Итоговая сумма заказа */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Итого к оплате</span>
            <span className="font-bold text-2xl text-primary">
              {formatPrice(getTotal())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
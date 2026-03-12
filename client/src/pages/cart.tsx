import { Link, useLocation } from "wouter";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";

// Компонент страницы корзины
export default function Cart() {
  // Хук для программного перехода между страницами
  const [, setLocation] = useLocation();

  // Получаем данные корзины и методы управления ею
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();

  // Общая стоимость всех товаров в корзине
  const total = getTotal();

  // Проверка, пуста ли корзина
  const isEmpty = items.length === 0;

  // Если корзина пуста, показываем специальный экран с предложением перейти в каталог
  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center justify-center text-center">
        {/* Иконка пустой корзины */}
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Заголовок состояния пустой корзины */}
        <h1 className="font-display text-3xl font-bold mb-4">Ваша корзина пуста</h1>

        {/* Подсказка для пользователя */}
        <p className="text-muted-foreground max-w-md mb-8">
          Похоже, вы еще ничего не добавили. Перейдите в каталог, чтобы найти что-то интересное.
        </p>

        {/* Кнопка перехода в каталог товаров */}
        <Link href="/catalog">
          <Button size="lg" className="rounded-full px-8 h-12 font-medium">
            Перейти к покупкам
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Заголовок страницы */}
      <h1 className="font-display text-4xl font-bold mb-10">Корзина</h1>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Список товаров в корзине */}
        <div className="flex-1 w-full space-y-6">
          {/* Верхняя панель списка товаров */}
          <div className="flex justify-between items-center pb-4 border-b">
            {/* Количество разных товаров в корзине */}
            <span className="font-medium text-muted-foreground">{items.length} товаров</span>

            {/* Кнопка полной очистки корзины */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              Очистить корзину
            </Button>
          </div>

          {/* Перебор всех товаров в корзине */}
          <div className="space-y-6">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 sm:gap-6 bg-card p-4 rounded-2xl border border-border/50"
              >
                {/* Изображение товара */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Информация о товаре и управление количеством */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Верхняя часть карточки товара: название, категория, удаление */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      {/* Название товара */}
                      <h3 className="font-medium text-base sm:text-lg line-clamp-2 leading-tight">
                        {product.name}
                      </h3>

                      {/* Категория товара */}
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.category}
                      </p>
                    </div>

                    {/* Кнопка удаления товара из корзины */}
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 -m-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Нижняя часть карточки: изменение количества и стоимость */}
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 mt-4">
                    {/* Блок управления количеством товара */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                      {/* Кнопка уменьшения количества */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        // Если количество равно 1, уменьшать дальше нельзя
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      {/* Текущее количество товара */}
                      <span className="w-10 text-center font-medium text-sm">{quantity}</span>

                      {/* Кнопка увеличения количества */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Стоимость товара с учётом количества */}
                    <div className="font-bold text-lg sm:text-xl">
                      {formatPrice(product.price * quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Блок с итоговой информацией по заказу */}
        <div className="w-full lg:w-[400px] shrink-0 bg-card p-6 sm:p-8 rounded-3xl border border-border/50 shadow-sm sticky top-24">
          <h2 className="font-display text-2xl font-bold mb-6">Детали заказа</h2>

          {/* Сводная информация по заказу */}
          <div className="space-y-4 mb-6 text-sm">
            {/* Сумма по товарам */}
            <div className="flex justify-between text-muted-foreground">
              <span>Товары ({items.length})</span>
              <span>{formatPrice(total)}</span>
            </div>

            {/* Стоимость доставки */}
            <div className="flex justify-between text-muted-foreground">
              <span>Доставка</span>
              <span className="text-green-600 font-medium">Бесплатно</span>
            </div>

            {/* Разделительная линия */}
            <div className="h-px bg-border my-4" />

            {/* Итоговая сумма заказа */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-base">Итого</span>
              <span className="font-bold text-3xl text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Кнопка перехода к оформлению заказа */}
          <Button
            size="lg"
            className="w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-primary/10"
            onClick={() => setLocation("/checkout")}
          >
            Перейти к оформлению
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
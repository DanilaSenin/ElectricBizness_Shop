import { useParams } from "wouter";
import { ShoppingBag, ArrowLeft, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { Link } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Компонент страницы подробной информации о товаре
export default function ProductDetails() {
  // Получаем параметр id из URL
  const { id } = useParams<{ id: string }>();

  // Преобразуем строковый id в число
  const productId = parseInt(id || "0", 10);

  // Загружаем данные конкретного товара по его id
  const { data: product, isLoading, error } = useProduct(productId);

  // Получаем функцию добавления товара в корзину
  const addItem = useCart((state) => state.addItem);

  // Хук для вывода уведомлений
  const { toast } = useToast();

  // Пока данные товара загружаются, отображаем скелетоны
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Заглушка под изображение товара */}
          <Skeleton className="aspect-square rounded-3xl" />

          {/* Заглушки под текстовую информацию */}
          <div className="space-y-6 pt-8">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  // Если возникла ошибка загрузки или товар не найден,
  // показываем сообщение об ошибке
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <h2 className="font-display text-2xl font-bold mb-4">Товар не найден</h2>
        <p className="text-muted-foreground mb-8">
          Возможно, товар был удален или ссылка неверна.
        </p>

        {/* Кнопка возврата в каталог */}
        <Link href="/catalog">
          <Button className="w-full">Вернуться в каталог</Button>
        </Link>
      </div>
    );
  }

  // Обработчик добавления товара в корзину
  const handleAddToCart = () => {
    // Добавляем товар в корзину
    addItem(product);

    // Показываем уведомление об успешном добавлении
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} успешно добавлен.`,
    });
  };

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Ссылка для возврата в каталог */}
        <Link
          href="/catalog"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад в каталог
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Блок изображения товара */}
          <div className="bg-muted/30 rounded-[2rem] p-8 md:p-12 flex items-center justify-center border border-border/50 relative">
            {/* Если товара нет в наличии, показываем соответствующую плашку */}
            {!product.isAvailable && (
              <div className="absolute top-6 right-6 bg-background text-foreground font-bold px-4 py-2 rounded-full shadow-sm z-10">
                Нет в наличии
              </div>
            )}

            {/* Изображение товара */}
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto object-contain mix-blend-multiply drop-shadow-2xl"
            />
          </div>

          {/* Блок информации о товаре */}
          <div className="flex flex-col pt-4 md:pt-8">
            {/* Категория товара */}
            <div className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
              {product.category}
            </div>

            {/* Название товара */}
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4 text-balance">
              {product.name}
            </h1>

            {/* Цена товара */}
            <div className="text-3xl font-extrabold text-foreground mb-8">
              {formatPrice(product.price)}
            </div>

            {/* Описание товара */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 text-balance">
              {product.description}
            </p>

            <div className="mt-auto space-y-6">
              {/* Кнопка добавления товара в корзину */}
              <Button
                size="lg"
                className="w-full h-14 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={handleAddToCart}
                // Если товара нет в наличии, кнопка блокируется
                disabled={!product.isAvailable}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {product.isAvailable ? "В корзину" : "Нет в наличии"}
              </Button>

              {/* Блок преимуществ товара/магазина */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border/50">
                {/* Преимущество: гарантия качества */}
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-green-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-foreground">Гарантия качества</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Оригинальный товар напрямую от производителя
                    </p>
                  </div>
                </div>

                {/* Преимущество: быстрая доставка */}
                <div className="flex items-start gap-3">
                  <Truck className="h-6 w-6 text-blue-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-foreground">Быстрая доставка</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Отправка в течение 24 часов после заказа
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
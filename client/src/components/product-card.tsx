import { Link } from "wouter";
import { Plus } from "lucide-react";
import type { Product } from "@shared/schema";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

// Интерфейс свойств компонента карточки товара
interface ProductCardProps {
  // Объект товара, данные которого будут отображаться в карточке
  product: Product;
}

// Компонент карточки товара для вывода в каталоге
export function ProductCard({ product }: ProductCardProps) {
  // Получаем функцию добавления товара в корзину из глобального состояния
  const addItem = useCart((state) => state.addItem);

  // Получаем функцию показа уведомлений
  const { toast } = useToast();

  // Обработчик добавления товара в корзину
  const handleAddToCart = (e: React.MouseEvent) => {
    // Отменяем переход по ссылке карточки,
    // чтобы при нажатии на кнопку не открывалась страница товара
    e.preventDefault();

    // Добавляем товар в корзину
    addItem(product);

    // Показываем уведомление об успешном добавлении
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} успешно добавлен.`,
    });
  };

  return (
    // Вся карточка является ссылкой на страницу конкретного товара
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col bg-card rounded-2xl overflow-hidden hover-lift border border-border/50"
    >
      {/* Блок изображения товара */}
      <div className="relative aspect-square overflow-hidden bg-muted/50 p-6 flex items-center justify-center">
        <img
          // URL изображения товара
          src={product.imageUrl}
          // Альтернативный текст изображения
          alt={product.name}
          // Стили для корректного отображения изображения и анимации при наведении
          className="object-contain w-full h-full mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          // Ленивый режим загрузки изображения для оптимизации производительности
          loading="lazy"
        />

        {/* Если товар недоступен, поверх изображения показывается плашка */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <span className="font-bold text-foreground px-4 py-2 bg-background rounded-full shadow-lg">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Информационный блок карточки */}
      <div className="p-5 flex flex-col flex-1">
        {/* Категория товара */}
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {product.category}
        </div>

        {/* Название товара */}
        <h3 className="font-display font-semibold text-lg text-foreground mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Нижняя часть карточки: цена и кнопка добавления в корзину */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          {/* Отформатированная цена товара */}
          <span className="text-xl font-bold text-foreground">
            {formatPrice(product.price)}
          </span>

          {/* Кнопка добавления товара в корзину */}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-10 w-10 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={handleAddToCart}
            // Если товара нет в наличии, кнопка становится неактивной
            disabled={!product.isAvailable}
          >
            <Plus className="h-5 w-5" />
            {/* Текст для скринридеров */}
            <span className="sr-only">Добавить</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
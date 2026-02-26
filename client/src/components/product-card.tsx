import { Link } from "wouter";
import { Plus } from "lucide-react";
import type { Product } from "@shared/schema";
import { formatPrice } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    addItem(product);
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} успешно добавлен.`,
    });
  };

  return (
    <Link 
      href={`/product/${product.id}`}
      className="group flex flex-col bg-card rounded-2xl overflow-hidden hover-lift border border-border/50"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/50 p-6 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="object-contain w-full h-full mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <span className="font-bold text-foreground px-4 py-2 bg-background rounded-full shadow-lg">Нет в наличии</span>
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {product.category}
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          <Button 
            size="icon" 
            variant="secondary"
            className="rounded-full h-10 w-10 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Добавить</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}

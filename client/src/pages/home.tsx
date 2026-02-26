import { Link } from "wouter";
import { ArrowRight, ShoppingBag, Package2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const featuredProducts = products?.slice(0, 4) || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30 pt-16 md:pt-24 pb-32">
        <div className="absolute inset-0 z-0 opacity-10">
          {/* subtle pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              ✨ Новая коллекция 2025
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground text-balance leading-tight">
              Стиль и комфорт <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">в каждой детали</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 text-balance">
              Откройте для себя премиальную коллекцию товаров, созданную для вашего идеального пространства.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <Link href="/catalog">
                <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold group">
                  Смотреть каталог
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl opacity-50"></div>
            {/* landing page hero sleek modern chair lifestyle product */}
            <img 
              src="https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80&fit=crop" 
              alt="Hero product" 
              className="relative z-10 w-full h-auto rounded-[2rem] shadow-2xl object-cover aspect-[4/5] md:aspect-square"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Популярное</h2>
              <p className="text-muted-foreground mt-2">Хиты продаж этой недели</p>
            </div>
            <Link href="/catalog" className="hidden sm:inline-flex items-center text-primary font-medium hover:underline">
              Смотреть все <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-2xl w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="mt-10 text-center sm:hidden">
            <Link href="/catalog">
              <Button variant="outline" className="w-full rounded-full">
                Все товары
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-primary-foreground/10">
            <div className="flex flex-col items-center pt-8 md:pt-0">
              <div className="bg-primary-foreground/10 p-4 rounded-2xl mb-6">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">Оригинальные бренды</h3>
              <p className="text-primary-foreground/70 text-balance">Гарантия подлинности всех представленных товаров в нашем магазине.</p>
            </div>
            <div className="flex flex-col items-center pt-12 md:pt-0">
              <div className="bg-primary-foreground/10 p-4 rounded-2xl mb-6">
                <Package2 className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">Быстрая доставка</h3>
              <p className="text-primary-foreground/70 text-balance">Бережная и оперативная доставка заказов по всей территории РФ.</p>
            </div>
            <div className="flex flex-col items-center pt-12 md:pt-0">
              <div className="bg-primary-foreground/10 p-4 rounded-2xl mb-6">
                <User className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">Поддержка 24/7</h3>
              <p className="text-primary-foreground/70 text-balance">Наши специалисты готовы ответить на любые ваши вопросы круглосуточно.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

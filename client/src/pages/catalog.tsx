import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");

  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    category: category && category !== "all" ? category : undefined,
    sortBy: sortBy || undefined,
  });

  // Extract unique categories from products if available, or hardcode common ones
  const categories = ["all", "Электроника", "Одежда", "Дом", "Аксессуары"];

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-display font-semibold text-lg mb-4">Категории</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                (category === cat || (category === "" && cat === "all"))
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "Все категории" : cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">Каталог товаров</h1>
        <p className="text-muted-foreground text-lg">Найдите именно то, что вам нужно.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Mobile Filters Trigger */}
        <div className="w-full flex items-center gap-4 md:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Поиск..." 
              className="pl-10 h-12 bg-muted/50 border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-6">
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <FilterSidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 shrink-0 space-y-8 sticky top-24">
          <FilterSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full space-y-6">
          {/* Top Bar */}
          <div className="hidden md:flex items-center gap-4 bg-card p-2 rounded-xl border border-border/50 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Поиск товаров..." 
                className="pl-10 h-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="h-6 w-px bg-border/50 mx-2"></div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-10 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Сначала новые</SelectItem>
                <SelectItem value="price_asc">Сначала дешевле</SelectItem>
                <SelectItem value="price_desc">Сначала дороже</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-2xl w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground">Попробуйте изменить параметры поиска или фильтры.</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => { setSearch(""); setCategory(""); setSortBy(""); }}
              >
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

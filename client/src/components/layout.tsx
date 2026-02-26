import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, User, Menu, Package2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const cartItemCount = useCart((state) => state.getItemCount());

  const navLinks = [
    { href: "/", label: "Главная" },
    { href: "/catalog", label: "Каталог" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu */}
            <div className="md:hidden flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          location === link.href ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <Package2 className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl hidden sm:inline-block">
                МАГАЗИН
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="h-5 w-5" />
              </Button>
              
              <Link href="/profile">
                <Button variant="ghost" size="icon" className={location === "/profile" ? "text-primary bg-primary/5" : ""}>
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/cart">
                <Button variant="ghost" size="icon" className={`relative ${location === "/cart" ? "text-primary bg-primary/5" : ""}`}>
                  <ShoppingBag className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-2 border-background">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-muted py-12 mt-auto border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package2 className="h-6 w-6" />
                <span className="font-display font-bold text-xl">МАГАЗИН</span>
              </div>
              <p className="text-sm text-muted-foreground text-balance">
                Современный магазин качественных товаров. Мы доставляем радость в каждый дом.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-foreground">Покупателям</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/catalog" className="hover:text-primary transition-colors">Каталог</Link></li>
                <li><span className="hover:text-primary transition-colors cursor-pointer">Доставка и оплата</span></li>
                <li><span className="hover:text-primary transition-colors cursor-pointer">Возврат товара</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-foreground">О компании</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-primary transition-colors cursor-pointer">О нас</span></li>
                <li><span className="hover:text-primary transition-colors cursor-pointer">Контакты</span></li>
                <li><span className="hover:text-primary transition-colors cursor-pointer">Вакансии</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-foreground">Связь с нами</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>8 (800) 555-00-00</li>
                <li>hello@magazin.ru</li>
                <li className="pt-2">
                  <Button variant="outline" className="w-full">Обратный звонок</Button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} МАГАЗИН. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}

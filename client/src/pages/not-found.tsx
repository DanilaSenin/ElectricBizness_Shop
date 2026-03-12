import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Компонент страницы, отображаемой при переходе на несуществующий маршрут
export default function NotFound() {
  return (
    // Контейнер на всю высоту экрана для центрирования содержимого
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      {/* Карточка с сообщением об ошибке 404 */}
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          {/* Верхняя часть карточки: иконка и заголовок */}
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />

            {/* Заголовок страницы ошибки */}
            <h1 className="text-2xl font-bold text-gray-900">
              404 Page Not Found
            </h1>
          </div>

          {/* Поясняющий текст для разработчика или пользователя */}
          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

// Ключ, под которым в localStorage хранится выбор пользователя по cookie
const STORAGE_KEY = "cookie_consent_accepted";

export function CookieBanner() {
  // Состояние отвечает за отображение баннера
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли уже сохранённый выбор пользователя
    const accepted = localStorage.getItem(STORAGE_KEY);

    // Если пользователь ещё не принимал и не отклонял cookie,
    // показываем баннер с небольшой задержкой
    if (!accepted) {
      // Небольшая задержка, чтобы баннер не мигал сразу при загрузке страницы
      const timer = setTimeout(() => setVisible(true), 800);

      // Очищаем таймер при размонтировании компонента
      return () => clearTimeout(timer);
    }
  }, []);

  // Обработчик принятия cookie
  const accept = () => {
    // Сохраняем согласие пользователя в localStorage
    localStorage.setItem(STORAGE_KEY, "true");

    // Скрываем баннер
    setVisible(false);
  };

  // Обработчик отклонения cookie
  const decline = () => {
    // Сохраняем отказ пользователя в localStorage
    localStorage.setItem(STORAGE_KEY, "declined");

    // Скрываем баннер
    setVisible(false);
  };

  // Если баннер не должен отображаться, ничего не рендерим
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border shadow-2xl rounded-2xl p-5 max-w-xl w-full flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Иконка cookie */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Текст уведомления */}
        <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
          Мы используем файлы <span className="text-foreground font-medium">cookie</span> для улучшения работы сайта, анализа трафика и персонализации контента. Продолжая использовать сайт, вы соглашаетесь с{" "}
          <span className="text-primary cursor-pointer hover:underline">политикой конфиденциальности</span>.
        </div>

        {/* Кнопки управления выбором пользователя */}
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none rounded-xl"
            onClick={decline}
          >
            Отклонить
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none rounded-xl"
            onClick={accept}
          >
            Принять
          </Button>
        </div>
      </div>
    </div>
  );
}
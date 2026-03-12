import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Основной компонент страницы авторизации
export default function AuthPage() {
  // Получаем данные пользователя, функции входа и регистрации,
  // а также статус авторизации
  const { user, login, register, isAuthenticated } = useAuth();

  // Хук для программного перехода между страницами
  const [, setLocation] = useLocation();

  // Хук для отображения уведомлений
  const { toast } = useToast();

  // Если пользователь уже авторизован,
  // перенаправляем его в личный кабинет
  if (isAuthenticated) {
    setLocation("/profile");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      {/* Карточка с формами входа и регистрации */}
      <Card className="w-full max-w-md rounded-3xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Добро пожаловать</CardTitle>
          <CardDescription>
            Войдите в аккаунт или создайте новый
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Табы для переключения между входом и регистрацией */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            {/* Содержимое вкладки входа */}
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            {/* Содержимое вкладки регистрации */}
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Компонент формы входа
function LoginForm() {
  // Получаем функцию входа и состояние выполнения запроса
  const { login, isLoggingIn } = useAuth();

  // Хук для вывода уведомлений
  const { toast } = useToast();

  // Инициализация формы входа с начальными значениями
  const form = useForm({ defaultValues: { username: "", password: "" } });

  // Обработчик отправки формы
  const onSubmit = async (data: any) => {
    try {
      // Выполняем вход пользователя
      await login(data);

      // Показываем уведомление об успешной авторизации
      toast({ title: "Успех", description: "Вы успешно вошли в систему" });
    } catch (e: any) {
      // В случае ошибки показываем уведомление с текстом ошибки
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  return (
    // Форма входа
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Поле имени пользователя */}
      <div className="space-y-2">
        <Label htmlFor="username">Имя пользователя</Label>
        <Input id="username" {...form.register("username")} required />
      </div>

      {/* Поле пароля */}
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" type="password" {...form.register("password")} required />
      </div>

      {/* Кнопка отправки формы */}
      <Button type="submit" className="w-full rounded-xl" disabled={isLoggingIn}>
        Войти
      </Button>
    </form>
  );
}

// Компонент формы регистрации
function RegisterForm() {
  // Получаем функцию регистрации и состояние выполнения запроса
  const { register, isRegistering } = useAuth();

  // Хук для отображения уведомлений
  const { toast } = useToast();

  // Инициализация формы регистрации с начальными значениями полей
  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: ""
    }
  });

  // Обработчик отправки формы регистрации
  const onSubmit = async (data: any) => {
    try {
      // Выполняем регистрацию нового пользователя
      await register(data);

      // Показываем уведомление об успешном создании аккаунта
      toast({ title: "Успех", description: "Аккаунт успешно создан" });
    } catch (e: any) {
      // В случае ошибки показываем сообщение об ошибке
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  return (
    // Форма регистрации
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Поля имени и фамилии, расположенные в две колонки */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Имя</Label>
          <Input id="firstName" {...form.register("firstName")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Фамилия</Label>
          <Input id="lastName" {...form.register("lastName")} required />
        </div>
      </div>

      {/* Поле имени пользователя */}
      <div className="space-y-2">
        <Label htmlFor="reg-username">Имя пользователя</Label>
        <Input id="reg-username" {...form.register("username")} required />
      </div>

      {/* Поле электронной почты */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} required />
      </div>

      {/* Поле пароля */}
      <div className="space-y-2">
        <Label htmlFor="reg-password">Пароль</Label>
        <Input id="reg-password" type="password" {...form.register("password")} required />
      </div>

      {/* Кнопка отправки формы регистрации */}
      <Button type="submit" className="w-full rounded-xl" disabled={isRegistering}>
        Зарегистрироваться
      </Button>
    </form>
  );
}
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

export default function AuthPage() {
  const { user, login, register, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (isAuthenticated) {
    setLocation("/profile");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-3xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Добро пожаловать</CardTitle>
          <CardDescription>Войдите в аккаунт или создайте новый</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const form = useForm({ defaultValues: { username: "", password: "" } });

  const onSubmit = async (data: any) => {
    try {
      await login(data);
      toast({ title: "Успех", description: "Вы успешно вошли в систему" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Имя пользователя</Label>
        <Input id="username" {...form.register("username")} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" type="password" {...form.register("password")} required />
      </div>
      <Button type="submit" className="w-full rounded-xl" disabled={isLoggingIn}>
        Войти
      </Button>
    </form>
  );
}

function RegisterForm() {
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const form = useForm({ 
    defaultValues: { 
      username: "", 
      password: "", 
      email: "", 
      firstName: "", 
      lastName: "" 
    } 
  });

  const onSubmit = async (data: any) => {
    try {
      await register(data);
      toast({ title: "Успех", description: "Аккаунт успешно создан" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      <div className="space-y-2">
        <Label htmlFor="reg-username">Имя пользователя</Label>
        <Input id="reg-username" {...form.register("username")} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Пароль</Label>
        <Input id="reg-password" type="password" {...form.register("password")} required />
      </div>
      <Button type="submit" className="w-full rounded-xl" disabled={isRegistering}>
        Зарегистрироваться
      </Button>
    </form>
  );
}

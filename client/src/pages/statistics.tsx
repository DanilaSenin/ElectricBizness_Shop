import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/price";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Users, Eye, ReceiptText, BarChart3,
} from "lucide-react";

// Набор цветов для сегментов круговой диаграммы
const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

// Компонент карточки со статистическим показателем
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          {/* Левая часть карточки: название метрики, значение и подпись */}
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>

          {/* Правая часть карточки: иконка */}
          <div className="bg-primary/10 p-3 rounded-xl">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Кастомный tooltip для графиков продаж и заказов
const CustomTooltipSales = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        {/* Подпись периода */}
        <p className="font-semibold mb-1">{label}</p>

        {/* Значения серий на графике */}
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name === "sales"
              ? `Выручка: ${formatPrice(p.value)}`
              : `Заказов: ${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Кастомный tooltip для графика посещаемости
const CustomTooltipVisits = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        {/* Подпись периода */}
        <p className="font-semibold mb-1">{label}</p>

        {/* Количество посещений */}
        <p style={{ color: "#6366f1" }}>Посещений: {payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

// Компонент страницы статистики
export default function Statistics() {
  // Загружаем детальную аналитику с сервера
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/analytics/detailed"],
    retry: false,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
      {/* Заголовок страницы */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold">Статистика продаж</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Аналитика и ключевые показатели магазина
        </p>
      </div>

      {/* Блок карточек с основными KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {isLoading ? (
          // Пока данные загружаются, показываем скелетоны
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            {/* Общий доход */}
            <StatCard
              icon={TrendingUp}
              label="Общий доход"
              value={formatPrice(data?.totalSales ?? 0)}
              sub="Все оформленные заказы"
            />

            {/* Количество заказов */}
            <StatCard
              icon={ShoppingBag}
              label="Всего заказов"
              value={String(data?.orderCount ?? 0)}
              sub="За всё время"
            />

            {/* Средний чек */}
            <StatCard
              icon={ReceiptText}
              label="Средний чек"
              value={formatPrice(data?.avgCheck ?? 0)}
              sub="На один заказ"
            />

            {/* Уникальные посетители */}
            <StatCard
              icon={Users}
              label="Уникальных посетителей"
              value={String(data?.uniqueVisitors30d ?? 0)}
              sub="За последние 30 дней"
            />

            {/* Общее количество просмотров сайта */}
            <StatCard
              icon={Eye}
              label="Просмотры сайта"
              value={String(data?.totalPageViews ?? 0)}
              sub="Всего записано событий"
            />
          </>
        )}
      </div>

      {/* Первый ряд графиков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* График выручки по месяцам */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Выручка по месяцам</CardTitle>
            <p className="text-sm text-muted-foreground">
              Сумма продаж за последние 12 месяцев
            </p>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data?.salesChart ?? []}
                  margin={{ top: 4, right: 4, left: 0, bottom: 24 }}
                >
                  {/* Сетка графика */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                  {/* Ось X с месяцами */}
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />

                  {/* Ось Y со значениями выручки */}
                  <YAxis
                    tickFormatter={(v) => `${(v / 100).toLocaleString("ru-RU")} ₽`}
                    tick={{ fontSize: 11 }}
                    width={80}
                  />

                  {/* Подсказка при наведении */}
                  <Tooltip content={<CustomTooltipSales />} />

                  {/* Столбцы выручки */}
                  <Bar
                    dataKey="sales"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    name="sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* График посещаемости по месяцам */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Посещаемость по месяцам</CardTitle>
            <p className="text-sm text-muted-foreground">
              Количество визитов за последние 12 месяцев
            </p>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={data?.visitsChart ?? []}
                  margin={{ top: 4, right: 4, left: 0, bottom: 24 }}
                >
                  {/* Сетка графика */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                  {/* Ось X с месяцами */}
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />

                  {/* Ось Y со значениями посещаемости */}
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={40} />

                  {/* Подсказка при наведении */}
                  <Tooltip content={<CustomTooltipVisits />} />

                  {/* Линия посещаемости */}
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 6 }}
                    name="visits"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Второй ряд графиков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График количества заказов по месяцам */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Заказы по месяцам</CardTitle>
            <p className="text-sm text-muted-foreground">
              Количество оформленных заказов
            </p>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data?.salesChart ?? []}
                  margin={{ top: 4, right: 4, left: 0, bottom: 24 }}
                >
                  {/* Сетка графика */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                  {/* Ось X с месяцами */}
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />

                  {/* Ось Y с количеством заказов */}
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={40} />

                  {/* Подсказка при наведении */}
                  <Tooltip content={<CustomTooltipSales />} />

                  {/* Столбцы количества заказов */}
                  <Bar
                    dataKey="orders"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    name="orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Круговая диаграмма продаж по категориям */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Продажи по категориям</CardTitle>
            <p className="text-sm text-muted-foreground">
              Доля выручки каждой категории
            </p>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : !data?.byCategory?.length ? (
              // Если данных по категориям нет, показываем сообщение
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Нет данных о продажах
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  {/* Круговая диаграмма */}
                  <Pie
                    data={data.byCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {/* Цвета сегментов */}
                    {data.byCategory.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  {/* Подсказка при наведении */}
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "Выручка"]}
                  />

                  {/* Легенда диаграммы */}
                  <Legend
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
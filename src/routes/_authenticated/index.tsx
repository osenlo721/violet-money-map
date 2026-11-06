import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { useTransactions } from "@/lib/tx-store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Control Financiero — Dashboard" },
      { name: "description", content: "Ingresos, gastos, saldo y tasa de ahorro de tus finanzas personales." },
      { property: "og:title", content: "Control Financiero — Dashboard" },
      { property: "og:description", content: "Ingresos, gastos, saldo y tasa de ahorro de tus finanzas personales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const money = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const COLORS = [1, 2, 3, 4, 5, 6].map((i) => `var(--chart-${i})`);
const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" },
  itemStyle: { color: "var(--foreground)" },
  formatter: (v: number) => money(v),
};

function Index() {
  const transactions = useTransactions();
  const d = useMemo(() => {
    const ing = transactions.filter((t) => t.tipo === "Ingreso").reduce((a, t) => a + t.monto, 0);
    const gas = transactions.filter((t) => t.tipo === "Gasto").reduce((a, t) => a + t.monto, 0);
    const months = new Map<string, { mes: string; Ingresos: number; Gastos: number }>();
    const cats = new Map<string, number>();
    for (const t of transactions) {
      const k = t.fecha.slice(0, 7);
      const label = new Date(t.fecha + "T12:00:00").toLocaleDateString("es", { month: "short", year: "numeric" });
      const m = months.get(k) ?? { mes: label, Ingresos: 0, Gastos: 0 };
      if (t.tipo === "Ingreso") m.Ingresos += t.monto;
      else { m.Gastos += t.monto; cats.set(t.categoria, (cats.get(t.categoria) ?? 0) + t.monto); }
      months.set(k, m);
    }
    return {
      ing, gas, saldo: ing - gas, tasa: ing ? ((ing - gas) / ing) * 100 : 0,
      monthly: [...months.entries()].sort().map(([, v]) => v),
      cats: [...cats.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      recent: [...transactions].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 10),
    };
  }, [transactions]);

  const kpis = [
    { label: "Ingresos Totales", value: money(d.ing), icon: ArrowUpRight, tone: "text-success" },
    { label: "Gastos Totales", value: money(d.gas), icon: ArrowDownRight, tone: "text-destructive" },
    { label: "Saldo Actual", value: money(d.saldo), icon: Wallet, tone: "text-primary" },
    { label: "Tasa de Ahorro", value: `${d.tasa.toFixed(1)}%`, icon: PiggyBank, tone: "text-chart-2" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Control financiero</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Tu resumen de finanzas</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <span className={`rounded-full bg-accent p-2 ${k.tone}`}><k.icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{k.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Ingresos vs Gastos por mes</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={d.monthly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={50} />
                <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
                <Legend />
                <Bar dataKey="Ingresos" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Gastos" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Gastos por categoría</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.cats} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3} stroke="none">
                  {d.cats.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Transacciones recientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 font-medium">Fecha</th><th className="font-medium">Descripción</th>
                <th className="font-medium">Categoría</th><th className="font-medium">Tipo</th>
                <th className="text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {d.recent.map((t, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 tabular-nums text-muted-foreground">{t.fecha}</td>
                  <td className="font-medium">{t.descripcion}</td>
                  <td><span className="rounded-full bg-accent px-2.5 py-1 text-xs">{t.categoria}</span></td>
                  <td>{t.tipo}</td>
                  <td className={`text-right font-semibold tabular-nums ${t.tipo === "Ingreso" ? "text-success" : "text-destructive"}`}>
                    {t.tipo === "Ingreso" ? "+" : "−"}{money(t.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Iniciar Sesión — Control Financiero" },
      { name: "description", content: "Accede a tu dashboard de finanzas personales." },
      { property: "og:title", content: "Iniciar Sesión — Control Financiero" },
      { property: "og:description", content: "Accede a tu dashboard de finanzas personales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Email o contraseña incorrectos.");
    navigate({ to: "/", replace: true });
  }

  const field = "w-full rounded-xl border bg-input/30 px-4 py-3 outline-none transition-colors focus:border-primary";
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-2xl shadow-primary/10">
        <span className="mb-4 inline-flex rounded-full bg-accent p-3 text-primary"><Lock className="h-5 w-5" /></span>
        <h1 className="text-2xl font-extrabold">Iniciar Sesión</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accede a tu control financiero.</p>
        <label className="mt-6 block text-sm font-medium">Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1.5 ${field}`} />
        </label>
        <label className="mt-4 block text-sm font-medium">Contraseña
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1.5 ${field}`} />
        </label>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {loading ? "Entrando..." : "Iniciar Sesión"}
        </button>
      </form>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, UploadCloud, AlertCircle } from "lucide-react";
import { parseCsv, setTransactions } from "@/lib/tx-store";

export const Route = createFileRoute("/actualizar")({
  head: () => ({
    meta: [
      { title: "Actualizar Datos — Control Financiero" },
      { name: "description", content: "Sube un nuevo CSV de transacciones para actualizar tu dashboard." },
      { property: "og:title", content: "Actualizar Datos — Control Financiero" },
      { property: "og:description", content: "Sube un nuevo CSV de transacciones para actualizar tu dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Actualizar,
});

function Actualizar() {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handle(file?: File) {
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      setTransactions(rows);
      setMsg({ ok: true, text: `¡Listo! Se cargaron ${rows.length} registros desde "${file.name}".` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo leer el archivo." });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Control financiero</p>
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Actualizar Datos</h1>
      <p className="mt-2 text-muted-foreground">
        Sube un CSV con las columnas: Fecha, Descripción, Categoría, Tipo, Monto. Reemplazará los datos actuales.
      </p>

      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
        className={`mt-8 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${drag ? "border-primary bg-accent" : "bg-card hover:border-primary"}`}
      >
        <UploadCloud className="h-10 w-10 text-primary" />
        <span className="font-semibold">Arrastra tu archivo CSV aquí</span>
        <span className="text-sm text-muted-foreground">o haz clic para seleccionarlo</span>
      </button>
      <input ref={input} type="file" accept=".csv,text/csv" className="hidden"
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />

      {msg && (
        <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${msg.ok ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}`}>
          {msg.ok ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <div>
            <p className="font-medium">{msg.text}</p>
            {msg.ok && <Link to="/" className="mt-1 inline-block text-sm text-primary underline">Ver el dashboard actualizado</Link>}
          </div>
        </div>
      )}
    </main>
  );
}

import { useEffect, useSyncExternalStore } from "react";
import { transactions as defaults, type Tx } from "./transactions";

const KEY = "finanzas-transacciones";
let data: Tx[] = defaults;
let loaded = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function setTransactions(next: Tx[]) {
  data = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function useTransactions() {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { data = JSON.parse(raw); emit(); }
    } catch { /* ignore */ }
  }, []);
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => data,
    () => defaults,
  );
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function splitLine(line: string, sep: string) {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === sep && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseDate(s: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(s: string) {
  let v = s.replace(/[^\d,.-]/g, "");
  if (v.includes(",") && v.includes(".")) v = v.lastIndexOf(",") > v.lastIndexOf(".") ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  else if (v.includes(",")) v = v.replace(",", ".");
  return Math.abs(parseFloat(v));
}

export function parseCsv(text: string): Tx[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("El archivo no tiene filas de datos.");
  const sep = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const head = splitLine(lines[0], sep).map(norm);
  const idx = (names: string[]) => head.findIndex((h) => names.includes(h));
  const col = {
    fecha: idx(["fecha"]), desc: idx(["descripcion"]), cat: idx(["categoria"]),
    tipo: idx(["tipo"]), monto: idx(["monto", "valor"]),
  };
  const missing = Object.entries(col).filter(([, i]) => i < 0).map(([k]) => k);
  if (missing.length) throw new Error(`Faltan columnas: ${missing.join(", ")}`);
  const rows: Tx[] = [];
  lines.slice(1).forEach((l, n) => {
    const c = splitLine(l, sep);
    const fecha = parseDate(c[col.fecha] ?? "");
    const monto = parseAmount(c[col.monto] ?? "");
    if (!fecha || isNaN(monto)) throw new Error(`Fila ${n + 2} con fecha o monto inválido.`);
    rows.push({
      fecha, monto, descripcion: c[col.desc] ?? "", categoria: c[col.cat] || "Otros",
      tipo: norm(c[col.tipo] ?? "").startsWith("ingreso") ? "Ingreso" : "Gasto",
    });
  });
  return rows;
}

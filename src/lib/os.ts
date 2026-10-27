import type { Database } from "@/integrations/supabase/types";

export type OsStatus = Database["public"]["Enums"]["os_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export const STATUS_LABEL: Record<OsStatus, string> = {
  aguardando_producao: "Aguardando produção",
  em_producao: "Em produção",
  producao_finalizada: "Produção finalizada",
  faturado: "Faturado",
  aguardando_entrega: "Aguardando entrega ou coleta",
  entregue: "Entregue",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const STATUS_ORDER: OsStatus[] = [
  "aguardando_producao",
  "em_producao",
  "producao_finalizada",
  "faturado",
  "aguardando_entrega",
  "entregue",
  "finalizado",
  "cancelado",
];

/** Statuses shown in the main (active) list. */
export const ACTIVE_STATUSES: OsStatus[] = STATUS_ORDER.filter(
  (s) => s !== "finalizado" && s !== "cancelado",
);
/** "OS para PCP": orders still to be planned / produced. */
export const PCP_STATUSES: OsStatus[] = ["aguardando_producao", "em_producao"];

export type PrazoIndicador = "atrasada" | "hoje" | "proxima" | "no_prazo" | "sem_prazo" | "encerrada";

export const PRAZO_PROXIMO_DIAS = 3;

/** Lateness is a computed indicator, never a status. Dates are YYYY-MM-DD. */
export function prazoIndicador(prazo: string | null, status: OsStatus, hoje: string): PrazoIndicador {
  if (status === "entregue" || status === "finalizado" || status === "cancelado") return "encerrada";
  if (!prazo) return "sem_prazo";
  const dias = diasEntre(hoje, prazo);
  if (dias < 0) return "atrasada";
  if (dias === 0) return "hoje";
  if (dias <= PRAZO_PROXIMO_DIAS) return "proxima";
  return "no_prazo";
}

export function diasEntre(de: string, ate: string): number {
  const a = Date.UTC(+de.slice(0, 4), +de.slice(5, 7) - 1, +de.slice(8, 10));
  const b = Date.UTC(+ate.slice(0, 4), +ate.slice(5, 7) - 1, +ate.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export function hojeISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Consolidates production entries. Billed quantity = good produced units, never the requested amount. */
export function consolidar(apontamentos: { qtd_produzida: number; qtd_perdida: number }[]) {
  return apontamentos.reduce(
    (acc, a) => ({
      produzido: acc.produzido + Number(a.qtd_produzida),
      perdido: acc.perdido + Number(a.qtd_perdida),
    }),
    { produzido: 0, perdido: 0 },
  );
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
export const fmtBRL = (v: number | null | undefined) => (v == null ? "—" : brl.format(Number(v)));
export const fmtNum = (v: number | null | undefined) => (v == null ? "—" : num.format(Number(v)));
export function fmtData(d: string | null | undefined) {
  if (!d) return "—";
  const s = d.slice(0, 10);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}
export function fmtDataHora(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
/** For <input type="datetime-local"> */
export function toLocalInput(d: string | null | undefined) {
  if (!d) return "";
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function erroMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Erro inesperado";
}

export const CONFLITO_MSG =
  "Este registro foi alterado por outra pessoa enquanto você editava. Recarregue para ver a versão atual.";

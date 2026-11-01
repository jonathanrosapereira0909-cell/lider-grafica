import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, prazoIndicador, hojeISO, diasEntre, type OsStatus } from "@/lib/os";

const STATUS_CLS: Record<OsStatus, string> = {
  aguardando_producao: "bg-muted text-muted-foreground border-border",
  em_producao: "bg-info text-info-foreground border-transparent",
  producao_finalizada: "bg-primary text-primary-foreground border-transparent",
  faturado: "bg-accent text-accent-foreground border-transparent",
  aguardando_entrega: "bg-warning text-warning-foreground border-transparent",
  entregue: "bg-success/15 text-success border-success/30",
  finalizado: "bg-success text-success-foreground border-transparent",
  cancelado: "bg-destructive/10 text-destructive border-destructive/30 line-through",
};

export function StatusBadge({ status }: { status: OsStatus }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium", STATUS_CLS[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PrazoBadge({ prazo, status }: { prazo: string | null; status: OsStatus }) {
  const hoje = hojeISO();
  const ind = prazoIndicador(prazo, status, hoje);
  if (ind === "encerrada" || ind === "sem_prazo") return <span className="text-muted-foreground">—</span>;
  const dias = diasEntre(hoje, prazo!);
  const map = {
    atrasada: ["bg-destructive text-destructive-foreground", `Atrasada ${-dias}d`],
    hoje: ["bg-warning text-warning-foreground", "Entrega hoje"],
    proxima: ["bg-warning/30 text-warning-foreground", `Em ${dias}d`],
    no_prazo: ["bg-success/15 text-success", "No prazo"],
  } as const;
  const [cls, label] = map[ind];
  return <span className={cn("whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium", cls)}>{label}</span>;
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chrome-border bg-chrome px-4 py-2.5">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted-foreground">{sub}</div>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

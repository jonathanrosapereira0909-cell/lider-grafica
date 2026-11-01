import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  BarChart3, ChevronDown, ChevronLeft, ChevronRight, Copy, FileCheck2, PackageCheck, Pencil, Plus,
  Printer, Search, Settings2, X, XSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { selectCls } from "@/components/os-ui";
import {
  ACTIVE_STATUSES, PCP_STATUSES, STATUS_LABEL, STATUS_ORDER, diasEntre, erroMsg, fmtBRL, fmtData, hojeISO,
  prazoIndicador, type OsStatus,
} from "@/lib/os";
import { useMaquinas, useProdutos, useUsuarios } from "@/lib/queries";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/os/")({
  head: () => ({ meta: [{ title: "Ordens de serviço — Lider Gráfica" }] }),
  component: OsList,
});

type Aba = "ativas" | "finalizados" | "cancelados";
type Modo = "geral" | "numero" | "cliente" | "codigo";
const vazio = {
  pcp: false, status: "" as "" | OsStatus,
  produto: "", maquina: "", prazoAte: "", de: "", ate: "", responsavel: "", atrasadas: false,
};

const MODOS: { v: Modo; label: string }[] = [
  { v: "geral", label: "0-Geral" },
  { v: "numero", label: "1-Nº OS" },
  { v: "cliente", label: "2-Nome cliente" },
  { v: "codigo", label: "3-Cód. cliente" },
];

function OsList() {
  const { data: me } = useMe();
  const g = !!me?.isGestor;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("ativas");
  const [modo, setModo] = useState<Modo>("geral");
  const [texto, setTexto] = useState("");
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [f, setF] = useState(vazio);
  const [selId, setSelId] = useState<string | null>(null);
  const set = <K extends keyof typeof vazio>(k: K, v: (typeof vazio)[K]) => setF((s) => ({ ...s, [k]: v }));
  const { data: produtos } = useProdutos();
  const { data: maquinas } = useMaquinas();
  const { data: usuarios } = useUsuarios();

  const { data, isLoading, error } = useQuery({
    queryKey: ["os", "lista", aba, f, modo, texto],
    queryFn: async () => {
      let q = supabase.from("os_lista").select("*").order("numero", { ascending: false }).limit(500);
      if (aba === "ativas") q = q.in("status", f.pcp ? PCP_STATUSES : ACTIVE_STATUSES);
      if (aba === "finalizados") q = q.eq("status", "finalizado");
      if (aba === "cancelados") q = q.eq("status", "cancelado");
      if (f.status) q = q.eq("status", f.status);
      if (f.produto) q = q.eq("produto_id", f.produto);
      if (f.maquina) q = q.contains("maquina_ids", [f.maquina]);
      if (f.prazoAte) q = q.lte("prazo_entrega", f.prazoAte);
      if (f.de) q = q.gte("data_os", f.de);
      if (f.ate) q = q.lte("data_os", f.ate);
      if (f.responsavel) q = q.eq("responsavel_id", f.responsavel);
      if (f.atrasadas) q = q.eq("atrasada", true);
      const t = texto.replace(/[,()%]/g, " ").trim();
      if (t) {
        const n = Number(t);
        if (modo === "numero") q = Number.isInteger(n) && n > 0 ? q.eq("numero", n) : q.eq("numero", -1);
        else if (modo === "cliente") q = q.ilike("cliente_nome", `%${t}%`);
        else if (modo === "codigo") q = q.ilike("cliente_codigo", `%${t}%`);
        else
          q = q.or(
            [`cliente_nome.ilike.%${t}%`, `descricao_servico.ilike.%${t}%`, `produto_nome.ilike.%${t}%`, `posicao_atual.ilike.%${t}%`,
              ...(Number.isInteger(n) && n > 0 ? [`numero.eq.${n}`] : [])].join(","),
          );
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const lista = data ?? [];
  const idx = lista.findIndex((o) => o.id === selId);
  const sel = idx >= 0 ? lista[idx] : null;

  useEffect(() => {
    if (idx < 0 && lista[0]) setSelId(lista[0].id!);
  }, [lista, idx]);

  function mover(d: number) {
    if (!lista.length) return;
    const n = Math.min(lista.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + d));
    const alvo = lista[n]!;
    setSelId(alvo.id!);
    document.getElementById(`os-row-${alvo.id}`)?.scrollIntoView({ block: "nearest" });
  }

  const abrir = (to: "/os/$id" | "/os/$id/editar" | "/os/$id/imprimir") =>
    sel && navigate({ to, params: { id: sel.id! } });

  async function baixar() {
    if (!sel) return;
    if (!window.confirm(`Baixar e finalizar a OS ${sel.numero}?`)) return;
    const { error } = await supabase.rpc("os_baixar" as never, { _id: sel.id } as never);
    if (error) { toast.error(erroMsg(error)); return; }
    toast.success(`OS ${sel.numero} baixada`);
    qc.invalidateQueries({ queryKey: ["os"] });
  }

  const st = sel?.status;
  const encerrada = st === "finalizado" || st === "cancelado";
  const algumFiltro = JSON.stringify(f) !== JSON.stringify(vazio);
  const hoje = hojeISO();

  return (
    <div className="flex h-full flex-col bg-card">
      {/* search bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-chrome-border bg-chrome px-1 py-1">
        <div className="relative">
          <Input
            className="h-8 w-56 rounded-sm bg-card pr-8"
            placeholder="digite a pesquisa"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            inputMode={modo === "numero" ? "numeric" : undefined}
          />
          <Search className="pointer-events-none absolute right-2 top-2 size-4 text-primary" />
        </div>
        <BarBtn onClick={() => setFiltrosOpen((v) => !v)} active={filtrosOpen || algumFiltro} title="Mais filtros">
          <ChevronDown className="size-4" />
        </BarBtn>
        <BarBtn onClick={() => mover(-1)} title="Anterior"><ChevronLeft className="size-4" /></BarBtn>
        <BarBtn onClick={() => mover(1)} title="Próxima"><ChevronRight className="size-4" /></BarBtn>
        <div className="mx-1 h-6 w-px bg-chrome-border" />
        {MODOS.map((m) => (
          <BarBtn key={m.v} active={modo === m.v} onClick={() => setModo(m.v)}>{m.label}</BarBtn>
        ))}
        <BarBtn active={f.pcp} onClick={() => set("pcp", !f.pcp)}>4-OS p/ PCP</BarBtn>
        <div className="mx-1 h-6 w-px bg-chrome-border" />
        {(["ativas", "finalizados", "cancelados"] as Aba[]).map((a) => (
          <BarBtn key={a} active={aba === a} onClick={() => setAba(a)}>
            {a === "ativas" ? "Ativas" : a === "finalizados" ? "Finalizadas" : "Canceladas"}
          </BarBtn>
        ))}
        <span className="ml-2 text-sm text-primary">Ordens de serviço ({lista.length})</span>
      </div>

      {filtrosOpen && (
        <div className="grid grid-cols-2 gap-2 border-b border-chrome-border bg-chrome p-2 md:grid-cols-4 xl:grid-cols-6">
          <select className={selectCls} value={f.status} onChange={(e) => set("status", e.target.value as OsStatus | "")}>
            <option value="">Situação: todas</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select className={selectCls} value={f.produto} onChange={(e) => set("produto", e.target.value)}>
            <option value="">Produto: todos</option>
            {produtos?.map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nome}</option>)}
          </select>
          <select className={selectCls} value={f.maquina} onChange={(e) => set("maquina", e.target.value)}>
            <option value="">Máquina: todas</option>
            {maquinas?.map((m) => <option key={m.id} value={m.id}>{m.codigo} — {m.nome}</option>)}
          </select>
          <select className={selectCls} value={f.responsavel} onChange={(e) => set("responsavel", e.target.value)}>
            <option value="">Responsável: todos</option>
            {usuarios?.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Prazo até
            <Input type="date" className="h-9" value={f.prazoAte} onChange={(e) => set("prazoAte", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">De
            <Input type="date" className="h-9" value={f.de} onChange={(e) => set("de", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Até
            <Input type="date" className="h-9" value={f.ate} onChange={(e) => set("ate", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.atrasadas} onChange={(e) => set("atrasadas", e.target.checked)} /> Só atrasadas</label>
          {algumFiltro && (
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => setF(vazio)}>
              <X className="size-4" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* grid */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="erp-grid w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              {["Nº OS", "Nome cliente", "Situação", "Descrição serviço", "Valor OS", "Posição atual", "Dt. previsão cliente", "Dt. inicial", "Atraso", "Nº orçamento"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {error && <tr><td colSpan={10} className="p-6 text-center text-destructive">Erro ao carregar</td></tr>}
            {!isLoading && lista.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Nenhuma OS encontrada.</td></tr>}
            {lista.map((o) => {
              const ind = prazoIndicador(o.prazo_entrega, o.status!, hoje);
              const atraso = ind === "atrasada" ? -diasEntre(hoje, o.prazo_entrega!) : 0;
              return (
                <tr
                  key={o.id!}
                  id={`os-row-${o.id}`}
                  data-selected={o.id === selId}
                  className="cursor-default select-none"
                  onClick={() => setSelId(o.id!)}
                  onDoubleClick={() => navigate({ to: "/os/$id", params: { id: o.id! } })}
                >
                  <td className="tabular whitespace-nowrap font-mono">{String(o.numero).padStart(6, "0")}</td>
                  <td className="max-w-48 truncate whitespace-nowrap">{o.cliente_nome}</td>
                  <td className="whitespace-nowrap">{STATUS_LABEL[o.status!]}</td>
                  <td className="max-w-md truncate whitespace-nowrap">{o.descricao_servico || o.produto_nome}</td>
                  <td className="tabular whitespace-nowrap text-right">{fmtBRL(o.valor).replace("R$", "").trim()}</td>
                  <td className="whitespace-nowrap">{o.posicao_atual || ""}</td>
                  <td className="tabular whitespace-nowrap">{o.prazo_entrega ? fmtData(o.prazo_entrega) : ""}</td>
                  <td className="tabular whitespace-nowrap">{o.data_inicial ? fmtData(o.data_inicial) : ""}</td>
                  <td className={cn("tabular whitespace-nowrap text-right", atraso > 0 && "font-semibold text-destructive")}>
                    {atraso > 0 ? atraso : ind === "hoje" ? "hoje" : ""}
                  </td>
                  <td className="whitespace-nowrap font-mono">{o.numero_orcamento || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* action bar */}
      <div className="no-print shrink-0 border-t border-chrome-border bg-chrome p-1">
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
          <ActBtn icon={<Plus className="text-success" />} disabled={!g} onClick={() => navigate({ to: "/os/nova" })}>Incluir</ActBtn>
          <ActBtn icon={<Copy className="text-accent-foreground" />} disabled={!g || !sel} onClick={() => sel && navigate({ to: "/os/nova", search: { de: sel.id! } })}>Duplicar</ActBtn>
          <ActBtn icon={<Pencil className="text-primary" />} primary disabled={!g || !sel || encerrada} onClick={() => abrir("/os/$id/editar")}>Alterar</ActBtn>
          <ActBtn icon={<BarChart3 className="text-destructive" />} onClick={() => navigate({ to: "/relatorios" })}>Relatórios</ActBtn>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1 md:grid-cols-5">
          <ActBtn icon={<Printer className="text-primary" />} disabled={!sel} onClick={() => abrir("/os/$id/imprimir")}>Imprimir OS</ActBtn>
          <ActBtn icon={<Settings2 className="text-warning-foreground" />} disabled={!sel} onClick={() => abrir("/os/$id")}>Gerenciar</ActBtn>
          <ActBtn icon={<FileCheck2 className="text-primary" />} disabled={!g || st !== "entregue"} onClick={baixar}>Baixar OS</ActBtn>
          <ActBtn icon={<PackageCheck className="text-accent-foreground" />} disabled={st !== "aguardando_entrega"} onClick={() => abrir("/os/$id")}>Expedir</ActBtn>
          <ActBtn icon={<XSquare className="text-destructive" />} disabled={!g || !sel || encerrada} onClick={() => abrir("/os/$id")}>Cancelar</ActBtn>
        </div>
      </div>
    </div>
  );
}

function BarBtn({ children, active, onClick, title }: { children: ReactNode; active?: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center rounded-sm border border-chrome-border bg-card px-2.5 text-sm hover:bg-chrome-hover",
        active && "border-primary/50 bg-tab-active",
      )}
    >
      {children}
    </button>
  );
}

function ActBtn({ children, icon, onClick, disabled, primary }: {
  children: ReactNode; icon: ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-10 items-center justify-center gap-3 rounded-sm border border-chrome-border bg-card text-sm underline-offset-2 hover:bg-chrome-hover hover:underline disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-6 [&_svg]:stroke-[1.5]",
        primary && "border-primary font-semibold",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

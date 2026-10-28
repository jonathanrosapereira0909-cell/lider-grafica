import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, PrazoBadge, StatusBadge, selectCls } from "@/components/os-ui";
import { ACTIVE_STATUSES, PCP_STATUSES, STATUS_LABEL, STATUS_ORDER, fmtBRL, fmtData, hojeISO, type OsStatus } from "@/lib/os";
import { useMaquinas, useProdutos, useUsuarios } from "@/lib/queries";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/os/")({
  head: () => ({ meta: [{ title: "Ordens de serviço — Lider Gráfica" }] }),
  component: OsList,
});

type Aba = "ativas" | "finalizados" | "cancelados";
const vazio = {
  q: "", numero: "", cliente: "", clienteCodigo: "", pcp: false, status: "" as "" | OsStatus,
  produto: "", maquina: "", prazoAte: "", de: "", ate: "", responsavel: "", atrasadas: false,
};

function OsList() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>("ativas");
  const [f, setF] = useState(vazio);
  const set = <K extends keyof typeof vazio>(k: K, v: (typeof vazio)[K]) => setF((s) => ({ ...s, [k]: v }));
  const { data: produtos } = useProdutos();
  const { data: maquinas } = useMaquinas();
  const { data: usuarios } = useUsuarios();

  const { data, isLoading, error } = useQuery({
    queryKey: ["os", "lista", aba, f],
    queryFn: async () => {
      let q = supabase.from("os_lista").select("*").order("numero", { ascending: false }).limit(500);
      if (aba === "ativas") q = q.in("status", f.pcp ? PCP_STATUSES : ACTIVE_STATUSES);
      if (aba === "finalizados") q = q.eq("status", "finalizado");
      if (aba === "cancelados") q = q.eq("status", "cancelado");
      if (f.status) q = q.eq("status", f.status);
      if (f.numero) q = q.eq("numero", Number(f.numero));
      if (f.cliente) q = q.ilike("cliente_nome", `%${f.cliente}%`);
      if (f.clienteCodigo) q = q.ilike("cliente_codigo", `%${f.clienteCodigo}%`);
      if (f.produto) q = q.eq("produto_id", f.produto);
      if (f.maquina) q = q.contains("maquina_ids", [f.maquina]);
      if (f.prazoAte) q = q.lte("prazo_entrega", f.prazoAte);
      if (f.de) q = q.gte("data_os", f.de);
      if (f.ate) q = q.lte("data_os", f.ate);
      if (f.responsavel) q = q.eq("responsavel_id", f.responsavel);
      if (f.atrasadas) q = q.eq("atrasada", true);
      if (f.q) {
        const t = f.q.replace(/[,()%]/g, " ").trim();
        const n = Number(t);
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

  const algumFiltro = JSON.stringify(f) !== JSON.stringify(vazio);

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        sub={`Hoje: ${fmtData(hojeISO())}`}
        actions={
          me?.isGestor && (
            <Button asChild>
              <Link to="/os/nova"><Plus /> Incluir OS</Link>
            </Button>
          )
        }
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
            <TabsList>
              <TabsTrigger value="ativas">Ativas</TabsTrigger>
              <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
              <TabsTrigger value="cancelados">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar nº, cliente, descrição…" value={f.q} onChange={(e) => set("q", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-3 md:grid-cols-4 xl:grid-cols-6">
          <Input placeholder="Nº OS" inputMode="numeric" value={f.numero} onChange={(e) => set("numero", e.target.value.replace(/\D/g, ""))} />
          <Input placeholder="Cliente" value={f.cliente} onChange={(e) => set("cliente", e.target.value)} />
          <Input placeholder="Cód. cliente" value={f.clienteCodigo} onChange={(e) => set("clienteCodigo", e.target.value)} />
          <select className={selectCls} value={f.status} onChange={(e) => set("status", e.target.value as OsStatus | "")}>
            <option value="">Status: todos</option>
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
            <Input type="date" value={f.prazoAte} onChange={(e) => set("prazoAte", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">De
            <Input type="date" value={f.de} onChange={(e) => set("de", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Até
            <Input type="date" value={f.ate} onChange={(e) => set("ate", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.pcp} onChange={(e) => set("pcp", e.target.checked)} /> OS para PCP</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.atrasadas} onChange={(e) => set("atrasadas", e.target.checked)} /> Só atrasadas</label>
          {algumFiltro && (
            <Button variant="ghost" size="sm" onClick={() => setF(vazio)}><X /> Limpar filtros</Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Nº OS", "Cliente", "Situação", "Descrição do serviço", "Valor", "Posição atual", "Prazo cliente", "Data inicial", "Atraso", "Nº orçamento"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
              {error && <tr><td colSpan={10} className="p-6 text-center text-destructive">Erro ao carregar</td></tr>}
              {data?.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Nenhuma OS encontrada.</td></tr>}
              {data?.map((o) => (
                <tr
                  key={o.id!}
                  className="cursor-pointer border-t hover:bg-muted/50"
                  onClick={() => navigate({ to: "/os/$id", params: { id: o.id! } })}
                >
                  <td className="px-3 py-2.5 font-mono font-semibold">{o.numero}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{o.cliente_nome}</div>
                    <div className="font-mono text-xs text-muted-foreground">{o.cliente_codigo}</div>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={o.status!} /></td>
                  <td className="max-w-xs truncate px-3 py-2.5">{o.descricao_servico || o.produto_nome}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5 text-right">{fmtBRL(o.valor)}</td>
                  <td className="px-3 py-2.5">{o.posicao_atual || "—"}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">{fmtData(o.prazo_entrega)}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">{fmtData(o.data_inicial)}</td>
                  <td className="px-3 py-2.5"><PrazoBadge prazo={o.prazo_entrega} status={o.status!} /></td>
                  <td className="px-3 py-2.5 font-mono text-xs">{o.numero_orcamento || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

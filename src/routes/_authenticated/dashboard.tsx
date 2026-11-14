import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, FileText, ShoppingCart, ClipboardList, Clock3, Settings, Truck, ChevronRight, CalendarDays, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, selectCls, StatusBadge } from "@/components/os-ui";
import { DashboardMetas } from "@/components/dashboard-metas";
import { DashboardDemo } from "@/components/dashboard-demo";
import { dashboardQuery, hojeProducao, progressoMeta } from "@/lib/dashboard";
import { fmtBRL, fmtNum, fmtData, erroMsg } from "@/lib/os";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard – Produção Industrial — Lider Gráfica" },
    { name: "description", content: "Produção industrial da Lider Gráfica: orçamentos, pedidos, OS, expedição e metas diárias por setor." },
    { property: "og:title", content: "Dashboard – Produção Industrial — Lider Gráfica" },
    { property: "og:description", content: "Acompanhamento do fluxo de produção e das metas por setor da Lider Gráfica." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery(hojeProducao())),
  pendingComponent: () => <div className="p-6 text-muted-foreground">Carregando produção…</div>,
  errorComponent: ({ error, reset }) => <div className="space-y-3 p-6"><h1 className="text-lg font-bold">Não foi possível carregar a produção</h1><p>{erroMsg(error)}</p><Button onClick={reset}><RefreshCw className="size-4" />Tentar novamente</Button></div>,
  component: Dashboard,
});

function Dashboard() {
  const { data: inicial } = useSuspenseQuery(dashboardQuery(hojeProducao()));
  const [dia, setDia] = useState(hojeProducao);
  const [setorId, setSetorId] = useState("todos");
  const { data = inicial, isFetching, error } = useQuery(dashboardQuery(dia));
  const { data: me } = useMe();
  const navigate = useNavigate();
  const cards = [
    { label: "Orçamentos", fluxo: "Orçamento", value: data.orcamentos_abertos.qtd, valor: data.orcamentos_abertos.valor, icon: FileText, tone: "budget" },
    { label: "Pedidos", fluxo: "Pedido", value: data.pedidos_abertos.qtd, valor: data.pedidos_abertos.valor, icon: ShoppingCart, tone: "orders" },
    { label: "O.S. (Abertas)", fluxo: "O.S.", value: data.status.abertas, icon: ClipboardList, tone: "open" },
    { label: "Aguardando Produção", fluxo: "Aguardando Produção", value: data.status.aguardando_producao, icon: Clock3, tone: "waiting" },
    { label: "Produzindo", fluxo: "Produzindo", value: data.status.produzindo, icon: Settings, tone: "running" },
    { label: "Aguardando Faturamento", fluxo: "Aguardando Faturamento", value: data.status.aguardando_faturamento, icon: FileText, tone: "billing" },
    { label: "Expedição", fluxo: "Expedição", value: data.status.expedicao, icon: Truck, tone: "shipping" },
  ];
  const chart = [
    { name: "Produzindo", value: data.status.produzindo, fill: "var(--dash-running)" },
    { name: "Aguardando Produção", value: data.status.aguardando_producao, fill: "var(--dash-waiting)" },
    { name: "Aguardando Faturamento", value: data.status.aguardando_faturamento, fill: "var(--dash-billing)" },
    { name: "Expedição", value: data.status.expedicao, fill: "var(--dash-shipping)" },
    { name: "Outros", value: data.status.outros, fill: "var(--dash-open)" },
  ];
  const setores = data.setores.filter(s => setorId === "todos" || s.id === setorId);

  return <div className="dashboard-page min-h-full">
    <PageHeader title="Dashboard – Produção Industrial" sub="Acompanhe em tempo real o fluxo de orçamentos, pedidos, O.S., produção e expedição." actions={<>{data.temDemo && <span className="self-center rounded border bg-warning/15 px-2 py-1 text-xs font-medium text-warning-foreground">Dados de demonstração</span>}<span className="flex items-center gap-2 text-sm font-bold"><BarChart3 className="size-5 text-primary" />Lider Gráfica</span>{data.temDemo && me?.isGestor && <DashboardDemo />}</>} />
    <div className="space-y-5 p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">Lider Gráfica · Visão geral da produção</span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" /><span className="relative"><Input aria-label="Data da produção" lang="pt-BR" type="date" value={dia} onChange={e => { if (e.target.value) setDia(e.target.value); }} className="dashboard-date w-40 bg-card" /><span aria-hidden="true" className="pointer-events-none absolute left-3 top-2 text-sm tabular">{fmtData(dia)}</span></span></label>
          <select aria-label="Setor da produção" className={`${selectCls} !w-48`} value={setorId} onChange={e => setSetorId(e.target.value)}><option value="todos">Todos os setores</option>{data.setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
        </div>
      </div>
      <div className="dashboard-metrics grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {cards.map(c => <article key={c.tone} className={`dashboard-tile dashboard-${c.tone} rounded-lg p-4 shadow-card`}>
          <div className="flex min-h-10 items-start gap-2"><c.icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.7} /><h2 className="text-sm font-semibold leading-snug">{c.label}</h2></div>
          <div className="mt-2 text-center text-4xl font-bold tabular">{fmtNum(c.value)}</div>
          <div className="mt-1 min-h-5 text-center text-sm tabular">{"valor" in c ? fmtBRL(c.valor) : null}</div>
        </article>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="dashboard-section min-w-0">
          <h2 className="dashboard-heading">Fluxo de Produção <span className="text-base font-medium text-muted-foreground">(Kanban)</span></h2>
          <div className="dashboard-flow mt-5 flex items-center pb-2">
            {cards.map((c, i) => <div key={c.tone} className="contents">
              {i > 0 && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
              <div className={`dashboard-tile dashboard-${c.tone} flex min-h-28 min-w-0 flex-1 flex-col justify-between rounded-md px-2 py-3 text-center`}><span className="text-xs font-semibold leading-snug">{c.fluxo}</span><strong className="mt-3 text-3xl tabular">{fmtNum(c.value)}</strong></div>
            </div>)}
          </div>
        </section>
        <section className="dashboard-section min-w-0">
          <h2 className="dashboard-heading">Status da Produção</h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:flex-nowrap">
            <div className="relative size-40 shrink-0">
              <ChartContainer config={{ value: { label: "O.S." } }} className="size-40 aspect-square">
                <PieChart><Pie data={data.status.abertas > 0 ? chart : [{ name: "Sem OS abertas", value: 1, fill: "var(--muted)" }]} dataKey="value" nameKey="name" innerRadius={53} outerRadius={76} stroke="none" isAnimationActive={false}>
                  {(data.status.abertas > 0 ? chart : [{ fill: "var(--muted)" }]).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>{data.status.abertas > 0 && <ChartTooltip content={<ChartTooltipContent hideLabel />} />}</PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-3xl tabular">{fmtNum(data.status.abertas)}</strong><span className="text-xs font-semibold">O.S.</span></div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2.5 text-xs">{chart.map(c => <li key={c.name} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2"><svg className="size-2.5 shrink-0" aria-hidden="true"><circle cx="5" cy="5" r="5" fill={c.fill} /></svg>{c.name}</span><strong className="tabular">{fmtNum(data.status.abertas ? c.value / data.status.abertas * 100 : 0)}%</strong></li>)}</ul>
          </div>
        </section>
        <section className="dashboard-section min-w-0">
          <div className="flex items-center justify-between gap-3"><h2 className="dashboard-heading">Últimos Pedidos / O.S.</h2><Button asChild variant="link" size="sm"><Link to="/os">Ver todas<ChevronRight className="size-4" /></Link></Button></div>
          <div className="mt-4 overflow-x-auto"><table className="dashboard-table w-full text-sm"><thead><tr>{["O.S.", "Cliente", "Produto", "Quantidade", "Status", "Previsão"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
            {data.recentes.map(os => <tr key={os.id} className="cursor-pointer" tabIndex={0} aria-label={`Abrir OS ${os.numero}`} onClick={() => navigate({ to: "/os/$id", params: { id: os.id } })} onKeyDown={e => { if (e.key === "Enter") navigate({ to: "/os/$id", params: { id: os.id } }); }}><td><Link to="/os/$id" params={{ id: os.id }} className="whitespace-nowrap font-semibold">OS {os.numero}</Link></td><td>{os.cliente_nome}</td><td>{os.produto_nome}</td><td className="whitespace-nowrap tabular">{fmtNum(os.quantidade_solicitada)} un</td><td><StatusBadge status={os.status} /></td><td className="whitespace-nowrap tabular">{os.prazo_entrega ? fmtData(os.prazo_entrega).slice(0, 5) : "—"}</td></tr>)}
            {!data.recentes.length && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma O.S. registrada.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="dashboard-section min-w-0" aria-busy={isFetching}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="dashboard-heading">Produção por Setor <span className="text-base font-medium text-muted-foreground">({dia === hojeProducao() ? "Hoje" : fmtData(dia)})</span></h2>{me?.isGestor && <DashboardMetas setores={data.setores} />}</div>
          {error ? <p role="alert" className="mt-4 text-sm text-destructive">Não foi possível consultar esta data: {erroMsg(error)}</p> : <div className={`mt-5 space-y-5 ${isFetching ? "opacity-50" : ""}`}>
            {setores.map(s => { const pct = progressoMeta(s.produzido, s.meta_diaria); return <div key={s.id} className={`dashboard-sector dashboard-sector-${s.ordem}`}>
              <div className="mb-2 flex items-center justify-between gap-2 text-sm"><strong>{s.nome}</strong><span className="shrink-0 font-semibold tabular">{pct === null ? "sem meta definida" : `${fmtNum(pct)}%`}</span></div>
              {pct !== null && <progress aria-label={`Meta de ${s.nome}`} className="dashboard-progress h-2.5 w-full" value={pct} max="100" />}
              <div className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground"><span>{fmtNum(s.produzido)} un produzidas</span>{s.meta_diaria !== null && s.meta_diaria > 0 && <span>Meta: {fmtNum(s.meta_diaria)} un</span>}</div>
              {setorId !== "todos" && <div className="mt-3 border-t pt-2">{s.maquinas.length ? s.maquinas.map(m => <div key={m.id} className="flex flex-wrap justify-between gap-1 py-1 text-xs"><span>{m.codigo} — {m.nome}</span><span className="tabular">{fmtNum(m.produzido)} boas · {fmtNum(m.perdido)} perdidas</span></div>) : <p className="text-xs text-muted-foreground">Nenhuma máquina vinculada.</p>}</div>}
            </div>; })}
          </div>}
        </section>
      </div>
    </div>
  </div>;
}
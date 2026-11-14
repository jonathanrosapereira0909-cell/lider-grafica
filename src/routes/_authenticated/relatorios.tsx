import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, selectCls } from "@/components/os-ui";
import { fmtData, fmtNum, hojeISO } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Lider Gráfica" }, { name: "description", content: "Relatórios de produção e perdas da Lider Gráfica por período e máquina." }, { property: "og:title", content: "Relatórios — Lider Gráfica" }, { property: "og:description", content: "Relatórios de produção e perdas da Lider Gráfica por período e máquina." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Relatorios,
});

function Relatorios() {
  const hoje = hojeISO();
  const [inicio, setInicio] = useState(hoje.slice(0, 8) + "01");
  const [fim, setFim] = useState(hoje);
  const [agrupar, setAgrupar] = useState("month");
  const { data, isLoading } = useQuery({
    queryKey: ["os", "relatorio-perdas", inicio, fim, agrupar],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("relatorio_perdas", { _inicio: inicio, _fim: fim, _agrupar: agrupar });
      if (error) throw error;
      return data;
    },
  });
  const tot = (data ?? []).reduce((a, r) => ({ p: a.p + Number(r.produzido), l: a.l + Number(r.perdido) }), { p: 0, l: 0 });
  return (
    <div>
      <PageHeader title="Relatórios" sub="Produção e perdas por período, máquina e motivo, a partir dos apontamentos." />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
          <Field label="De"><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
          <Field label="Até"><Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></Field>
          <Field label="Agrupar por">
            <select className={selectCls} value={agrupar} onChange={(e) => setAgrupar(e.target.value)}>
              <option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option><option value="year">Ano</option>
            </select>
          </Field>
          <div className="ml-auto self-end text-sm">
            Produzido <b className="font-mono">{fmtNum(tot.p)}</b> · Perdido <b className="font-mono text-destructive">{fmtNum(tot.l)}</b>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <table className="erp-grid w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>{["Período", "Máquina", "Motivo da perda", "Produzido", "Perdido", "Apontamentos"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
              {data?.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem apontamentos no período.</td></tr>}
              {data?.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="tabular px-4 py-2.5">{fmtData(r.periodo)}</td>
                  <td className="px-4 py-2.5">{r.maquina}</td>
                  <td className="px-4 py-2.5">{r.motivo}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmtNum(r.produzido)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{fmtNum(r.perdido)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{r.apontamentos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

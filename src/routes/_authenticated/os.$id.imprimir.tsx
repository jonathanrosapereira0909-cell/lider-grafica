import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, fmtData, fmtNum } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/os/$id/imprimir")({
  head: () => ({ meta: [{ title: "Imprimir OS — Lider Gráfica" }] }),
  component: Imprimir,
});

function Imprimir() {
  const { id } = Route.useParams();
  const { data: os } = useQuery({
    queryKey: ["os", "detalhe-print", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("os_lista").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  if (!os) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  const linhas: [string, string | null][] = [
    ["Cliente", `${os.cliente_codigo} — ${os.cliente_nome}`],
    ["Produto", `${os.produto_codigo} — ${os.produto_nome} (${os.produto_categoria})`],
    ["Material", os.material], ["Dimensão / modelo", os.dimensao_modelo], ["Acabamento", os.acabamento],
    ["Quantidade solicitada", fmtNum(os.quantidade_solicitada)],
    ["Data da OS", fmtData(os.data_os)], ["Prazo de entrega", fmtData(os.prazo_entrega)],
    ["Responsável", os.responsavel_nome], ["Situação", STATUS_LABEL[os.status!]],
    ["Descrição do serviço", os.descricao_servico], ["Observações", os.observacoes],
  ];
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="no-print mb-6 flex gap-2">
        <Button onClick={() => window.print()}>Imprimir</Button>
        <Button variant="outline" asChild><Link to="/os/$id" params={{ id }}>Voltar</Link></Button>
      </div>
      <div className="border-2 border-foreground bg-card p-8">
        <div className="cmyk-bar mb-4" />
        <div className="flex items-end justify-between border-b-2 border-foreground pb-3">
          <div className="font-display text-xl font-extrabold">Lider Gráfica — Ordem de Serviço</div>
          <div className="font-mono text-3xl font-bold">Nº {os.numero}</div>
        </div>
        <dl className="mt-4 divide-y text-sm">
          {linhas.map(([l, v]) => (
            <div key={l} className="grid grid-cols-3 gap-4 py-2">
              <dt className="font-medium text-muted-foreground">{l}</dt>
              <dd className="col-span-2 whitespace-pre-wrap">{v || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 text-sm font-medium">Apontamentos (máquina · início · fim · produzido · perdido · motivo)</div>
        <div className="mt-2 space-y-6">{[0, 1, 2, 3].map((i) => <div key={i} className="border-b border-dashed" />)}</div>
      </div>
    </div>
  );
}

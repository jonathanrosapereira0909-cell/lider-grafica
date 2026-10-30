import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OsForm, osToPayload, type OsFormValues } from "@/components/os-form";
import { PageHeader } from "@/components/os-ui";
import { useMe } from "@/hooks/use-me";
import { CONFLITO_MSG, erroMsg } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/os/$id/editar")({
  head: () => ({ meta: [{ title: "Alterar OS — Lider Gráfica" }] }),
  component: EditarOs,
});

function EditarOs() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data: os, isLoading } = useQuery({
    queryKey: ["os", "editar", id],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_servico").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !me) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  if (!os) return <p className="p-8">OS não encontrada.</p>;
  if (!me.isGestor) return <p className="p-8 text-muted-foreground">Somente o gestor pode alterar a OS.</p>;
  if (os.status === "finalizado" || os.status === "cancelado")
    return <p className="p-8 text-muted-foreground">OS {os.numero} está encerrada e não pode ser alterada.</p>;

  const initial: OsFormValues = {
    cliente_id: os.cliente_id, produto_id: os.produto_id, quantidade_solicitada: String(os.quantidade_solicitada),
    data_os: os.data_os, prazo_entrega: os.prazo_entrega ?? "", material: os.material ?? "",
    dimensao_modelo: os.dimensao_modelo ?? "", acabamento: os.acabamento ?? "",
    descricao_servico: os.descricao_servico ?? "", observacoes: os.observacoes ?? "",
    responsavel_id: os.responsavel_id ?? "", valor: os.valor != null ? String(os.valor) : "",
    numero_orcamento: os.numero_orcamento ?? "", posicao_atual: os.posicao_atual ?? "",
  };

  async function salvar(v: OsFormValues) {
    setSaving(true);
    const { data, error } = await supabase
      .from("ordens_servico").update(osToPayload(v)).eq("id", id).eq("version", os!.version).select("id");
    setSaving(false);
    if (error) { toast.error(erroMsg(error)); return; }
    if (!data.length) { toast.error(CONFLITO_MSG); return; }
    toast.success("OS alterada");
    qc.invalidateQueries({ queryKey: ["os"] });
    navigate({ to: "/os/$id", params: { id } });
  }

  return (
    <div>
      <PageHeader title={`Alterar OS ${os.numero}`} />
      <div className="max-w-5xl px-8 py-6">
        <OsForm initial={initial} onSubmit={salvar} submitLabel="Salvar alterações" saving={saving}
          keepClienteId={os.cliente_id} keepProdutoId={os.produto_id} />
      </div>
    </div>
  );
}

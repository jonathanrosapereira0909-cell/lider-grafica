import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OsForm, osFormVazio, osToPayload, type OsFormValues } from "@/components/os-form";
import { PageHeader } from "@/components/os-ui";
import { useMe } from "@/hooks/use-me";
import { erroMsg, hojeISO } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/os/nova")({
  validateSearch: (s: Record<string, unknown>) => ({ de: typeof s.de === "string" ? s.de : undefined }),
  head: () => ({ meta: [{ title: "Nova OS — Lider Gráfica" }] }),
  component: NovaOs,
});

function NovaOs() {
  const { de } = Route.useSearch();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: origem, isLoading } = useQuery({
    queryKey: ["os", "duplicar", de],
    enabled: !!de,
    queryFn: async () => {
      const { data, error } = await supabase.from("ordens_servico").select("*").eq("id", de!).single();
      if (error) throw error;
      return data;
    },
  });

  if (!me) return null;
  if (!me.isGestor) return <p className="p-8 text-muted-foreground">Somente o gestor pode criar OS.</p>;
  if (de && isLoading) return <p className="p-8 text-muted-foreground">Carregando…</p>;

  const initial: OsFormValues = origem
    ? {
        cliente_id: origem.cliente_id, produto_id: origem.produto_id,
        quantidade_solicitada: String(origem.quantidade_solicitada), data_os: hojeISO(), prazo_entrega: "",
        material: origem.material ?? "", dimensao_modelo: origem.dimensao_modelo ?? "", acabamento: origem.acabamento ?? "",
        descricao_servico: origem.descricao_servico ?? "", observacoes: origem.observacoes ?? "",
        responsavel_id: origem.responsavel_id ?? me.id, valor: origem.valor != null ? String(origem.valor) : "",
        numero_orcamento: origem.numero_orcamento ?? "", posicao_atual: "",
      }
    : osFormVazio(me.id);

  async function salvar(v: OsFormValues) {
    setSaving(true);
    const { data, error } = await supabase.from("ordens_servico").insert(osToPayload(v)).select("id, numero").single();
    setSaving(false);
    if (error) return toast.error(erroMsg(error));
    toast.success(`OS ${data.numero} criada`);
    qc.invalidateQueries({ queryKey: ["os"] });
    navigate({ to: "/os/$id", params: { id: data.id } });
  }

  return (
    <div>
      <PageHeader
        title={origem ? `Nova OS (cópia da OS ${origem.numero})` : "Nova OS"}
        sub="O número será gerado automaticamente ao salvar."
      />
      <div className="max-w-5xl px-8 py-6">
        <OsForm initial={initial} onSubmit={salvar} submitLabel="Criar OS" saving={saving} />
      </div>
    </div>
  );
}

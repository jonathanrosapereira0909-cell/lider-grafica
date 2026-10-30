import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, selectCls } from "@/components/os-ui";
import { useMaquinas, useMotivos } from "@/lib/queries";
import { CONFLITO_MSG, erroMsg, toLocalInput } from "@/lib/os";

export function ApontamentoDialog({
  open, onOpenChange, osId, apontamento,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  osId: string;
  apontamento?: Tables<"apontamentos"> | null;
}) {
  const qc = useQueryClient();
  const { data: maquinas } = useMaquinas();
  const { data: motivos } = useMotivos();
  const [saving, setSaving] = useState(false);
  const vazio = { maquina_id: "", inicio: "", fim: "", qtd_produzida: "", qtd_perdida: "0", motivo_perda_id: "", observacoes: "" };
  const [v, setV] = useState(vazio);

  useEffect(() => {
    if (!open) return;
    const a = apontamento;
    setV(a ? {
      maquina_id: a.maquina_id, inicio: toLocalInput(a.inicio), fim: toLocalInput(a.fim),
      qtd_produzida: String(a.qtd_produzida), qtd_perdida: String(a.qtd_perdida),
      motivo_perda_id: a.motivo_perda_id ?? "", observacoes: a.observacoes ?? "",
    } : vazio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apontamento]);

  const perda = Number(v.qtd_perdida || 0);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (perda > 0 && !v.motivo_perda_id) { toast.error("Informe o motivo da perda"); return; }
    if (v.fim && v.fim < v.inicio) { toast.error("O fim deve ser depois do início"); return; }
    setSaving(true);
    const payload = {
      maquina_id: v.maquina_id,
      inicio: new Date(v.inicio).toISOString(),
      fim: v.fim ? new Date(v.fim).toISOString() : null,
      qtd_produzida: Number(v.qtd_produzida || 0),
      qtd_perdida: perda,
      motivo_perda_id: perda > 0 ? v.motivo_perda_id : null,
      observacoes: v.observacoes.trim() || null,
    };
    try {
      if (apontamento) {
        const { data, error } = await supabase.from("apontamentos").update(payload)
          .eq("id", apontamento.id).eq("version", apontamento.version).select("id");
        if (error) throw error;
        if (!data.length) throw new Error(CONFLITO_MSG);
      } else {
        // usuario_id is set by the database from the signed-in user
        const { error } = await supabase.from("apontamentos").insert({ ...payload, os_id: osId } as never);
        if (error) throw error;
      }
      toast.success("Apontamento salvo");
      qc.invalidateQueries({ queryKey: ["os"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(erroMsg(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{apontamento ? "Alterar apontamento" : "Registrar produção"}</DialogTitle></DialogHeader>
        <form id="apont-form" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Máquina *" className="sm:col-span-2">
            <select required className={selectCls} value={v.maquina_id} onChange={(e) => setV({ ...v, maquina_id: e.target.value })}>
              <option value="">Selecione…</option>
              {maquinas?.filter((m) => m.ativo).map((m) => <option key={m.id} value={m.id}>{m.codigo} — {m.nome}</option>)}
            </select>
          </Field>
          <Field label="Início *"><Input required type="datetime-local" value={v.inicio} onChange={(e) => setV({ ...v, inicio: e.target.value })} /></Field>
          <Field label="Fim"><Input type="datetime-local" value={v.fim} onChange={(e) => setV({ ...v, fim: e.target.value })} /></Field>
          <Field label="Qtd. produzida (boas) *"><Input required type="number" min="0" step="any" value={v.qtd_produzida} onChange={(e) => setV({ ...v, qtd_produzida: e.target.value })} /></Field>
          <Field label="Qtd. perdida"><Input type="number" min="0" step="any" value={v.qtd_perdida} onChange={(e) => setV({ ...v, qtd_perdida: e.target.value })} /></Field>
          {perda > 0 && (
            <Field label="Motivo da perda *" className="sm:col-span-2">
              <select required className={selectCls} value={v.motivo_perda_id} onChange={(e) => setV({ ...v, motivo_perda_id: e.target.value })}>
                <option value="">Selecione…</option>
                {motivos?.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </Field>
          )}
          <Field label="Observações da produção" className="sm:col-span-2">
            <Textarea rows={2} value={v.observacoes} onChange={(e) => setV({ ...v, observacoes: e.target.value })} />
          </Field>
        </form>
        <DialogFooter><Button form="apont-form" disabled={saving}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

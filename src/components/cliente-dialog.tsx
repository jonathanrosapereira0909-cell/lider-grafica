import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, selectCls } from "@/components/os-ui";
import { CONFLITO_MSG, erroMsg } from "@/lib/os";

export function ClienteDialog({
  open, onOpenChange, cliente, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cliente?: Tables<"clientes"> | null;
  onSaved?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [v, setV] = useState({ codigo: "", nome: "", tipo: "PJ", telefone: "", ativo: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open)
      setV(cliente
        ? { codigo: cliente.codigo, nome: cliente.nome, tipo: cliente.tipo, telefone: cliente.telefone ?? "", ativo: cliente.ativo }
        : { codigo: "", nome: "", tipo: "PJ", telefone: "", ativo: true });
  }, [open, cliente]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { codigo: v.codigo.trim(), nome: v.nome.trim(), tipo: v.tipo, telefone: v.telefone.trim() || null, ativo: v.ativo };
    try {
      if (cliente) {
        const { data, error } = await supabase.from("clientes").update(payload).eq("id", cliente.id).eq("version", cliente.version).select("id");
        if (error) throw error;
        if (!data.length) throw new Error(CONFLITO_MSG);
        onSaved?.(cliente.id);
      } else {
        const { data, error } = await supabase.from("clientes").insert(payload).select("id").single();
        if (error) throw error;
        onSaved?.(data.id);
      }
      toast.success("Cliente salvo");
      qc.invalidateQueries({ queryKey: ["clientes"] });
      onOpenChange(false);
    } catch (err) {
      const m = erroMsg(err);
      toast.error(m.includes("duplicate") ? "Já existe um cliente com este código" : m);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{cliente ? "Alterar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
        <form id="cliente-form" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Código *"><Input required value={v.codigo} onChange={(e) => setV({ ...v, codigo: e.target.value })} /></Field>
          <Field label="Tipo *">
            <select className={selectCls} value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value })}>
              <option value="PJ">PJ</option><option value="PF">PF</option>
            </select>
          </Field>
          <Field label="Nome / razão social *" className="sm:col-span-2"><Input required value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={v.telefone} onChange={(e) => setV({ ...v, telefone: e.target.value })} /></Field>
          {cliente && (
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={v.ativo} onChange={(e) => setV({ ...v, ativo: e.target.checked })} /> Ativo
            </label>
          )}
        </form>
        <DialogFooter><Button form="cliente-form" disabled={saving}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

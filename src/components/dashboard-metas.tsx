import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { erroMsg, CONFLITO_MSG } from "@/lib/os";
import type { SetorDashboard } from "@/lib/dashboard";

export function DashboardMetas({ setores }: { setores: SetorDashboard[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [originais, setOriginais] = useState<Record<string, number | null>>({});
  const qc = useQueryClient();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      for (const setor of setores) {
        const valor = valores[setor.id] ?? "";
        const meta = valor.trim() === "" ? null : Number(valor);
        if (meta !== null && (!Number.isFinite(meta) || meta < 0)) throw new Error("A meta deve ser maior ou igual a zero.");
        const original = originais[setor.id] ?? null;
        if (meta === original) continue;
        let q = supabase.from("setores").update({ meta_diaria: meta }).eq("id", setor.id);
        q = original === null ? q.is("meta_diaria", null) : q.eq("meta_diaria", original);
        const { data, error } = await q.select("id");
        if (error) throw error;
        if (!data?.length) throw new Error(CONFLITO_MSG);
      }
      toast.success("Metas diárias atualizadas.");
      setOpen(false);
    } catch (error) {
      toast.error(erroMsg(error));
    } finally {
      await qc.invalidateQueries({ queryKey: ["os", "dashboard"] });
      setSaving(false);
    }
  }

  return <>
    <Button variant="outline" size="sm" onClick={() => {
      setValores(Object.fromEntries(setores.map(s => [s.id, s.meta_diaria === null ? "" : String(s.meta_diaria)])));
      setOriginais(Object.fromEntries(setores.map(s => [s.id, s.meta_diaria])));
      setOpen(true);
    }}><Target className="size-4" />Metas diárias</Button>
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Metas diárias</DialogTitle>
        <DialogDescription>Quantidade por setor · Lider Gráfica</DialogDescription>
        <form onSubmit={salvar} className="space-y-4">
          {setores.map(s => <div key={s.id} className="space-y-1.5">
            <label htmlFor={`meta-${s.id}`} className="text-sm font-medium">{s.nome}</label>
            <Input id={`meta-${s.id}`} type="number" min="0" step="any" placeholder="Sem meta definida" disabled={saving} value={valores[s.id] ?? ""} onChange={e => setValores(v => ({ ...v, [s.id]: e.target.value }))} />
          </div>)}
          <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={saving}>{saving ? "Salvando…" : "Salvar metas"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
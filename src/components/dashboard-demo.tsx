import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { erroMsg } from "@/lib/os";

export function DashboardDemo() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  async function remover() {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("remover_dados_demo");
      if (error) throw error;
      await qc.invalidateQueries();
      setOpen(false);
      toast.success("Dados de demonstração removidos. Os registros reais foram preservados.");
    } catch (error) { toast.error(erroMsg(error)); }
    finally { setSaving(false); }
  }
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Trash2 className="size-4" />Remover dados de demonstração</Button>
    <AlertDialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogTitle>Remover dados de demonstração?</AlertDialogTitle>
        <AlertDialogDescription>Clientes, produtos, pedidos, orçamentos, OS e apontamentos identificados como DEMO serão apagados. As metas demonstrativas ainda inalteradas serão removidas e a numeração continuará após o último registro real. Esta ação não pode ser desfeita.</AlertDialogDescription>
        <AlertDialogFooter><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={saving} onClick={remover}>{saving ? "Removendo…" : "Confirmar remoção"}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
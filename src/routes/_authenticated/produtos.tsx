import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, PageHeader, selectCls } from "@/components/os-ui";
import { useCategorias, useProdutos } from "@/lib/queries";
import { useMe } from "@/hooks/use-me";
import { CONFLITO_MSG, erroMsg } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Lider Gráfica" }] }),
  component: Produtos,
});

type Produto = NonNullable<ReturnType<typeof useProdutos>["data"]>[number];

function Produtos() {
  const { data: me } = useMe();
  const { data } = useProdutos();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Produto | null>(null);
  const lista = data?.filter((p) => `${p.codigo} ${p.nome} ${p.categoria?.nome}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Produtos" sub="Alterar um produto não muda as OS já criadas."
        actions={me?.isGestor && <Button onClick={() => { setSel(null); setOpen(true); }}><Plus /> Novo produto</Button>} />
      <div className="space-y-4 px-8 py-6">
        <Input className="max-w-sm" placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <table className="erp-grid w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>{["Código", "Nome / descrição", "Categoria", "Material", "Dimensão / modelo", "Acabamento", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {lista?.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum produto.</td></tr>}
              {lista?.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2.5 font-mono">{p.codigo}</td>
                  <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                  <td className="px-4 py-2.5">{p.categoria?.nome}</td>
                  <td className="px-4 py-2.5">{p.material || "—"}</td>
                  <td className="px-4 py-2.5">{p.especificacao || "—"}</td>
                  <td className="px-4 py-2.5">{p.acabamento || "—"}</td>
                  <td className="px-4 py-2.5">{p.ativo ? <span className="text-success">Ativo</span> : <span className="text-muted-foreground">Inativo</span>}</td>
                  <td className="px-4 py-2.5 text-right">{me?.isGestor && <Button size="sm" variant="ghost" onClick={() => { setSel(p); setOpen(true); }}>Alterar</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ProdutoDialog open={open} onOpenChange={setOpen} produto={sel} />
    </div>
  );
}

function ProdutoDialog({ open, onOpenChange, produto }: { open: boolean; onOpenChange: (o: boolean) => void; produto: Produto | null }) {
  const qc = useQueryClient();
  const { data: cats } = useCategorias();
  const vazio = { codigo: "", nome: "", categoria_id: "", material: "", especificacao: "", acabamento: "", ativo: true };
  const [v, setV] = useState(vazio);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setV(produto ? {
      codigo: produto.codigo, nome: produto.nome, categoria_id: produto.categoria_id, material: produto.material ?? "",
      especificacao: produto.especificacao ?? "", acabamento: produto.acabamento ?? "", ativo: produto.ativo,
    } : vazio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, produto]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const n = (s: string) => s.trim() || null;
    const payload = { codigo: v.codigo.trim(), nome: v.nome.trim(), categoria_id: v.categoria_id, material: n(v.material),
      especificacao: n(v.especificacao), acabamento: n(v.acabamento), ativo: v.ativo };
    try {
      if (produto) {
        const { data, error } = await supabase.from("produtos").update(payload).eq("id", produto.id).eq("version", produto.version).select("id");
        if (error) throw error;
        if (!data.length) throw new Error(CONFLITO_MSG);
      } else {
        const { error } = await supabase.from("produtos").insert(payload);
        if (error) throw error;
      }
      toast.success("Produto salvo");
      qc.invalidateQueries({ queryKey: ["produtos"] });
      onOpenChange(false);
    } catch (err) {
      const m = erroMsg(err);
      toast.error(m.includes("duplicate") ? "Já existe um produto com este código" : m);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{produto ? "Alterar produto" : "Novo produto"}</DialogTitle></DialogHeader>
        <form id="prod-form" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
          <Field label="Código *"><Input required value={v.codigo} onChange={(e) => setV({ ...v, codigo: e.target.value })} /></Field>
          <Field label="Categoria *">
            <select required className={selectCls} value={v.categoria_id} onChange={(e) => setV({ ...v, categoria_id: e.target.value })}>
              <option value="">Selecione…</option>
              {cats?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <Field label="Nome / descrição *" className="sm:col-span-2"><Input required value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></Field>
          <Field label="Material"><Input value={v.material} onChange={(e) => setV({ ...v, material: e.target.value })} /></Field>
          <Field label="Dimensão / modelo / especificação"><Input value={v.especificacao} onChange={(e) => setV({ ...v, especificacao: e.target.value })} /></Field>
          <Field label="Acabamento"><Input value={v.acabamento} onChange={(e) => setV({ ...v, acabamento: e.target.value })} /></Field>
          {produto && <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={v.ativo} onChange={(e) => setV({ ...v, ativo: e.target.checked })} /> Ativo</label>}
        </form>
        <DialogFooter><Button form="prod-form" disabled={saving}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

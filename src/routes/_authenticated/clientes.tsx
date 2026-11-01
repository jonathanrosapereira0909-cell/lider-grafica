import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/os-ui";
import { ClienteDialog } from "@/components/cliente-dialog";
import { useClientes } from "@/lib/queries";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Lider Gráfica" }] }),
  component: Clientes,
});

function Clientes() {
  const { data: me } = useMe();
  const { data } = useClientes();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Tables<"clientes"> | null>(null);
  const lista = data?.filter((c) => `${c.codigo} ${c.nome} ${c.telefone ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Clientes" sub="Clientes inativos não aparecem para novas OS, mas permanecem no histórico."
        actions={me?.isGestor && <Button onClick={() => { setSel(null); setOpen(true); }}><Plus /> Novo cliente</Button>} />
      <div className="space-y-4 px-8 py-6">
        <Input className="max-w-sm" placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <table className="erp-grid w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>{["Código", "Nome / razão social", "Tipo", "Telefone", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {lista?.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum cliente.</td></tr>}
              {lista?.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2.5 font-mono">{c.codigo}</td>
                  <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                  <td className="px-4 py-2.5">{c.tipo}</td>
                  <td className="px-4 py-2.5">{c.telefone || "—"}</td>
                  <td className="px-4 py-2.5">{c.ativo ? <span className="text-success">Ativo</span> : <span className="text-muted-foreground">Inativo</span>}</td>
                  <td className="px-4 py-2.5 text-right">
                    {me?.isGestor && <Button size="sm" variant="ghost" onClick={() => { setSel(c); setOpen(true); }}>Alterar</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ClienteDialog open={open} onOpenChange={setOpen} cliente={sel} />
    </div>
  );
}

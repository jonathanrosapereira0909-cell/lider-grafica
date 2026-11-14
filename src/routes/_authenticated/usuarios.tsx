import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, selectCls } from "@/components/os-ui";
import { useUsuarios } from "@/lib/queries";
import { useMe } from "@/hooks/use-me";
import { erroMsg, type AppRole } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Lider Gráfica" }, { name: "description", content: "Gestão dos acessos e funções da equipe da Lider Gráfica." }, { property: "og:title", content: "Usuários — Lider Gráfica" }, { property: "og:description", content: "Gestão dos acessos e funções da equipe da Lider Gráfica." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Usuarios,
});

function Usuarios() {
  const { data: me } = useMe();
  const { data } = useUsuarios();
  const qc = useQueryClient();
  if (!me?.isGestor) return <p className="p-8 text-muted-foreground">Somente o gestor gerencia usuários.</p>;

  async function definir(uid: string, role: string) {
    const { error } = await supabase.rpc("definir_papel", { _user_id: uid, _role: (role || null) as AppRole });
    if (error) { toast.error(erroMsg(error)); return; }
    toast.success("Acesso atualizado");
    qc.invalidateQueries({ queryKey: ["usuarios"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div>
      <PageHeader title="Usuários" sub="Novas contas ficam sem acesso até o gestor definir o perfil." />
      <div className="px-8 py-6">
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <table className="erp-grid w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>{["Nome", "E-mail", "Perfil"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{u.nome}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="w-56 px-4 py-2.5">
                    <select className={selectCls} value={u.role ?? ""} onChange={(e) => definir(u.id, e.target.value)}>
                      <option value="">Sem acesso</option>
                      <option value="producao">Produção</option>
                      <option value="gestor">Gestor</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

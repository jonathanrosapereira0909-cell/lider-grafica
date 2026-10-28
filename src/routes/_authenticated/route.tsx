import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Users, Package, UserCog, BarChart3, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { useRealtimeSync } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

function Layout() {
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  useRealtimeSync();

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) return <div className="p-10 text-muted-foreground">Carregando…</div>;

  if (me && !me.isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
          <h1 className="text-xl font-bold">Acesso aguardando liberação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ({me.email}) foi criada. Peça ao gestor para liberar seu acesso em Usuários.
          </p>
          <Button variant="outline" className="mt-6" onClick={sair}>Sair</Button>
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/os", label: "Ordens de serviço", icon: ClipboardList },
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/produtos", label: "Produtos", icon: Package },
    { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ...(me?.isGestor ? [{ to: "/usuarios", label: "Usuários", icon: UserCog }] : []),
  ] as const;

  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="cmyk-bar" />
        <div className="px-5 py-5">
          <div className="font-display text-lg font-extrabold text-sidebar-accent-foreground">Lider Gráfica</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-primary">OS · Produção</div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs">
          <div className="truncate font-medium text-sidebar-accent-foreground">{me?.nome}</div>
          <div className="mt-0.5 font-mono uppercase text-sidebar-primary">{me?.isGestor ? "Gestor" : "Produção"}</div>
          <button onClick={sair} className="mt-3 flex items-center gap-2 hover:text-sidebar-accent-foreground">
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

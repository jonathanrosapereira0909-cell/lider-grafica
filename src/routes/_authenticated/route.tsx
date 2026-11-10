import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Users, Package, UserCog, BarChart3, LogOut, FilePlus2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { useRealtimeSync } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import {
  Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger,
} from "@/components/ui/menubar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    // Login desativado temporariamente: entra automaticamente como Gestor.
    if (!data.user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    }
  },
  component: Layout,
});

const ABAS: { prefix: string; label: string; icon: typeof ClipboardList }[] = [
  { prefix: "/os", label: "OS", icon: ClipboardList },
  { prefix: "/clientes", label: "Clientes", icon: Users },
  { prefix: "/produtos", label: "Produtos", icon: Package },
  { prefix: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { prefix: "/usuarios", label: "Usuários", icon: UserCog },
];

function Layout() {
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
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

  const g = !!me?.isGestor;
  const aba = ABAS.find((a) => pathname.startsWith(a.prefix)) ?? ABAS[0]!;

  const tools = [
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/produtos", label: "Produtos", icon: Package },
    "sep",
    { to: "/os", label: "OS", icon: ClipboardList },
    ...(g ? [{ to: "/os/nova", label: "Nova OS", icon: FilePlus2 }] : []),
    "sep",
    { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ...(g ? ["sep" as const, { to: "/usuarios", label: "Usuários", icon: UserCog }] : []),
  ] as const;

  return (
    <div className="flex h-screen flex-col bg-background print:h-auto">
      <header className="no-print shrink-0 border-b border-chrome-border bg-chrome">
        {/* menu bar */}
        <div className="flex items-center justify-between pr-3">
          <Menubar className="h-7 rounded-none border-0 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="px-2 py-0.5 text-sm font-normal">Cadastros</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => navigate({ to: "/clientes" })}>Clientes</MenubarItem>
                <MenubarItem onClick={() => navigate({ to: "/produtos" })}>Produtos e máquinas</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-2 py-0.5 text-sm font-normal">Produção</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => navigate({ to: "/os" })}>Ordens de serviço</MenubarItem>
                {g && <MenubarItem onClick={() => navigate({ to: "/os/nova" })}>Incluir OS</MenubarItem>}
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-2 py-0.5 text-sm font-normal">Relatórios</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => navigate({ to: "/relatorios" })}>Produção e perdas</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            {g && (
              <MenubarMenu>
                <MenubarTrigger className="px-2 py-0.5 text-sm font-normal">Usuários</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => navigate({ to: "/usuarios" })}>Acessos e funções</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            )}
            <MenubarMenu>
              <MenubarTrigger className="px-2 py-0.5 text-sm font-normal">Conta</MenubarTrigger>
              <MenubarContent>
                <MenubarItem disabled>{me?.nome} · {g ? "Gestor" : "Produção"}</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={sair}><LogOut className="size-4" /> Sair</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="font-display font-extrabold text-foreground">Lider Gráfica</span>
            <span className="truncate">· {me?.nome}</span>
          </div>
        </div>

        {/* icon toolbar */}
        <div className="flex items-stretch gap-0.5 overflow-x-auto border-t border-chrome-border bg-chrome px-1 py-1">
          {tools.map((t, i) =>
            t === "sep" ? (
              <div key={`s${i}`} className="mx-1 w-px shrink-0 bg-chrome-border" />
            ) : (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: t.to === "/os/nova" }}
                className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-sm border border-transparent px-1 py-1 text-[11px] text-foreground hover:border-chrome-border hover:bg-chrome-hover"
              >
                <t.icon className="size-6 text-primary" strokeWidth={1.5} />
                {t.label}
              </Link>
            ),
          )}
          <div className="flex-1" />
          <button
            onClick={sair}
            className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-sm border border-transparent px-1 py-1 text-[11px] hover:border-chrome-border hover:bg-chrome-hover"
          >
            <LogOut className="size-6 text-destructive" strokeWidth={1.5} />
            Sair
          </button>
        </div>

        {/* open tab */}
        <div className="flex items-end bg-chrome-strong px-1 pt-1">
          <div className="flex items-center gap-2 rounded-t-sm border border-b-0 border-chrome-border bg-tab-active px-3 py-1 text-sm">
            <aba.icon className="size-4 text-primary" />
            {aba.label}
            <Link to="/os" className="ml-3 text-muted-foreground hover:text-foreground" aria-label="Fechar aba">
              <X className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="min-h-0 min-w-0 flex-1 overflow-auto print:overflow-visible">
        <Outlet />
      </main>
    </div>
  );
}

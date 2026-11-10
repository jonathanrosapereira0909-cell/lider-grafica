import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lider Gráfica — Sistema de OS e Produção" },
      { name: "description", content: "Acesso interno: ordens de serviço, produção, perdas e expedição." },
      { property: "og:title", content: "Lider Gráfica — Sistema de OS e Produção" },
      { property: "og:description", content: "Acesso interno: ordens de serviço, produção, perdas e expedição." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/os" }); },
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-ink-foreground">
      <div className="cmyk-bar" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-sidebar-primary">Sistema interno</p>
        <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] md:text-7xl">
          Lider Gráfica
        </h1>
        <p className="mt-6 max-w-xl text-lg text-sidebar-foreground">
          Ordens de serviço, apontamentos de produção, perdas e expedição — num só lugar, para toda a equipe.
        </p>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link to="/auth">Entrar no sistema</Link>
          </Button>
        </div>
        <div className="mt-20 grid max-w-2xl grid-cols-4 gap-px font-mono text-xs text-sidebar-foreground">
          {["OS", "Produção", "Perdas", "Entrega"].map((t, i) => (
            <div key={t} className="border-t border-sidebar-border pt-3">
              <span className="text-sidebar-primary">0{i + 1}</span> {t}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

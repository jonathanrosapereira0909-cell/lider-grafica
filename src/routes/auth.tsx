import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { erroMsg } from "@/lib/os";

export const Route = createFileRoute("/auth")({
  beforeLoad: () => { throw redirect({ to: "/os" }); }, // login desativado temporariamente
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Lider Gráfica" },
      { name: "description", content: "Acesso ao sistema interno da Lider Gráfica." },
      { property: "og:title", content: "Entrar — Lider Gráfica" },
      { property: "og:description", content: "Acesso ao sistema interno da Lider Gráfica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/os", replace: true });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) { toast.error("E-mail ou senha inválidos"); return; }
    navigate({ to: "/os", replace: true });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: window.location.origin + "/os", data: { nome } },
    });
    setLoading(false);
    if (error) { toast.error(erroMsg(error)); return; }
    if (!data.session) toast.success("Confira seu e-mail para confirmar o cadastro.");
    else navigate({ to: "/os", replace: true });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) { toast.error("Não foi possível entrar com Google"); return; }
    if (r.redirected) return;
    navigate({ to: "/os", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="cmyk-bar" />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">Lider Gráfica</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse o sistema interno.</p>
          <Tabs defaultValue="entrar" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar">Criar acesso</TabsTrigger>
            </TabsList>
            <TabsContent value="entrar">
              <form onSubmit={entrar} className="mt-4 space-y-4">
                <Campo label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Campo>
                <Campo label="Senha"><Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></Campo>
                <Button className="w-full" disabled={loading}>Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="cadastrar">
              <form onSubmit={cadastrar} className="mt-4 space-y-4">
                <Campo label="Nome"><Input required value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
                <Campo label="E-mail"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Campo>
                <Campo label="Senha"><Input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} /></Campo>
                <p className="text-xs text-muted-foreground">Após o cadastro, o gestor precisa liberar seu acesso.</p>
                <Button className="w-full" disabled={loading}>Criar acesso</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

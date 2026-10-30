import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Pencil, Printer, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, PageHeader, PrazoBadge, StatusBadge } from "@/components/os-ui";
import { ApontamentoDialog } from "@/components/apontamento-dialog";
import { useMe } from "@/hooks/use-me";
import { useMaquinas, useMotivos, useUsuarios } from "@/lib/queries";
import { consolidar, erroMsg, fmtBRL, fmtData, fmtDataHora, fmtNum, toLocalInput } from "@/lib/os";

export const Route = createFileRoute("/_authenticated/os/$id/")({
  head: () => ({ meta: [{ title: "OS — Lider Gráfica" }] }),
  component: OsDetalhe,
});

function OsDetalhe() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: maquinas } = useMaquinas();
  const { data: motivos } = useMotivos();
  const { data: usuarios } = useUsuarios();
  const nomeUsuario = (uid: string | null) => usuarios?.find((u) => u.id === uid)?.nome ?? "—";

  const { data, isLoading } = useQuery({
    queryKey: ["os", "detalhe", id],
    queryFn: async () => {
      const [os, ap, hist] = await Promise.all([
        supabase.from("os_lista").select("*").eq("id", id).single(),
        supabase.from("apontamentos").select("*").eq("os_id", id).order("inicio"),
        supabase.from("audit_log").select("*").in("tabela", ["ordens_servico", "apontamentos"])
          .or(`registro_id.eq.${id},depois->>os_id.eq.${id}`).order("em", { ascending: false }).limit(100),
      ]);
      if (os.error) throw os.error;
      return { os: os.data, apontamentos: ap.data ?? [], historico: hist.data ?? [] };
    },
  });

  const [apontOpen, setApontOpen] = useState(false);
  const [apontEdit, setApontEdit] = useState<Tables<"apontamentos"> | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [expedirOpen, setExpedirOpen] = useState(false);

  if (isLoading || !me) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  if (!data) return <p className="p-8">OS não encontrada.</p>;
  const { os, apontamentos, historico } = data;
  const st = os.status!;
  const tot = consolidar(apontamentos);
  const g = me.isGestor;

  async function rpc(fn: string, args: Record<string, unknown>, ok: string) {
    const { error } = await supabase.rpc(fn as never, args as never);
    if (error) { toast.error(erroMsg(error)); return; }
    toast.success(ok);
    qc.invalidateQueries({ queryKey: ["os"] });
  }

  const podeApontar = st === "aguardando_producao" || st === "em_producao";
  const podeEditarApont = podeApontar || st === "producao_finalizada";
  const encerrada = st === "finalizado" || st === "cancelado";

  return (
    <div>
      <PageHeader
        title={`OS ${os.numero}`}
        sub={<span className="flex items-center gap-2"><StatusBadge status={st} /> <PrazoBadge prazo={os.prazo_entrega} status={st} /> {os.cliente_nome}</span>}
        actions={
          <>
            {g && !encerrada && <Button variant="outline" asChild><Link to="/os/$id/editar" params={{ id }}><Pencil /> Alterar</Link></Button>}
            {g && <Button variant="outline" asChild><Link to="/os/nova" search={{ de: id }}><Copy /> Duplicar</Link></Button>}
            <Button variant="outline" asChild><Link to="/os/$id/imprimir" params={{ id }}><Printer /> Imprimir OS</Link></Button>
            {g && !encerrada && <Button variant="destructive" onClick={() => setCancelOpen(true)}>Cancelar</Button>}
          </>
        }
      />

      <div className="grid gap-6 px-8 py-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Fluxo */}
          {!encerrada && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4 shadow-card">
              <span className="mr-2 text-sm font-medium">Próximo passo:</span>
              {podeApontar && <Button onClick={() => { setApontEdit(null); setApontOpen(true); }}><Plus /> Registrar produção</Button>}
              {st === "em_producao" && <Button variant="secondary" onClick={() => rpc("os_finalizar_producao", { _id: id }, "Produção finalizada")}>Finalizar produção</Button>}
              {st === "producao_finalizada" && g && <Button onClick={() => rpc("os_faturar", { _id: id }, "OS faturada")}>Faturar ({fmtNum(tot.produzido)} un.)</Button>}
              {st === "producao_finalizada" && !g && <span className="text-sm text-muted-foreground">Aguardando faturamento pelo gestor.</span>}
              {st === "faturado" && <Button onClick={() => rpc("os_liberar_entrega", { _id: id }, "Aguardando entrega ou coleta")}>Liberar para entrega/coleta</Button>}
              {st === "aguardando_entrega" && <Button onClick={() => setExpedirOpen(true)}>Expedir</Button>}
              {st === "entregue" && g && <Button onClick={() => rpc("os_baixar", { _id: id }, "OS baixada e finalizada")}>Baixar OS</Button>}
              {st === "entregue" && !g && <span className="text-sm text-muted-foreground">Aguardando baixa pelo gestor.</span>}
            </div>
          )}
          {st === "cancelado" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <b>Cancelada</b> em {fmtDataHora(os.cancelado_em)} por {nomeUsuario(os.cancelado_por)}. Motivo: {os.motivo_cancelamento}
            </div>
          )}

          <section className="grid gap-x-6 gap-y-3 rounded-lg border bg-card p-6 text-sm shadow-card sm:grid-cols-3">
            <Info l="Cliente" v={`${os.cliente_codigo} — ${os.cliente_nome}`} />
            <Info l="Produto" v={`${os.produto_codigo} — ${os.produto_nome}`} />
            <Info l="Categoria" v={os.produto_categoria} />
            <Info l="Material" v={os.material} />
            <Info l="Dimensão / modelo" v={os.dimensao_modelo} />
            <Info l="Acabamento" v={os.acabamento} />
            <Info l="Data da OS" v={fmtData(os.data_os)} />
            <Info l="Prazo" v={fmtData(os.prazo_entrega)} />
            <Info l="Responsável" v={os.responsavel_nome} />
            <Info l="Valor" v={fmtBRL(os.valor)} />
            <Info l="Nº orçamento" v={os.numero_orcamento} />
            <Info l="Posição atual" v={os.posicao_atual} />
            <Info l="Descrição do serviço" v={os.descricao_servico} wide />
            <Info l="Observações" v={os.observacoes} wide />
          </section>

          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border shadow-card sm:grid-cols-4">
            <Kpi l="Solicitado" v={fmtNum(os.quantidade_solicitada)} />
            <Kpi l="Produzido (boas)" v={fmtNum(tot.produzido)} />
            <Kpi l="Perdido" v={fmtNum(tot.perdido)} />
            <Kpi l="Faturado" v={fmtNum(os.quantidade_faturada)} />
          </section>

          <section className="rounded-lg border bg-card shadow-card">
            <h2 className="border-b px-6 py-3 font-semibold">Apontamentos de produção</h2>
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>{["Máquina", "Início", "Fim", "Produzido", "Perdido", "Motivo", "Usuário", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {apontamentos.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhum apontamento.</td></tr>}
                {apontamentos.map((a) => (
                  <tr key={a.id} className="border-t align-top">
                    <td className="px-3 py-2 font-mono">{maquinas?.find((m) => m.id === a.maquina_id)?.codigo}</td>
                    <td className="tabular px-3 py-2">{fmtDataHora(a.inicio)}</td>
                    <td className="tabular px-3 py-2">{fmtDataHora(a.fim)}</td>
                    <td className="tabular px-3 py-2 text-right">{fmtNum(a.qtd_produzida)}</td>
                    <td className="tabular px-3 py-2 text-right">{fmtNum(a.qtd_perdida)}</td>
                    <td className="px-3 py-2">{motivos?.find((m) => m.id === a.motivo_perda_id)?.nome ?? "—"}</td>
                    <td className="px-3 py-2">{nomeUsuario(a.usuario_id)}{a.observacoes && <div className="text-xs text-muted-foreground">{a.observacoes}</div>}</td>
                    <td className="px-3 py-2">
                      {podeEditarApont && (a.usuario_id === me.id || g) && (
                        <Button size="sm" variant="ghost" onClick={() => { setApontEdit(a); setApontOpen(true); }}>Alterar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {(os.data_entrega || os.faturado_em) && (
            <section className="grid gap-3 rounded-lg border bg-card p-6 text-sm shadow-card sm:grid-cols-3">
              <Info l="Faturado em" v={fmtDataHora(os.faturado_em)} />
              <Info l="Faturado por" v={os.faturado_por ? nomeUsuario(os.faturado_por) : null} />
              <Info l="Data da entrega" v={fmtDataHora(os.data_entrega)} />
              <Info l="Responsável pela entrega" v={os.entregue_por} />
              <Info l="Recebido por" v={os.recebido_por} />
              <Info l="Observação da entrega" v={os.observacao_entrega} />
              <Info l="Finalizado em" v={fmtDataHora(os.finalizado_em)} />
            </section>
          )}
        </div>

        <aside className="rounded-lg border bg-card shadow-card">
          <h2 className="border-b px-5 py-3 font-semibold">Histórico</h2>
          <ol className="max-h-[70vh] space-y-3 overflow-y-auto p-5 text-sm">
            {historico.map((h) => (
              <li key={h.id} className="border-l-2 border-primary/40 pl-3">
                <div className="font-medium">{h.tabela === "apontamentos" ? `Apontamento ${h.acao}` : `OS ${h.acao}`}</div>
                <div className="text-xs text-muted-foreground">{fmtDataHora(h.em)} · {nomeUsuario(h.usuario_id)}</div>
                {h.acao === "alterado" && <Diff antes={h.antes} depois={h.depois} />}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <ApontamentoDialog open={apontOpen} onOpenChange={setApontOpen} osId={id} apontamento={apontEdit} />
      <CancelarDialog open={cancelOpen} onOpenChange={setCancelOpen} onConfirm={(m) => rpc("os_cancelar", { _id: id, _motivo: m }, "OS cancelada").then(() => setCancelOpen(false))} />
      <ExpedirDialog open={expedirOpen} onOpenChange={setExpedirOpen}
        onConfirm={(d) => rpc("os_expedir", { _id: id, ...d }, "Entrega registrada").then(() => setExpedirOpen(false))} />
    </div>
  );
}

const IGNORAR = new Set(["version", "updated_at"]);
function Diff({ antes, depois }: { antes: unknown; depois: unknown }) {
  const a = (antes ?? {}) as Record<string, unknown>;
  const d = (depois ?? {}) as Record<string, unknown>;
  const ks = Object.keys(d).filter((k) => !IGNORAR.has(k) && JSON.stringify(a[k]) !== JSON.stringify(d[k]));
  if (!ks.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-muted-foreground">
      {ks.map((k) => <li key={k}>{k}: {String(a[k] ?? "∅")} → {String(d[k] ?? "∅")}</li>)}
    </ul>
  );
}

function Info({ l, v, wide }: { l: string; v: string | number | null | undefined; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-3" : ""}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div>
      <div className="mt-0.5 whitespace-pre-wrap">{v || "—"}</div>
    </div>
  );
}
function Kpi({ l, v }: { l: string; v: string }) {
  return (
    <div className="bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div>
      <div className="tabular mt-1 font-mono text-2xl font-semibold">{v}</div>
    </div>
  );
}

function CancelarDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (m: string) => void }) {
  const [m, setM] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancelar OS</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">A OS continuará registrada no histórico e o número não será reutilizado.</p>
        <Field label="Motivo do cancelamento *"><Textarea value={m} onChange={(e) => setM(e.target.value)} /></Field>
        <DialogFooter><Button variant="destructive" disabled={m.trim().length < 3} onClick={() => onConfirm(m)}>Confirmar cancelamento</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpedirDialog({ open, onOpenChange, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onConfirm: (d: { _data_entrega: string; _entregue_por: string; _recebido_por: string; _observacao: string }) => void;
}) {
  const [v, setV] = useState({ data: toLocalInput(new Date().toISOString()), por: "", recebido: "", obs: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Expedir — registrar entrega</DialogTitle></DialogHeader>
        <form id="exp" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); onConfirm({ _data_entrega: new Date(v.data).toISOString(), _entregue_por: v.por, _recebido_por: v.recebido, _observacao: v.obs }); }}>
          <Field label="Data da entrega *"><Input required type="datetime-local" value={v.data} onChange={(e) => setV({ ...v, data: e.target.value })} /></Field>
          <Field label="Responsável pela entrega *"><Input required value={v.por} onChange={(e) => setV({ ...v, por: e.target.value })} /></Field>
          <Field label="Quem recebeu *"><Input required value={v.recebido} onChange={(e) => setV({ ...v, recebido: e.target.value })} /></Field>
          <Field label="Observação"><Textarea value={v.obs} onChange={(e) => setV({ ...v, obs: e.target.value })} /></Field>
        </form>
        <DialogFooter><Button form="exp">Registrar entrega</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

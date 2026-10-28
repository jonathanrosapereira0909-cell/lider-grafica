import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, selectCls } from "@/components/os-ui";
import { useClientes, useProdutos, useUsuarios } from "@/lib/queries";
import { ClienteDialog } from "@/components/cliente-dialog";
import { hojeISO } from "@/lib/os";

export type OsFormValues = {
  cliente_id: string;
  produto_id: string;
  quantidade_solicitada: string;
  data_os: string;
  prazo_entrega: string;
  material: string;
  dimensao_modelo: string;
  acabamento: string;
  descricao_servico: string;
  observacoes: string;
  responsavel_id: string;
  valor: string;
  numero_orcamento: string;
  posicao_atual: string;
};

export const osFormVazio = (responsavel: string): OsFormValues => ({
  cliente_id: "", produto_id: "", quantidade_solicitada: "", data_os: hojeISO(), prazo_entrega: "",
  material: "", dimensao_modelo: "", acabamento: "", descricao_servico: "", observacoes: "",
  responsavel_id: responsavel, valor: "", numero_orcamento: "", posicao_atual: "",
});

export function osToPayload(v: OsFormValues) {
  const n = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    cliente_id: v.cliente_id,
    produto_id: v.produto_id,
    quantidade_solicitada: Number(v.quantidade_solicitada),
    data_os: v.data_os,
    prazo_entrega: n(v.prazo_entrega),
    material: n(v.material),
    dimensao_modelo: n(v.dimensao_modelo),
    acabamento: n(v.acabamento),
    descricao_servico: n(v.descricao_servico),
    observacoes: n(v.observacoes),
    responsavel_id: n(v.responsavel_id),
    valor: v.valor.trim() === "" ? null : Number(v.valor.replace(",", ".")),
    numero_orcamento: n(v.numero_orcamento),
    posicao_atual: n(v.posicao_atual),
  };
}

export function OsForm({
  initial, onSubmit, submitLabel, saving, keepClienteId, keepProdutoId,
}: {
  initial: OsFormValues;
  onSubmit: (v: OsFormValues) => void;
  submitLabel: string;
  saving: boolean;
  /** inactive ids already linked to this OS (edit mode) stay visible */
  keepClienteId?: string;
  keepProdutoId?: string;
}) {
  const [v, setV] = useState(initial);
  const set = (k: keyof OsFormValues, val: string) => setV((s) => ({ ...s, [k]: val }));
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();
  const { data: usuarios } = useUsuarios();
  const [novoCliente, setNovoCliente] = useState(false);

  function escolherProduto(id: string) {
    const p = produtos?.find((x) => x.id === id);
    setV((s) => ({
      ...s,
      produto_id: id,
      material: p?.material ?? "",
      dimensao_modelo: p?.especificacao ?? "",
      acabamento: p?.acabamento ?? "",
    }));
  }

  const clientesOpc = clientes?.filter((c) => c.ativo || c.id === keepClienteId);
  const produtosOpc = produtos?.filter((p) => p.ativo || p.id === keepProdutoId);
  const prodSel = produtos?.find((p) => p.id === v.produto_id);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="space-y-6"
    >
      <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-card md:grid-cols-2">
        <Field label="Cliente *">
          <div className="flex gap-2">
            <select required className={selectCls} value={v.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}>
              <option value="">Selecione…</option>
              {clientesOpc?.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nome}{!c.ativo ? " (inativo)" : ""}</option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={() => setNovoCliente(true)}>Novo</Button>
          </div>
        </Field>
        <Field label="Produto *">
          <select required className={selectCls} value={v.produto_id} onChange={(e) => escolherProduto(e.target.value)}>
            <option value="">Selecione…</option>
            {produtosOpc?.map((p) => (
              <option key={p.id} value={p.id}>{p.codigo} — {p.nome}{!p.ativo ? " (inativo)" : ""}</option>
            ))}
          </select>
          {prodSel && <p className="text-xs text-muted-foreground">Categoria: {prodSel.categoria?.nome}</p>}
        </Field>
        <Field label="Material"><Input value={v.material} onChange={(e) => set("material", e.target.value)} /></Field>
        <Field label="Dimensão / modelo"><Input value={v.dimensao_modelo} onChange={(e) => set("dimensao_modelo", e.target.value)} /></Field>
        <Field label="Acabamento"><Input value={v.acabamento} onChange={(e) => set("acabamento", e.target.value)} /></Field>
        <Field label="Quantidade solicitada *">
          <Input required type="number" min="0.01" step="any" value={v.quantidade_solicitada} onChange={(e) => set("quantidade_solicitada", e.target.value)} />
        </Field>
        <p className="text-xs text-muted-foreground md:col-span-2">
          Os dados do produto são copiados para esta OS. Alterá-los aqui não muda o cadastro do produto.
        </p>
      </section>

      <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-card md:grid-cols-3">
        <Field label="Data da OS *"><Input required type="date" value={v.data_os} onChange={(e) => set("data_os", e.target.value)} /></Field>
        <Field label="Prazo de entrega"><Input type="date" value={v.prazo_entrega} onChange={(e) => set("prazo_entrega", e.target.value)} /></Field>
        <Field label="Responsável">
          <select className={selectCls} value={v.responsavel_id} onChange={(e) => set("responsavel_id", e.target.value)}>
            <option value="">—</option>
            {usuarios?.filter((u) => u.role).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </Field>
        <Field label="Valor (R$)"><Input inputMode="decimal" value={v.valor} onChange={(e) => set("valor", e.target.value)} /></Field>
        <Field label="Nº orçamento"><Input value={v.numero_orcamento} onChange={(e) => set("numero_orcamento", e.target.value)} /></Field>
        <Field label="Posição atual"><Input value={v.posicao_atual} onChange={(e) => set("posicao_atual", e.target.value)} /></Field>
        <Field label="Descrição do serviço" className="md:col-span-3">
          <Textarea rows={2} value={v.descricao_servico} onChange={(e) => set("descricao_servico", e.target.value)} />
        </Field>
        <Field label="Observações" className="md:col-span-3">
          <Textarea rows={2} value={v.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
        </Field>
      </section>

      <div className="flex justify-end">
        <Button size="lg" disabled={saving}>{saving ? "Salvando…" : submitLabel}</Button>
      </div>

      <ClienteDialog open={novoCliente} onOpenChange={setNovoCliente} onSaved={(id) => set("cliente_id", id)} />
    </form>
  );
}

import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const quantidade = z.number();
const resumo = z.object({ qtd: quantidade, valor: quantidade });
const maquina = z.object({ id: z.string(), codigo: z.string(), nome: z.string(), produzido: quantidade, perdido: quantidade });
export const dashboardSchema = z.object({
  orcamentos_abertos: resumo,
  pedidos_abertos: resumo,
  status: z.object({ abertas: quantidade, aguardando_producao: quantidade, produzindo: quantidade, aguardando_faturamento: quantidade, expedicao: quantidade, outros: quantidade }),
  setores: z.array(z.object({ id: z.string(), nome: z.string(), ordem: quantidade, meta_diaria: quantidade.nullable(), produzido: quantidade, perdido: quantidade, maquinas: z.array(maquina) })),
  recentes: z.array(z.object({ id: z.string(), numero: quantidade, cliente_nome: z.string(), produto_nome: z.string(), quantidade_solicitada: quantidade, status: z.enum(["aguardando_producao", "em_producao", "producao_finalizada", "faturado", "aguardando_entrega", "entregue", "finalizado", "cancelado"]), prazo_entrega: z.string().nullable() })),
});
export type DashboardData = z.infer<typeof dashboardSchema>;
export type SetorDashboard = DashboardData["setores"][number];

export function dashboardQuery(dia: string) {
  return queryOptions({
    queryKey: ["os", "dashboard", dia],
    queryFn: async () => {
      const [resumo, demo] = await Promise.all([
        supabase.rpc("dashboard_producao", { _dia: dia }),
        supabase.from("clientes").select("id").like("codigo", "DEMO-%").limit(1),
      ]);
      if (resumo.error) throw resumo.error;
      if (demo.error) throw demo.error;
      return { ...dashboardSchema.parse(resumo.data), temDemo: Boolean(demo.data?.length) };
    },
  });
}

export function progressoMeta(produzido: number, meta: number | null): number | null {
  if (meta === null || meta <= 0) return null;
  return Math.max(0, Math.min(100, produzido / meta * 100));
}

export function hojeProducao(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
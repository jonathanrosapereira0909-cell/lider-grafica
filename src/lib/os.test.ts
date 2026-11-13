import { describe, expect, it } from "vitest";
import { consolidar, prazoIndicador } from "./os";
import { progressoMeta, hojeProducao } from "./dashboard";

describe("prazo (atraso é indicador, não status)", () => {
  it("OS em produção com prazo vencido está atrasada", () => {
    expect(prazoIndicador("2026-10-20", "em_producao", "2026-10-27")).toBe("atrasada");
  });
  it("prazo hoje", () => {
    expect(prazoIndicador("2026-10-27", "aguardando_producao", "2026-10-27")).toBe("hoje");
  });
  it("prazo em até 3 dias é entrega próxima", () => {
    expect(prazoIndicador("2026-10-30", "faturado", "2026-10-27")).toBe("proxima");
  });
  it("OS entregue não é marcada como atrasada", () => {
    expect(prazoIndicador("2026-10-01", "entregue", "2026-10-27")).toBe("encerrada");
  });
});

describe("metas de produção", () => {
  it("produção dividida pela meta, limitada a 100%", () => {
    expect(progressoMeta(850, 1000)).toBe(85);
    expect(progressoMeta(1200, 1000)).toBe(100);
  });
  it("setor sem meta ou meta zero não gera divisão por zero", () => {
    expect(progressoMeta(100, null)).toBeNull();
    expect(progressoMeta(100, 0)).toBeNull();
  });
  it("dia da produção usa America/Sao_Paulo", () => {
    expect(hojeProducao(new Date("2026-11-14T01:00:00Z"))).toBe("2026-11-13");
  });
});

describe("consolidação da produção", () => {
  it("10.000 solicitadas em 3 apontamentos → 9.800 produzidas e 200 perdidas", () => {
    const r = consolidar([
      { qtd_produzida: 4000, qtd_perdida: 100 },
      { qtd_produzida: 3000, qtd_perdida: 50 },
      { qtd_produzida: 2800, qtd_perdida: 50 },
    ]);
    expect(r).toEqual({ produzido: 9800, perdido: 200 });
  });
});

import { describe, expect, it } from "vitest";
import { normalizeDescription } from "../src/services/normalization";
import { detectRecurringPatterns } from "../src/services/recurrence";
import type { TransactionForRecurrence } from "../src/types/cashflow";

describe("detectRecurringPatterns", () => {
  it("detecta recorrencia mensal com variacao de ate 3 dias no vencimento", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-05", "pix enviado imobiliaria sao jose ltda", 8500, "expense", "rent"),
      tx("2", "2026-02-06", "pix enviado imobiliaria sao jose ltda", 8500, "expense", "rent"),
      tx("3", "2026-03-04", "pix enviado imobiliaria sao jose ltda", 8500, "expense", "rent"),
      tx("4", "2026-04-05", "pix enviado imobiliaria sao jose ltda", 8500, "expense", "rent")
    ];

    const patterns = detectRecurringPatterns(transactions);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      frequency: "monthly",
      type: "expense",
      categoryId: "rent",
      recurrenceType: "fixed",
      status: "suggested"
    });
    expect(patterns[0].confidence).toBeGreaterThanOrEqual(0.75);
    expect(patterns[0].recurrenceStabilityScore).toBeGreaterThanOrEqual(0.75);
  });

  it("nao transforma transacoes aleatorias em recorrencia", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-02", "pagamento fornecedor atlas", 3000, "expense", "supplier"),
      tx("2", "2026-01-19", "pagamento fornecedor boreal", 7500, "expense", "supplier"),
      tx("3", "2026-03-08", "compra avulsa equipamento", 2200, "expense", "supplier")
    ];

    expect(detectRecurringPatterns(transactions)).toEqual([]);
  });

  it("nao cria recorrencia de receita apenas por categoria e periodicidade", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-10", "pix recebido venda cliente alfa", 9000, "income", "sales"),
      tx("2", "2026-02-10", "pix recebido venda cliente beta", 10000, "income", "sales"),
      tx("3", "2026-03-10", "pix recebido venda cliente gama", 11000, "income", "sales"),
      tx("4", "2026-04-10", "pix recebido venda cliente delta", 12000, "income", "sales")
    ];

    expect(detectRecurringPatterns(transactions)).toEqual([]);
  });

  it("agrupa descricoes do mesmo fornecedor por similaridade de tokens, sem exigir chave textual exata", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-05", "PIX IMOBILIARIA SAO JOSE", 8500, "expense", "rent"),
      tx("2", "2026-02-06", "ALUGUEL SALA COMERCIAL IMOBILIARIA SAO JOSE", 8500, "expense", "rent"),
      tx("3", "2026-03-05", "PIX IMOBILIARIA SAO JOSE", 8500, "expense", "rent"),
      tx("4", "2026-04-04", "ALUGUEL SALA COMERCIAL IMOBILIARIA SAO JOSE", 8500, "expense", "rent")
    ];

    const patterns = detectRecurringPatterns(transactions, { minTokenJaccard: 0.6 });

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      descriptionPattern: "imobiliaria sao jose",
      frequency: "monthly",
      categoryId: "rent",
      recurrenceType: "fixed"
    });
    expect(patterns[0].transactionIds.sort()).toEqual(["1", "2", "3", "4"]);
  });

  it("detecta recorrencia variavel sem classificar como projetavel", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-10", "REPASSE MARKETPLACE VENDAS PERIODO", 10000, "income", "sales"),
      tx("2", "2026-02-10", "REPASSE MARKETPLACE VENDAS PERIODO", 28000, "income", "sales"),
      tx("3", "2026-03-10", "REPASSE MARKETPLACE VENDAS PERIODO", 14000, "income", "sales"),
      tx("4", "2026-04-10", "REPASSE MARKETPLACE VENDAS PERIODO", 41000, "income", "sales")
    ];

    const patterns = detectRecurringPatterns(transactions);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      frequency: "monthly",
      recurrenceType: "variable"
    });
    expect(patterns[0].recurrenceStabilityScore).toBeLessThan(0.75);
  });

  it("nao agrupa descricoes parecidas quando fornecedores sao diferentes", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-05", "PIX IMOBILIARIA SAO JOSE", 8500, "expense", "rent"),
      tx("2", "2026-02-05", "ALUGUEL SALA COMERCIAL IMOBILIARIA SAO PEDRO", 8500, "expense", "rent"),
      tx("3", "2026-03-05", "PIX IMOBILIARIA SAO LUCAS", 8500, "expense", "rent"),
      tx("4", "2026-04-05", "ALUGUEL SALA COMERCIAL IMOBILIARIA SANTO ANTONIO", 8500, "expense", "rent")
    ];

    expect(detectRecurringPatterns(transactions)).toEqual([]);
  });

  it("nao transforma receitas variaveis frequentes em recorrencia automaticamente", () => {
    const transactions: TransactionForRecurrence[] = [
      tx("1", "2026-01-10", "PIX RECEBIDO VENDA CLIENTE ALFA CONTRATO PROJETO", 9000, "income", "sales"),
      tx("2", "2026-02-10", "PIX RECEBIDO VENDA CLIENTE BETA CONTRATO PROJETO", 10000, "income", "sales"),
      tx("3", "2026-03-10", "PIX RECEBIDO VENDA CLIENTE GAMA CONTRATO PROJETO", 11000, "income", "sales"),
      tx("4", "2026-04-10", "PIX RECEBIDO VENDA CLIENTE DELTA CONTRATO PROJETO", 12000, "income", "sales")
    ];

    expect(detectRecurringPatterns(transactions)).toEqual([]);
  });
});

function tx(
  id: string,
  date: string,
  normalizedDescription: string,
  amount: number,
  type: "income" | "expense",
  categoryId: string
): TransactionForRecurrence {
  return {
    id,
    accountId: "account",
    categoryId,
    date: new Date(`${date}T00:00:00.000Z`),
    normalizedDescription: normalizeDescription(normalizedDescription),
    amount,
    type
  };
}

import { describe, expect, it } from "vitest";
import { categorizeTransactions } from "../src/services/categorization";
import type { CategorizationRuleInput, TransactionForCategorization } from "../src/types/cashflow";

const rules: CategorizationRuleInput[] = [
  {
    id: "rule-tax",
    categoryId: "tax",
    field: "normalizedDescription",
    operator: "contains",
    value: "darf",
    priority: 10,
    confidence: 0.95
  },
  {
    id: "rule-software",
    categoryId: "software",
    field: "normalizedDescription",
    operator: "contains",
    value: "aws",
    priority: 10,
    confidence: 0.95
  },
  {
    id: "rule-sales",
    categoryId: "sales",
    field: "normalizedDescription",
    operator: "contains",
    value: "pix recebido",
    priority: 20,
    confidence: 0.85
  }
];

describe("categorizeTransactions", () => {
  it("categoriza pela primeira regra compativel", () => {
    const transactions: TransactionForCategorization[] = [
      tx("1", "darf simples nacional", "expense"),
      tx("2", "aws servicos cloud", "expense"),
      tx("3", "pix recebido cliente alfa", "income"),
      tx("4", "texto desconhecido", "expense")
    ];

    const results = categorizeTransactions(transactions, rules);

    expect(results).toMatchObject([
      { transactionId: "1", categoryId: "tax", confidence: 0.95 },
      { transactionId: "2", categoryId: "software", confidence: 0.95 },
      { transactionId: "3", categoryId: "sales", confidence: 0.85 },
      { transactionId: "4", categoryId: null, confidence: null }
    ]);
  });

  it("nao sobrescreve transacao ja categorizada", () => {
    const results = categorizeTransactions(
      [
        {
          ...tx("1", "darf simples nacional", "expense"),
          categoryId: "existing"
        }
      ],
      rules
    );

    expect(results).toEqual([]);
  });
});

function tx(
  id: string,
  normalizedDescription: string,
  type: "income" | "expense"
): TransactionForCategorization {
  return {
    id,
    description: normalizedDescription,
    normalizedDescription,
    categoryId: null,
    type
  };
}

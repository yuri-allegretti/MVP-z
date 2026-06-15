import type { RecurrenceEvaluationDataset } from "../../src/services/recurrence-evaluation";
import type { TransactionForRecurrence, TransactionType } from "../../src/types/cashflow";

export const recurrenceEvaluationDatasets: RecurrenceEvaluationDataset[] = [
  {
    id: "software-agency",
    companyName: "Agencia de software",
    transactions: [
      tx("agency-rent-jan", "agency-account", "rent", "2026-01-05", "pix enviado imobiliaria norte ltda aluguel escritorio", 6400, "expense"),
      tx("agency-rent-feb", "agency-account", "rent", "2026-02-06", "aluguel sala comercial imobiliaria norte", 6400, "expense"),
      tx("agency-rent-mar", "agency-account", "rent", "2026-03-05", "pix enviado imobiliaria norte ltda aluguel escritorio", 6400, "expense"),
      tx("agency-rent-apr", "agency-account", "rent", "2026-04-04", "aluguel sala comercial imobiliaria norte", 6400, "expense"),
      tx("agency-acme-jan", "agency-account", "retainer", "2026-01-10", "pix recebido mensalidade cliente acme suporte contrato", 12000, "income"),
      tx("agency-acme-feb", "agency-account", "retainer", "2026-02-10", "recebimento cliente acme suporte mensal", 12000, "income"),
      tx("agency-acme-mar", "agency-account", "retainer", "2026-03-11", "pix recebido mensalidade cliente acme suporte contrato", 12000, "income"),
      tx("agency-acme-apr", "agency-account", "retainer", "2026-04-10", "recebimento cliente acme suporte mensal", 12000, "income"),
      tx("agency-oneoff-1", "agency-account", "supplier", "2026-01-16", "compra notebook equipe desenvolvimento", 7800, "expense"),
      tx("agency-oneoff-2", "agency-account", "supplier", "2026-03-22", "pagamento fornecedor evento tecnico", 2600, "expense")
    ],
    expectedPatterns: [
      {
        id: "agency-rent",
        label: "Aluguel do escritorio",
        type: "expense",
        frequency: "monthly",
        categoryId: "rent",
        transactionIds: ["agency-rent-jan", "agency-rent-feb", "agency-rent-mar", "agency-rent-apr"],
        expectedFingerprint: "imobiliaria norte",
        minConfidence: 0.75
      },
      {
        id: "agency-acme-retainer",
        label: "Receita recorrente ACME",
        type: "income",
        frequency: "monthly",
        categoryId: "retainer",
        transactionIds: ["agency-acme-jan", "agency-acme-feb", "agency-acme-mar", "agency-acme-apr"],
        expectedFingerprint: "acme suporte",
        minConfidence: 0.75
      }
    ]
  },
  {
    id: "retail-store",
    companyName: "Loja varejista",
    transactions: [
      tx("retail-clean-1", "retail-account", "operations", "2026-01-05", "pagamento fornecedor limpeza loja equipe fixa", 850, "expense"),
      tx("retail-clean-2", "retail-account", "operations", "2026-01-12", "limpeza loja equipe fixa semanal", 850, "expense"),
      tx("retail-clean-3", "retail-account", "operations", "2026-01-19", "pagamento fornecedor limpeza loja equipe fixa", 850, "expense"),
      tx("retail-clean-4", "retail-account", "operations", "2026-01-26", "limpeza loja equipe fixa semanal", 850, "expense"),
      tx("retail-card-jan", "retail-account", "software", "2026-01-14", "debito automatico maquininha assinatura mensal", 199, "expense"),
      tx("retail-card-feb", "retail-account", "software", "2026-02-14", "fatura maquininha assinatura loja", 199, "expense"),
      tx("retail-card-mar", "retail-account", "software", "2026-03-15", "debito automatico maquininha assinatura mensal", 199, "expense"),
      tx("retail-card-apr", "retail-account", "software", "2026-04-14", "fatura maquininha assinatura loja", 199, "expense"),
      tx("retail-sale-jan", "retail-account", "sales", "2026-01-08", "pix recebido venda cliente alfa pedido loja", 5300, "income"),
      tx("retail-sale-feb", "retail-account", "sales", "2026-02-08", "pix recebido venda cliente beta pedido loja", 5800, "income"),
      tx("retail-sale-mar", "retail-account", "sales", "2026-03-08", "pix recebido venda cliente gama pedido loja", 6200, "income")
    ],
    expectedPatterns: [
      {
        id: "retail-cleaning",
        label: "Limpeza semanal da loja",
        type: "expense",
        frequency: "weekly",
        categoryId: "operations",
        transactionIds: ["retail-clean-1", "retail-clean-2", "retail-clean-3", "retail-clean-4"],
        expectedFingerprint: "limpeza loja equipe fixa",
        minConfidence: 0.75
      },
      {
        id: "retail-card-subscription",
        label: "Assinatura da maquininha",
        type: "expense",
        frequency: "monthly",
        categoryId: "software",
        transactionIds: ["retail-card-jan", "retail-card-feb", "retail-card-mar", "retail-card-apr"],
        expectedFingerprint: "maquininha assinatura",
        minConfidence: 0.75
      }
    ]
  },
  {
    id: "health-clinic",
    companyName: "Clinica de saude",
    transactions: [
      tx("clinic-health-jan", "clinic-account", "benefits", "2026-01-07", "debito automatico plano saude unimed funcionarios", 4100, "expense"),
      tx("clinic-health-feb", "clinic-account", "benefits", "2026-02-07", "pagamento unimed saude empresarial", 4100, "expense"),
      tx("clinic-health-mar", "clinic-account", "benefits", "2026-03-06", "debito automatico plano saude unimed funcionarios", 4100, "expense"),
      tx("clinic-health-apr", "clinic-account", "benefits", "2026-04-07", "pagamento unimed saude empresarial", 4100, "expense"),
      tx("clinic-tax-jan", "clinic-account", "taxes", "2026-01-20", "darf imposto trimestral clinica", 2600, "expense"),
      tx("clinic-tax-apr", "clinic-account", "taxes", "2026-04-20", "darf imposto trimestral clinica", 2800, "expense")
    ],
    expectedPatterns: [
      {
        id: "clinic-health-plan",
        label: "Plano de saude empresarial",
        type: "expense",
        frequency: "monthly",
        categoryId: "benefits",
        transactionIds: ["clinic-health-jan", "clinic-health-feb", "clinic-health-mar", "clinic-health-apr"],
        expectedFingerprint: "saude unimed",
        minConfidence: 0.75
      }
    ]
  },
  {
    id: "construction-company",
    companyName: "Construtora",
    transactions: [
      tx("construction-supplier-jan", "construction-account", "supplier", "2026-01-10", "pagamento fornecedor areia sul obra", 7000, "expense"),
      tx("construction-supplier-feb", "construction-account", "supplier", "2026-02-10", "pagamento fornecedor cimento norte obra", 7300, "expense"),
      tx("construction-supplier-mar", "construction-account", "supplier", "2026-03-10", "pagamento fornecedor ferro real obra", 6900, "expense"),
      tx("construction-rental-jan", "construction-account", "equipment", "2026-01-18", "aluguel equipamento guindaste obra centro", 18000, "expense"),
      tx("construction-rental-feb", "construction-account", "equipment", "2026-02-17", "aluguel equipamento guindaste obra centro", 18000, "expense"),
      tx("construction-invoice-jan", "construction-account", "sales", "2026-01-25", "pix recebido venda cliente torre azul etapa", 42000, "income"),
      tx("construction-invoice-feb", "construction-account", "sales", "2026-02-25", "pix recebido venda cliente residencial sol etapa", 39000, "income"),
      tx("construction-invoice-mar", "construction-account", "sales", "2026-03-25", "pix recebido venda cliente galpao oeste etapa", 45000, "income")
    ],
    expectedPatterns: []
  }
];

function tx(
  id: string,
  accountId: string,
  categoryId: string,
  date: string,
  normalizedDescription: string,
  amount: number,
  type: TransactionType
): TransactionForRecurrence {
  return {
    id,
    accountId,
    categoryId,
    date: new Date(`${date}T00:00:00.000Z`),
    normalizedDescription,
    amount,
    type
  };
}

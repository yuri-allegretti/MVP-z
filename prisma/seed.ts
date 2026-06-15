import { PrismaClient } from "@prisma/client";
import { categorizeTransactions } from "../src/services/categorization";
import { normalizeDescription } from "../src/services/normalization";
import { detectRecurringPatterns } from "../src/services/recurrence";

const prisma = new PrismaClient();

type SeedTransaction = {
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
};

async function main() {
  await cleanDatabase();

  const user = await prisma.user.create({
    data: {
      name: "Usuario Teste",
      email: "teste@example.com"
    }
  });

  const organization = await prisma.organization.create({
    data: {
      name: "Empresa Demo Ltda"
    }
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: "owner"
    }
  });

  const account = await prisma.account.create({
    data: {
      organizationId: organization.id,
      name: "Conta Corrente Principal",
      type: "checking",
      initialBalance: 50000,
      currentBalance: 50000,
      currency: "BRL"
    }
  });

  const categories = await createCategories(organization.id);
  await createRules(organization.id, categories);

  const seedTransactions = buildTransactions();
  await prisma.transaction.createMany({
    data: seedTransactions.map((transaction) => ({
      organizationId: organization.id,
      accountId: account.id,
      date: transaction.date,
      description: transaction.description,
      rawDescription: transaction.description,
      normalizedDescription: normalizeDescription(transaction.description),
      amount: transaction.amount,
      type: transaction.type,
      source: "seed"
    }))
  });

  await runInitialCategorization(organization.id);
  await runInitialRecurringDetection(organization.id);
  await updateCurrentBalanceSnapshot(organization.id, account.id);

  console.log(`Seed concluido para organizacao: ${organization.name}`);
}

async function cleanDatabase() {
  await prisma.projectedCashflowItem.deleteMany();
  await prisma.userCorrection.deleteMany();
  await prisma.recurringPattern.deleteMany();
  await prisma.categorizationRule.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
}

async function createCategories(organizationId: string) {
  const rows = [
    ["Vendas", "income"],
    ["Aluguel", "expense"],
    ["Folha de pagamento", "expense"],
    ["Impostos", "expense"],
    ["Software", "expense"],
    ["Fornecedor", "expense"],
    ["Marketing", "expense"],
    ["Emprestimo", "both"],
    ["Transferencia interna", "both"],
    ["Outros", "both"]
  ] as const;

  const categories = await Promise.all(
    rows.map(([name, type]) =>
      prisma.category.create({
        data: {
          organizationId,
          name,
          type,
          isDefault: true
        }
      })
    )
  );

  return Object.fromEntries(categories.map((category) => [category.name, category]));
}

async function createRules(
  organizationId: string,
  categories: Awaited<ReturnType<typeof createCategories>>
) {
  const rules = [
    ["darf", "Impostos", 10, 0.95],
    ["fgts", "Impostos", 20, 0.85],
    ["salario", "Folha de pagamento", 10, 0.95],
    ["folha", "Folha de pagamento", 10, 0.95],
    ["aluguel", "Aluguel", 10, 0.95],
    ["imobiliaria", "Aluguel", 20, 0.9],
    ["aws", "Software", 10, 0.95],
    ["google", "Software", 10, 0.95],
    ["microsoft", "Software", 10, 0.95],
    ["vercel", "Software", 10, 0.95],
    ["pix recebido", "Vendas", 20, 0.85],
    ["venda", "Vendas", 20, 0.85],
    ["recebimento", "Vendas", 20, 0.85]
  ] as const;

  await prisma.categorizationRule.createMany({
    data: rules.map(([value, categoryName, priority, confidence]) => ({
      organizationId,
      categoryId: categories[categoryName].id,
      field: "normalizedDescription",
      operator: "contains",
      value,
      priority,
      confidence
    }))
  });
}

function buildTransactions(): SeedTransaction[] {
  const months = lastMonths(6);
  const transactions: SeedTransaction[] = [];
  const customerNames = [
    "Alfa",
    "Beta",
    "Gama",
    "Delta",
    "Epsilon",
    "Zeta",
    "Kappa",
    "Lambda",
    "Sigma",
    "Omega",
    "Norte",
    "Sul",
    "Leste",
    "Oeste",
    "Prime",
    "Blue",
    "Green",
    "Red"
  ];
  const supplierNames = ["Atlas", "Boreal", "Central", "Domus", "Eixo", "Fenix"];

  months.forEach(({ year, month }, monthIndex) => {
    const aluguelDay = [5, 5, 6, 4, 5, 5][monthIndex];
    transactions.push({
      date: makeDate(year, month, aluguelDay),
      description:
        monthIndex % 2 === 0
          ? "PIX ENVIADO - IMOBILIARIA SAO JOSE LTDA 12345"
          : "ALUGUEL SALA COMERCIAL IMOBILIARIA SAO JOSE",
      amount: 8500,
      type: "expense"
    });

    transactions.push({
      date: makeDate(year, month, 28),
      description: "FOLHA DE PAGAMENTO FUNCIONARIOS",
      amount: 32000 + monthIndex * 400,
      type: "expense"
    });

    transactions.push({
      date: makeDate(year, month, 12),
      description: "AWS SERVICOS CLOUD CONTA EMPRESA",
      amount: 1100 + (monthIndex % 3) * 80,
      type: "expense"
    });

    transactions.push({
      date: makeDate(year, month, 20),
      description: "DARF SIMPLES NACIONAL",
      amount: 5200 + monthIndex * 180,
      type: "expense"
    });

    if (monthIndex % 2 === 0) {
      transactions.push({
        date: makeDate(year, month, 21),
        description: "FGTS GUIA MENSAL",
        amount: 2100 + monthIndex * 120,
        type: "expense"
      });
    }

    const salesCount = 6 + (monthIndex % 4);
    for (let index = 0; index < salesCount; index++) {
      const customer = customerNames[(monthIndex * 7 + index) % customerNames.length];
      transactions.push({
        date: makeDate(year, month, 3 + index * 3),
        description: `PIX RECEBIDO VENDA CLIENTE ${customer} PEDIDO ${year}${month + 1}${index}`,
        amount: 5000 + ((monthIndex + 1) * (index + 3) * 731) % 20000,
        type: "income"
      });
    }

    const supplierCount = 3 + (monthIndex % 4);
    for (let index = 0; index < supplierCount; index++) {
      const supplier = supplierNames[(monthIndex + index) % supplierNames.length];
      transactions.push({
        date: makeDate(year, month, 7 + index * 4),
        description: `PAGAMENTO FORNECEDOR ${supplier} NF ${year}${month + 1}${index}`,
        amount: 1000 + ((monthIndex + 4) * (index + 2) * 619) % 11000,
        type: "expense"
      });
    }

    transactions.push({
      date: makeDate(year, month, 16),
      description: `MARKETING CAMPANHA GOOGLE ADS MES ${monthIndex + 1}`,
      amount: 1200 + monthIndex * 250,
      type: "expense"
    });

    if (monthIndex % 2 === 0) {
      transactions.push({
        date: makeDate(year, month, 23),
        description: `TED ENVIADA ${year}${month + 1}93847`,
        amount: 1800 + monthIndex * 300,
        type: "expense"
      });
    } else {
      transactions.push({
        date: makeDate(year, month, 24),
        description: `PAGAMENTO DIVERSOS ${year}${month + 1}712`,
        amount: 900 + monthIndex * 220,
        type: "expense"
      });
    }
  });

  transactions.push(
    {
      date: makeDate(months[5].year, months[5].month, 25),
      description: "AJUSTE OPERACIONAL BANCO",
      amount: 650,
      type: "expense"
    },
    {
      date: makeDate(months[5].year, months[5].month, 26),
      description: "COMPRA AVULSA 8841",
      amount: 430,
      type: "expense"
    }
  );

  return transactions;
}

async function runInitialCategorization(organizationId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { organizationId, categoryId: null }
  });
  const rules = await prisma.categorizationRule.findMany({
    where: { organizationId },
    orderBy: { priority: "asc" }
  });

  const results = categorizeTransactions(
    transactions.map((transaction) => ({
      id: transaction.id,
      description: transaction.description,
      normalizedDescription: transaction.normalizedDescription,
      categoryId: transaction.categoryId,
      type: transaction.type
    })),
    rules.map((rule) => ({
      id: rule.id,
      categoryId: rule.categoryId,
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      priority: rule.priority,
      confidence: Number(rule.confidence)
    }))
  );

  for (const result of results) {
    if (!result.categoryId) {
      continue;
    }

    await prisma.transaction.update({
      where: { id: result.transactionId },
      data: {
        categoryId: result.categoryId,
        categoryConfidence: result.confidence
      }
    });
  }
}

async function runInitialRecurringDetection(organizationId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { organizationId },
    orderBy: { date: "asc" }
  });

  const patterns = detectRecurringPatterns(
    transactions.map((transaction) => ({
      id: transaction.id,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      date: transaction.date,
      normalizedDescription: transaction.normalizedDescription,
      amount: Number(transaction.amount),
      type: transaction.type
    }))
  );

  for (const pattern of patterns) {
    const existing = await prisma.recurringPattern.findFirst({
      where: {
        organizationId,
        accountId: pattern.accountId,
        categoryId: pattern.categoryId,
        descriptionPattern: pattern.descriptionPattern,
        frequency: pattern.frequency,
        type: pattern.type
      }
    });

    if (existing) {
      await prisma.recurringPattern.update({
        where: { id: existing.id },
        data: {
          merchantName: pattern.merchantName,
          averageAmount: pattern.averageAmount,
          minAmount: pattern.minAmount,
          maxAmount: pattern.maxAmount,
          expectedDayOfMonth: pattern.expectedDayOfMonth,
          expectedWeekday: pattern.expectedWeekday,
          confidence: pattern.confidence,
          nextExpectedDate: pattern.nextExpectedDate
        }
      });
    } else {
      await prisma.recurringPattern.create({
        data: {
          organizationId,
          accountId: pattern.accountId,
          categoryId: pattern.categoryId,
          merchantName: pattern.merchantName,
          descriptionPattern: pattern.descriptionPattern,
          averageAmount: pattern.averageAmount,
          minAmount: pattern.minAmount,
          maxAmount: pattern.maxAmount,
          type: pattern.type,
          frequency: pattern.frequency,
          expectedDayOfMonth: pattern.expectedDayOfMonth,
          expectedWeekday: pattern.expectedWeekday,
          confidence: pattern.confidence,
          nextExpectedDate: pattern.nextExpectedDate,
          status: "suggested"
        }
      });
    }
  }
}

async function updateCurrentBalanceSnapshot(organizationId: string, accountId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { organizationId, accountId },
    select: { amount: true, type: true }
  });

  const currentBalance = transactions.reduce((balance, transaction) => {
    const amount = Number(transaction.amount);
    return transaction.type === "income" ? balance + amount : balance - amount;
  }, 50000);

  await prisma.account.update({
    where: { id: accountId },
    data: { currentBalance }
  });
}

function lastMonths(count: number) {
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(currentMonth);
    date.setUTCMonth(currentMonth.getUTCMonth() - count + 1 + index);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth()
    };
  });
}

function makeDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

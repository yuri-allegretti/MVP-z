"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/lib/active-organization";
import { prisma } from "@/lib/db";
import { normalizeDescription } from "@/services/normalization";
import { categorizeTransactions } from "@/services/categorization";
import { csvImportSchema } from "@/schemas/import.schema";
import {
  createTransactionSchema,
  updateTransactionCategorySchema
} from "@/schemas/transaction.schema";

export async function createManualTransactionAction(formData: FormData) {
  const organizationId = await getActiveOrganizationId();
  const input = createTransactionSchema.parse(Object.fromEntries(formData));

  await assertAccountBelongsToOrganization(input.accountId, organizationId);

  await prisma.transaction.create({
    data: {
      organizationId,
      accountId: input.accountId,
      date: input.date,
      description: input.description,
      rawDescription: input.description,
      normalizedDescription: normalizeDescription(input.description),
      amount: input.amount,
      type: input.type,
      source: "manual"
    }
  });

  await categorizePendingTransactions(organizationId);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
}

export async function importCsvTransactionsAction(formData: FormData) {
  const organizationId = await getActiveOrganizationId();
  const input = csvImportSchema.parse(Object.fromEntries(formData));

  await assertAccountBelongsToOrganization(input.accountId, organizationId);

  const rows = parseCsv(input.csvText);
  await prisma.transaction.createMany({
    data: rows.map((row) => ({
      organizationId,
      accountId: input.accountId,
      date: row.date,
      description: row.description,
      rawDescription: row.description,
      normalizedDescription: normalizeDescription(row.description),
      amount: row.amount,
      type: row.type,
      source: "csv"
    }))
  });

  await categorizePendingTransactions(organizationId);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
}

export async function runCategorizationAction() {
  const organizationId = await getActiveOrganizationId();
  await categorizePendingTransactions(organizationId);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function updateTransactionCategoryAction(formData: FormData) {
  const organizationId = await getActiveOrganizationId();
  const input = updateTransactionCategorySchema.parse(Object.fromEntries(formData));

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      organizationId
    }
  });

  if (!transaction) {
    throw new Error("Transacao nao encontrada para a organizacao ativa.");
  }

  const category = await prisma.category.findFirst({
    where: {
      id: input.newCategoryId,
      organizationId
    }
  });

  if (!category) {
    throw new Error("Categoria nao encontrada para a organizacao ativa.");
  }

  if (category.type !== "both" && category.type !== transaction.type) {
    throw new Error("Categoria incompativel com o tipo da transacao.");
  }

  await prisma.$transaction([
    prisma.userCorrection.create({
      data: {
        organizationId,
        transactionId: transaction.id,
        oldCategoryId: transaction.categoryId,
        newCategoryId: category.id
      }
    }),
    prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        categoryId: category.id,
        categoryConfidence: 1
      }
    })
  ]);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function categorizePendingTransactions(organizationId: string) {
  const [transactions, rules] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organizationId,
        categoryId: null
      }
    }),
    prisma.categorizationRule.findMany({
      where: { organizationId },
      orderBy: { priority: "asc" }
    })
  ]);

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

  const groupedUpdates = new Map<
    string,
    { categoryId: string; confidence: number | null; transactionIds: string[] }
  >();

  for (const result of results) {
    if (!result.categoryId) {
      continue;
    }

    const confidence = result.confidence ?? null;
    const key = `${result.categoryId}:${confidence ?? "null"}`;
    const group = groupedUpdates.get(key) ?? {
      categoryId: result.categoryId,
      confidence,
      transactionIds: []
    };

    group.transactionIds.push(result.transactionId);
    groupedUpdates.set(key, group);
  }

  if (groupedUpdates.size === 0) {
    return;
  }

  await prisma.$transaction(
    [...groupedUpdates.values()].map((group) =>
      prisma.transaction.updateMany({
        where: {
          organizationId,
          id: { in: group.transactionIds }
        },
        data: {
          categoryId: group.categoryId,
          categoryConfidence: group.confidence
        }
      })
    )
  );
}

async function assertAccountBelongsToOrganization(accountId: string, organizationId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, organizationId },
    select: { id: true }
  });

  if (!account) {
    throw new Error("Conta invalida para a organizacao ativa.");
  }
}

function parseCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV precisa de cabecalho e pelo menos uma transacao.");
  }

  const header = lines[0].split(",").map((column) => column.trim().toLowerCase());
  const required = ["date", "description", "amount", "type"];

  for (const column of required) {
    if (!header.includes(column)) {
      throw new Error(`CSV sem coluna obrigatoria: ${column}`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(header.map((column, columnIndex) => [column, values[columnIndex] ?? ""]));
    const parsed = createTransactionSchema.omit({ accountId: true }).parse(row);

    if (!Number.isFinite(parsed.amount)) {
      throw new Error(`Valor invalido na linha ${index + 2}.`);
    }

    return parsed;
  });
}

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveOrganizationId } from "@/lib/active-organization";
import { prisma } from "@/lib/db";
import { recurringStatusSchema } from "@/schemas/recurring.schema";
import { detectRecurringPatterns } from "@/services/recurrence";

export async function runRecurringDetectionAction() {
  const organizationId = await getActiveOrganizationId();
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

  if (patterns.length === 0) {
    revalidatePath("/recurring");
    revalidatePath("/projection");
    revalidatePath("/dashboard");
    return;
  }

  const existingPatterns = await prisma.recurringPattern.findMany({
    where: { organizationId },
    select: {
      id: true,
      accountId: true,
      categoryId: true,
      descriptionPattern: true,
      frequency: true,
      type: true
    }
  });
  const existingByKey = new Map(
    existingPatterns.map((pattern) => [recurringPatternKey({ organizationId, ...pattern }), pattern])
  );
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  const queuedKeys = new Set<string>();

  for (const pattern of patterns) {
    const key = recurringPatternKey({ organizationId, ...pattern });

    if (queuedKeys.has(key)) {
      continue;
    }

    queuedKeys.add(key);
    const existing = existingByKey.get(key);
    if (existing) {
      operations.push(
        prisma.recurringPattern.update({
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
        })
      );
      continue;
    }

    operations.push(
      prisma.recurringPattern.create({
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
      })
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  revalidatePath("/recurring");
  revalidatePath("/projection");
  revalidatePath("/dashboard");
}

export async function updateRecurringStatusAction(formData: FormData) {
  const organizationId = await getActiveOrganizationId();
  const input = recurringStatusSchema.parse(Object.fromEntries(formData));

  const recurringPattern = await prisma.recurringPattern.findFirst({
    where: {
      id: input.recurringPatternId,
      organizationId
    },
    select: { id: true }
  });

  if (!recurringPattern) {
    throw new Error("Recorrencia nao encontrada para a organizacao ativa.");
  }

  await prisma.recurringPattern.update({
    where: { id: recurringPattern.id },
    data: { status: input.status }
  });

  revalidatePath("/recurring");
  revalidatePath("/projection");
  revalidatePath("/dashboard");
}

function recurringPatternKey(input: {
  organizationId: string;
  accountId: string | null;
  categoryId: string | null;
  descriptionPattern: string;
  frequency: string;
  type: string;
}) {
  return [
    input.organizationId,
    input.accountId ?? "__null__",
    input.categoryId ?? "__null__",
    input.descriptionPattern,
    input.frequency,
    input.type
  ].join("::");
}

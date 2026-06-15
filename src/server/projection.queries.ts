import { getActiveOrganizationId } from "@/lib/active-organization";
import { getPrimaryAccountWithBalance } from "@/lib/balance";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/dates";
import { generateCashflowAlerts } from "@/services/alerts";
import { generateCashflowProjection } from "@/services/projection";
import type {
  CashflowProjection,
  ProjectionHorizon,
  ProjectionRecurringInput,
  ProjectionScenario
} from "@/types/cashflow";

export async function getProjectionData(input: {
  horizonDays: ProjectionHorizon;
  scenario: ProjectionScenario;
}): Promise<CashflowProjection> {
  const organizationId = await getActiveOrganizationId();
  const account = await getPrimaryAccountWithBalance(organizationId);
  const recurringPatterns = await getProjectionRecurringPatterns(organizationId);

  return generateProjectionFromBase({
    startDate: toDateOnly(new Date()),
    openingBalance: account.calculatedBalance,
    horizonDays: input.horizonDays,
    scenario: input.scenario,
    recurringPatterns
  });
}

export async function getDashboardData() {
  const organizationId = await getActiveOrganizationId();
  const [account, recurringPatterns, uncategorizedTransactionCount] = await Promise.all([
    getPrimaryAccountWithBalance(organizationId),
    getProjectionRecurringPatterns(organizationId),
    prisma.transaction.count({
      where: {
        organizationId,
        categoryId: null
      }
    })
  ]);

  const startDate = toDateOnly(new Date());
  const projection30 = generateProjectionFromBase({
    startDate,
    openingBalance: account.calculatedBalance,
    recurringPatterns,
    horizonDays: 30,
    scenario: "likely"
  });
  const projection60 = generateProjectionFromBase({
    startDate,
    openingBalance: account.calculatedBalance,
    recurringPatterns,
    horizonDays: 60,
    scenario: "likely"
  });
  const projection90 = generateProjectionFromBase({
    startDate,
    openingBalance: account.calculatedBalance,
    recurringPatterns,
    horizonDays: 90,
    scenario: "likely"
  });
  const alerts = generateCashflowAlerts({
    projection: projection90,
    uncategorizedTransactionCount
  });

  return {
    account,
    projections: [projection30, projection60, projection90],
    alerts,
    uncategorizedTransactionCount
  };
}

async function getProjectionRecurringPatterns(
  organizationId: string
): Promise<ProjectionRecurringInput[]> {
  const patterns = await prisma.recurringPattern.findMany({
    where: {
      organizationId,
      status: { not: "ignored" }
    },
    orderBy: [{ status: "asc" }, { confidence: "desc" }]
  });

  return patterns.map((pattern) => ({
    id: pattern.id,
    descriptionPattern: pattern.descriptionPattern,
    averageAmount: Number(pattern.averageAmount),
    type: pattern.type,
    frequency: pattern.frequency,
    expectedDayOfMonth: pattern.expectedDayOfMonth,
    expectedWeekday: pattern.expectedWeekday,
    nextExpectedDate: pattern.nextExpectedDate,
    confidence: Number(pattern.confidence),
    status: pattern.status
  }));
}

function generateProjectionFromBase(input: {
  startDate: Date;
  openingBalance: number;
  horizonDays: ProjectionHorizon;
  scenario: ProjectionScenario;
  recurringPatterns: ProjectionRecurringInput[];
}): CashflowProjection {
  return generateCashflowProjection(input);
}

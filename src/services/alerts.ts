import { daysBetween, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CashflowAlert, CashflowProjection, ProjectionItem } from "@/types/cashflow";

export function generateCashflowAlerts(input: {
  projection: CashflowProjection;
  uncategorizedTransactionCount: number;
}): CashflowAlert[] {
  const alerts: CashflowAlert[] = [];
  const { projection } = input;

  if (projection.summary.firstNegativeBalanceDate) {
    const daysUntilNegative = Math.max(
      0,
      daysBetween(projection.days[0].date, projection.summary.firstNegativeBalanceDate)
    );
    alerts.push({
      code: "negative_cash",
      severity: "critical",
      message: `Caixa pode ficar negativo em ${daysUntilNegative} dias`,
      metadata: { daysUntilNegative }
    });
  }

  alerts.push({
    code: "lowest_balance",
    severity: projection.summary.lowestBalance < 0 ? "critical" : "warning",
    message: `Menor saldo projetado: ${formatMoney(projection.summary.lowestBalance)} em ${formatDate(
      projection.summary.lowestBalanceDate
    )}`,
    metadata: { lowestBalance: projection.summary.lowestBalance }
  });

  const next7DaysExpense = projection.days
    .slice(0, 7)
    .reduce((sum, day) => sum + day.expense, 0);

  if (next7DaysExpense > 0) {
    alerts.push({
      code: "next_7_days_expenses",
      severity: "info",
      message: `Saidas previstas nos proximos 7 dias: ${formatMoney(next7DaysExpense)}`,
      metadata: { expense: next7DaysExpense }
    });
  }

  const largestExpense = projection.days
    .flatMap((day) => day.items)
    .filter((item): item is ProjectionItem => item.type === "expense")
    .sort((a, b) => b.amount - a.amount)[0];

  if (largestExpense) {
    alerts.push({
      code: "largest_future_expense",
      severity: "info",
      message: `Maior despesa futura: ${largestExpense.description} em ${formatDate(largestExpense.date)}`,
      metadata: { amount: largestExpense.amount }
    });
  }

  if (input.uncategorizedTransactionCount > 0) {
    alerts.push({
      code: "uncategorized_transactions",
      severity: "warning",
      message: "Ha transacoes sem categoria que podem afetar a precisao",
      metadata: { count: input.uncategorizedTransactionCount }
    });
  }

  return alerts;
}

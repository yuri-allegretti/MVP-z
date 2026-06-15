import {
  addDays,
  addMonthsClamped,
  addYearsClamped,
  dateKey,
  eachDay,
  toDateOnly
} from "@/lib/dates";
import { roundMoney } from "@/lib/money";
import type {
  CashflowProjection,
  ProjectionHorizon,
  ProjectionItem,
  ProjectionRecurringInput,
  ProjectionScenario
} from "@/types/cashflow";

export function generateCashflowProjection(input: {
  startDate: Date;
  openingBalance: number;
  horizonDays: ProjectionHorizon;
  scenario: ProjectionScenario;
  recurringPatterns: ProjectionRecurringInput[];
  manualFutureItems?: ProjectionItem[];
}): CashflowProjection {
  const startDate = toDateOnly(input.startDate);
  const endDate = addDays(startDate, input.horizonDays - 1);
  const recurringItems = input.recurringPatterns
    .filter((pattern) => isPatternEligible(pattern, input.scenario))
    .flatMap((pattern) => expandRecurringPattern(pattern, startDate, endDate));
  const allItems = [...recurringItems, ...(input.manualFutureItems ?? [])];
  const itemsByDate = groupItemsByDate(allItems);

  let openingBalance = roundMoney(input.openingBalance);
  const days = eachDay(startDate, input.horizonDays).map((date) => {
    const items = itemsByDate.get(dateKey(date)) ?? [];
    const income = roundMoney(sumByType(items, "income"));
    const expense = roundMoney(sumByType(items, "expense"));
    const closingBalance = roundMoney(openingBalance + income - expense);
    const day = {
      date,
      openingBalance,
      income,
      expense,
      closingBalance,
      items
    };
    openingBalance = closingBalance;
    return day;
  });

  const lowestDay = days.reduce((lowest, day) =>
    day.closingBalance < lowest.closingBalance ? day : lowest
  );
  const firstNegativeDay = days.find((day) => day.closingBalance < 0) ?? null;

  return {
    scenario: input.scenario,
    horizonDays: input.horizonDays,
    days,
    summary: {
      lowestBalance: lowestDay.closingBalance,
      lowestBalanceDate: lowestDay.date,
      firstNegativeBalanceDate: firstNegativeDay?.date ?? null,
      totalIncome: roundMoney(days.reduce((sum, day) => sum + day.income, 0)),
      totalExpense: roundMoney(days.reduce((sum, day) => sum + day.expense, 0))
    }
  };
}

export function isPatternEligible(
  pattern: ProjectionRecurringInput,
  scenario: ProjectionScenario
): boolean {
  if (scenario === "conservative") {
    return pattern.status === "confirmed";
  }

  if (scenario === "likely") {
    return pattern.status === "confirmed" || (pattern.status === "suggested" && pattern.confidence >= 0.75);
  }

  if (pattern.status === "confirmed") {
    return true;
  }

  if (pattern.status === "suggested" && pattern.confidence >= 0.75) {
    return true;
  }

  return pattern.status === "suggested" && pattern.type === "income" && pattern.confidence >= 0.6;
}

export function expandRecurringPattern(
  pattern: ProjectionRecurringInput,
  startDate: Date,
  endDate: Date
): ProjectionItem[] {
  if (pattern.frequency === "unknown") {
    return [];
  }

  const items: ProjectionItem[] = [];
  let nextDate = toDateOnly(pattern.nextExpectedDate);

  while (nextDate < startDate) {
    nextDate = advanceRecurringDate(nextDate, pattern);
  }

  while (nextDate <= endDate) {
    items.push({
      recurringPatternId: pattern.id,
      date: nextDate,
      description: pattern.descriptionPattern,
      amount: roundMoney(pattern.averageAmount),
      type: pattern.type,
      confidence: pattern.confidence,
      source: "recurring_pattern"
    });
    nextDate = advanceRecurringDate(nextDate, pattern);
  }

  return items;
}

function advanceRecurringDate(date: Date, pattern: ProjectionRecurringInput): Date {
  if (pattern.frequency === "monthly") {
    return addMonthsClamped(date, 1, pattern.expectedDayOfMonth);
  }

  if (pattern.frequency === "weekly") {
    return addDays(date, 7);
  }

  if (pattern.frequency === "yearly") {
    return addYearsClamped(date, 1);
  }

  return date;
}

function groupItemsByDate(items: ProjectionItem[]): Map<string, ProjectionItem[]> {
  const grouped = new Map<string, ProjectionItem[]>();

  for (const item of items) {
    const key = dateKey(item.date);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return grouped;
}

function sumByType(items: ProjectionItem[], type: "income" | "expense"): number {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.amount, 0);
}

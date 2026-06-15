export type TransactionType = "income" | "expense";
export type AccountType = "checking" | "savings" | "cash" | "other";
export type CategoryType = "income" | "expense" | "both";
export type RuleField = "description" | "normalizedDescription";
export type RuleOperator = "contains" | "regex" | "equals";
export type RecurringFrequency = "weekly" | "monthly" | "yearly" | "unknown";
export type RecurringStatus = "suggested" | "confirmed" | "ignored";
export type ProjectionScenario = "conservative" | "likely" | "optimistic";
export type ProjectionHorizon = 30 | 60 | 90;

export interface CategorizationRuleInput {
  id: string;
  categoryId: string;
  field: RuleField;
  operator: RuleOperator;
  value: string;
  priority: number;
  confidence: number;
}

export interface TransactionForCategorization {
  id: string;
  description: string;
  normalizedDescription: string;
  categoryId: string | null;
  type: TransactionType;
}

export interface CategorizationResult {
  transactionId: string;
  categoryId: string | null;
  confidence: number | null;
  matchedRuleId: string | null;
}

export interface TransactionForRecurrence {
  id: string;
  accountId: string;
  categoryId: string | null;
  date: Date;
  normalizedDescription: string;
  amount: number;
  type: TransactionType;
}

export interface DetectedRecurringPattern {
  accountId: string | null;
  categoryId: string | null;
  merchantName: string | null;
  descriptionPattern: string;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  expectedDayOfMonth: number | null;
  expectedWeekday: number | null;
  confidence: number;
  nextExpectedDate: Date;
  status: "suggested";
  transactionIds: string[];
}

export interface ProjectionRecurringInput {
  id: string;
  descriptionPattern: string;
  averageAmount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  expectedDayOfMonth: number | null;
  expectedWeekday: number | null;
  nextExpectedDate: Date;
  confidence: number;
  status: RecurringStatus;
}

export interface ProjectionItem {
  id?: string;
  recurringPatternId?: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  confidence: number;
  source: "recurring_pattern" | "manual_future" | "accounts_payable" | "accounts_receivable";
}

export interface DailyCashflow {
  date: Date;
  openingBalance: number;
  income: number;
  expense: number;
  closingBalance: number;
  items: ProjectionItem[];
}

export interface ProjectionSummary {
  lowestBalance: number;
  lowestBalanceDate: Date;
  firstNegativeBalanceDate: Date | null;
  totalIncome: number;
  totalExpense: number;
}

export interface CashflowProjection {
  scenario: ProjectionScenario;
  horizonDays: ProjectionHorizon;
  days: DailyCashflow[];
  summary: ProjectionSummary;
}

export type CashflowAlertSeverity = "info" | "warning" | "critical";

export interface CashflowAlert {
  code:
    | "negative_cash"
    | "lowest_balance"
    | "next_7_days_expenses"
    | "largest_future_expense"
    | "uncategorized_transactions";
  severity: CashflowAlertSeverity;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
}

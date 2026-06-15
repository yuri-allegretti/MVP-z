import {
  addDays,
  addMonthsClamped,
  addYearsClamped,
  daysBetween,
  toDateOnly
} from "@/lib/dates";
import { roundMoney } from "@/lib/money";
import type {
  DetectedRecurringPattern,
  RecurringFrequency,
  TransactionForRecurrence
} from "@/types/cashflow";

const FINGERPRINT_STOPWORDS = new Set([
  "a",
  "automatico",
  "br",
  "brasil",
  "boleto",
  "cartao",
  "cliente",
  "comercial",
  "compra",
  "competencia",
  "credito",
  "debito",
  "doc",
  "eireli",
  "empresa",
  "enviada",
  "pix",
  "enviado",
  "epp",
  "fatura",
  "fiscal",
  "fornecedor",
  "janeiro",
  "jan",
  "fevereiro",
  "fev",
  "marco",
  "mar",
  "abril",
  "abr",
  "maio",
  "junho",
  "jun",
  "julho",
  "jul",
  "agosto",
  "ago",
  "setembro",
  "set",
  "outubro",
  "out",
  "novembro",
  "nov",
  "dezembro",
  "dez",
  "ltda",
  "me",
  "mei",
  "mensal",
  "mensalidade",
  "mes",
  "nf",
  "nfe",
  "nota",
  "pagamento",
  "pagto",
  "parcela",
  "parcelamento",
  "pedido",
  "plano",
  "recebida",
  "recebido",
  "recebimento",
  "ref",
  "referente",
  "s",
  "sa",
  "sala",
  "servico",
  "servicos",
  "empresarial",
  "funcionarios",
  "ted",
  "transferencia",
  "aluguel",
  "venda"
]);

type FingerprintedTransaction = {
  transaction: TransactionForRecurrence;
  fingerprint: string;
  tokens: string[];
};

type RecurrenceCluster = {
  bucketKey: string;
  items: FingerprintedTransaction[];
};

export type RecurrenceDetectionOptions = {
  minTokenJaccard?: number;
};

const DEFAULT_MIN_TOKEN_JACCARD = 0.6;

export function buildDescriptionFingerprint(normalizedDescription: string): string {
  return getFingerprintTokens(normalizedDescription)
    .slice(0, 6)
    .join(" ");
}

function getFingerprintTokens(normalizedDescription: string): string[] {
  return normalizedDescription
    .split(" ")
    .filter((token) => token.length > 1)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !FINGERPRINT_STOPWORDS.has(token))
    .slice(0, 8);
}

export function detectRecurringPatterns(
  transactions: TransactionForRecurrence[],
  options: RecurrenceDetectionOptions = {}
): DetectedRecurringPattern[] {
  const minTokenJaccard = options.minTokenJaccard ?? DEFAULT_MIN_TOKEN_JACCARD;
  const clusters: RecurrenceCluster[] = [];

  for (const transaction of [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())) {
    const fingerprint = buildDescriptionFingerprint(transaction.normalizedDescription);
    const tokenCount = fingerprint.split(" ").filter(Boolean).length;

    // Receitas variaveis nao devem virar recorrencia so por cair todo mes.
    if (!fingerprint || (transaction.type === "income" && tokenCount < 2)) {
      continue;
    }

    const categoryKey = transaction.categoryId ?? "uncategorized";
    const bucketKey = `${transaction.type}:${categoryKey}`;
    const item = {
      transaction,
      fingerprint,
      tokens: fingerprint.split(" ")
    };
    const cluster = findMatchingCluster(clusters, bucketKey, item, minTokenJaccard);

    if (cluster) {
      cluster.items.push(item);
    } else {
      clusters.push({
        bucketKey,
        items: [item]
      });
    }
  }

  const patterns: DetectedRecurringPattern[] = [];

  for (const cluster of clusters) {
    const group = cluster.items.map((item) => item.transaction);

    if (group.length < 3 || !hasConsistentType(group)) {
      continue;
    }

    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
    const intervals = sorted.slice(1).map((transaction, index) => daysBetween(sorted[index].date, transaction.date));
    const frequency = detectFrequency(sorted, intervals);

    if (frequency === "unknown") {
      continue;
    }

    const amounts = sorted.map((transaction) => transaction.amount);
    const averageAmount = average(amounts);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const amountVariation = (maxAmount - minAmount) / Math.max(averageAmount, 1);
    const valuesVaryLittle = amountVariation <= 0.2;
    const categoryId = getConsistentCategoryId(sorted);
    const accountId = getConsistentAccountId(sorted);
    const sameCategory = Boolean(categoryId);
    const descriptionPattern = buildClusterFingerprint(cluster.items);
    const datesRegular = true;
    const latestDate = toDateOnly(sorted[sorted.length - 1].date);
    const type = sorted[0].type;
    const expectedDayOfMonth =
      frequency === "monthly" ? Math.round(median(sorted.map((item) => item.date.getUTCDate()))) : null;
    const expectedWeekday =
      frequency === "weekly" ? mode(sorted.map((item) => item.date.getUTCDay())) : null;
    const nextExpectedDate = getNextExpectedDate(latestDate, frequency, expectedDayOfMonth);

    let confidence = 0;
    if (sorted.length >= 3) confidence += 0.3;
    if (datesRegular) confidence += 0.2;
    if (valuesVaryLittle) confidence += 0.2;
    if (sameCategory) confidence += 0.2;
    if (descriptionPattern.length > 0) confidence += 0.1;

    patterns.push({
      accountId,
      categoryId,
      merchantName: descriptionPattern.split(" ").slice(0, 4).join(" ") || null,
      descriptionPattern,
      averageAmount: roundMoney(averageAmount),
      minAmount: roundMoney(minAmount),
      maxAmount: roundMoney(maxAmount),
      type,
      frequency,
      expectedDayOfMonth,
      expectedWeekday,
      confidence: Math.min(roundMoney(confidence), 1),
      nextExpectedDate,
      status: "suggested",
      transactionIds: sorted.map((transaction) => transaction.id)
    });
  }

  return patterns;
}

function findMatchingCluster(
  clusters: RecurrenceCluster[],
  bucketKey: string,
  item: FingerprintedTransaction,
  minTokenJaccard: number
): RecurrenceCluster | undefined {
  return clusters.find(
    (cluster) =>
      cluster.bucketKey === bucketKey &&
      cluster.items.some((existing) => jaccardSimilarity(existing.tokens, item.tokens) >= minTokenJaccard)
  );
}

function jaccardSimilarity(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersectionSize = [...leftSet].filter((token) => rightSet.has(token)).length;
  const unionSize = new Set([...leftSet, ...rightSet]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function buildClusterFingerprint(items: FingerprintedTransaction[]): string {
  const tokenCounts = new Map<string, number>();
  const firstSeenOrder = new Map<string, number>();
  const minOccurrences = Math.ceil(items.length * 0.6);

  items.forEach((item, itemIndex) => {
    const uniqueTokens = new Set(item.tokens);

    for (const token of uniqueTokens) {
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);

      if (!firstSeenOrder.has(token)) {
        firstSeenOrder.set(token, itemIndex * 100 + item.tokens.indexOf(token));
      }
    }
  });

  const stableTokens = [...tokenCounts.entries()]
    .filter(([, count]) => count >= minOccurrences)
    .map(([token]) => token)
    .sort((a, b) => (firstSeenOrder.get(a) ?? 0) - (firstSeenOrder.get(b) ?? 0))
    .slice(0, 6);

  return stableTokens.length > 0 ? stableTokens.join(" ") : items[0].fingerprint;
}

function detectFrequency(
  transactions: TransactionForRecurrence[],
  intervals: number[]
): RecurringFrequency {
  if (intervals.length === 0) {
    return "unknown";
  }

  const distinctMonths = new Set(
    transactions.map((transaction) => `${transaction.date.getUTCFullYear()}-${transaction.date.getUTCMonth()}`)
  ).size;
  const daysOfMonth = transactions.map((transaction) => transaction.date.getUTCDate());
  const dayWindow = Math.max(...daysOfMonth) - Math.min(...daysOfMonth);
  const monthlyIntervals = intervals.filter((interval) => interval >= 25 && interval <= 35);

  if (distinctMonths >= 3 && monthlyIntervals.length / intervals.length >= 0.75 && dayWindow <= 3) {
    return "monthly";
  }

  const averageInterval = average(intervals);
  const weeklyIntervals = intervals.filter((interval) => interval >= 6 && interval <= 8);

  if (averageInterval >= 6 && averageInterval <= 8 && weeklyIntervals.length / intervals.length >= 0.75) {
    return "weekly";
  }

  return "unknown";
}

function getNextExpectedDate(
  latestDate: Date,
  frequency: RecurringFrequency,
  expectedDayOfMonth: number | null
): Date {
  if (frequency === "monthly") {
    return addMonthsClamped(latestDate, 1, expectedDayOfMonth);
  }

  if (frequency === "weekly") {
    return addDays(latestDate, 7);
  }

  if (frequency === "yearly") {
    return addYearsClamped(latestDate, 1);
  }

  return latestDate;
}

function hasConsistentType(transactions: TransactionForRecurrence[]): boolean {
  return new Set(transactions.map((transaction) => transaction.type)).size === 1;
}

function getConsistentAccountId(transactions: TransactionForRecurrence[]): string | null {
  const ids = new Set(transactions.map((transaction) => transaction.accountId));
  return ids.size === 1 ? transactions[0].accountId : null;
}

function getConsistentCategoryId(transactions: TransactionForRecurrence[]): string | null {
  const ids = new Set(transactions.map((transaction) => transaction.categoryId).filter(Boolean));
  return ids.size === 1 ? transactions.find((transaction) => transaction.categoryId)?.categoryId ?? null : null;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

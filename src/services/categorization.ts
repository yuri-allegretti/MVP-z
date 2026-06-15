import { normalizeDescription } from "@/services/normalization";
import type {
  CategorizationResult,
  CategorizationRuleInput,
  TransactionForCategorization
} from "@/types/cashflow";

export function categorizeTransactions(
  transactions: TransactionForCategorization[],
  rules: CategorizationRuleInput[]
): CategorizationResult[] {
  const orderedRules = [...rules].sort((a, b) => a.priority - b.priority);
  const results: CategorizationResult[] = [];

  for (const transaction of transactions) {
    if (transaction.categoryId) {
      continue;
    }

    const matchedRule = orderedRules.find((rule) => {
      const fieldValue =
        rule.field === "description" ? transaction.description : transaction.normalizedDescription;
      return matchesRule(fieldValue, rule);
    });

    results.push({
      transactionId: transaction.id,
      categoryId: matchedRule?.categoryId ?? null,
      confidence: matchedRule?.confidence ?? null,
      matchedRuleId: matchedRule?.id ?? null
    });
  }

  return results;
}

function matchesRule(input: string, rule: CategorizationRuleInput): boolean {
  const fieldValue = normalizeDescription(input);
  const ruleValue = normalizeDescription(rule.value);

  if (rule.operator === "contains") {
    return fieldValue.includes(ruleValue);
  }

  if (rule.operator === "equals") {
    return fieldValue === ruleValue;
  }

  if (rule.operator === "regex") {
    assertSimpleRegex(rule.value);
    return new RegExp(rule.value, "i").test(input);
  }

  return false;
}

function assertSimpleRegex(pattern: string): void {
  if (pattern.length > 120) {
    throw new Error(`Regex muito longo para regra de categorizacao: ${pattern}`);
  }

  if (/\([^)]*[+*][^)]*\)[+*]/.test(pattern)) {
    throw new Error(`Regex com quantificador aninhado nao permitido: ${pattern}`);
  }
}

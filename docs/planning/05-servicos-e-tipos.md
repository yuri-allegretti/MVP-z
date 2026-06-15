# Servicos, funcoes e tipos principais

Este arquivo descreve assinaturas e contratos. A implementacao deve ficar para uma fase posterior.

## Tipos base

```ts
export type TransactionType = "income" | "expense";
export type AccountType = "checking" | "savings" | "cash" | "other";
export type CategoryType = "income" | "expense" | "both";
export type RuleField = "description" | "normalizedDescription";
export type RuleOperator = "contains" | "regex" | "equals";
export type RecurringFrequency = "weekly" | "monthly" | "yearly" | "unknown";
export type RecurringStatus = "suggested" | "confirmed" | "ignored";
export type ProjectionScenario = "conservative" | "likely" | "optimistic";
export type ProjectionHorizon = 30 | 60 | 90;
```

## Tipos de categorizacao

```ts
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
```

## Tipos de recorrencia

```ts
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
```

## Tipos de projecao

```ts
export interface ProjectionRecurringInput {
  id: string;
  descriptionPattern: string;
  averageAmount: number;
  frequency: RecurringFrequency;
  expectedDayOfMonth: number | null;
  expectedWeekday: number | null;
  nextExpectedDate: Date;
  confidence: number;
  status: RecurringStatus;
  type: TransactionType;
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
```

## Tipos de alertas

```ts
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
```

## Funcoes principais

### normalizeDescription()

```ts
export function normalizeDescription(input: string): string;
```

Contrato:

- converter para lowercase;
- remover acentos;
- remover pontuacao e caracteres especiais desnecessarios;
- remover numeros soltos quando forem claramente identificadores;
- remover espacos duplicados;
- preservar palavras uteis como nome de fornecedor, banco, categoria e canal.

Exemplo:

```txt
PIX ENVIADO - IMOBILIARIA SAO JOSE LTDA 12345
=> pix enviado imobiliaria sao jose ltda
```

### categorizeTransactions()

```ts
export function categorizeTransactions(
  transactions: TransactionForCategorization[],
  rules: CategorizationRuleInput[]
): CategorizationResult[];
```

Contrato:

- processar apenas transacoes sem `categoryId`;
- ordenar regras por `priority` crescente;
- comparar contra `description` ou `normalizedDescription`;
- suportar `contains`, `equals` e `regex`;
- regex invalido deve gerar erro claro ou ser ignorado com log controlado no servidor, nunca falhar silenciosamente;
- retornar categoria e confianca da primeira regra que casar;
- retornar `categoryId = null` quando nenhuma regra casar.

### detectRecurringPatterns()

```ts
export function detectRecurringPatterns(
  transactions: TransactionForRecurrence[]
): DetectedRecurringPattern[];
```

Contrato:

- agrupar por descricao normalizada parecida e categoria quando existir;
- considerar apenas grupos com 3 ou mais ocorrencias;
- persistir `type` com base no tipo consistente das transacoes do grupo;
- detectar mensal com intervalos aproximados de 25 a 35 dias e tolerancia de ate 3 dias no dia do mes;
- detectar semanal com intervalo medio de 6 a 8 dias;
- para receitas, exigir fingerprint muito consistente; nao criar recorrencia apenas porque varias receitas caem todo mes;
- calcular valor medio, minimo e maximo;
- calcular dia esperado do mes por mediana dos dias;
- calcular confidence conforme regra definida;
- evitar duplicatas por `organizationId`, `accountId`, `categoryId`, `descriptionPattern`, `frequency` e `type` no momento de persistir;
- retornar apenas patterns com frequencia diferente de `unknown` ou confidence suficiente para revisao manual.

### generateCashflowProjection()

```ts
export function generateCashflowProjection(input: {
  startDate: Date;
  openingBalance: number;
  horizonDays: ProjectionHorizon;
  scenario: ProjectionScenario;
  recurringPatterns: ProjectionRecurringInput[];
  manualFutureItems?: ProjectionItem[];
}): CashflowProjection;
```

Contrato:

- criar uma linha por dia;
- gerar itens futuros a partir das recorrencias elegiveis;
- calcular tudo em memoria na V1, sem depender de `ProjectedCashflowItem`;
- somar receitas e despesas por dia;
- calcular saldo de abertura e fechamento encadeado;
- calcular resumo final.

### generateCashflowAlerts()

```ts
export function generateCashflowAlerts(input: {
  projection: CashflowProjection;
  uncategorizedTransactionCount: number;
}): CashflowAlert[];
```

Contrato:

- alertar primeira data negativa;
- alertar menor saldo projetado;
- somar saidas dos proximos 7 dias;
- identificar maior despesa futura;
- alertar transacoes sem categoria.

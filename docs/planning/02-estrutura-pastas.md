# Estrutura de pastas recomendada

Estrutura simples, sem camadas desnecessarias:

```txt
.
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  ├─ transactions/
│  │  │  └─ page.tsx
│  │  ├─ recurring/
│  │  │  └─ page.tsx
│  │  ├─ projection/
│  │  │  └─ page.tsx
│  │  ├─ import/
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ alerts-list.tsx
│  │  ├─ category-select.tsx
│  │  ├─ projection-table.tsx
│  │  ├─ recurring-table.tsx
│  │  └─ transactions-table.tsx
│  ├─ lib/
│  │  ├─ active-organization.ts
│  │  ├─ db.ts
│  │  ├─ money.ts
│  │  └─ dates.ts
│  ├─ schemas/
│  │  ├─ transaction.schema.ts
│  │  ├─ correction.schema.ts
│  │  ├─ recurring.schema.ts
│  │  └─ import.schema.ts
│  ├─ services/
│  │  ├─ normalization.ts
│  │  ├─ categorization.ts
│  │  ├─ recurrence.ts
│  │  ├─ projection.ts
│  │  └─ alerts.ts
│  ├─ server/
│  │  ├─ transactions.actions.ts
│  │  ├─ recurring.actions.ts
│  │  ├─ projection.queries.ts
│  │  └─ import.actions.ts
│  └─ types/
│     ├─ cashflow.ts
│     ├─ categorization.ts
│     └─ recurrence.ts
├─ tests/
│  ├─ normalization.test.ts
│  ├─ categorization.test.ts
│  ├─ recurrence.test.ts
│  ├─ projection.test.ts
│  └─ alerts.test.ts
└─ docs/
   └─ planning/
```

## Regras de organizacao do codigo

- `services/`: funcoes puras ou quase puras de regra de negocio.
- `server/`: server actions ou queries que chamam Prisma e validam entrada.
- `schemas/`: Zod schemas para entradas vindas da UI.
- `lib/active-organization.ts`: ponto unico para obter `activeOrganizationId` mockado no MVP.
- `components/`: componentes simples, sem regra de negocio pesada.
- `types/`: tipos compartilhados que nao dependem diretamente do Prisma Client.

## Multi-tenant no MVP

Mesmo sem autenticacao robusta, todas as queries de negocio devem filtrar por `organizationId`.

Criar uma funcao centralizada:

```ts
export async function getActiveOrganizationId(): Promise<string> {
  // MVP: retorna a organizacao seedada ou uma env var.
  // Futuro: usar sessao/autenticacao.
}
```

Regra pratica:

- Query de Account: filtrar por `organizationId`.
- Query de Transaction: filtrar por `organizationId`.
- Query de RecurringPattern: filtrar por `organizationId`.
- Query de ProjectedCashflowItem: filtrar por `organizationId`.
- Mutacao de categoria/correcao: validar se a transacao pertence ao mesmo `organizationId`.
- Categorias e regras de categorizacao da V1 sempre devem ter `organizationId`. Nao criar defaults globais nesta versao.

## Saldo atual

Usar uma funcao unica para obter o saldo atual:

```ts
export async function getCurrentAccountBalance(accountId: string): Promise<number> {
  // MVP: initialBalance + totalIncome - totalExpense
  // Sempre filtrar a conta e as transacoes por activeOrganizationId.
}
```

`Account.currentBalance` pode existir no schema para leitura rapida futura, mas a V1 nao deve depender dele como fonte da verdade, porque pode ficar desatualizado apos importacoes ou ajustes.

## Validacao

Usar Zod nos limites do sistema:

- criar transacao;
- importar CSV;
- corrigir categoria;
- confirmar ou ignorar recorrencia;
- solicitar projecao com horizonte/cenario.

Nao confiar no client para:

- `organizationId`;
- `accountId`;
- `categoryId`;
- `transactionId`;
- valores monetarios;
- tipo income/expense.

O server deve verificar existencia e pertencimento a organizacao antes de gravar.

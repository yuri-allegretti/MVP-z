# UI minima, fluxos e seguranca

## Rotas

### `/dashboard`

Conteudo:

- saldo atual da conta principal;
- cards simples de projecao para 30, 60 e 90 dias;
- alertas basicos;
- tabela curta com saldo projetado dos proximos dias;
- link para projecao detalhada.

Dados:

- `getActiveOrganizationId()`;
- conta principal da organizacao;
- recorrencias relevantes;
- contagem de transacoes sem categoria;
- projecao provavel como default.

### `/transactions`

Conteudo:

- tabela com data, descricao, valor, tipo, categoria e origem;
- filtros por categoria, tipo e intervalo de datas;
- select para editar categoria.

Fluxo de correcao:

```txt
usuario altera categoria
server action valida transactionId e categoryId
server verifica se ambos pertencem ao activeOrganizationId
server grava UserCorrection com oldCategoryId e newCategoryId
server atualiza Transaction.categoryId
server opcionalmente retorna sugestao de regra baseada na normalizedDescription
```

Nao criar regra automaticamente na V1.0. Apenas sugerir na UI ou deixar TODO.

### `/recurring`

Conteudo:

- lista de recorrencias detectadas;
- descricao;
- categoria;
- valor medio;
- frequencia;
- proxima data estimada;
- confianca;
- status;
- botoes Confirmar e Ignorar.

Fluxos:

```txt
Confirmar:
  validar patternId
  filtrar por organizationId
  update status = confirmed

Ignorar:
  validar patternId
  filtrar por organizationId
  update status = ignored
```

### `/projection`

Conteudo:

- seletor de horizonte: 30, 60, 90;
- seletor de cenario: conservador, provavel, otimista;
- tabela diaria:
  - data;
  - saldo inicial;
  - entradas;
  - saidas;
  - saldo final;
  - itens do dia.

Default:

- horizonte: 30;
- cenario: provavel.

### `/import`

Conteudo V1.0:

- formulario manual de transacao;
- textarea para colar CSV com colunas `date,description,amount,type`.

CSV esperado:

```csv
date,description,amount,type
2026-01-05,ALUGUEL SALA COMERCIAL,8500.00,expense
2026-01-10,PIX RECEBIDO CLIENTE A,12000.00,income
```

Fluxo:

```txt
usuario envia formulario ou CSV
server valida com Zod
server normaliza descricao
server grava transacoes com organizationId e accountId
server pode chamar categorizacao apos import
server nao depende de currentBalance; saldo atual vem de funcao centralizada
```

Upload de arquivo pode ficar para depois se textarea CSV for suficiente para validar a logica.

## Server actions/API routes

Recomendacao: usar server actions simples se o projeto estiver em App Router.

Actions/queries:

- `createManualTransactionAction(input)`
- `importCsvTransactionsAction(input)`
- `runCategorizationAction()`
- `updateTransactionCategoryAction(input)`
- `runRecurringDetectionAction()`
- `updateRecurringStatusAction(input)`
- `getProjectionQuery(input)`

Cada action deve:

- obter `activeOrganizationId` no servidor;
- validar input com Zod;
- verificar pertencimento dos ids recebidos;
- retornar erro claro quando input for invalido;
- nunca confiar em `organizationId` vindo do client.

## Zod schemas

Exemplos de contratos:

```ts
createTransactionSchema:
  accountId: string cuid/uuid
  date: coerce date
  description: string min 1
  amount: positive number
  type: enum income/expense

updateCategorySchema:
  transactionId: string
  newCategoryId: string

recurringStatusSchema:
  recurringPatternId: string
  status: enum confirmed/ignored

projectionInputSchema:
  horizonDays: enum 30/60/90
  scenario: enum conservative/likely/optimistic
```

## Seguranca minima

Obrigatorio:

- nao expor `DATABASE_URL` ou secrets no frontend;
- Prisma Client apenas no servidor;
- sempre filtrar por `organizationId`;
- categorias e regras sempre devem ter `organizationId` na V1;
- validar input com Zod;
- tratar erros de regex invalido;
- evitar queries amplas sem limite em telas de tabela;
- usar Decimal no banco e converter com cuidado para number nos algoritmos;
- nao aceitar valores negativos para `amount` se `type` ja define entrada/saida;
- formatar dinheiro apenas na camada de apresentacao.

## Saldo atual

Para evitar inconsistencia no MVP, usar uma funcao unica:

- `getCurrentAccountBalance(accountId)`;
- buscar a conta pelo `activeOrganizationId`;
- somar receitas e despesas da conta;
- retornar `initialBalance + incomeTotal - expenseTotal`.

`Account.currentBalance` pode ser atualizado por conveniencia, mas a UI e a projecao devem preferir a funcao calculada sob demanda. Nao tentar manter ledger complexo na V1.0.

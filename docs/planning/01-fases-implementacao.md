# Fases de implementacao

## Fase 1 - Schema + seed

Objetivo: ter banco, modelos multi-tenant preparados e dados ficticios bons o suficiente para demonstrar o produto.

Entregas:

- Criar app Next.js com TypeScript, Prisma, Postgres, Tailwind se fizer sentido.
- Configurar `DATABASE_URL`, Prisma Client e migracao inicial.
- Criar schema com User, Organization, Membership, Account, Transaction, Category, CategorizationRule, RecurringPattern, ProjectedCashflowItem e UserCorrection.
- Em `RecurringPattern`, incluir `type` para a projecao saber se a recorrencia e receita ou despesa.
- Para V1, categorias e regras devem sempre ter `organizationId`; nao usar categorias globais.
- Criar seed com 1 usuario, 1 organizacao, 1 membership owner, 1 conta e categorias/regras padrao.
- Criar pelo menos 6 meses de transacoes ficticias.

Criterio de aceite:

- `prisma migrate dev` aplica o schema.
- `prisma db seed` carrega dados.
- Existem transacoes mensais, variaveis e nao categorizaveis.

## Fase 2 - Transacoes + normalizacao

Objetivo: cadastrar/importar transacoes e gerar `normalizedDescription`.

Entregas:

- Funcao pura `normalizeDescription()`.
- Cadastro manual de transacao via server action ou API route.
- Import simples por textarea/manual paste com CSV `date,description,amount,type`.
- Validacao Zod para input de transacao.
- Persistencia com `organizationId` e `accountId` obrigatorios.

Criterio de aceite:

- Uma transacao criada manualmente aparece na lista.
- Uma linha CSV valida cria transacao.
- `rawDescription` e `normalizedDescription` sao preenchidos.

## Fase 3 - Categorizacao

Objetivo: aplicar regras simples e deixar sem categoria quando nenhuma regra casar.

Entregas:

- Servico `categorizeTransactions()`.
- Busca transacoes sem categoria por `organizationId`.
- Ordena regras por `priority`.
- Aplica `contains`, depois `equals`, depois `regex` simples.
- Atualiza `categoryId` e `categoryConfidence`.
- Mantem sem categoria quando nenhuma regra casar.

Criterio de aceite:

- `darf` vira Impostos.
- `aws`, `google`, `microsoft` e `vercel` viram Software.
- Transacoes desconhecidas continuam sem categoria.

## Fase 4 - Recorrencia

Objetivo: detectar padroes recorrentes simples sem IA.

Entregas:

- Servico `detectRecurringPatterns()`.
- Agrupamento por categoria + assinatura simples da descricao normalizada.
- Frequencia mensal, semanal ou unknown.
- Calculo de valor medio, minimo, maximo, confidence e proxima data esperada.
- Persistencia do `type` da recorrencia com base no tipo consistente das transacoes do grupo.
- Protecao contra recorrencias duplicadas usando `organizationId`, `accountId`, `categoryId`, `descriptionPattern`, `frequency` e `type`.
- Persistencia como `status = suggested`.
- Tela `/recurring` para confirmar ou ignorar.

Criterio de aceite:

- Aluguel mensal com 6 ocorrencias vira recorrencia suggested.
- Transacoes aleatorias de fornecedor nao viram recorrencia se nao tiverem 3 ocorrencias regulares.
- Confirmar altera status para `confirmed`.
- Ignorar altera status para `ignored`.

## Fase 5 - Projecao

Objetivo: gerar fluxo de caixa diario para 30, 60 e 90 dias.

Entregas:

- Servico `generateCashflowProjection()`.
- Cenarios:
  - conservador: apenas recorrencias confirmed;
  - provavel: confirmed + suggested com confidence >= 0.75;
  - otimista: confirmed + suggested com confidence >= 0.75 + receitas suggested com confidence >= 0.6.
- Output diario com openingBalance, income, expense, closingBalance e items.
- Metricas: menor saldo, data do menor saldo, primeira data negativa, total de entradas e total de saidas.

Criterio de aceite:

- Projecao de 30, 60 e 90 dias retorna linhas diarias.
- Saldo de fechamento de um dia vira saldo de abertura do dia seguinte.
- Despesas reduzem saldo e receitas aumentam saldo.
- Projecao e calculada em memoria na V1; `ProjectedCashflowItem` nao e requisito para gerar a projecao.

## Fase 6 - UI minima

Objetivo: permitir validacao manual do fluxo completo.

Entregas:

- `/dashboard`: saldo atual, alertas, resumo de projecao 30/60/90 e tabela simples.
- `/transactions`: tabela, filtros simples e edicao de categoria.
- `/recurring`: recorrencias detectadas, confirmar e ignorar.
- `/projection`: tabela diaria com seletor de horizonte e cenario.
- `/import`: cadastro manual e textarea CSV simples.

Criterio de aceite:

- Usuario consegue navegar entre as telas principais.
- Editar categoria cria UserCorrection e altera a categoria da transacao.
- Confirmar recorrencia afeta o cenario conservador.

## Fase 7 - Testes e ajustes

Objetivo: proteger a logica principal contra regressao.

Entregas:

- Testes unitarios das funcoes puras.
- Testes de integracao leves para actions/API principais.
- Ajustes de seed para demonstrar alertas e recorrencias.

Criterio de aceite:

- Testes minimos passam.
- Projeto roda localmente.
- Fluxo completo da definicao de pronto funciona com dados seed.

# Relatorio de analise: demora em trocas de tela

Data: 2026-06-15

## Objetivo do relatorio

Este relatorio registra a analise solicitada sobre o projeto MVP de fluxo de caixa, com foco especifico no problema de demora ao trocar de telas. A pergunta inicial sobre o algoritmo foi usada apenas como contexto para separar duas hipoteses:

- se a demora vinha do motor de negocio;
- se a demora vinha do caminho de renderizacao, banco e queries.

A conclusao principal e que a lentidao percebida nas trocas de tela nao parece ser causada pelo algoritmo puro de projecao/categorizacao/recorrencia. O principal gargalo observado esta no carregamento server-side das rotas dinamicas, combinado com banco remoto Supabase e consultas repetidas, especialmente no dashboard.

## O que foi solicitado

Foi solicitado:

- analisar o projeto e os documentos de planejamento;
- considerar que se trata de um MVP;
- entender para que serve o algoritmo e se ele e eficiente;
- investigar por que ha grande demora ao trocar de telas clicando nos botoes/links;
- produzir um relatorio para fornecer contexto ao agente de planejamento que corrigira os problemas.

Este documento prioriza a demora em navegacao. A avaliacao do algoritmo aparece apenas como contexto tecnico.

## O que foi analisado

Foram analisados:

- documentos em `docs/planning/`;
- rotas Next em `src/app/`;
- queries e server actions em `src/server/`;
- funcoes de negocio em `src/services/`;
- acesso Prisma em `src/lib/db.ts`, `src/lib/balance.ts` e `src/lib/active-organization.ts`;
- schema Prisma em `prisma/schema.prisma`;
- seed em `prisma/seed.ts`;
- testes unitarios em `tests/`;
- configuracao de ambiente de forma redigida, sem expor secrets.

Tambem foram executadas validacoes locais:

- `npm test`: passou, 5 arquivos de teste e 9 testes.
- `npm run build`: passou.

O build confirmou que as telas principais sao renderizadas dinamicamente sob demanda.

## Evidencias coletadas

### Banco remoto

O `.env` aponta para Supabase remoto:

```txt
DATABASE_URL host=aws-1-us-east-2.pooler.supabase.com scheme=postgresql
DIRECT_URL host=aws-1-us-east-2.pooler.supabase.com scheme=postgresql
```

Isso significa que cada rota dinamica que consulta Prisma paga latencia de rede ate o banco.

### Rotas dinamicas

As rotas principais usam renderizacao dinamica forcada:

- `src/app/dashboard/page.tsx`
- `src/app/transactions/page.tsx`
- `src/app/recurring/page.tsx`
- `src/app/projection/page.tsx`
- `src/app/import/page.tsx`

Cada uma declara:

```ts
export const dynamic = "force-dynamic";
```

Impacto: cada clique para uma dessas paginas precisa passar pelo servidor, executar queries Prisma e renderizar a resposta. A navegacao nao e apenas client-side.

### Medicoes reais observadas

Foram feitas chamadas diretas as funcoes/queries usadas pelas paginas, usando o banco remoto configurado:

| Tela / operacao | Tempo observado aproximado |
| --- | ---: |
| Dashboard (`getDashboardData`) | 29,7s |
| Projecao 30 dias (`getProjectionData`) | 9,2s |
| Transacoes | 5,2s |
| Recorrencias | 4,9s |
| Importacao | 4,0s |

Esses tempos explicam a sensacao de travamento ao trocar de telas.

## Causa raiz mais provavel

### 1. Dashboard multiplica queries pesadas

O dashboard chama:

```ts
const projection30 = await getProjectionData({ horizonDays: 30, scenario: "likely" });
const projection60 = await getProjectionData({ horizonDays: 60, scenario: "likely" });
const projection90 = await getProjectionData({ horizonDays: 90, scenario: "likely" });
```

Arquivo: `src/server/projection.queries.ts`.

Problema: cada chamada a `getProjectionData()` refaz o carregamento de dados base:

- busca organizacao ativa;
- busca conta principal;
- recalcula saldo;
- busca recorrencias;
- gera a projecao.

Como isso acontece tres vezes em serie, o dashboard paga varias idas ao banco remoto para dados que poderiam ser carregados uma unica vez.

### 2. Saldo atual recalculado repetidamente

`getPrimaryAccountWithBalance()` chama `getCurrentAccountBalance()`.

`getCurrentAccountBalance()` faz:

- `account.findFirst`;
- `transaction.aggregate` para receitas;
- `transaction.aggregate` para despesas.

Arquivo: `src/lib/balance.ts`.

Isso e correto para a fonte da verdade do MVP, mas caro quando chamado varias vezes na mesma renderizacao, principalmente contra banco remoto.

No dashboard atual, o saldo e buscado uma vez diretamente em `getDashboardData()` e depois novamente dentro de cada `getProjectionData()`.

### 3. Organizacao ativa pode gerar lookup extra

`getActiveOrganizationId()` usa `process.env.ACTIVE_ORGANIZATION_ID` se existir. Caso contrario, executa:

```ts
prisma.organization.findFirst(...)
```

Arquivo: `src/lib/active-organization.ts`.

Se `ACTIVE_ORGANIZATION_ID` nao estiver configurado, cada fluxo que pede a organizacao ativa pode adicionar uma query extra.

### 4. Paginas simples tambem dependem do banco

Mesmo telas simples como `import`, `recurring` e `transactions` precisam consultar o banco no servidor. Como o banco e remoto, elas ainda ficaram na faixa de 4s a 5s nas medicoes.

Isso nao indica algoritmo pesado. Indica latencia e round trips de banco em toda navegacao dinamica.

### 5. Server actions podem ter gargalos adicionais

As acoes manuais tambem podem ficar lentas em alguns casos:

- `categorizePendingTransactions()` busca transacoes e regras, depois atualiza cada transacao categorizada em loop sequencial.
- `runRecurringDetectionAction()` busca todas as transacoes, detecta patterns e faz `findFirst` + `update/create` em loop sequencial.

Arquivos:

- `src/server/transactions.actions.ts`
- `src/server/recurring.actions.ts`

Esses pontos afetam principalmente os botoes "Categorizar pendentes" e "Detectar recorrencias", nao necessariamente uma navegacao simples por link. Ainda assim, eles podem reforcar a percepcao de demora quando acionados pela UI.

## Avaliacao contextual do algoritmo

Para o escopo de MVP, o algoritmo e adequado e relativamente barato:

- normalizacao e linear no tamanho da string;
- categorizacao e proporcional a `transacoes x regras`;
- recorrencia agrupa transacoes e calcula regularidade;
- projecao trabalha com no maximo 90 dias e poucos patterns.

A projecao em memoria, em `src/services/projection.ts`, nao e o gargalo principal observado.

Pontos de qualidade do algoritmo que foram observados, mas nao sao o foco deste relatorio:

- o aluguel esperado no seed nao apareceu como recorrencia no banco demo atual, provavelmente porque descricoes diferentes geraram fingerprints diferentes;
- uma transacao de marketing com `GOOGLE ADS` foi categorizada como Software por causa da regra generica `google -> Software`;
- isso mostra que a qualidade das regras/fingerprints ainda e simples, aceitavel para MVP, mas precisa evoluir para dados reais.

## Conclusoes

1. A demora de troca de telas tem causa tecnica clara: rotas dinamicas renderizadas no servidor + banco Supabase remoto + repeticao de queries.

2. O dashboard e o principal problema: ele recalcula os mesmos dados de base tres vezes, uma para cada horizonte de projecao.

3. O algoritmo puro nao parece ser o causador principal da lentidao. Ele e pequeno e adequado para MVP.

4. Mesmo sem corrigir algoritmo, a experiencia pode melhorar bastante reduzindo round trips de banco e removendo duplicacao de carregamento.

5. O projeto esta em bom formato para uma correcao incremental, porque a regra de negocio ja esta separada em services e as queries estao concentradas em poucos arquivos.

## Recomendacoes para o agente de planejamento

### Prioridade 0: otimizar o dashboard

Refatorar `getDashboardData()` para:

- buscar `organizationId` uma unica vez;
- buscar conta + saldo uma unica vez;
- buscar recorrencias uma unica vez;
- gerar as projecoes 30/60/90 em memoria a partir dos mesmos dados ja carregados.

Evitar chamar `getProjectionData()` tres vezes dentro do dashboard.

### Prioridade 1: reduzir queries repetidas de organizacao

Configurar `ACTIVE_ORGANIZATION_ID` no `.env` ou criar um mecanismo simples de cache server-side por request/processo para o MVP.

Como a V1 usa organizacao mockada, essa otimizacao e coerente com o escopo.

### Prioridade 2: revisar renderizacao dinamica

Manter rotas dinamicas onde necessario, mas avaliar:

- remover `force-dynamic` onde a rota puder tolerar cache/revalidate;
- usar `loading.tsx` nas rotas principais para feedback imediato;
- usar `Suspense` em secoes pesadas como tabelas e dashboard.

Mesmo que as queries continuem lentas, a UI nao deve parecer congelada.

### Prioridade 3: melhorar server actions de lote

Para categorizacao:

- aplicar updates em transacao Prisma ou `Promise.all` com limite;
- considerar `updateMany` quando varias transacoes recebem a mesma categoria.

Para recorrencias:

- carregar patterns existentes uma vez;
- deduplicar em memoria;
- reduzir `findFirst` por pattern dentro do loop.

### Prioridade 4: ambiente local para desenvolvimento

Para desenvolvimento e validacao de UX, usar Postgres local ou um Supabase/regiao com menor latencia. O banco remoto atual adiciona segundos mesmo em paginas simples.

## Criterios de aceite sugeridos apos correcao

Para considerar o problema de demora tratado no MVP:

- dashboard carregar em tempo muito menor que o baseline observado de 29,7s;
- `getDashboardData()` nao chamar `getProjectionData()` tres vezes;
- navegacao para paginas simples ficar abaixo de 1s a 2s em ambiente local;
- se banco remoto continuar sendo usado, exibir estado de loading imediatamente;
- testes existentes continuarem passando;
- `npm run build` continuar passando.


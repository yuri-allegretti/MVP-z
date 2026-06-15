# Fluxo de Caixa MVP

MVP web para validar logica de fluxo de caixa empresarial: transacoes, normalizacao, categorizacao por regras, recorrencias e projecao 30/60/90 dias.

## Stack

- Next.js + TypeScript
- Prisma ORM
- Postgres
- Zod
- Vitest

## Como rodar localmente

1. Configure o banco Postgres e crie `.env` a partir de `.env.example`.

Para Supabase, use:

- `DATABASE_URL`: URL pooler para o app.
- `DIRECT_URL`: URL direta do banco, porta 5432, para Prisma sincronizar schema.
2. Instale dependencias:

```bash
npm install
```

3. Gere o Prisma Client e sincronize o schema:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Neste MVP, `prisma:migrate` usa `prisma db push --accept-data-loss`. Isso evita friccao com migrations versionadas durante a validacao. Quando o projeto evoluir para producao, trocar para migrations versionadas.

4. Carregue dados ficticios:

```bash
npm run prisma:seed
```

Opcional, mas recomendado no MVP: depois do seed, preencha `ACTIVE_ORGANIZATION_ID`
no `.env` com o id da organizacao demo. Se a variavel ficar vazia, o app ainda
busca a primeira organizacao e guarda esse id em memoria no processo, mas a
variavel evita esse lookup extra.

5. Rode o app:

```bash
npm run dev
```

Abra `http://localhost:3000/dashboard`.

## Validacao

```bash
npm test
npm run build
```

## Observacoes de escopo

- Nao ha autenticacao robusta na V1.
- Todas as categorias e regras seedadas pertencem a uma organizacao.
- O saldo atual usado pela UI e pela projecao e calculado sob demanda a partir de `initialBalance + incomes - expenses`.
- A tabela `ProjectedCashflowItem` existe no schema, mas a projecao da V1 e calculada em memoria.

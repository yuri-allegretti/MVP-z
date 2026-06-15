# Plano de correcao: demora em trocas de tela

Data: 2026-06-15

Relatorio base: `docs/reports/2026-06-15-demora-troca-telas.md`

## Objetivo

Reduzir a demora percebida ao trocar de telas no MVP, sem adicionar infraestrutura complexa e sem transformar o projeto em uma arquitetura maior do que o necessario.

Este plano considera apenas as prioridades 0, 1, 2 e 3 do relatorio. A prioridade 4 foi intencionalmente ignorada.

## Diretriz de MVP

Nao buscar perfeicao de performance. O objetivo e remover gargalos obvios, diminuir round trips desnecessarios ao banco e dar feedback visual imediato quando alguma rota ainda depender de consulta remota.

Fora do escopo:

- trocar infraestrutura;
- adicionar cache distribuido;
- adicionar fila;
- criar camada complexa de estado global;
- reescrever o app para client-side completo;
- otimizar algoritmo de negocio antes de corrigir queries repetidas.

## Diagnostico resumido

A lentidao nao parece vir do algoritmo puro de projecao, categorizacao ou recorrencia. O problema principal esta em:

- rotas dinamicas renderizadas no servidor;
- banco remoto via Supabase;
- queries repetidas na mesma renderizacao;
- dashboard chamando `getProjectionData()` tres vezes;
- recalculo repetido de saldo;
- lookup repetido de organizacao ativa;
- ausencia de feedback imediato de loading.

## Plano por fases

### Fase 1 - Corrigir o dashboard primeiro

Prioridade: alta.

Arquivos provaveis:

- `src/server/projection.queries.ts`
- `src/app/dashboard/page.tsx`

Acao:

- Refatorar `getDashboardData()` para carregar dados base uma unica vez.
- Evitar chamar `getProjectionData()` tres vezes dentro do dashboard.
- Criar uma funcao interna, simples, que receba:
  - saldo atual ja calculado;
  - recorrencias ja carregadas;
  - data inicial;
  - horizonte;
  - cenario.
- Gerar projecoes de 30, 60 e 90 dias em memoria a partir dos mesmos dados.

Resultado esperado:

- Dashboard deixa de repetir busca de organizacao, conta, saldo e recorrencias.
- A maior parte do ganho deve vir desta fase.

Criterio de aceite:

- `getDashboardData()` nao chama mais `getProjectionData()` em serie.
- As tres projecoes continuam aparecendo no dashboard.
- `npm test` e `npm run build` continuam passando.

### Fase 2 - Reduzir lookup repetido de organizacao ativa

Prioridade: alta.

Arquivos provaveis:

- `src/lib/active-organization.ts`
- `.env.example`
- `README.md`

Acao:

- Manter `ACTIVE_ORGANIZATION_ID` como caminho preferencial no MVP.
- Documentar que, apos o seed, o usuario pode preencher `ACTIVE_ORGANIZATION_ID` para evitar lookup extra.
- Se fizer sentido, adicionar cache simples em memoria no processo para o fallback de `findFirst`.

Implementacao esperada, sem overengineering:

- variavel module-level `cachedOrganizationId`;
- se `process.env.ACTIVE_ORGANIZATION_ID` existir, retornar direto;
- se ja houver `cachedOrganizationId`, retornar;
- caso contrario, buscar primeira organizacao e guardar no cache.

Criterio de aceite:

- Sem `ACTIVE_ORGANIZATION_ID`, a organizacao ainda e encontrada.
- Com `ACTIVE_ORGANIZATION_ID`, nao ha query extra para buscar organizacao.
- Nao introduzir autenticacao ou sessao nesta fase.

### Fase 3 - Melhorar feedback de navegacao

Prioridade: media.

Arquivos provaveis:

- `src/app/dashboard/loading.tsx`
- `src/app/transactions/loading.tsx`
- `src/app/recurring/loading.tsx`
- `src/app/projection/loading.tsx`
- `src/app/import/loading.tsx`

Acao:

- Adicionar `loading.tsx` simples nas rotas principais.
- Usar texto e skeleton minimo, sem design elaborado.
- O objetivo e mostrar resposta imediata ao clique, nao mascarar query ruim.

Exemplo de conteudo:

```tsx
export default function Loading() {
  return (
    <div className="panel">
      <p className="muted">Carregando...</p>
    </div>
  );
}
```

Criterio de aceite:

- Ao navegar, a UI mostra estado de carregamento rapidamente.
- Nenhum novo componente complexo e criado.
- `npm run build` continua passando.

### Fase 4 - Rever uso de `force-dynamic` com cautela

Prioridade: media.

Arquivos provaveis:

- `src/app/dashboard/page.tsx`
- `src/app/transactions/page.tsx`
- `src/app/recurring/page.tsx`
- `src/app/projection/page.tsx`
- `src/app/import/page.tsx`

Acao:

- Revisar cada `export const dynamic = "force-dynamic"`.
- Manter dinamico onde a pagina precisa refletir mutacoes imediatamente.
- Remover apenas onde nao houver risco para o fluxo do MVP.

Recomendacao pratica:

- Manter `transactions`, `recurring` e `projection` dinamicas inicialmente.
- Avaliar `import`, pois ela carrega basicamente contas para formularios.
- Evitar cache agressivo nesta V1 para nao criar bugs de dados desatualizados.

Criterio de aceite:

- Nenhuma tela mostra dados claramente obsoletos apos action.
- Se houver duvida, manter dinamico e confiar nas fases 1, 2 e 3.

### Fase 5 - Otimizar server actions de lote

Prioridade: media.

Arquivos provaveis:

- `src/server/transactions.actions.ts`
- `src/server/recurring.actions.ts`

Acao para categorizacao:

- Trocar updates sequenciais por operacao em lote simples.
- Agrupar resultados por `categoryId` quando possivel e usar `updateMany`.
- Manter clareza do codigo acima de micro-otimizacao.

Acao para recorrencias:

- Carregar patterns existentes uma vez por organizacao.
- Criar chave de deduplicacao em memoria:
  - `organizationId`
  - `accountId`
  - `categoryId`
  - `descriptionPattern`
  - `frequency`
  - `type`
- Evitar `findFirst` dentro do loop para cada pattern detectado.

Criterio de aceite:

- Botoes "Categorizar pendentes" e "Detectar recorrencias" reduzem round trips.
- Protecao contra recorrencia duplicada continua funcionando.
- Testes existentes continuam passando.

## Ordem recomendada

1. Fase 1: corrigir `getDashboardData()`.
2. Fase 2: cache simples/uso preferencial de `ACTIVE_ORGANIZATION_ID`.
3. Fase 3: adicionar `loading.tsx`.
4. Fase 5: otimizar actions de lote.
5. Fase 4: revisar `force-dynamic` por ultimo e com cautela.

Motivo da ordem:

- O maior ganho esperado esta no dashboard.
- Loading melhora percepcao rapidamente.
- Actions de lote importam, mas afetam mais botoes especificos do que navegacao simples.
- Cache de rota pode gerar comportamento confuso no MVP se aplicado cedo demais.

## Metricas antes e depois

Antes de alterar:

- medir tempo de `getDashboardData()`;
- medir tempo de `getProjectionData({ horizonDays: 30 })`;
- medir carregamento de `/transactions`, `/recurring` e `/import`.

Depois de cada fase:

- repetir as mesmas medicoes;
- comparar contra baseline do report;
- registrar resultados em novo arquivo dentro de `docs/reports`.

Medicoes minimas aceitaveis para MVP:

- dashboard claramente abaixo do baseline de 29,7s;
- paginas simples com feedback visual imediato;
- actions de lote sem travamento perceptivel longo sem feedback.

## Riscos

- Banco remoto ainda pode deixar paginas simples lentas.
- Remover `force-dynamic` cedo demais pode mostrar dados antigos.
- Otimizar actions em excesso pode complicar codigo sem ganho relevante.
- Cache em memoria e aceitavel para MVP, mas nao deve ser tratado como solucao multi-tenant final.

## Definicao de pronto

O problema sera considerado tratado para o MVP quando:

- `getDashboardData()` nao recalcular dados base tres vezes;
- o dashboard carregar substancialmente mais rapido;
- as rotas principais tiverem estado de loading;
- o app continuar simples e legivel;
- `npm test` passar;
- `npm run build` passar;
- houver registro de medicao pos-correcao em `docs/reports`.

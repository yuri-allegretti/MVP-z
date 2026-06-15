# Relatorio pos-correcao: demora em trocas de tela

Data: 2026-06-15

Plano aplicado: `docs/planning/corrections/2026-06-15-plano-correcao-demora-troca-telas.md`

## Resumo

Foram aplicadas as correcoes de MVP para reduzir round trips repetidos e melhorar a
percepcao de navegacao:

- `getDashboardData()` deixou de chamar `getProjectionData()` tres vezes.
- O dashboard agora carrega conta/saldo, recorrencias e contagem de pendentes uma
  vez, gerando as projecoes de 30/60/90 dias em memoria.
- `getActiveOrganizationId()` passou a usar cache simples em memoria quando
  `ACTIVE_ORGANIZATION_ID` nao estiver configurado.
- As rotas principais receberam `loading.tsx` simples.
- As actions de categorizacao e deteccao de recorrencias reduziram loops com
  queries repetidas.

## Medicao pos-correcao

Metodo:

- `npm run build`
- `next start -p 3100`
- chamadas HTTP locais via `Invoke-WebRequest`
- banco configurado pelo `.env` atual

| Rota | Tempo pos-correcao aproximado |
| --- | ---: |
| `/dashboard` | 3,1s |
| `/projection` | 4,1s |
| `/transactions` | 2,3s |
| `/recurring` | 1,6s |
| `/import` | 1,0s |

Comparacao com baseline do relatorio original:

| Tela / operacao | Antes aproximado | Depois aproximado |
| --- | ---: | ---: |
| Dashboard | 29,7s | 3,1s |
| Projecao | 9,2s | 4,1s |
| Transacoes | 5,2s | 2,3s |
| Recorrencias | 4,9s | 1,6s |
| Importacao | 4,0s | 1,0s |

Observacao: o baseline original mediu algumas funcoes diretamente, enquanto esta
medicao pos-correcao mediu rotas HTTP em producao local. Ainda assim, a queda do
dashboard e clara e ataca o gargalo principal identificado.

## Validacao

- `npm test`: passou, 5 arquivos e 9 testes.
- `npm run build`: passou.

## Revisao de rotas dinamicas

As declaracoes `force-dynamic` foram mantidas nas rotas principais nesta rodada.
Como o MVP trabalha com dados mutaveis por server actions e banco remoto, remover
dinamismo agora poderia gerar telas com dados desatualizados. O ganho principal
foi obtido com menos queries repetidas e feedback visual imediato.

## Resultado

O problema foi tratado para o escopo de MVP: o dashboard deixou de recalcular os
mesmos dados base tres vezes, as paginas principais passaram a exibir loading e
as actions de lote reduziram round trips obvios sem adicionar infraestrutura ou
estado global.

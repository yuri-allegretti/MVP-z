# Avaliacao de recorrencia: bancada ampliada

Data: 2026-06-15

## Escopo

Esta rodada ampliou a avaliacao de `detectRecurringPatterns()` e separou dois
conceitos:

- recorrencia detectada: padrao recorrente encontrado no historico;
- recorrencia projetavel: padrao detectado com estabilidade suficiente para
  entrar na projecao.

Nao houve alteracao de UI, dashboard, autenticacao, Open Finance, IA/ML ou regras
de categorizacao. Tambem nao foram adicionadas regras especificas por categoria
nem novas listas especiais de palavras.

## Tamanho da amostra

- Datasets: 20.
- Transacoes sinteticas: 495.
- Recorrencias esperadas rotuladas: 88.
- Recorrencias pontuadas: 69.
- Casos unsupported/false negative esperado: 19.
- Armadilhas de falso positivo: 38.

## Estabilidade

Cada recorrencia detectada agora recebe:

- `recurrenceStabilityScore`;
- `recurrenceType`, com valores `fixed` ou `variable`.

O score combina criterios gerais:

- estabilidade das datas;
- similaridade textual dentro do grupo;
- variabilidade de valor.

Uma recorrencia pode existir e ainda assim ser `variable`. A projecao usa apenas
recorrencias `fixed`.

## Comparativo antes/depois

Antes, a avaliacao tinha um unico conceito: toda recorrencia detectada era
tratada como candidata a uso. Depois, a avaliacao separa deteccao e
projetabilidade.

| Metrica | Recorrencia detectada | Recorrencia projetavel |
| --- | ---: | ---: |
| Detectadas | 79 | 64 |
| True positives | 64 | 64 |
| False positives | 15 | 0 |
| False negatives | 5 | 5 |
| Precision | 0.81 | 1.00 |
| Recall | 0.93 | 0.93 |
| F1 | 0.86 | 0.96 |
| Confidence media dos TPs | 1.00 | 1.00 |
| Confidence media dos FPs | 0.80 | - |
| Armadilhas atingidas por FP | 15 | 0 |
| Problemas de integridade | 0 | 0 |

## Metricas por tipo

| Grupo | Recorrencia detectada | Recorrencia projetavel |
| --- | ---: | ---: |
| Despesas mensais fixas | recall 0.95 | recall 0.95 |
| Receitas recorrentes consistentes | recall 0.83 | recall 0.83 |
| Descricoes alternadas com tokens em comum | recall 0.92 | recall 0.92 |
| Receitas variaveis/genericas | precision 1.00 | precision 1.00 |
| Marketplace payouts | precision 0.00 | precision 1.00 |
| Cartao/taxa generica | precision 0.00 | precision 1.00 |
| Campanhas de marketing variaveis | precision 0.00 | precision 1.00 |
| Fretes por volume | precision 0.00 | precision 1.00 |
| Impostos instaveis | precision 0.00 | precision 1.00 |
| Estoque irregular | precision 0.88 | precision 1.00 |

## Melhores casos

- Escola e cursos.
- Oficina mecanica.
- Empresa de eventos.
- Pet shop.
- SaaS B2B.

Esses casos mantiveram bom recall para recorrencias fixas e nao produziram
falsos positivos projetaveis relevantes.

## Piores casos

- Escritorio juridico: ainda tem falsos negativos em aluguel e honorarios
  mensais com descricao alternada.
- Consultoria: ainda tem falsos negativos em pro-labore e contrato recorrente.
- Restaurante: ainda tem falso negativo em aluguel com descricao alternada.

Essas falhas sao de deteccao textual; a camada de estabilidade nao corrige
recorrencias que sequer foram agrupadas.

## Falsos positivos mais perigosos

Na avaliacao de recorrencia detectada, os falsos positivos perigosos continuam
aparecendo em:

- marketplace payouts;
- cartao corporativo com descritor generico;
- campanhas de marketing variaveis;
- fretes por volume;
- impostos instaveis;
- algumas compras de estoque.

Na avaliacao projetavel, esses casos passaram a ser classificados como
`variable`, entao nao entram na projecao.

## Falsos negativos mais importantes

- Aluguel juridico com descricao alternada.
- Honorarios mensais juridicos com descricao alternada.
- Aluguel de restaurante com descricao alternada.
- Pro-labore de consultoria.
- Contrato recorrente de consultoria.

## Casos unsupported

Foram mantidos 19 casos `unsupported`, principalmente:

- recorrencias anuais;
- recorrencias quinzenais;
- recorrencias trimestrais.

Eles continuam fora das metricas pontuadas porque a deteccao atual suporta
efetivamente mensal e semanal.

## Recomendacoes para proxima versao

1. Melhorar o agrupamento textual sem criar aliases por fornecedor ou regras por
   categoria.
2. Persistir `recurrenceStabilityScore` e `recurrenceType` no banco se a UI de
   recorrencias passar a expor essa distincao.
3. Adicionar suporte real a quinzenal, trimestral e anual.
4. Separar experiencia de revisao: mostrar padroes `variable` como detectados,
   mas nao projetaveis por padrao.
5. Manter a bancada com casos dificeis; a melhora de precision projetavel nao
   significa validacao final do algoritmo.

## Estado dos testes

Depois da separacao entre recorrencia detectada e projetavel:

- `npm test`: passou.
- `npm run build`: passou.

Esta amostra ainda e sintetica. Ela indica que o conceito de estabilidade reduz
risco de projecao indevida, mas nao valida plenamente o algoritmo para dados
reais.

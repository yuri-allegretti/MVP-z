# Avaliacao de recorrencia: bancada ampliada

Data: 2026-06-15

## Escopo

Esta rodada ampliou apenas a bancada de avaliacao de `detectRecurringPatterns()`.
Nao houve alteracao de UI, dashboard, autenticacao, Open Finance, IA/ML ou regras
de categorizacao.

## Tamanho da amostra

- Datasets: 20.
- Transacoes sinteticas: 495.
- Recorrencias esperadas rotuladas: 88.
- Recorrencias esperadas pontuadas: 69.
- Casos unsupported/false negative esperado: 19.
- Armadilhas de falso positivo: 38.

Tipos de empresa cobertos:

- SaaS B2B.
- Clinica medica.
- Restaurante.
- E-commerce.
- Agencia de marketing.
- Escola/curso.
- Escritorio juridico.
- Industria pequena.
- Marketplace seller.
- Consultoria.
- Academia.
- Imobiliaria.
- Logistica/frete.
- Oficina mecanica.
- Empresa de eventos.
- Construtora pequena.
- Pet shop.
- Coworking.
- Produtor de conteudo/infoproduto.
- Comercio varejista.

## Resultado global

| Metrica | Valor |
| --- | ---: |
| Detectadas | 79 |
| True positives | 64 |
| False positives | 15 |
| False negatives | 5 |
| Precision | 0.81 |
| Recall | 0.93 |
| F1 | 0.86 |
| Confidence media dos TPs | 1.00 |
| Confidence media dos FPs | 0.80 |
| Armadilhas atingidas por FP | 15 |
| Problemas de integridade nos datasets | 0 |

As metas de recall e F1 foram atingidas, mas a meta inicial de precision `>= 0.85`
nao foi atingida. A meta de falsos positivos em armadilhas tambem nao foi
atingida: 15 hits em 38 armadilhas, acima do limite de 30%.

## Metricas por tipo

| Grupo | Esperadas/armadilhas | Acertos/hits | Metrica |
| --- | ---: | ---: | ---: |
| Despesas mensais fixas | 57 | 54 TP | recall 0.95 |
| Receitas recorrentes consistentes | 12 | 10 TP | recall 0.83 |
| Descricoes alternadas com tokens em comum | 62 | 57 TP | recall 0.92 |
| Receitas variaveis/genericas | 12 armadilhas | 0 hits | precision 1.00 |
| Marketplace payouts | 4 armadilhas | 4 hits | precision 0.00 |
| Cartao/taxa generica | 5 armadilhas | 5 hits | precision 0.00 |
| Campanhas de marketing variaveis | 2 armadilhas | 2 hits | precision 0.00 |
| Fretes por volume | 2 armadilhas | 2 hits | precision 0.00 |
| Impostos instaveis | 1 armadilha | 1 hit | precision 0.00 |
| Estoque irregular | 8 armadilhas | 1 hit | precision 0.88 |

## Melhores casos

- Escola e cursos: precision 1.00, recall 1.00, F1 1.00.
- Oficina mecanica: precision 1.00, recall 1.00, F1 1.00.
- Empresa de eventos: precision 1.00, recall 1.00, F1 1.00.
- Pet shop: precision 1.00, recall 1.00, F1 1.00.
- SaaS B2B: precision 0.80, recall 1.00, F1 0.89.

## Piores casos

- Escritorio juridico: precision 0.50, recall 0.33, F1 0.40.
  - FN: aluguel do escritorio juridico.
  - FN: honorarios mensais do cliente Atlas.
  - FP: custas/taxas processuais mensais variaveis.
- Consultoria: precision 1.00, recall 0.33, F1 0.50.
  - FN: pro-labore de socios.
  - FN: contrato recorrente do cliente Beta.
- Construtora pequena: precision 0.60, recall 1.00, F1 0.75.
  - FP: materiais pagos mensalmente por fase.
  - FP: fretes de obra por volume.

## Falsos positivos mais perigosos

- Repasses de marketplace: detectados como receita mensal recorrente apesar de
  dependerem de volume vendido.
- Repasses de cartao/academia e lancamentos de infoproduto: detectados como
  recorrencia de receita, embora tenham alta variacao.
- Cartao corporativo com descritor generico: detectado como despesa recorrente
  mesmo agregando compras diferentes.
- Campanhas de marketing mensais: detectadas como recorrencia apesar de verba
  muito variavel.
- Fretes por volume: detectados como recorrencia mensal, mas variam por demanda.
- Impostos mensais instaveis: detectados como recorrencia com confidence 0.80.

## Falsos negativos mais importantes

- Aluguel juridico com descricao alternada entre `imobiliaria foro` e
  `conjunto juridico imobiliaria foro`.
- Honorarios mensais juridicos com descricao alternada.
- Aluguel de restaurante com descricao alternada.
- Pro-labore de consultoria.
- Contrato recorrente de consultoria.

Esses falsos negativos indicam que o matching textual ainda e sensivel a termos
de contexto que aparecem em parte das descricoes.

## Casos unsupported/false negative esperado

Foram incluidos 19 casos marcados como `unsupported`, principalmente:

- recorrencias anuais;
- recorrencias quinzenais;
- recorrencias trimestrais.

Esses casos ficam fora das metricas pontuadas porque o tipo atual
`RecurringFrequency` e a funcao `detectFrequency()` ainda suportam efetivamente
apenas mensal e semanal. Eles permanecem na bancada para impedir que essa
limitacao seja esquecida.

## Recomendacoes para proxima versao do algoritmo

1. Criar criterio explicito de variacao de valor para nao promover padroes com
   alta variacao a recorrencia operacional, especialmente marketing, frete,
   marketplace payout, cartao e imposto.
2. Separar confidence de elegibilidade: hoje padroes variaveis ainda saem como
   recorrencias com confidence media de 0.80.
3. Adicionar suporte real ou classificacao explicita para frequencias quinzenal,
   trimestral e anual.
4. Melhorar tokenizacao generica para reduzir falsos negativos em descricoes
   alternadas com termos de contexto.
5. Avaliar regras diferentes por tipo de fluxo: receita variavel, despesa fixa,
   fornecedores e cartao corporativo tem riscos distintos.

## Estado dos testes

`npm test` falhou de forma esperada nesta rodada porque a bancada ampliada mostrou
que as metas globais ainda nao sao todas atendidas:

- precision atual: 0.81, meta: 0.85.
- hits em armadilhas: 15 de 38, limite: 30%.

Isso nao deve ser interpretado como algoritmo validado. A amostra ainda e
sintetica, mas ja e forte o suficiente para mostrar lacunas relevantes de
generalizacao.

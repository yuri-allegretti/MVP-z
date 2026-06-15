# Seed e dados de demonstracao

## Entidades base

Usuario:

- name: `Usuario Teste`
- email: `teste@example.com`

Organizacao:

- name: `Empresa Demo Ltda`

Membership:

- role: `owner`

Conta:

- name: `Conta Corrente Principal`
- type: `checking`
- initialBalance: `50000.00`
- currentBalance: pode ser preenchido no seed, mas a V1 deve calcular saldo atual sob demanda
- currency: `BRL`

## Categorias padrao

Criar categorias com `organizationId` da Empresa Demo e `isDefault = true`. Nao criar categorias globais na V1.

| Nome | Tipo |
| --- | --- |
| Vendas | income |
| Aluguel | expense |
| Folha de pagamento | expense |
| Impostos | expense |
| Software | expense |
| Fornecedor | expense |
| Marketing | expense |
| Emprestimo | both |
| Transferencia interna | both |
| Outros | both |

## Regras de categorizacao

Todas as regras devem ter `organizationId` da Empresa Demo, mirar `normalizedDescription`, usar prioridade menor para regras mais especificas e registrar confidence simples. Nao criar regras globais na V1.

| Valor | Categoria | Operator | Priority | Confidence |
| --- | --- | --- | --- | --- |
| `darf` | Impostos | contains | 10 | 0.95 |
| `fgts` | Impostos | contains | 20 | 0.85 |
| `salario` | Folha de pagamento | contains | 10 | 0.95 |
| `folha` | Folha de pagamento | contains | 10 | 0.95 |
| `aluguel` | Aluguel | contains | 10 | 0.95 |
| `imobiliaria` | Aluguel | contains | 20 | 0.90 |
| `aws` | Software | contains | 10 | 0.95 |
| `google` | Software | contains | 10 | 0.95 |
| `microsoft` | Software | contains | 10 | 0.95 |
| `vercel` | Software | contains | 10 | 0.95 |
| `pix recebido` | Vendas | contains | 20 | 0.85 |
| `venda` | Vendas | contains | 20 | 0.85 |
| `recebimento` | Vendas | contains | 20 | 0.85 |

Observacao: `fgts` pode ser Impostos no seed para manter uma regra unica. Se o produto quiser distinguir melhor depois, criar regra especifica para Folha.

## Transacoes ficticias

Gerar pelo menos 6 meses completos, preferencialmente encerrando no mes atual da execucao do seed.

Padroes mensais:

- Aluguel: todo dia 5, despesa fixa de `8500.00`, descricao variando levemente:
  - `PIX ENVIADO - IMOBILIARIA SAO JOSE LTDA`
  - `ALUGUEL SALA COMERCIAL IMOBILIARIA SAO JOSE`
- Folha: todo dia 28, despesa de `32000.00` a `35000.00`, descricao:
  - `FOLHA DE PAGAMENTO FUNCIONARIOS`
  - `PAGAMENTO SALARIO EQUIPE`
- Software: todo dia 12, despesa recorrente de `900.00` a `1400.00`, descricao:
  - `AWS SERVICOS CLOUD`
  - `GOOGLE WORKSPACE`
  - `VERCEL PRO`
- Impostos: todo dia 20, despesa de `4500.00` a `7500.00`, descricao:
  - `DARF SIMPLES NACIONAL`
  - `FGTS GUIA MENSAL`

Padroes variaveis:

- Vendas: 6 a 10 entradas por mes, valores entre `5000.00` e `25000.00`.
- Fornecedores: 3 a 6 saidas por mes, valores entre `1000.00` e `12000.00`.
- Marketing: 1 a 3 saidas por mes, valores entre `500.00` e `5000.00`.

Transacoes nao categorizaveis:

- `TED ENVIADA 93847`
- `PAGAMENTO DIVERSOS 712`
- `AJUSTE OPERACIONAL BANCO`
- `COMPRA AVULSA 8841`

Essas devem permanecer sem categoria para demonstrar o alerta de precisao.

## Cuidados no seed

- Preencher `rawDescription` com a descricao original.
- Preencher `description` com texto legivel.
- Preencher `normalizedDescription` usando a mesma funcao de normalizacao do produto.
- Usar `source = seed`.
- Calcular `type` por sinal ou pela propria geracao:
  - receitas com `income`;
  - despesas com `expense`;
  - `amount` sempre positivo para simplificar os algoritmos.
- Opcionalmente atualizar `currentBalance` da conta ao final para exibicao inicial.
- A fonte da verdade do saldo atual na V1 deve ser uma funcao que calcula `initialBalance + totalIncome - totalExpense` sob demanda.

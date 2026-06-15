# Avaliacao do algoritmo de recorrencia

Data: 2026-06-15

## Objetivo

Criar uma bancada de avaliacao para medir e melhorar a generalizacao de
`detectRecurringPatterns()` sem depender de regras hardcoded por fornecedor e sem
corrigir apenas o caso do seed.

## Bancada criada

Arquivos principais:

- `src/services/recurrence-evaluation.ts`: avaliador que executa
  `detectRecurringPatterns()` e calcula true positives, false positives, false
  negatives, confidence e fingerprints gerados.
- `tests/fixtures/recurrence-evaluation-datasets.ts`: datasets sinteticos e
  gabaritos de recorrencias esperadas.
- `tests/recurrence-evaluation.test.ts`: testes automatizados da bancada.

Os datasets cobrem quatro empresas:

- Agencia de software.
- Loja varejista.
- Clinica de saude.
- Construtora.

Tambem ha casos negativos com receitas variaveis e fornecedores diferentes para
evitar que periodicidade e categoria sozinhas virem recorrencia.

## Ajuste no algoritmo

O algoritmo deixou de depender apenas de fingerprint exato. A deteccao agora:

- remove termos transacionais genericos, como pagamento, boleto, fatura,
  transferencia, mes, nota fiscal e sufixos societarios;
- agrupa descricoes por similaridade de tokens dentro do mesmo tipo e categoria;
- exige sobreposicao minima de tokens para agrupar descricoes variantes;
- mantem protecao contra receitas variaveis com fingerprint muito curto;
- calcula o fingerprint final do pattern a partir dos tokens estaveis do grupo.

Nao foram adicionadas regras por fornecedor.

## Resultado da avaliacao

| Empresa | Esperadas | Detectadas | TP | FP | FN | Confidence media TP |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Agencia de software | 2 | 2 | 2 | 0 | 0 | 1.00 |
| Loja varejista | 2 | 2 | 2 | 0 | 0 | 1.00 |
| Clinica de saude | 1 | 1 | 1 | 0 | 0 | 1.00 |
| Construtora | 0 | 0 | 0 | 0 | 0 | - |

Totais:

- True positives: 5.
- False positives: 0.
- False negatives: 0.

## True positives

Agencia de software:

- Aluguel do escritorio: fingerprint `imobiliaria norte`, confidence `1.00`.
- Receita recorrente ACME: fingerprint `acme suporte`, confidence `1.00`.

Loja varejista:

- Limpeza semanal da loja: fingerprint `limpeza loja equipe fixa`, confidence
  `1.00`.
- Assinatura da maquininha: fingerprint `maquininha assinatura`, confidence
  `1.00`.

Clinica de saude:

- Plano de saude empresarial: fingerprint `saude unimed`, confidence `1.00`.

## False positives

Nenhum falso positivo foi gerado nos datasets avaliados.

## False negatives

Nenhum falso negativo foi gerado nos datasets avaliados.

## Fingerprints gerados

Agencia de software:

- `agency-rent-jan`: `imobiliaria norte escritorio`
- `agency-rent-feb`: `imobiliaria norte`
- `agency-rent-mar`: `imobiliaria norte escritorio`
- `agency-rent-apr`: `imobiliaria norte`
- `agency-acme-jan`: `acme suporte contrato`
- `agency-acme-feb`: `acme suporte`
- `agency-acme-mar`: `acme suporte contrato`
- `agency-acme-apr`: `acme suporte`
- `agency-oneoff-1`: `notebook equipe desenvolvimento`
- `agency-oneoff-2`: `evento tecnico`

Loja varejista:

- `retail-clean-1`: `limpeza loja equipe fixa`
- `retail-clean-2`: `limpeza loja equipe fixa semanal`
- `retail-clean-3`: `limpeza loja equipe fixa`
- `retail-clean-4`: `limpeza loja equipe fixa semanal`
- `retail-card-jan`: `maquininha assinatura`
- `retail-card-feb`: `maquininha assinatura loja`
- `retail-card-mar`: `maquininha assinatura`
- `retail-card-apr`: `maquininha assinatura loja`
- `retail-sale-jan`: `alfa loja`
- `retail-sale-feb`: `beta loja`
- `retail-sale-mar`: `gama loja`

Clinica de saude:

- `clinic-health-jan`: `plano saude unimed funcionarios`
- `clinic-health-feb`: `unimed saude empresarial`
- `clinic-health-mar`: `plano saude unimed funcionarios`
- `clinic-health-apr`: `unimed saude empresarial`
- `clinic-tax-jan`: `darf imposto trimestral clinica`
- `clinic-tax-apr`: `darf imposto trimestral clinica`

Construtora:

- `construction-supplier-jan`: `areia sul obra`
- `construction-supplier-feb`: `cimento norte obra`
- `construction-supplier-mar`: `ferro real obra`
- `construction-rental-jan`: `equipamento guindaste obra centro`
- `construction-rental-feb`: `equipamento guindaste obra centro`
- `construction-invoice-jan`: `torre azul etapa`
- `construction-invoice-feb`: `residencial sol etapa`
- `construction-invoice-mar`: `galpao oeste etapa`

## Validacao

- `npm test`: passou com 6 arquivos e 11 testes.
- `npm run build`: passou.

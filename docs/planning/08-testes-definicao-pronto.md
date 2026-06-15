# Testes minimos e definicao de pronto

## Testes unitarios

### Normalizacao remove acentos

Entrada:

```txt
PIX ENVIADO - IMOBILIARIA SAO JOSE LTDA 12345
```

Saida esperada:

```txt
pix enviado imobiliaria sao jose ltda
```

Tambem testar:

- lowercase;
- remocao de caracteres especiais;
- espacos duplicados;
- string vazia.

### Regra categoriza corretamente

Cenarios:

- `darf simples nacional` -> Impostos.
- `aws servicos cloud` -> Software.
- `pix recebido cliente a` -> Vendas.
- `texto desconhecido 999` -> sem categoria.

Verificar:

- primeira regra por prioridade vence;
- `confidence` vem da regra;
- transacao ja categorizada nao e sobrescrita.

### Transacoes mensais viram recorrencia

Dados:

- 6 transacoes de aluguel;
- datas com intervalos de 25 a 35 dias;
- valores iguais ou variacao baixa;
- mesma categoria.

Esperado:

- 1 pattern mensal;
- `frequency = monthly`;
- `status = suggested`;
- `confidence >= 0.75`;
- `type = expense`;
- `expectedDayOfMonth` proximo do dia usado;
- `nextExpectedDate` depois da ultima transacao.

### Transacoes aleatorias nao viram recorrencia

Dados:

- fornecedores variaveis;
- descricoes diferentes;
- datas irregulares;
- menos de 3 ocorrencias por grupo ou intervalos fora das janelas.

Esperado:

- nenhum pattern mensal/semanal confiavel.

### Receitas variaveis nao viram recorrencia sem fingerprint consistente

Dados:

- varias receitas mensais;
- descricoes/fingerprints diferentes;
- mesma categoria Vendas.

Esperado:

- nenhuma recorrencia criada apenas pela categoria e periodicidade mensal.

### Projecao calcula saldo corretamente

Dados:

- saldo inicial: `1000`;
- receita recorrente: `500` no dia 2;
- despesa recorrente: `200` no dia 3;
- horizonte: 5 dias.

Esperado:

- dia 1 closingBalance = `1000`;
- dia 2 closingBalance = `1500`;
- dia 3 closingBalance = `1300`;
- totalIncome = `500`;
- totalExpense = `200`;
- lowestBalance = `1000`.

### Alerta aparece quando saldo fica negativo

Dados:

- saldo inicial: `100`;
- despesa futura: `200` amanha.

Esperado:

- alerta `negative_cash`;
- severity `critical`;
- mensagem contem dias ate saldo negativo;
- `firstNegativeBalanceDate` preenchida.

## Testes de integracao leves

### Correcao manual de categoria

Fluxo:

- criar transacao sem categoria;
- chamar action de correcao;
- verificar `Transaction.categoryId`;
- verificar `UserCorrection` com oldCategoryId null e newCategoryId.

### Confirmar recorrencia

Fluxo:

- criar pattern suggested;
- chamar action de status confirmed;
- gerar projecao conservadora;
- verificar se item entra na projecao.

### Ignorar recorrencia

Fluxo:

- criar pattern suggested;
- chamar action de status ignored;
- gerar projecao provavel;
- verificar se item nao entra na projecao.

## Testes manuais de aceite

1. Rodar projeto localmente.
2. Carregar seed.
3. Abrir `/transactions` e ver dados ficticios.
4. Rodar categorizacao e ver categorias preenchidas.
5. Abrir `/recurring` e ver aluguel, folha, software ou impostos detectados.
6. Confirmar aluguel.
7. Abrir `/projection` em cenario conservador e ver aluguel projetado.
8. Abrir cenario provavel e ver recorrencias suggested com alta confianca.
9. Abrir `/dashboard` e ver alertas.
10. Editar categoria de uma transacao e ver `UserCorrection` criada.

## Definicao de pronto

O MVP V1.0 esta pronto quando:

- roda localmente com Next.js, Postgres e Prisma;
- seed cria usuario, organizacao, conta, categorias, regras e transacoes;
- transacoes sao normalizadas;
- categorizacao por regras funciona;
- transacoes sem regra permanecem sem categoria;
- recorrencias mensais e semanais simples sao detectadas;
- recorrencias podem ser confirmadas ou ignoradas;
- projecoes de 30, 60 e 90 dias funcionam;
- cenarios conservador, provavel e otimista respeitam as regras de elegibilidade;
- alertas basicos aparecem;
- correcao manual de categoria cria UserCorrection;
- todos os acessos de dados usam `organizationId`;
- saldo atual e obtido por funcao calculada sob demanda, nao por `currentBalance` desatualizado;
- testes minimos passam.

## Riscos conhecidos da V1.0

- Deteccao de recorrencia baseada em texto pode falhar com descricoes muito variaveis.
- Valores com alta variacao reduzem confianca mesmo quando a recorrencia e real.
- Sem autenticacao robusta, o MVP depende de `activeOrganizationId` mockado.
- Projecao nao substitui contas a pagar/receber reais; serve para validar a logica.

Esses riscos sao aceitaveis para a V1.0 porque o objetivo e validar o motor de logica antes de integrar fontes externas ou automatizacoes mais complexas.

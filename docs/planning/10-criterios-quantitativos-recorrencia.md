# Criterios quantitativos - validacao do algoritmo de recorrencia

## Objetivo

Definir criterios objetivos para validar se uma versao do algoritmo de recorrencia e boa o suficiente para evoluir no MVP e servir de base para um SaaS B2B multiempresa.

Estes criterios devem ser aplicados sempre que uma nova versao do algoritmo for criada.

## Corpus minimo de avaliacao

O MVP deve ter um conjunto sintetico minimo com:

- pelo menos 20 datasets sinteticos;
- pelo menos 50 recorrencias esperadas rotuladas;
- pelo menos 30 grupos nao recorrentes desenhados como armadilhas de falso positivo;
- pelo menos 15 recorrencias dificeis desenhadas como casos provaveis de falso negativo;
- pelo menos 5 perfis diferentes de empresa;
- pelo menos 3 niveis de ruido: baixo, medio e alto.

## Distribuicao dos 20 datasets

### Grupo A - recorrencias simples

Quantidade: 5 datasets.

Objetivo: validar que o algoritmo encontra o obvio.

Conteudo minimo:

- recorrencias mensais claras;
- recorrencias semanais claras;
- receitas e despesas;
- descricoes muito parecidas;
- valores estaveis.

Meta esperada neste grupo:

- precision >= 0.95;
- recall >= 0.95;
- F1 >= 0.95.

### Grupo B - recorrencias com ruido realista

Quantidade: 5 datasets.

Objetivo: validar robustez com variacao normal de mundo real.

Conteudo minimo:

- datas com variacao de alguns dias;
- valores com variacao controlada;
- descricoes com tokens extras;
- identificadores numericos;
- meses ausentes;
- duplicidade pontual no mesmo periodo.

Meta esperada neste grupo:

- precision >= 0.85;
- recall >= 0.80;
- F1 >= 0.82.

### Grupo C - armadilhas de falso positivo

Quantidade: 4 datasets.

Objetivo: garantir que o algoritmo nao inventa recorrencias por coincidencia.

Conteudo minimo:

- varias receitas mensais sem relacao recorrente;
- despesas parecidas, mas de contrapartes diferentes;
- transacoes em datas regulares por acaso;
- valores parecidos por acaso;
- parcelamentos finitos;
- eventos sazonais.

Meta esperada neste grupo:

- taxa de falso positivo <= 10%;
- no maximo 3 falsos positivos nos 30 grupos de armadilha;
- nenhuma receita variavel deve virar recorrencia apenas por categoria ou periodicidade.

### Grupo D - casos provaveis de falso negativo

Quantidade: 3 datasets.

Objetivo: expor limites do algoritmo e medir o que ele deixa passar.

Conteudo minimo:

- recorrencias reais com descricoes muito variaveis;
- recorrencias com valor muito variavel;
- recorrencias que mudam de data;
- recorrencias que mudam de conta;
- recorrencias novas com poucas ocorrencias;
- recorrencias encerradas.

Meta esperada neste grupo:

- recall >= 0.60;
- listar 100% dos falsos negativos em relatorio;
- cada falso negativo deve ter motivo provavel registrado.

### Grupo E - cenarios multiempresa

Quantidade: 3 datasets.

Objetivo: validar generalizacao entre empresas.

Conteudo minimo:

- empresa com baixo volume de transacoes;
- empresa com alto volume de transacoes;
- empresa com varias contas;
- empresa com muitas receitas pequenas;
- empresa com poucas despesas grandes;
- padroes textuais diferentes entre empresas.

Meta esperada neste grupo:

- precision >= 0.80;
- recall >= 0.75;
- F1 >= 0.77.

## Metricas obrigatorias

### Precision

```txt
true_positives / (true_positives + false_positives)
```

Indica quantas recorrencias sugeridas eram corretas.

Meta geral para MVP:

- precision >= 0.85.

### Recall

```txt
true_positives / (true_positives + false_negatives)
```

Indica quantas recorrencias esperadas foram encontradas.

Meta geral para MVP:

- recall >= 0.75.

### F1

```txt
2 * precision * recall / (precision + recall)
```

Equilibra precision e recall.

Meta geral para MVP:

- F1 >= 0.80.

## Metricas complementares

### Erro de proxima data

Medir diferenca absoluta entre `nextExpectedDate` prevista e data esperada.

Metas:

- erro medio <= 3 dias para recorrencias mensais;
- erro medio <= 1 dia para recorrencias semanais;
- percentil 90 <= 5 dias para recorrencias mensais.

### Erro de valor

Medir erro percentual absoluto entre valor medio previsto e valor esperado.

```txt
abs(predictedAmount - expectedAmount) / expectedAmount
```

Metas:

- erro medio <= 15%;
- percentil 90 <= 25%;
- para recorrencias fixas, erro medio <= 5%.

### Accuracy de frequencia

Percentual de recorrencias detectadas com frequencia correta.

Meta:

- frequency accuracy >= 0.90 nos true positives.

### Calibracao de confidence

Agrupar candidatos por faixa de confidence:

- 0.60 a 0.74;
- 0.75 a 0.89;
- 0.90 a 1.00.

Expectativa:

- faixa 0.90 a 1.00 deve ter precision >= 0.90;
- faixa 0.75 a 0.89 deve ter precision >= 0.80;
- candidatos abaixo de 0.75 nao devem entrar automaticamente em cenario provavel sem revisao.

### Runtime

Medir tempo de execucao da funcao pura de recorrencia, sem banco.

Metas para MVP em ambiente local:

- ate 1.000 transacoes: <= 500 ms;
- ate 5.000 transacoes: <= 2 s;
- ate 10.000 transacoes: <= 5 s.

Estas metas sao para orientar regressao. Nao exigem otimizacao prematura.

## Definicao de true positive, false positive e false negative

### True positive

Um candidato detectado e considerado true positive quando:

- corresponde a uma recorrencia esperada rotulada;
- inclui a maioria das transacoes esperadas do grupo;
- tem tipo correto: `income` ou `expense`;
- tem frequencia correta ou aceitavelmente equivalente;
- nao mistura duas recorrencias distintas.

### False positive

Um candidato detectado e false positive quando:

- nao existe recorrencia esperada correspondente;
- mistura transacoes de grupos diferentes;
- transforma receitas variaveis em recorrencia sem consistencia textual;
- interpreta parcelamento finito como recorrencia aberta;
- usa categoria como principal motivo de agrupamento.

### False negative

Uma recorrencia esperada e false negative quando:

- nao foi detectada;
- foi detectada com confidence abaixo do limiar minimo;
- foi quebrada em varios candidatos fracos;
- foi misturada com outro grupo e perdeu identidade.

## Limiar minimo para aceitar uma versao

Uma nova versao do algoritmo so pode ser considerada aceitavel para a V1 se cumprir todos os criterios abaixo:

- pelo menos 20 datasets sinteticos avaliados;
- pelo menos 50 recorrencias esperadas no total;
- precision geral >= 0.85;
- recall geral >= 0.75;
- F1 geral >= 0.80;
- falso positivo em armadilhas <= 10%;
- frequency accuracy >= 0.90 nos true positives;
- erro medio de proxima data mensal <= 3 dias;
- todos os falsos positivos e falsos negativos listados no relatorio.

## Criterio para promover versao nova

Comparar sempre:

- versao atual em uso;
- versao nova candidata.

A versao nova pode ser promovida se:

- F1 geral melhorar pelo menos 0.03 ponto absoluto; ou
- falso positivo cair pelo menos 20% sem perda relevante de recall; ou
- recall subir pelo menos 0.05 ponto absoluto sem precision cair abaixo de 0.85.

Restrições:

- precision nao pode cair mais que 0.02 ponto absoluto;
- recall nao pode cair mais que 0.03 ponto absoluto;
- desempenho em receitas variaveis nao pode piorar;
- nenhum ganho pode depender de regra hardcoded especifica.

## Relatorio comparativo obrigatorio

Cada avaliacao deve gerar um Markdown em `docs/reports/`, por exemplo:

```txt
docs/reports/YYYY-MM-DD-recorrencia-comparacao-vAtual-vNova.md
```

O relatorio deve conter:

### 1. Identificacao

- data;
- autor ou agente;
- versao atual;
- versao nova;
- quantidade de datasets;
- quantidade de transacoes;
- quantidade de recorrencias esperadas.

### 2. Tabela geral

| Metrica | Versao atual | Versao nova | Delta |
| --- | ---: | ---: | ---: |
| Precision |  |  |  |
| Recall |  |  |  |
| F1 |  |  |  |
| False positives |  |  |  |
| False negatives |  |  |  |
| Frequency accuracy |  |  |  |
| Next date MAE |  |  |  |
| Amount MAPE |  |  |  |
| Runtime medio |  |  |  |

### 3. Breakdown por grupo de dataset

| Grupo | Precision | Recall | F1 | Observacao |
| --- | ---: | ---: | ---: | --- |
| A - simples |  |  |  |  |
| B - ruido realista |  |  |  |  |
| C - falso positivo |  |  |  |  |
| D - falso negativo provavel |  |  |  |  |
| E - multiempresa |  |  |  |  |

### 4. Falsos positivos

Para cada falso positivo:

- dataset;
- candidateId;
- confidence;
- tipo;
- frequencia;
- transacoes envolvidas;
- motivo provavel;
- se tambem ocorreu na versao anterior.

### 5. Falsos negativos

Para cada falso negativo:

- dataset;
- expectedRecurrenceId;
- tipo;
- frequencia esperada;
- transacoes esperadas;
- motivo provavel;
- se tambem ocorreu na versao anterior.

### 6. Decisao

Uma das opcoes:

- promover versao nova;
- rejeitar versao nova;
- manter em experimento;
- ajustar parametros e reavaliar.

A decisao deve citar os criterios quantitativos, nao apenas impressao visual.

## Criterio de pronto da avaliacao

A avaliacao do algoritmo esta pronta quando:

1. existem pelo menos 20 datasets sinteticos;
2. existem pelo menos 50 recorrencias esperadas rotuladas;
3. existem casos intencionais de falso positivo;
4. existem casos provaveis de falso negativo;
5. precision, recall e F1 sao calculados automaticamente;
6. versao atual e versao nova sao executadas sobre o mesmo corpus;
7. o relatorio comparativo e gerado em Markdown;
8. a decisao de promover ou rejeitar a nova versao e baseada nos limiares deste documento.

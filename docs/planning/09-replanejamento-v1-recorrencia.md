# Replanejamento V1 - foco em recorrencia

## Novo foco da V1

A V1 deixa de ter como objetivo principal uma demo visual de fluxo de caixa e passa a ter como objetivo validar, medir e aprimorar o algoritmo de deteccao de recorrencia para um futuro SaaS B2B multiempresa.

A UI continua existindo, mas como ferramenta minima para:

- importar ou cadastrar transacoes;
- executar versoes do algoritmo;
- revisar recorrencias sugeridas;
- registrar feedback manual;
- comparar resultados.

O produto visual completo fica fora do foco da V1.

## Principios

- O algoritmo deve ser generalizavel entre empresas.
- A deteccao de recorrencia nao deve depender de categorias.
- Categoria pode ser usada como sinal auxiliar, nunca como chave obrigatoria.
- Nao criar regras hardcoded para nomes especificos de empresas, fornecedores, bancos, anuncios, imobiliarias ou softwares.
- Avaliar o algoritmo com datasets sinteticos rotulados.
- Registrar falsos positivos e falsos negativos de forma estruturada.
- Comparar versoes do algoritmo com metricas.
- Manter o MVP simples: banco, Prisma, services puros, telas minimas e testes.

## 1. Separar recorrencia de categorizacao

### Problema atual

O planejamento anterior mistura recorrencia com categoria em alguns pontos. Isso pode gerar vieses:

- uma categoria generica pode agrupar transacoes que nao sao recorrentes;
- uma recorrencia real pode nao ser detectada se a categoria estiver ausente ou errada;
- categorias manuais variam entre empresas e usuarios.

### Nova regra

O modulo de recorrencia deve receber transacoes normalizadas e detectar padroes usando sinais independentes:

- assinatura textual da descricao;
- similaridade textual;
- intervalo temporal;
- estabilidade de valor;
- direcao financeira: `income` ou `expense`;
- conta, quando relevante;
- categoria apenas como sinal opcional de consistencia.

### Contrato esperado

```ts
detectRecurringPatterns(input: {
  transactions: RecurrenceTransactionInput[];
  options: RecurrenceDetectionOptions;
  algorithmVersion: string;
}): RecurrenceDetectionResult;
```

Categorias nao devem ser obrigatorias no input. Quando existirem, entram como metadado auxiliar.

## 2. Arquitetura do modulo de recorrencia

Estrutura recomendada:

```txt
src/
├─ recurrence/
│  ├─ index.ts
│  ├─ normalize.ts
│  ├─ fingerprint.ts
│  ├─ similarity.ts
│  ├─ grouping.ts
│  ├─ frequency.ts
│  ├─ scoring.ts
│  ├─ evaluation.ts
│  ├─ versions/
│  │  ├─ v1-baseline.ts
│  │  ├─ v2-similarity.ts
│  │  └─ registry.ts
│  └─ types.ts
├─ synthetic-datasets/
│  ├─ generator.ts
│  ├─ scenarios.ts
│  └─ labels.ts
└─ server/
   ├─ recurrence-runs.actions.ts
   └─ recurrence-feedback.actions.ts
```

### Responsabilidades

`normalize.ts`

- normalizar descricao;
- remover ruido generico;
- nao remover informacao util demais;
- nao conter regras por fornecedor especifico.

`fingerprint.ts`

- criar assinatura textual generalizavel;
- remover tokens fracos genericos;
- preservar tokens capazes de diferenciar entidades.

`similarity.ts`

- calcular similaridade entre descricoes;
- comecar simples: token overlap, Jaccard ou Dice coefficient;
- sem machine learning na V1.

`grouping.ts`

- agrupar candidatos por tipo, conta opcional e similaridade textual;
- nao agrupar apenas por categoria;
- evitar que varias receitas mensais genericas virem recorrencia por coincidencia temporal.

`frequency.ts`

- detectar mensal, semanal, anual ou desconhecida;
- tolerar variacao de data;
- permitir janelas configuraveis por versao do algoritmo.

`scoring.ts`

- calcular score e confidence;
- separar motivos do score;
- retornar explicabilidade basica.

`evaluation.ts`

- comparar deteccoes com labels esperados;
- calcular metricas;
- listar falsos positivos e falsos negativos.

`versions/`

- manter versoes comparaveis do algoritmo;
- cada versao deve ter nome, parametros e funcao de execucao.

## 3. Modelo conceitual de dados para avaliacao

Nao precisa virar schema completo no primeiro passo, mas a V1 deve ter estes conceitos.

### RecurrenceDetectionRun

Representa uma execucao do algoritmo.

Campos:

- `id`
- `organizationId`
- `datasetId` nullable
- `algorithmVersion`
- `parametersJson`
- `startedAt`
- `finishedAt`
- `status`
- `metricsJson`

### RecurrenceDetectionCandidate

Representa uma recorrencia sugerida por uma execucao.

Campos:

- `id`
- `runId`
- `organizationId`
- `patternKey`
- `type`
- `frequency`
- `averageAmount`
- `amountVariation`
- `dateRegularity`
- `textSimilarity`
- `confidence`
- `explanationJson`
- `matchedTransactionIds`

### RecurrenceFeedback

Representa feedback manual do usuario ou avaliador.

Campos:

- `id`
- `organizationId`
- `candidateId`
- `label`: `true_positive | false_positive | false_negative | uncertain`
- `expectedFrequency` nullable
- `expectedNextDate` nullable
- `comment` nullable
- `createdAt`

### SyntheticDataset

Representa um dataset sintetico rotulado.

Campos:

- `id`
- `name`
- `scenario`
- `seed`
- `organizationProfileJson`
- `createdAt`

## 4. Datasets sinteticos de teste

Objetivo: testar o algoritmo em cenarios controlados antes de confiar em dados reais.

Cada dataset deve conter:

- transacoes;
- labels esperados de recorrencia;
- ruido intencional;
- metadados do cenario.

### Tipos de casos de teste

#### Recorrencias simples

- despesa mensal fixa;
- receita mensal fixa;
- despesa semanal fixa;
- despesa anual;
- recorrencia com mesmo valor e descricao muito parecida.

#### Recorrencias com variacao realista

- valor variando dentro de uma faixa pequena;
- data variando alguns dias;
- descricao com pequenos sufixos, prefixos ou identificadores;
- recorrencia que pula um mes;
- recorrencia com uma ocorrencia duplicada no mesmo periodo.

#### Nao recorrencias que parecem recorrentes

- varias receitas em meses diferentes, mas com contrapartes diferentes;
- despesas da mesma categoria em datas proximas, mas descricoes diferentes;
- pagamentos parcelados com numero finito de parcelas;
- transacoes sazonais;
- transferencias internas;
- ajustes e taxas avulsas.

#### Casos dificeis

- mesma entidade com descricoes muito diferentes;
- descricoes parecidas para entidades diferentes;
- valores muito variaveis;
- mudanca de dia de vencimento;
- mudanca de conta;
- recorrencia encerrada;
- recorrencia nova com apenas duas ocorrencias.

#### Casos multiempresa

- empresa com baixo volume de transacoes;
- empresa com alto volume;
- empresa com muitas receitas pequenas;
- empresa com poucas despesas grandes;
- empresa com varias contas;
- empresas com padroes de texto diferentes.

## 5. Metricas de avaliacao

### Metricas principais

Precision:

```txt
true_positives / (true_positives + false_positives)
```

Mede quantas recorrencias sugeridas eram realmente recorrencias.

Recall:

```txt
true_positives / (true_positives + false_negatives)
```

Mede quantas recorrencias reais foram encontradas.

F1:

```txt
2 * precision * recall / (precision + recall)
```

Equilibra precision e recall.

### Metricas complementares

False positive rate:

- importante para evitar que o SaaS projete itens inexistentes.

False negative rate:

- importante para entender recorrencias que o algoritmo deixou passar.

Next date accuracy:

- diferenca media entre proxima data prevista e data esperada.

Amount accuracy:

- erro percentual medio entre valor projetado e valor esperado.

Frequency accuracy:

- percentual de recorrencias com frequencia correta.

Confidence calibration:

- candidatos com confidence alta devem ter maior chance de serem verdadeiros.

Runtime:

- tempo de execucao por quantidade de transacoes.

### Segmentacao das metricas

As metricas devem ser quebradas por:

- `income` vs `expense`;
- frequencia;
- volume de transacoes;
- nivel de ruido;
- com categoria vs sem categoria;
- dataset sintetico;
- versao do algoritmo.

## 6. Registro de falsos positivos e falsos negativos

### Falso positivo

Caso em que o algoritmo sugeriu uma recorrencia inexistente.

Registrar:

- versao do algoritmo;
- dataset ou organizacao;
- transacoes que causaram a sugestao;
- confidence;
- explicacao do algoritmo;
- motivo manual do erro.

Exemplos genericos de motivos:

- descricoes parecidas, mas entidades diferentes;
- varias entradas mensais sem relacao recorrente;
- valor estavel por coincidencia;
- agrupamento textual agressivo demais;
- janela de data permissiva demais.

### Falso negativo

Caso em que havia recorrencia real e o algoritmo nao detectou.

Registrar:

- recorrencia esperada;
- transacoes que deveriam formar o grupo;
- motivo provavel;
- versao do algoritmo;
- score intermediario, se houver.

Exemplos genericos de motivos:

- descricao variou demais;
- valor variou demais;
- faltou uma ocorrencia;
- transacoes cairam em contas diferentes;
- janela temporal restritiva demais;
- fingerprint perdeu tokens importantes.

## 7. Comparar versoes do algoritmo

### Registro de versoes

Cada versao deve declarar:

- `version`;
- descricao curta;
- parametros;
- estrategia de fingerprint;
- estrategia de agrupamento;
- estrategia de score;
- data de criacao.

Exemplo:

```ts
export interface RecurrenceAlgorithmVersion {
  version: string;
  description: string;
  parameters: Record<string, number | string | boolean>;
  run(input: RecurrenceDetectionInput): RecurrenceDetectionResult;
}
```

### Baseline da V1

Criar uma versao inicial simples:

- agrupamento por tipo + fingerprint textual;
- similaridade por tokens;
- frequencia mensal/semanal;
- score por regularidade, similaridade e estabilidade de valor;
- categoria apenas como bonus pequeno quando consistente.

### Comparacao

Para cada dataset:

1. Rodar todas as versoes registradas.
2. Calcular metricas.
3. Gerar tabela comparativa.
4. Listar falsos positivos e falsos negativos por versao.
5. Registrar se a nova versao melhorou ou piorou.

Regra de decisao:

- nao promover uma versao se ela melhora recall destruindo precision;
- nao promover uma versao se ela depende de exemplos especificos;
- preferir versao simples e explicavel enquanto as metricas forem aceitaveis.

## 8. Feedback manual do usuario

### Objetivo

Usar a revisao humana para melhorar avaliacao e calibrar o algoritmo, sem transformar isso em machine learning na V1.

### Fluxos minimos

Na tela de recorrencias:

- confirmar recorrencia sugerida;
- marcar como nao recorrente;
- editar frequencia esperada;
- editar proxima data esperada;
- registrar comentario opcional.

Para falsos negativos:

- permitir selecionar transacoes e marcar como recorrencia esperada;
- salvar isso como feedback manual;
- usar depois na avaliacao.

### Uso do feedback na V1

O feedback deve:

- entrar nas metricas;
- aparecer nos reports de avaliacao;
- ajudar a ajustar parametros;
- nao treinar modelo;
- nao criar regras especificas por fornecedor.

## 9. Manter o MVP simples

### O que implementar na V1

- modulo puro de recorrencia;
- gerador de datasets sinteticos;
- labels esperados;
- runner de avaliacao;
- metricas em JSON ou Markdown;
- tela simples para feedback;
- persistencia minima de runs e feedback.

### O que nao implementar na V1

- machine learning;
- Open Finance;
- classificadores externos;
- embeddings;
- fila de processamento;
- dashboard analitico complexo;
- tuning automatico;
- regras por fornecedor especifico;
- arquitetura multi-servico.

## 10. Criterios de sucesso

### Sucesso tecnico

- recorrencia roda sem depender de categoria;
- datasets sinteticos conseguem reproduzir casos simples e dificeis;
- cada execucao registra versao e parametros;
- metricas sao calculadas automaticamente;
- falsos positivos e falsos negativos ficam auditaveis;
- feedback manual e persistido.

### Sucesso de algoritmo

Para considerar a V1 util:

- precision satisfatoria em casos simples;
- recall satisfatorio em recorrencias mensais e semanais claras;
- baixa taxa de falso positivo em receitas variaveis;
- proxima data prevista dentro de tolerancia configurada;
- valor medio projetado com erro aceitavel em recorrencias estaveis;
- resultados explicaveis por score e sinais.

### Sucesso de produto MVP

- usuario consegue revisar sugestoes;
- usuario consegue corrigir falso positivo;
- usuario consegue registrar falso negativo;
- equipe consegue comparar versoes;
- o MVP ajuda a decidir como evoluir o algoritmo.

## 11. Proximos passos de desenvolvimento

### Passo 1 - Definir tipos do modulo

Criar tipos para:

- input de transacao;
- candidato de recorrencia;
- resultado de deteccao;
- label esperado;
- feedback manual;
- metricas;
- versao do algoritmo.

### Passo 2 - Extrair recorrencia para modulo dedicado

Mover a logica atual de `src/services/recurrence.ts` para uma estrutura dedicada, mantendo compatibilidade com a UI atual.

### Passo 3 - Criar baseline versionado

Registrar a versao `v1-baseline` com os parametros atuais, removendo dependencia obrigatoria de categoria.

### Passo 4 - Criar datasets sinteticos

Implementar gerador deterministico com seed fixa e cenarios controlados.

### Passo 5 - Criar runner de avaliacao

Rodar algoritmo contra dataset, comparar com labels e gerar metricas.

### Passo 6 - Persistir runs e feedback

Adicionar persistencia minima para:

- execucoes;
- candidatos;
- feedback manual.

### Passo 7 - Ajustar UI minima

Adaptar `/recurring` para:

- mostrar versao do algoritmo;
- mostrar score e explicacao;
- registrar feedback;
- listar falsos positivos e falsos negativos conhecidos.

### Passo 8 - Comparar v1 com v2

Criar uma segunda versao simples com melhoria isolada, por exemplo ajuste de similaridade textual ou score temporal, e comparar com o baseline.

## Definicao de pronto da V1 replanejada

A V1 estara pronta quando for possivel:

1. gerar datasets sinteticos rotulados;
2. rodar pelo menos uma versao do algoritmo;
3. calcular precision, recall, F1 e erros de data/valor;
4. registrar feedback manual;
5. identificar falsos positivos e falsos negativos;
6. comparar duas versoes do algoritmo;
7. manter a UI simples apenas como suporte ao processo;
8. demonstrar que a deteccao funciona sem depender de categorizacao.

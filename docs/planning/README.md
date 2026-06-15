# Planejamento tecnico - MVP V1.0

Este diretorio contem apenas documentacao de planejamento. Nenhum codigo de aplicacao foi implementado aqui.

Objetivo do MVP: validar a logica principal de fluxo de caixa empresarial:

- importar ou cadastrar transacoes;
- normalizar descricoes;
- categorizar por regras simples;
- detectar recorrencias;
- permitir confirmacao, ignorar recorrencias e corrigir categorias;
- projetar saldo futuro em 30, 60 e 90 dias;
- gerar alertas basicos de risco de caixa.

Escopo explicitamente fora da V1.0:

- autenticacao robusta;
- Open Finance;
- machine learning;
- microservicos;
- filas;
- dashboards complexos;
- infraestrutura alem de Next.js, Postgres e Prisma.

Arquivos deste plano:

- `01-fases-implementacao.md`: fases pequenas de entrega.
- `02-estrutura-pastas.md`: estrutura recomendada do projeto.
- `03-schema-prisma.md`: schema Prisma completo proposto.
- `04-seed-e-dados-demo.md`: plano de seed e dados ficticios.
- `05-servicos-e-tipos.md`: servicos, funcoes e tipos TypeScript principais.
- `06-pseudocodigo-algoritmos.md`: pseudocodigo dos algoritmos centrais.
- `07-ui-fluxos-seguranca.md`: telas, fluxos e seguranca minima.
- `08-testes-definicao-pronto.md`: testes minimos e definicao de pronto.

Principio de implementacao:

Manter regra de negocio fora da UI. A UI deve chamar server actions ou API routes pequenas, com validacao Zod e sempre filtrando por `organizationId`. Os algoritmos devem ser preferencialmente funcoes puras, recebendo arrays/objetos e retornando resultados claros, sem efeitos colaterais escondidos.

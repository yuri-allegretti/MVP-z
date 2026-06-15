import type {
  ExpectedRecurringPattern,
  FalsePositiveTrap,
  RecurrenceEvaluationDataset
} from "../../src/services/recurrence-evaluation";
import type {
  RecurringFrequency,
  TransactionForRecurrence,
  TransactionType
} from "../../src/types/cashflow";

type DatasetPart = {
  transactions: TransactionForRecurrence[];
  expectedPatterns: ExpectedRecurringPattern[];
  falsePositiveTraps: FalsePositiveTrap[];
};

type PatternInput = {
  id: string;
  label: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  descriptions: string[];
  expectedFingerprint: string;
  tags: string[];
  day?: number;
  startDate?: string;
  frequency?: RecurringFrequency;
  evaluationMode?: ExpectedRecurringPattern["evaluationMode"];
};

type TrapInput = {
  id: string;
  label: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amounts: number[];
  descriptions: string[];
  reason: string;
  tags: string[];
  day?: number;
};

export const recurrenceEvaluationDatasets: RecurrenceEvaluationDataset[] = [
  dataset("saas-b2b", "SaaS B2B", "SaaS B2B", [
    monthly("saas-rent", "Aluguel escritorio SaaS", "saas-account", "rent", "expense", 12200, 5, [
      "pix imobiliaria azul aluguel matriz",
      "aluguel sala comercial imobiliaria azul matriz"
    ], "imobiliaria azul matriz", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("saas-payroll", "Folha equipe produto", "saas-account", "payroll", "expense", 68000, 28, [
      "folha pagamento equipe produto tecnologia",
      "salarios equipe produto tecnologia"
    ], "equipe produto tecnologia", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("saas-cloud", "Assinatura cloud monitoramento", "saas-account", "software", "expense", 4200, 12, [
      "assinatura cloud monitoramento plataforma",
      "fatura cloud monitoramento plataforma"
    ], "cloud monitoramento plataforma", ["fixed_monthly_expense", "saas_subscription", "alternating_common_tokens"]),
    monthly("saas-retainer", "Contrato recorrente cliente anchor", "saas-account", "retainer", "income", 36000, 10, [
      "mensalidade cliente anchor suporte plataforma",
      "recebimento cliente anchor suporte plataforma"
    ], "anchor suporte plataforma", ["consistent_recurring_income", "alternating_common_tokens"]),
    variableTrap("saas-marketing-variable", "Campanhas SaaS variaveis", "saas-account", "marketing", "expense", [9000, 17000, 5200, 23000], [
      "campanha marketing growth ads produto",
      "campanha marketing growth ads produto"
    ], "campanhas mensais tem descritor igual, mas valor altamente variavel", ["marketing_variable"]),
    genericIncomeTrap("saas-generic-pix", "PIX genericos de clientes diferentes", "saas-account", "sales", [
      "pix recebido cliente alfa licenca",
      "pix recebido cliente beta licenca",
      "pix recebido cliente gama licenca",
      "pix recebido cliente delta licenca"
    ]),
    yearlyUnsupported("saas-annual-security", "Cobranca anual de seguranca", "saas-account", "software", "expense", 14800, [
      "renovacao anual seguranca aplicacao",
      "renovacao anual seguranca aplicacao",
      "renovacao anual seguranca aplicacao"
    ], "renovacao anual seguranca")
  ]),

  dataset("medical-clinic", "Clinica medica", "clinica medica", [
    monthly("clinic-rent", "Aluguel da clinica", "clinic-account", "rent", "expense", 9800, 6, [
      "pix imobiliaria centro clinica aluguel",
      "aluguel consultorio imobiliaria centro clinica"
    ], "imobiliaria centro clinica", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("clinic-health", "Plano de saude empresarial", "clinic-account", "benefits", "expense", 6100, 7, [
      "debito plano saude equipe medica",
      "pagamento saude equipe medica empresarial"
    ], "saude equipe medica", ["fixed_monthly_expense", "health_plan", "alternating_common_tokens"]),
    monthly("clinic-internet", "Internet da clinica", "clinic-account", "utilities", "expense", 620, 15, [
      "internet fibra clinica unidade centro",
      "fatura internet fibra clinica centro"
    ], "internet fibra clinica centro", ["fixed_monthly_expense", "utilities", "alternating_common_tokens"]),
    monthly("clinic-membership", "Mensalidade de pacientes premium", "clinic-account", "membership", "income", 18000, 10, [
      "mensalidade programa premium saude preventiva",
      "recebimento programa premium saude preventiva"
    ], "programa premium saude preventiva", ["consistent_recurring_income", "monthly_fee", "alternating_common_tokens"]),
    variableTrap("clinic-tax-variable", "Impostos instaveis da clinica", "clinic-account", "taxes", "expense", [2800, 7700, 3300, 9400], [
      "darf imposto clinica competencia",
      "darf imposto clinica competencia"
    ], "impostos mensais com valor instavel nao devem parecer recorrencia fixa", ["unstable_tax"]),
    genericIncomeTrap("clinic-patient-pix", "PIX de pacientes diferentes", "clinic-account", "sales", [
      "pix recebido paciente maria consulta",
      "pix recebido paciente joao consulta",
      "pix recebido paciente ana consulta",
      "pix recebido paciente bruno consulta"
    ]),
    quarterlyUnsupported("clinic-quarter-tax", "Imposto trimestral da clinica", "clinic-account", "taxes", "expense", 11200, [
      "imposto trimestral clinica simples nacional",
      "imposto trimestral clinica simples nacional",
      "imposto trimestral clinica simples nacional"
    ], "imposto trimestral clinica")
  ]),

  dataset("restaurant", "Restaurante", "restaurante", [
    monthly("restaurant-rent", "Aluguel do salao", "restaurant-account", "rent", "expense", 14200, 5, [
      "pix imobiliaria sabor aluguel salao",
      "aluguel ponto comercial imobiliaria sabor"
    ], "imobiliaria sabor", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("restaurant-gas", "Fornecedor recorrente de gas", "restaurant-account", "supplier", "expense", 3300, 9, [
      "fornecedor gas cozinha contrato fixo",
      "pagamento gas cozinha contrato fixo"
    ], "gas cozinha contrato fixo", ["fixed_monthly_expense", "recurring_supplier", "alternating_common_tokens"]),
    monthly("restaurant-energy", "Energia do restaurante", "restaurant-account", "utilities", "expense", 4700, 18, [
      "conta energia restaurante unidade centro",
      "fatura energia restaurante centro"
    ], "energia restaurante centro", ["fixed_monthly_expense", "utilities", "alternating_common_tokens"]),
    stockTrap("restaurant-stock-variable", "Compras de estoque mensais irregulares", "restaurant-account", "inventory", [
      "compra estoque carnes fornecedor sul",
      "compra estoque verduras fornecedor horta",
      "compra estoque bebidas fornecedor distribuidora",
      "compra estoque descartaveis fornecedor geral"
    ]),
    supplierCoincidenceTrap("restaurant-supplier-coincidence", "Fornecedores pagos por coincidencia todo mes", "restaurant-account", "supplier", [
      "pagamento fornecedor peixe azul",
      "pagamento fornecedor paes serra",
      "pagamento fornecedor limpeza norte",
      "pagamento fornecedor gelo polar"
    ]),
    genericIncomeTrap("restaurant-delivery-pix", "Recebimentos delivery de clientes diferentes", "restaurant-account", "sales", [
      "pix recebido delivery cliente mesa alfa",
      "pix recebido delivery cliente mesa beta",
      "pix recebido delivery cliente mesa gama",
      "pix recebido delivery cliente mesa delta"
    ]),
    biweeklyUnsupported("restaurant-biweekly-waste", "Coleta quinzenal de residuos", "restaurant-account", "operations", "expense", 780, [
      "coleta residuos restaurante contrato",
      "coleta residuos restaurante contrato",
      "coleta residuos restaurante contrato",
      "coleta residuos restaurante contrato"
    ], "coleta residuos restaurante")
  ]),

  dataset("ecommerce", "E-commerce", "e-commerce", [
    monthly("ecom-platform", "Assinatura plataforma loja", "ecom-account", "software", "expense", 890, 14, [
      "assinatura plataforma loja virtual",
      "fatura plataforma loja virtual"
    ], "plataforma loja virtual", ["fixed_monthly_expense", "saas_subscription", "alternating_common_tokens"]),
    monthly("ecom-warehouse", "Aluguel galpao e-commerce", "ecom-account", "rent", "expense", 16500, 5, [
      "aluguel galpao estoque ecommerce",
      "pix galpao estoque ecommerce locacao"
    ], "galpao estoque ecommerce", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("ecom-loan", "Parcela emprestimo capital giro", "ecom-account", "loan", "expense", 7200, 22, [
      "parcela emprestimo capital giro loja",
      "debito emprestimo capital giro loja"
    ], "emprestimo capital giro loja", ["fixed_monthly_expense", "loan_installment", "alternating_common_tokens"]),
    marketplaceTrap("ecom-marketplace-payouts", "Repasses marketplace frequentes e variaveis", "ecom-account", "sales"),
    stockTrap("ecom-stock-variable", "Compras de estoque do e-commerce", "ecom-account", "inventory", [
      "compra estoque eletronicos lote janeiro",
      "compra estoque acessorios lote fevereiro",
      "compra estoque embalagens lote marco",
      "compra estoque cabos lote abril"
    ]),
    supplierCoincidenceTrap("ecom-supplier-coincidence", "Servicos avulsos pagos mensalmente", "ecom-account", "services", [
      "pagamento fornecedor foto produto",
      "pagamento fornecedor embalagem especial",
      "pagamento fornecedor ajuste loja",
      "pagamento fornecedor auditoria frete"
    ]),
    yearlyUnsupported("ecom-annual-domain", "Dominio anual da loja", "ecom-account", "software", "expense", 340, [
      "renovacao anual dominio loja virtual",
      "renovacao anual dominio loja virtual",
      "renovacao anual dominio loja virtual"
    ], "renovacao anual dominio")
  ]),

  dataset("marketing-agency", "Agencia de marketing", "agencia de marketing", [
    monthly("mkt-rent", "Aluguel agencia", "mkt-account", "rent", "expense", 8700, 4, [
      "pix imobiliaria criativa aluguel agencia",
      "aluguel sala comercial imobiliaria criativa"
    ], "imobiliaria criativa", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("mkt-payroll", "Folha time midia", "mkt-account", "payroll", "expense", 42000, 27, [
      "folha pagamento time midia performance",
      "salarios time midia performance"
    ], "time midia performance", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("mkt-retainer", "Contrato mensal cliente food", "mkt-account", "retainer", "income", 22000, 8, [
      "mensalidade cliente food planejamento midia",
      "recebimento cliente food planejamento midia"
    ], "food planejamento midia", ["consistent_recurring_income", "alternating_common_tokens"]),
    monthly("mkt-saas", "Assinatura ferramenta SEO", "mkt-account", "software", "expense", 1200, 11, [
      "assinatura ferramenta seo relatorios",
      "fatura ferramenta seo relatorios"
    ], "ferramenta seo relatorios", ["fixed_monthly_expense", "saas_subscription", "alternating_common_tokens"]),
    variableTrap("mkt-campaign-variable", "Campanhas de midia com valor variavel", "mkt-account", "marketing", "expense", [12000, 54000, 9000, 41000], [
      "campanha ads cliente varejo verba midia",
      "campanha ads cliente varejo verba midia"
    ], "campanhas ocorrem todo mes, mas verba muda conforme cliente", ["marketing_variable"]),
    genericIncomeTrap("mkt-project-income", "Projetos avulsos de clientes", "mkt-account", "sales", [
      "pix recebido cliente alfa projeto landing",
      "pix recebido cliente beta projeto videos",
      "pix recebido cliente gama projeto campanha",
      "pix recebido cliente delta projeto marca"
    ]),
    biweeklyUnsupported("mkt-freelancer-biweekly", "Freelancer quinzenal fixo", "mkt-account", "services", "expense", 2400, [
      "freelancer design pacote quinzenal",
      "freelancer design pacote quinzenal",
      "freelancer design pacote quinzenal",
      "freelancer design pacote quinzenal"
    ], "freelancer design pacote")
  ]),

  dataset("school", "Escola e cursos", "escola/curso", [
    monthly("school-rent", "Aluguel unidade curso", "school-account", "rent", "expense", 11800, 5, [
      "aluguel unidade curso centro",
      "pix imobiliaria unidade curso centro"
    ], "unidade curso centro", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("school-payroll", "Folha professores", "school-account", "payroll", "expense", 53000, 28, [
      "folha professores coordenacao pedagogica",
      "salarios professores coordenacao pedagogica"
    ], "professores coordenacao pedagogica", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("school-tuition", "Mensalidades turma recorrente", "school-account", "tuition", "income", 31000, 10, [
      "mensalidade turma intensivo alunos",
      "recebimento mensalidade turma intensivo alunos"
    ], "turma intensivo alunos", ["consistent_recurring_income", "monthly_fee", "alternating_common_tokens"]),
    monthly("school-internet", "Internet salas online", "school-account", "utilities", "expense", 950, 16, [
      "internet fibra salas online",
      "fatura internet fibra salas online"
    ], "internet fibra salas online", ["fixed_monthly_expense", "utilities"]),
    genericIncomeTrap("school-course-sales", "Vendas variaveis de cursos", "school-account", "sales", [
      "pix recebido aluno modulo excel",
      "pix recebido aluno modulo ingles",
      "pix recebido aluno modulo dados",
      "pix recebido aluno modulo design"
    ]),
    yearlyUnsupported("school-annual-license", "Licenca anual plataforma educacional", "school-account", "software", "expense", 9200, [
      "renovacao anual plataforma educacional",
      "renovacao anual plataforma educacional",
      "renovacao anual plataforma educacional"
    ], "renovacao anual plataforma educacional")
  ]),

  dataset("law-office", "Escritorio juridico", "escritorio juridico", [
    monthly("law-rent", "Aluguel escritorio juridico", "law-account", "rent", "expense", 9300, 6, [
      "pix imobiliaria foro aluguel escritorio",
      "aluguel conjunto juridico imobiliaria foro"
    ], "imobiliaria foro", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("law-software", "Assinatura software juridico", "law-account", "software", "expense", 1600, 13, [
      "assinatura software juridico processos",
      "fatura software juridico processos"
    ], "software juridico processos", ["fixed_monthly_expense", "saas_subscription"]),
    monthly("law-retainer", "Honorarios mensais cliente atlas", "law-account", "retainer", "income", 24000, 9, [
      "honorarios mensais cliente atlas consultivo",
      "recebimento cliente atlas consultivo mensal"
    ], "atlas consultivo", ["consistent_recurring_income", "alternating_common_tokens"]),
    variableTrap("law-court-fees", "Custas e taxas variaveis", "law-account", "fees", "expense", [700, 3200, 1400, 5100], [
      "custas processo tribunal cliente",
      "custas processo tribunal cliente"
    ], "custas podem ocorrer mensalmente, mas dependem dos processos", ["generic_card_or_fee"]),
    genericIncomeTrap("law-variable-clients", "Honorarios avulsos de clientes diferentes", "law-account", "sales", [
      "pix recebido cliente atlas parecer",
      "pix recebido cliente boreal audiencia",
      "pix recebido cliente domus contrato",
      "pix recebido cliente eixo recurso"
    ]),
    quarterlyUnsupported("law-quarter-dues", "Anuidade parcelada trimestral associacao", "law-account", "dues", "expense", 1800, [
      "contribuicao trimestral associacao juridica",
      "contribuicao trimestral associacao juridica",
      "contribuicao trimestral associacao juridica"
    ], "contribuicao trimestral associacao")
  ]),

  dataset("small-industry", "Industria pequena", "industria pequena", [
    monthly("industry-lease", "Locacao fabrica", "industry-account", "rent", "expense", 21000, 5, [
      "locacao galpao fabril distrito",
      "aluguel galpao fabril distrito"
    ], "galpao fabril distrito", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("industry-energy", "Energia fabril", "industry-account", "utilities", "expense", 18500, 19, [
      "conta energia fabrica producao",
      "fatura energia fabrica producao"
    ], "energia fabrica producao", ["fixed_monthly_expense", "utilities"]),
    monthly("industry-maintenance", "Manutencao preventiva maquinas", "industry-account", "maintenance", "expense", 4600, 12, [
      "manutencao preventiva maquinas contrato",
      "pagamento manutencao maquinas contrato"
    ], "manutencao maquinas contrato", ["fixed_monthly_expense", "recurring_supplier", "alternating_common_tokens"]),
    stockTrap("industry-raw-materials", "Materia-prima mensal irregular", "industry-account", "inventory", [
      "compra estoque resina fornecedor alpha",
      "compra estoque pigmento fornecedor beta",
      "compra estoque embalagem fornecedor gama",
      "compra estoque componentes fornecedor delta"
    ]),
    variableTrap("industry-card-generic", "Cartao corporativo fabril generico", "industry-account", "card", "expense", [2200, 9600, 3100, 12700], [
      "cartao corporativo despesas fabrica",
      "cartao corporativo despesas fabrica"
    ], "descritor generico do cartao agrega compras diferentes", ["generic_card_or_fee"]),
    quarterlyUnsupported("industry-quarter-maintenance", "Calibracao trimestral equipamentos", "industry-account", "maintenance", "expense", 5200, [
      "calibracao trimestral equipamentos producao",
      "calibracao trimestral equipamentos producao",
      "calibracao trimestral equipamentos producao"
    ], "calibracao trimestral equipamentos")
  ]),

  dataset("marketplace-seller", "Marketplace seller", "marketplace seller", [
    monthly("seller-warehouse", "Aluguel pequeno deposito", "seller-account", "rent", "expense", 7600, 5, [
      "aluguel deposito marketplace seller",
      "pix locacao deposito marketplace seller"
    ], "deposito marketplace seller", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("seller-software", "Assinatura integrador marketplace", "seller-account", "software", "expense", 740, 11, [
      "assinatura integrador marketplace pedidos",
      "fatura integrador marketplace pedidos"
    ], "integrador marketplace pedidos", ["fixed_monthly_expense", "saas_subscription", "alternating_common_tokens"]),
    monthly("seller-loan", "Parcela emprestimo estoque", "seller-account", "loan", "expense", 5100, 21, [
      "parcela emprestimo estoque loja",
      "debito emprestimo estoque loja"
    ], "emprestimo estoque loja", ["fixed_monthly_expense", "loan_installment", "alternating_common_tokens"]),
    marketplaceTrap("seller-marketplace-payouts", "Payouts marketplace variaveis", "seller-account", "sales"),
    stockTrap("seller-inventory-variable", "Reposicao de estoque variavel", "seller-account", "inventory", [
      "compra estoque capa celular lote",
      "compra estoque carregador lote",
      "compra estoque fone lote",
      "compra estoque pelicula lote"
    ]),
    yearlyUnsupported("seller-annual-insurance", "Seguro anual estoque", "seller-account", "insurance", "expense", 6600, [
      "seguro anual estoque deposito",
      "seguro anual estoque deposito",
      "seguro anual estoque deposito"
    ], "seguro anual estoque")
  ]),

  dataset("consulting", "Consultoria", "consultoria", [
    monthly("consulting-coworking", "Coworking mensal consultoria", "consulting-account", "rent", "expense", 2900, 4, [
      "mensalidade coworking sala consultoria",
      "fatura coworking sala consultoria"
    ], "coworking consultoria", ["fixed_monthly_expense", "monthly_fee", "alternating_common_tokens"]),
    monthly("consulting-payroll", "Pro-labore socios", "consulting-account", "payroll", "expense", 26000, 28, [
      "pro labore socios consultoria",
      "retirada socios consultoria mensal"
    ], "socios consultoria", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("consulting-retainer", "Contrato recorrente cliente beta", "consulting-account", "retainer", "income", 30000, 8, [
      "honorarios mensais cliente beta estrategia",
      "recebimento cliente beta estrategia mensal"
    ], "beta estrategia", ["consistent_recurring_income", "alternating_common_tokens"]),
    genericIncomeTrap("consulting-variable-clients", "Projetos variaveis de consultoria", "consulting-account", "sales", [
      "pix recebido cliente alfa diagnostico",
      "pix recebido cliente gama workshop",
      "pix recebido cliente omega plano",
      "pix recebido cliente sigma analise"
    ]),
    supplierCoincidenceTrap("consulting-services-coincidence", "Servicos externos sem recorrencia unica", "consulting-account", "services", [
      "pagamento fornecedor pesquisa mercado",
      "pagamento fornecedor revisao proposta",
      "pagamento fornecedor design apresentacao",
      "pagamento fornecedor traducao relatorio"
    ]),
    quarterlyUnsupported("consulting-quarter-tax", "Imposto trimestral consultoria", "consulting-account", "taxes", "expense", 14300, [
      "imposto trimestral consultoria lucro presumido",
      "imposto trimestral consultoria lucro presumido",
      "imposto trimestral consultoria lucro presumido"
    ], "imposto trimestral consultoria")
  ]),

  dataset("gym", "Academia", "academia", [
    monthly("gym-rent", "Aluguel academia", "gym-account", "rent", "expense", 15500, 5, [
      "pix imobiliaria fitness aluguel academia",
      "aluguel ponto fitness imobiliaria academia"
    ], "imobiliaria fitness academia", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("gym-payroll", "Folha instrutores", "gym-account", "payroll", "expense", 37000, 28, [
      "folha instrutores recepcao academia",
      "salarios instrutores recepcao academia"
    ], "instrutores recepcao academia", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("gym-memberships", "Mensalidades plano anual", "gym-account", "membership", "income", 44000, 10, [
      "mensalidade alunos plano anual academia",
      "recebimento alunos plano anual academia"
    ], "alunos anual academia", ["consistent_recurring_income", "monthly_fee", "alternating_common_tokens"]),
    monthly("gym-water", "Agua unidade academia", "gym-account", "utilities", "expense", 2100, 17, [
      "conta agua academia unidade",
      "fatura agua academia unidade"
    ], "agua academia unidade", ["fixed_monthly_expense", "utilities"]),
    variableTrap("gym-card-payouts", "Repasses cartao variaveis", "gym-account", "sales", "income", [18000, 37000, 22000, 51000], [
      "repasse cartao mensalidades academia",
      "repasse cartao mensalidades academia"
    ], "repasses dependem do volume de alunos e cancelamentos", ["marketplace_payouts"]),
    yearlyUnsupported("gym-equipment-annual", "Manutencao anual equipamentos", "gym-account", "maintenance", "expense", 9000, [
      "manutencao anual equipamentos musculacao",
      "manutencao anual equipamentos musculacao",
      "manutencao anual equipamentos musculacao"
    ], "manutencao anual equipamentos")
  ]),

  dataset("real-estate", "Imobiliaria", "imobiliaria", [
    monthly("realestate-office", "Aluguel escritorio imobiliaria", "realestate-account", "rent", "expense", 7200, 5, [
      "aluguel escritorio imobiliaria central",
      "pix locacao escritorio imobiliaria central"
    ], "escritorio imobiliaria central", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("realestate-portal", "Assinatura portal anuncios", "realestate-account", "software", "expense", 2100, 12, [
      "assinatura portal imoveis anuncios",
      "fatura portal imoveis anuncios"
    ], "portal imoveis anuncios", ["fixed_monthly_expense", "saas_subscription"]),
    monthly("realestate-admin", "Receita administracao condominio", "realestate-account", "retainer", "income", 27000, 9, [
      "taxa administracao condominio vila verde",
      "recebimento administracao condominio vila verde"
    ], "administracao condominio vila verde", ["consistent_recurring_income", "alternating_common_tokens"]),
    genericIncomeTrap("realestate-commissions", "Comissoes variaveis de venda", "realestate-account", "sales", [
      "pix recebido comissao venda cliente norte",
      "pix recebido comissao venda cliente sul",
      "pix recebido comissao venda cliente leste",
      "pix recebido comissao venda cliente oeste"
    ]),
    variableTrap("realestate-card-generic", "Cartao corporativo imobiliaria", "realestate-account", "card", "expense", [900, 4300, 1700, 6200], [
      "cartao corporativo despesas imobiliaria",
      "cartao corporativo despesas imobiliaria"
    ], "cartao agrupa despesas diferentes sob o mesmo texto", ["generic_card_or_fee"]),
    quarterlyUnsupported("realestate-quarter-tax", "ISS trimestral imobiliaria", "realestate-account", "taxes", "expense", 6800, [
      "iss trimestral imobiliaria administracao",
      "iss trimestral imobiliaria administracao",
      "iss trimestral imobiliaria administracao"
    ], "iss trimestral imobiliaria")
  ]),

  dataset("logistics", "Logistica e frete", "logistica/frete", [
    monthly("logistics-yard", "Aluguel patio frota", "logistics-account", "rent", "expense", 18800, 5, [
      "aluguel patio frota caminhoes",
      "pix locacao patio frota caminhoes"
    ], "patio frota caminhoes", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("logistics-tracking", "SaaS rastreamento frota", "logistics-account", "software", "expense", 2600, 12, [
      "assinatura rastreamento frota veiculos",
      "fatura rastreamento frota veiculos"
    ], "rastreamento frota veiculos", ["fixed_monthly_expense", "saas_subscription"]),
    weekly("logistics-cleaning", "Lavagem semanal frota", "logistics-account", "maintenance", "expense", 1200, "2026-01-03", [
      "lavagem frota caminhoes contrato",
      "pagamento lavagem frota caminhoes"
    ], "lavagem frota caminhoes", ["fixed_monthly_expense", "weekly_recurrence", "alternating_common_tokens"]),
    variableTrap("logistics-freight-volume", "Fretes recorrentes por volume", "logistics-account", "freight", "expense", [7600, 21200, 9800, 18500], [
      "frete agregado rota sul volume",
      "frete agregado rota sul volume"
    ], "fretes aparecem todo mes, mas variam por volume e nao por contrato fixo", ["volume_freight"]),
    biweeklyUnsupported("logistics-biweekly-tolls", "Acerto quinzenal pedagios", "logistics-account", "freight", "expense", 3400, [
      "acerto pedagio frota quinzenal",
      "acerto pedagio frota quinzenal",
      "acerto pedagio frota quinzenal",
      "acerto pedagio frota quinzenal"
    ], "acerto pedagio frota")
  ]),

  dataset("auto-repair", "Oficina mecanica", "oficina mecanica", [
    monthly("auto-rent", "Aluguel oficina", "auto-account", "rent", "expense", 6900, 5, [
      "aluguel galpao oficina mecanica",
      "pix locacao galpao oficina mecanica"
    ], "galpao oficina mecanica", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("auto-payroll", "Folha mecanicos", "auto-account", "payroll", "expense", 24500, 28, [
      "folha mecanicos atendimento oficina",
      "salarios mecanicos atendimento oficina"
    ], "mecanicos atendimento oficina", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("auto-parts-contract", "Fornecedor recorrente de oleo", "auto-account", "supplier", "expense", 3900, 13, [
      "fornecedor oleo lubrificante contrato",
      "pagamento oleo lubrificante contrato"
    ], "oleo lubrificante contrato", ["fixed_monthly_expense", "recurring_supplier", "alternating_common_tokens"]),
    stockTrap("auto-parts-stock", "Compras de pecas irregulares", "auto-account", "inventory", [
      "compra estoque pastilha freio",
      "compra estoque correia dentada",
      "compra estoque filtro ar",
      "compra estoque amortecedor"
    ]),
    genericIncomeTrap("auto-service-income", "Servicos avulsos de clientes", "auto-account", "sales", [
      "pix recebido cliente alfa revisao",
      "pix recebido cliente beta funilaria",
      "pix recebido cliente gama pintura",
      "pix recebido cliente delta alinhamento"
    ]),
    yearlyUnsupported("auto-annual-license", "Licenca anual sistema oficina", "auto-account", "software", "expense", 2800, [
      "licenca anual sistema oficina",
      "licenca anual sistema oficina",
      "licenca anual sistema oficina"
    ], "licenca anual sistema oficina")
  ]),

  dataset("events-company", "Empresa de eventos", "empresa de eventos", [
    monthly("events-warehouse", "Aluguel deposito eventos", "events-account", "rent", "expense", 10400, 5, [
      "aluguel deposito equipamentos eventos",
      "pix locacao deposito equipamentos eventos"
    ], "deposito equipamentos eventos", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("events-insurance", "Seguro mensal equipamentos", "events-account", "insurance", "expense", 2400, 18, [
      "seguro equipamentos eventos contrato",
      "debito seguro equipamentos eventos"
    ], "seguro equipamentos eventos", ["fixed_monthly_expense", "alternating_common_tokens"]),
    monthly("events-retainer", "Contrato mensal casa shows", "events-account", "retainer", "income", 18000, 9, [
      "mensalidade casa shows producao tecnica",
      "recebimento casa shows producao tecnica"
    ], "casa shows producao tecnica", ["consistent_recurring_income", "alternating_common_tokens"]),
    genericIncomeTrap("events-variable-events", "Eventos avulsos variaveis", "events-account", "sales", [
      "pix recebido evento casamento alfa",
      "pix recebido evento corporativo beta",
      "pix recebido evento aniversario gama",
      "pix recebido evento feira delta"
    ]),
    supplierCoincidenceTrap("events-supplier-coincidence", "Fornecedores de eventos diferentes", "events-account", "supplier", [
      "pagamento fornecedor som evento",
      "pagamento fornecedor luz evento",
      "pagamento fornecedor buffet evento",
      "pagamento fornecedor seguranca evento"
    ]),
    quarterlyUnsupported("events-quarter-tax", "Taxa trimestral equipamentos", "events-account", "taxes", "expense", 4100, [
      "taxa trimestral equipamentos prefeitura",
      "taxa trimestral equipamentos prefeitura",
      "taxa trimestral equipamentos prefeitura"
    ], "taxa trimestral equipamentos")
  ]),

  dataset("small-construction", "Construtora pequena", "construtora pequena", [
    monthly("construction-equipment", "Aluguel equipamento obra", "construction-account", "equipment", "expense", 15200, 6, [
      "aluguel equipamento escavadeira obra",
      "pix locacao equipamento escavadeira obra"
    ], "equipamento escavadeira obra", ["fixed_monthly_expense", "alternating_common_tokens"]),
    monthly("construction-payroll", "Folha equipe obra", "construction-account", "payroll", "expense", 59000, 28, [
      "folha equipe obra construtora",
      "salarios equipe obra construtora"
    ], "equipe obra construtora", ["fixed_monthly_expense", "payroll", "alternating_common_tokens"]),
    monthly("construction-internet", "Internet escritorio obra", "construction-account", "utilities", "expense", 780, 16, [
      "internet escritorio obra engenharia",
      "fatura internet escritorio obra"
    ], "internet escritorio obra", ["fixed_monthly_expense", "utilities", "alternating_common_tokens"]),
    stockTrap("construction-materials", "Materiais pagos mensalmente por fase", "construction-account", "inventory", [
      "compra material cimento obra norte",
      "compra material ferro obra norte",
      "compra material tinta obra norte",
      "compra material madeira obra norte"
    ]),
    variableTrap("construction-freight-volume", "Fretes de obra por volume", "construction-account", "freight", "expense", [5600, 14900, 7100, 19800], [
      "frete material obra volume",
      "frete material obra volume"
    ], "frete de obra varia por volume transportado", ["volume_freight"]),
    biweeklyUnsupported("construction-subcontractor", "Subempreiteiro quinzenal", "construction-account", "services", "expense", 8600, [
      "subempreiteiro acabamento quinzenal",
      "subempreiteiro acabamento quinzenal",
      "subempreiteiro acabamento quinzenal",
      "subempreiteiro acabamento quinzenal"
    ], "subempreiteiro acabamento")
  ]),

  dataset("pet-shop", "Pet shop", "pet shop", [
    monthly("pet-rent", "Aluguel loja pet", "pet-account", "rent", "expense", 7600, 5, [
      "aluguel loja pet bairro",
      "pix imobiliaria loja pet bairro"
    ], "loja pet bairro", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("pet-energy", "Energia pet shop", "pet-account", "utilities", "expense", 1800, 17, [
      "conta energia pet shop banho",
      "fatura energia pet shop banho"
    ], "energia pet shop banho", ["fixed_monthly_expense", "utilities", "alternating_common_tokens"]),
    monthly("pet-food-supplier", "Fornecedor recorrente racao premium", "pet-account", "supplier", "expense", 5400, 11, [
      "fornecedor racao premium contrato",
      "pagamento racao premium contrato"
    ], "racao premium contrato", ["fixed_monthly_expense", "recurring_supplier", "alternating_common_tokens"]),
    monthly("pet-club", "Clube mensal banho e tosa", "pet-account", "membership", "income", 9200, 10, [
      "mensalidade clube banho tosa",
      "recebimento clube banho tosa"
    ], "clube banho tosa", ["consistent_recurring_income", "monthly_fee", "alternating_common_tokens"]),
    stockTrap("pet-inventory", "Compras mensais de estoque pet", "pet-account", "inventory", [
      "compra estoque brinquedos pet",
      "compra estoque medicamentos pet",
      "compra estoque acessorios pet",
      "compra estoque areia pet"
    ]),
    genericIncomeTrap("pet-service-income", "Servicos avulsos de banho e tosa", "pet-account", "sales", [
      "pix recebido banho pet thor",
      "pix recebido tosa pet mel",
      "pix recebido consulta pet nina",
      "pix recebido banho pet bob"
    ]),
    yearlyUnsupported("pet-annual-license", "Licenca sanitaria anual", "pet-account", "fees", "expense", 1900, [
      "licenca sanitaria anual pet shop",
      "licenca sanitaria anual pet shop",
      "licenca sanitaria anual pet shop"
    ], "licenca sanitaria anual pet")
  ]),

  dataset("coworking", "Coworking", "coworking", [
    monthly("coworking-rent", "Aluguel predio coworking", "coworking-account", "rent", "expense", 32000, 5, [
      "aluguel predio coworking centro",
      "pix locacao predio coworking centro"
    ], "predio coworking centro", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("coworking-internet", "Internet dedicada coworking", "coworking-account", "utilities", "expense", 4200, 15, [
      "internet dedicada coworking salas",
      "fatura internet dedicada coworking"
    ], "internet dedicada coworking", ["fixed_monthly_expense", "utilities", "alternating_common_tokens"]),
    monthly("coworking-membership", "Mensalidades residentes", "coworking-account", "membership", "income", 46000, 8, [
      "mensalidade residentes coworking plano fixo",
      "recebimento residentes coworking plano fixo"
    ], "residentes coworking fixo", ["consistent_recurring_income", "monthly_fee", "alternating_common_tokens"]),
    weekly("coworking-cleaning", "Limpeza semanal coworking", "coworking-account", "operations", "expense", 1600, "2026-01-06", [
      "limpeza coworking salas contrato",
      "pagamento limpeza coworking salas"
    ], "limpeza coworking salas", ["fixed_monthly_expense", "weekly_recurrence", "alternating_common_tokens"]),
    genericIncomeTrap("coworking-room-rentals", "Salas avulsas variaveis", "coworking-account", "sales", [
      "pix recebido sala reuniao cliente alfa",
      "pix recebido sala treinamento cliente beta",
      "pix recebido sala evento cliente gama",
      "pix recebido sala reuniao cliente delta"
    ]),
    variableTrap("coworking-card-generic", "Cartao corporativo coworking", "coworking-account", "card", "expense", [800, 5400, 1200, 7800], [
      "cartao corporativo despesas coworking",
      "cartao corporativo despesas coworking"
    ], "cartao corporativo reune despesas operacionais diferentes", ["generic_card_or_fee"]),
    yearlyUnsupported("coworking-fire-license", "Vistoria anual bombeiros", "coworking-account", "fees", "expense", 3600, [
      "vistoria anual bombeiros coworking",
      "vistoria anual bombeiros coworking",
      "vistoria anual bombeiros coworking"
    ], "vistoria anual bombeiros")
  ]),

  dataset("content-producer", "Produtor de conteudo e infoproduto", "produtor de conteudo/infoproduto", [
    monthly("content-saas", "Assinatura plataforma video", "content-account", "software", "expense", 1900, 11, [
      "assinatura plataforma video aulas",
      "fatura plataforma video aulas"
    ], "plataforma video aulas", ["fixed_monthly_expense", "saas_subscription", "alternating_common_tokens"]),
    monthly("content-membership", "Receita clube de assinantes", "content-account", "membership", "income", 52000, 8, [
      "mensalidade clube assinantes conteudo",
      "recebimento clube assinantes conteudo"
    ], "clube assinantes conteudo", ["consistent_recurring_income", "monthly_fee", "alternating_common_tokens"]),
    monthly("content-loan", "Parcela emprestimo estudio", "content-account", "loan", "expense", 4300, 22, [
      "parcela emprestimo estudio gravacao",
      "debito emprestimo estudio gravacao"
    ], "emprestimo estudio gravacao", ["fixed_monthly_expense", "loan_installment", "alternating_common_tokens"]),
    monthly("content-internet", "Internet estudio", "content-account", "utilities", "expense", 850, 16, [
      "internet fibra estudio conteudo",
      "fatura internet fibra estudio"
    ], "internet fibra estudio", ["fixed_monthly_expense", "utilities", "alternating_common_tokens"]),
    variableTrap("content-launch-revenue", "Lancamentos mensais variaveis", "content-account", "sales", "income", [22000, 85000, 14000, 64000], [
      "repasse plataforma lancamento curso",
      "repasse plataforma lancamento curso"
    ], "lancamentos podem ocorrer todo mes, mas nao sao receita recorrente fixa", ["marketplace_payouts"]),
    yearlyUnsupported("content-annual-platform", "Plano anual comunidade", "content-account", "software", "expense", 7800, [
      "plano anual comunidade membros",
      "plano anual comunidade membros",
      "plano anual comunidade membros"
    ], "plano anual comunidade")
  ]),

  dataset("retail-commerce", "Comercio varejista", "comercio varejista", [
    monthly("retail-rent", "Aluguel loja varejo", "retail-account", "rent", "expense", 11200, 5, [
      "aluguel loja varejo centro",
      "pix imobiliaria loja varejo centro"
    ], "loja varejo centro", ["fixed_monthly_expense", "alternating_common_tokens", "rent"]),
    monthly("retail-pos", "Assinatura PDV", "retail-account", "software", "expense", 590, 12, [
      "assinatura pdv loja caixa",
      "fatura pdv loja caixa"
    ], "pdv loja caixa", ["fixed_monthly_expense", "saas_subscription", "alternating_common_tokens"]),
    weekly("retail-cleaning", "Limpeza semanal loja varejo", "retail-account", "operations", "expense", 780, "2026-01-04", [
      "limpeza loja varejo contrato",
      "pagamento limpeza loja varejo"
    ], "limpeza loja varejo", ["fixed_monthly_expense", "weekly_recurrence", "alternating_common_tokens"]),
    monthly("retail-water", "Agua loja varejo", "retail-account", "utilities", "expense", 760, 18, [
      "conta agua loja varejo",
      "fatura agua loja varejo"
    ], "agua loja varejo", ["fixed_monthly_expense", "utilities"]),
    stockTrap("retail-stock-purchases", "Compras de estoque mensais irregulares", "retail-account", "inventory", [
      "compra estoque moda inverno",
      "compra estoque moda praia",
      "compra estoque acessorios loja",
      "compra estoque embalagens loja"
    ]),
    variableTrap("retail-card-generic", "Cartao corporativo descritor generico", "retail-account", "card", "expense", [1300, 6900, 2100, 8400], [
      "cartao corporativo despesas loja",
      "cartao corporativo despesas loja"
    ], "mesmo descritor generico agrega compras diferentes", ["generic_card_or_fee"])
  ])
];

function dataset(
  id: string,
  companyName: string,
  companyType: string,
  parts: DatasetPart[]
): RecurrenceEvaluationDataset {
  return {
    id,
    companyName,
    companyType,
    transactions: parts.flatMap((part) => part.transactions),
    expectedPatterns: parts.flatMap((part) => part.expectedPatterns),
    falsePositiveTraps: parts.flatMap((part) => part.falsePositiveTraps)
  };
}

function monthly(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  day: number,
  descriptions: string[],
  expectedFingerprint: string,
  tags: string[]
): DatasetPart {
  return pattern({
    id,
    label,
    accountId,
    categoryId,
    type,
    amount,
    descriptions,
    expectedFingerprint,
    tags,
    day,
    frequency: "monthly"
  });
}

function weekly(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  startDate: string,
  descriptions: string[],
  expectedFingerprint: string,
  tags: string[]
): DatasetPart {
  return pattern({
    id,
    label,
    accountId,
    categoryId,
    type,
    amount,
    descriptions,
    expectedFingerprint,
    tags,
    startDate,
    frequency: "weekly"
  });
}

function yearlyUnsupported(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  descriptions: string[],
  expectedFingerprint: string
): DatasetPart {
  return pattern({
    id,
    label,
    accountId,
    categoryId,
    type,
    amount,
    descriptions,
    expectedFingerprint,
    tags: ["known_false_negative", "annual_unsupported"],
    frequency: "yearly",
    evaluationMode: "unsupported"
  });
}

function quarterlyUnsupported(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  descriptions: string[],
  expectedFingerprint: string
): DatasetPart {
  return unsupportedPattern(id, label, accountId, categoryId, type, amount, descriptions, expectedFingerprint, [
    "known_false_negative",
    "quarterly_unsupported"
  ]);
}

function biweeklyUnsupported(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  descriptions: string[],
  expectedFingerprint: string
): DatasetPart {
  return unsupportedPattern(id, label, accountId, categoryId, type, amount, descriptions, expectedFingerprint, [
    "known_false_negative",
    "biweekly_unsupported"
  ]);
}

function unsupportedPattern(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amount: number,
  descriptions: string[],
  expectedFingerprint: string,
  tags: string[]
): DatasetPart {
  return pattern({
    id,
    label,
    accountId,
    categoryId,
    type,
    amount,
    descriptions,
    expectedFingerprint,
    tags,
    frequency: "unknown",
    evaluationMode: "unsupported"
  });
}

function pattern(input: PatternInput): DatasetPart {
  const frequency = input.frequency ?? "monthly";
  const dates = datesFor(frequency, input.day ?? 10, input.startDate);
  const transactionIds = dates.map((_, index) => `${input.id}-${index + 1}`);
  const transactions = dates.map((date, index) =>
    tx(
      transactionIds[index],
      input.accountId,
      input.categoryId,
      date,
      input.descriptions[index % input.descriptions.length],
      input.amount,
      input.type
    )
  );

  return {
    transactions,
    expectedPatterns: [
      {
        id: input.id,
        label: input.label,
        type: input.type,
        frequency,
        categoryId: input.categoryId,
        transactionIds,
        expectedFingerprint: input.expectedFingerprint,
        minConfidence: 0.75,
        tags: input.tags,
        evaluationMode: input.evaluationMode
      }
    ],
    falsePositiveTraps: []
  };
}

function variableTrap(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  type: TransactionType,
  amounts: number[],
  descriptions: string[],
  reason: string,
  tags: string[]
): DatasetPart {
  return trap({
    id,
    label,
    accountId,
    categoryId,
    type,
    amounts,
    descriptions,
    reason,
    tags
  });
}

function genericIncomeTrap(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  descriptions: string[]
): DatasetPart {
  return trap({
    id,
    label,
    accountId,
    categoryId,
    type: "income",
    amounts: [4200, 9700, 6100, 13200],
    descriptions,
    reason: "receitas frequentes de clientes diferentes nao devem virar contrato recorrente",
    tags: ["variable_generic_income", "generic_pix_income"]
  });
}

function marketplaceTrap(
  id: string,
  label: string,
  accountId: string,
  categoryId: string
): DatasetPart {
  return trap({
    id,
    label,
    accountId,
    categoryId,
    type: "income",
    amounts: [18000, 41000, 26000, 57000],
    descriptions: [
      "repasse marketplace vendas periodo",
      "repasse marketplace vendas periodo",
      "repasse marketplace vendas periodo",
      "repasse marketplace vendas periodo"
    ],
    reason: "payouts de marketplace sao frequentes e variaveis por volume vendido",
    tags: ["marketplace_payouts"]
  });
}

function stockTrap(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  descriptions: string[]
): DatasetPart {
  return trap({
    id,
    label,
    accountId,
    categoryId,
    type: "expense",
    amounts: [4200, 11900, 7300, 16400],
    descriptions,
    reason: "compras de estoque aparecem todo mes, mas itens e volumes mudam",
    tags: ["irregular_inventory"]
  });
}

function supplierCoincidenceTrap(
  id: string,
  label: string,
  accountId: string,
  categoryId: string,
  descriptions: string[]
): DatasetPart {
  return trap({
    id,
    label,
    accountId,
    categoryId,
    type: "expense",
    amounts: [2200, 3100, 1800, 4400],
    descriptions,
    reason: "fornecedores sao pagos todo mes por coincidencia, sem recorrencia operacional unica",
    tags: ["supplier_coincidence"]
  });
}

function trap(input: TrapInput): DatasetPart {
  const dates = monthDates(input.day ?? 10);
  const transactionIds = dates.map((_, index) => `${input.id}-${index + 1}`);
  const transactions = dates.map((date, index) =>
    tx(
      transactionIds[index],
      input.accountId,
      input.categoryId,
      date,
      input.descriptions[index % input.descriptions.length],
      input.amounts[index % input.amounts.length],
      input.type
    )
  );

  return {
    transactions,
    expectedPatterns: [],
    falsePositiveTraps: [
      {
        id: input.id,
        label: input.label,
        transactionIds,
        reason: input.reason,
        tags: input.tags
      }
    ]
  };
}

function datesFor(frequency: RecurringFrequency, day: number, startDate?: string): string[] {
  if (frequency === "weekly") {
    return weeklyDates(startDate ?? "2026-01-05");
  }

  if (frequency === "yearly") {
    return ["2024-04-10", "2025-04-10", "2026-04-10"];
  }

  if (frequency === "unknown") {
    return ["2026-01-08", "2026-01-22", "2026-02-05", "2026-02-19"];
  }

  return monthDates(day);
}

function monthDates(day: number): string[] {
  const safeDay = String(day).padStart(2, "0");
  const earlierDay = String(Math.max(day - 1, 1)).padStart(2, "0");
  const laterDay = String(Math.min(day + 1, 28)).padStart(2, "0");
  return [`2026-01-${safeDay}`, `2026-02-${laterDay}`, `2026-03-${earlierDay}`, `2026-04-${safeDay}`];
}

function weeklyDates(startDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00.000Z`);

  return Array.from({ length: 4 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index * 7);
    return date.toISOString().slice(0, 10);
  });
}

function tx(
  id: string,
  accountId: string,
  categoryId: string,
  date: string,
  normalizedDescription: string,
  amount: number,
  type: TransactionType
): TransactionForRecurrence {
  return {
    id,
    accountId,
    categoryId,
    date: new Date(`${date}T00:00:00.000Z`),
    normalizedDescription,
    amount,
    type
  };
}

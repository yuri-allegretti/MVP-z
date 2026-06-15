# Pseudocodigo dos algoritmos

## Normalizacao

```txt
function normalizeDescription(input):
  if input is empty:
    return ""

  text = input.toLowerCase()
  text = remove accents using unicode normalization
  text = replace punctuation and symbols with space
  text = remove standalone long numeric identifiers
  text = replace multiple spaces with one space
  text = trim

  return text
```

Observacao: evitar remover palavras demais na V1.0. A normalizacao deve ser previsivel e facil de debugar.

## Categorizacao por regras

```txt
function categorizeTransactions(transactions, rules):
  orderedRules = sort rules by priority asc, then createdAt asc if available
  results = []

  for transaction in transactions:
    if transaction.categoryId is not null:
      continue

    matched = null

    for rule in orderedRules:
      fieldValue = transaction[rule.field]

      if rule.operator == "contains":
        doesMatch = fieldValue contains normalized(rule.value)

      if rule.operator == "equals":
        doesMatch = fieldValue equals normalized(rule.value)

      if rule.operator == "regex":
        validate regex is simple and safe
        doesMatch = regex(rule.value).test(fieldValue)

      if doesMatch:
        matched = rule
        break

    if matched exists:
      results.push({
        transactionId: transaction.id,
        categoryId: matched.categoryId,
        confidence: matched.confidence,
        matchedRuleId: matched.id
      })
    else:
      results.push({
        transactionId: transaction.id,
        categoryId: null,
        confidence: null,
        matchedRuleId: null
      })

  return results
```

Persistencia no servidor:

```txt
load activeOrganizationId
load uncategorized transactions where organizationId = activeOrganizationId
load rules where organizationId is activeOrganizationId or null
results = categorizeTransactions(transactions, rules)
for each result with categoryId:
  update transaction categoryId and categoryConfidence
```

## Assinatura simples de descricao para recorrencia

```txt
function buildDescriptionFingerprint(normalizedDescription):
  tokens = split by space
  remove numeric tokens
  remove weak tokens: pix, enviado, recebida, recebido, pagamento, compra, boleto, transferencia
  keep first 4 to 6 significant tokens
  return tokens joined by space
```

Exemplo:

```txt
pix enviado imobiliaria sao jose ltda
=> imobiliaria sao jose ltda
```

## Deteccao de recorrencia

```txt
function detectRecurringPatterns(transactions):
  eligible = transactions sorted by date asc
  groups = map

  for transaction in eligible:
    fingerprint = buildDescriptionFingerprint(transaction.normalizedDescription)

    if transaction.type == "income" and fingerprint has fewer than 3 significant tokens:
      continue

    if transaction.categoryId exists:
      groupKey = transaction.type + ":" + transaction.categoryId + ":" + fingerprint
    else:
      groupKey = transaction.type + ":uncategorized:" + fingerprint

    groups[groupKey].push(transaction)

  patterns = []

  for each group in groups:
    if group.length < 3:
      continue

    if group contains both income and expense:
      continue

    type = first group transaction type
    sorted = group sorted by date asc
    intervals = days between consecutive dates
    distinctMonths = count distinct year-month values
    daysOfMonth = day of month for each transaction
    dayWindow = max(daysOfMonth) - min(daysOfMonth)

    frequency = "unknown"
    datesRegular = false

    averageInterval = average(intervals)

    if distinctMonths >= 3
      and most intervals are between 25 and 35
      and dayWindow <= 3:
      frequency = "monthly"
      datesRegular = true

    else if averageInterval between 6 and 8 and most intervals are between 6 and 8:
      frequency = "weekly"
      datesRegular = true

    if frequency == "unknown":
      continue

    amounts = group amounts
    averageAmount = average(amounts)
    minAmount = min(amounts)
    maxAmount = max(amounts)
    amountVariation = (maxAmount - minAmount) / max(averageAmount, 1)
    valuesVaryLittle = amountVariation <= 0.20

    weekdays = weekday for each transaction

    if frequency == "monthly":
      expectedDayOfMonth = rounded median(daysOfMonth)
      expectedWeekday = null
      nextExpectedDate = next date after latest transaction using expectedDayOfMonth

    if frequency == "weekly":
      expectedDayOfMonth = null
      expectedWeekday = rounded mode(weekdays)
      nextExpectedDate = latest transaction date + 7 days

    sameCategory = all non-null categoryId values are equal
    descriptionsSimilar = group has same fingerprint

    if type == "income" and not descriptionsSimilar:
      continue

    confidence = 0
    if group.length >= 3:
      confidence += 0.3
    if datesRegular:
      confidence += 0.2
    if valuesVaryLittle:
      confidence += 0.2
    if sameCategory:
      confidence += 0.2
    if descriptionsSimilar:
      confidence += 0.1

    confidence = min(confidence, 1.0)

    patterns.push({
      accountId: if all accountId equal then that accountId else null,
      categoryId: if sameCategory then categoryId else null,
      merchantName: first useful words from fingerprint or null,
      descriptionPattern: fingerprint,
      averageAmount,
      minAmount,
      maxAmount,
      type,
      frequency,
      expectedDayOfMonth,
      expectedWeekday,
      confidence,
      nextExpectedDate,
      status: "suggested",
      transactionIds: group ids
    })

  return patterns
```

Persistencia sem duplicar:

```txt
for each detected pattern:
  existing = find first RecurringPattern where:
    organizationId equals activeOrganizationId
    accountId equals pattern.accountId or null
    categoryId equals pattern.categoryId or null
    descriptionPattern equals pattern.descriptionPattern
    frequency equals pattern.frequency
    type equals pattern.type

  if existing exists:
    update calculated fields if useful, but do not create another row
  else:
    create RecurringPattern with status suggested
```

## Elegibilidade de recorrencias por cenario

```txt
function isPatternEligible(pattern, scenario):
  if scenario == "conservative":
    return pattern.status == "confirmed"

  if scenario == "likely":
    return pattern.status == "confirmed"
      or (pattern.status == "suggested" and pattern.confidence >= 0.75)

  if scenario == "optimistic":
    if pattern.status == "confirmed":
      return true
    if pattern.status == "suggested" and pattern.confidence >= 0.75:
      return true
    if pattern.status == "suggested"
      and pattern.type == "income"
      and pattern.confidence >= 0.60:
      return true
    return false
```

## Geracao de itens futuros por recorrencia

```txt
function expandRecurringPattern(pattern, startDate, endDate):
  items = []
  date = pattern.nextExpectedDate

  while date < startDate:
    date = advance date by frequency

  while date <= endDate:
    items.push({
      recurringPatternId: pattern.id,
      date,
      description: pattern.descriptionPattern,
      amount: pattern.averageAmount,
      type: pattern.type,
      confidence: pattern.confidence,
      source: "recurring_pattern"
    })

    date = advance date by frequency

  return items
```

Avanco de data:

```txt
monthly:
  add one month and clamp to expectedDayOfMonth when possible

weekly:
  add seven days

yearly:
  add one year
```

## Projecao de fluxo de caixa

```txt
function generateCashflowProjection(input):
  startDate = date only input.startDate
  endDate = startDate + horizonDays - 1

  eligiblePatterns = input.recurringPatterns filtered by scenario

  generatedItems = []
  for pattern in eligiblePatterns:
    generatedItems += expandRecurringPattern(pattern, startDate, endDate)

  allItems = generatedItems + manualFutureItems
  // V1: allItems fica em memoria. Nao e necessario gravar ProjectedCashflowItem.
  itemsByDate = group allItems by date

  days = []
  currentOpeningBalance = input.openingBalance

  for each date from startDate to endDate:
    items = itemsByDate[date] or []
    income = sum item.amount where item.type == "income"
    expense = sum item.amount where item.type == "expense"
    closingBalance = currentOpeningBalance + income - expense

    days.push({
      date,
      openingBalance: currentOpeningBalance,
      income,
      expense,
      closingBalance,
      items
    })

    currentOpeningBalance = closingBalance

  lowestDay = day with minimum closingBalance
  firstNegativeDay = first day where closingBalance < 0

  return {
    scenario,
    horizonDays,
    days,
    summary: {
      lowestBalance: lowestDay.closingBalance,
      lowestBalanceDate: lowestDay.date,
      firstNegativeBalanceDate: firstNegativeDay?.date ?? null,
      totalIncome: sum income,
      totalExpense: sum expense
    }
  }
```

## Alertas

```txt
function generateCashflowAlerts(projection, uncategorizedTransactionCount):
  alerts = []

  if projection.summary.firstNegativeBalanceDate exists:
    daysUntilNegative = diff days from today
    alerts.push critical:
      "Caixa pode ficar negativo em X dias"

  alerts.push warning or info:
    "Menor saldo projetado: R$ X em DD/MM"

  next7Days = first 7 projection days
  expenses7Days = sum expense from next7Days
  if expenses7Days > 0:
    alerts.push info:
      "Saidas previstas nos proximos 7 dias: R$ X"

  futureExpenseItems = all projection items where type == expense
  largest = max by amount
  if largest exists:
    alerts.push info:
      "Maior despesa futura: DESCRICAO em DD/MM"

  if uncategorizedTransactionCount > 0:
    alerts.push warning:
      "Ha transacoes sem categoria que podem afetar a precisao"

  return alerts
```

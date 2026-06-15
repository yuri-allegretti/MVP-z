import { buildDescriptionFingerprint, detectRecurringPatterns } from "@/services/recurrence";
import type {
  DetectedRecurringPattern,
  RecurrenceType,
  RecurringFrequency,
  TransactionForRecurrence,
  TransactionType
} from "@/types/cashflow";

export type ExpectedPatternEvaluationMode = "scored" | "known_false_negative" | "unsupported";

export type ExpectedRecurringPattern = {
  id: string;
  label: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  categoryId?: string | null;
  transactionIds: string[];
  expectedFingerprint?: string;
  minConfidence?: number;
  tags?: string[];
  expectedRecurrenceType?: RecurrenceType;
  evaluationMode?: ExpectedPatternEvaluationMode;
};

export type FalsePositiveTrap = {
  id: string;
  label: string;
  transactionIds: string[];
  reason: string;
  tags?: string[];
};

export type RecurrenceEvaluationDataset = {
  id: string;
  companyName: string;
  companyType?: string;
  transactions: TransactionForRecurrence[];
  expectedPatterns: ExpectedRecurringPattern[];
  falsePositiveTraps?: FalsePositiveTrap[];
};

export type EvaluationTruePositive = {
  expectedId: string;
  label: string;
  detectedFingerprint: string;
  expectedFingerprint?: string;
  confidence: number;
  matchedTransactionIds: string[];
  tokenSimilarity: number;
  recurrenceStabilityScore: number;
  recurrenceType: RecurrenceType;
};

export type EvaluationFalsePositive = {
  detectedFingerprint: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  categoryId: string | null;
  confidence: number;
  recurrenceStabilityScore: number;
  recurrenceType: RecurrenceType;
  transactionIds: string[];
  matchedTrapIds: string[];
};

export type EvaluationFalseNegative = {
  expectedId: string;
  label: string;
  expectedFingerprint?: string;
  transactionIds: string[];
  tags: string[];
};

export type EvaluationTrapHit = {
  trapId: string;
  label: string;
  reason: string;
  detectedFingerprint: string;
  confidence: number;
};

export type RecurrenceEvaluationReport = {
  datasetId: string;
  companyName: string;
  companyType?: string;
  summary: EvaluationSummary;
  fingerprints: Array<{
    transactionId: string;
    fingerprint: string;
  }>;
  truePositives: EvaluationTruePositive[];
  falsePositives: EvaluationFalsePositive[];
  falseNegatives: EvaluationFalseNegative[];
  knownLimitations: Array<{
    expectedId: string;
    label: string;
    mode: ExpectedPatternEvaluationMode;
    expectedFingerprint?: string;
    transactionIds: string[];
    detected: boolean;
  }>;
  falsePositiveTrapHits: EvaluationTrapHit[];
  projectableSummary: EvaluationSummary;
  projectableTruePositives: EvaluationTruePositive[];
  projectableFalsePositives: EvaluationFalsePositive[];
  projectableFalseNegatives: EvaluationFalseNegative[];
  projectableFalsePositiveTrapHits: EvaluationTrapHit[];
  dataIssues: string[];
};

export type EvaluationSummary = {
  expected: number;
  scoredExpected: number;
  knownFalseNegativeExpected: number;
  unsupportedExpected: number;
  traps: number;
  detected: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  falsePositiveTrapHits: number;
  precision: number;
  recall: number;
  f1: number;
  averageTruePositiveConfidence: number | null;
  averageFalsePositiveConfidence: number | null;
  dataIssues: number;
};

export type RecurrenceEvaluationSuite = {
  reports: RecurrenceEvaluationReport[];
  summary: EvaluationSummary & {
    datasets: number;
    transactions: number;
  };
  expectedTagMetrics: Record<string, TagRecallMetric>;
  trapTagMetrics: Record<string, TrapPrecisionMetric>;
  projectableSummary: EvaluationSummary;
  projectableExpectedTagMetrics: Record<string, TagRecallMetric>;
  projectableTrapTagMetrics: Record<string, TrapPrecisionMetric>;
  dataIssues: Array<{
    datasetId: string;
    issue: string;
  }>;
};

export type TagRecallMetric = {
  expected: number;
  truePositives: number;
  recall: number;
};

export type TrapPrecisionMetric = {
  traps: number;
  falsePositiveTrapHits: number;
  precision: number;
};

const MIN_TOKEN_SIMILARITY = 0.4;
const MIN_EXPECTED_TRANSACTION_OVERLAP = 0.5;
const MIN_DETECTED_TRANSACTION_OVERLAP = 0.5;

export function runRecurringDetectionEvaluation(
  dataset: RecurrenceEvaluationDataset
): RecurrenceEvaluationReport {
  const dataIssues = validateDataset(dataset);
  const transactionById = new Map(dataset.transactions.map((transaction) => [transaction.id, transaction]));
  const detectedPatterns = detectRecurringPatterns(dataset.transactions);
  const unmatchedDetected = new Set(detectedPatterns.map((_, index) => index));
  const truePositives: RecurrenceEvaluationReport["truePositives"] = [];
  const falseNegatives: RecurrenceEvaluationReport["falseNegatives"] = [];
  const knownLimitations: RecurrenceEvaluationReport["knownLimitations"] = [];
  const scoredExpected = dataset.expectedPatterns.filter(
    (expected) => (expected.evaluationMode ?? "scored") === "scored"
  );
  const fixedExpected = scoredExpected.filter(
    (expected) => (expected.expectedRecurrenceType ?? "fixed") === "fixed"
  );

  for (const expected of scoredExpected) {
    const match = findBestMatch(expected, detectedPatterns, unmatchedDetected, transactionById);

    if (!match) {
      falseNegatives.push({
        expectedId: expected.id,
        label: expected.label,
        expectedFingerprint: expected.expectedFingerprint,
        transactionIds: expected.transactionIds,
        tags: expected.tags ?? []
      });
      continue;
    }

    unmatchedDetected.delete(match.index);
    truePositives.push({
      expectedId: expected.id,
      label: expected.label,
      detectedFingerprint: match.pattern.descriptionPattern,
      expectedFingerprint: expected.expectedFingerprint,
      confidence: match.pattern.confidence,
      matchedTransactionIds: match.matchedTransactionIds,
      tokenSimilarity: match.tokenSimilarity,
      recurrenceStabilityScore: match.pattern.recurrenceStabilityScore,
      recurrenceType: match.pattern.recurrenceType
    });
  }

  for (const expected of dataset.expectedPatterns.filter(
    (pattern) => (pattern.evaluationMode ?? "scored") !== "scored"
  )) {
    knownLimitations.push({
      expectedId: expected.id,
      label: expected.label,
      mode: expected.evaluationMode ?? "known_false_negative",
      expectedFingerprint: expected.expectedFingerprint,
      transactionIds: expected.transactionIds,
      detected: detectedPatterns.some((pattern) =>
        overlapsEnough(pattern.transactionIds, expected.transactionIds, 0.5, 0.5)
      )
    });
  }

  const traps = dataset.falsePositiveTraps ?? [];
  const falsePositives = [...unmatchedDetected].map((index) => {
    const pattern = detectedPatterns[index];
    const matchedTrapIds = traps
      .filter((trap) => overlapsEnough(pattern.transactionIds, trap.transactionIds, 0.5, 0.5))
      .map((trap) => trap.id);

    return {
      detectedFingerprint: pattern.descriptionPattern,
      type: pattern.type,
      frequency: pattern.frequency,
      categoryId: pattern.categoryId,
      confidence: pattern.confidence,
      recurrenceStabilityScore: pattern.recurrenceStabilityScore,
      recurrenceType: pattern.recurrenceType,
      transactionIds: pattern.transactionIds,
      matchedTrapIds
    };
  });
  const falsePositiveTrapHits = traps.flatMap((trap) => {
    const matchedPattern = falsePositives.find((pattern) =>
      overlapsEnough(pattern.transactionIds, trap.transactionIds, 0.5, 0.5)
    );

    if (!matchedPattern) {
      return [];
    }

    return [
      {
        trapId: trap.id,
        label: trap.label,
        reason: trap.reason,
        detectedFingerprint: matchedPattern.detectedFingerprint,
        confidence: matchedPattern.confidence
      }
    ];
  });
  const projectable = evaluateProjectablePatterns({
    detectedPatterns,
    fixedExpected,
    traps,
    transactionById
  });

  return {
    datasetId: dataset.id,
    companyName: dataset.companyName,
    companyType: dataset.companyType,
    summary: buildSummary({
      expected: dataset.expectedPatterns.length,
      scoredExpected: scoredExpected.length,
      knownFalseNegativeExpected: dataset.expectedPatterns.filter(
        (pattern) => pattern.evaluationMode === "known_false_negative"
      ).length,
      unsupportedExpected: dataset.expectedPatterns.filter((pattern) => pattern.evaluationMode === "unsupported")
        .length,
      traps: traps.length,
      detected: detectedPatterns.length,
      truePositives: truePositives.length,
      falsePositives: falsePositives.length,
      falseNegatives: falseNegatives.length,
      falsePositiveTrapHits: falsePositiveTrapHits.length,
      truePositiveConfidences: truePositives.map((item) => item.confidence),
      falsePositiveConfidences: falsePositives.map((item) => item.confidence),
      dataIssues: dataIssues.length
    }),
    projectableSummary: buildSummary({
      expected: fixedExpected.length,
      scoredExpected: fixedExpected.length,
      knownFalseNegativeExpected: 0,
      unsupportedExpected: 0,
      traps: traps.length,
      detected: detectedPatterns.filter((pattern) => pattern.recurrenceType === "fixed").length,
      truePositives: projectable.truePositives.length,
      falsePositives: projectable.falsePositives.length,
      falseNegatives: projectable.falseNegatives.length,
      falsePositiveTrapHits: projectable.falsePositiveTrapHits.length,
      truePositiveConfidences: projectable.truePositives.map((item) => item.confidence),
      falsePositiveConfidences: projectable.falsePositives.map((item) => item.confidence),
      dataIssues: dataIssues.length
    }),
    fingerprints: dataset.transactions.map((transaction) => ({
      transactionId: transaction.id,
      fingerprint: buildDescriptionFingerprint(transaction.normalizedDescription)
    })),
    truePositives,
    falsePositives,
    falseNegatives,
    knownLimitations,
    falsePositiveTrapHits,
    projectableTruePositives: projectable.truePositives,
    projectableFalsePositives: projectable.falsePositives,
    projectableFalseNegatives: projectable.falseNegatives,
    projectableFalsePositiveTrapHits: projectable.falsePositiveTrapHits,
    dataIssues
  };
}

export function runRecurringDetectionEvaluationSuite(
  datasets: RecurrenceEvaluationDataset[]
): RecurrenceEvaluationSuite {
  const reports = datasets.map(runRecurringDetectionEvaluation);
  const truePositiveConfidences = reports.flatMap((report) =>
    report.truePositives.map((item) => item.confidence)
  );
  const falsePositiveConfidences = reports.flatMap((report) =>
    report.falsePositives.map((item) => item.confidence)
  );
  const projectableTruePositiveConfidences = reports.flatMap((report) =>
    report.projectableTruePositives.map((item) => item.confidence)
  );
  const projectableFalsePositiveConfidences = reports.flatMap((report) =>
    report.projectableFalsePositives.map((item) => item.confidence)
  );

  return {
    reports,
    summary: {
      ...buildSummary({
        expected: sum(reports.map((report) => report.summary.expected)),
        scoredExpected: sum(reports.map((report) => report.summary.scoredExpected)),
        knownFalseNegativeExpected: sum(reports.map((report) => report.summary.knownFalseNegativeExpected)),
        unsupportedExpected: sum(reports.map((report) => report.summary.unsupportedExpected)),
        traps: sum(reports.map((report) => report.summary.traps)),
        detected: sum(reports.map((report) => report.summary.detected)),
        truePositives: sum(reports.map((report) => report.summary.truePositives)),
        falsePositives: sum(reports.map((report) => report.summary.falsePositives)),
        falseNegatives: sum(reports.map((report) => report.summary.falseNegatives)),
        falsePositiveTrapHits: sum(reports.map((report) => report.summary.falsePositiveTrapHits)),
        truePositiveConfidences,
        falsePositiveConfidences,
        dataIssues: sum(reports.map((report) => report.summary.dataIssues))
      }),
      datasets: reports.length,
      transactions: sum(reports.map((report) => report.fingerprints.length))
    },
    projectableSummary: buildSummary({
      expected: sum(reports.map((report) => report.projectableSummary.expected)),
      scoredExpected: sum(reports.map((report) => report.projectableSummary.scoredExpected)),
      knownFalseNegativeExpected: 0,
      unsupportedExpected: 0,
      traps: sum(reports.map((report) => report.projectableSummary.traps)),
      detected: sum(reports.map((report) => report.projectableSummary.detected)),
      truePositives: sum(reports.map((report) => report.projectableSummary.truePositives)),
      falsePositives: sum(reports.map((report) => report.projectableSummary.falsePositives)),
      falseNegatives: sum(reports.map((report) => report.projectableSummary.falseNegatives)),
      falsePositiveTrapHits: sum(reports.map((report) => report.projectableSummary.falsePositiveTrapHits)),
      truePositiveConfidences: projectableTruePositiveConfidences,
      falsePositiveConfidences: projectableFalsePositiveConfidences,
      dataIssues: sum(reports.map((report) => report.projectableSummary.dataIssues))
    }),
    expectedTagMetrics: buildExpectedTagMetrics(datasets, reports),
    trapTagMetrics: buildTrapTagMetrics(datasets, reports),
    projectableExpectedTagMetrics: buildExpectedTagMetrics(datasets, reports, "projectable"),
    projectableTrapTagMetrics: buildTrapTagMetrics(datasets, reports, "projectable"),
    dataIssues: reports.flatMap((report) =>
      report.dataIssues.map((issue) => ({
        datasetId: report.datasetId,
        issue
      }))
    )
  };
}

export function formatRecurrenceEvaluationReport(
  suite: RecurrenceEvaluationSuite | RecurrenceEvaluationReport[]
): string {
  const normalizedSuite = Array.isArray(suite)
    ? runRecurringDetectionEvaluationSuite([])
    : suite;
  const reports = Array.isArray(suite) ? suite : normalizedSuite.reports;
  const summary = Array.isArray(suite)
    ? buildSummary({
        expected: sum(reports.map((report) => report.summary.expected)),
        scoredExpected: sum(reports.map((report) => report.summary.scoredExpected)),
        knownFalseNegativeExpected: sum(reports.map((report) => report.summary.knownFalseNegativeExpected)),
        unsupportedExpected: sum(reports.map((report) => report.summary.unsupportedExpected)),
        traps: sum(reports.map((report) => report.summary.traps)),
        detected: sum(reports.map((report) => report.summary.detected)),
        truePositives: sum(reports.map((report) => report.summary.truePositives)),
        falsePositives: sum(reports.map((report) => report.summary.falsePositives)),
        falseNegatives: sum(reports.map((report) => report.summary.falseNegatives)),
        falsePositiveTrapHits: sum(reports.map((report) => report.summary.falsePositiveTrapHits)),
        truePositiveConfidences: reports.flatMap((report) => report.truePositives.map((item) => item.confidence)),
        falsePositiveConfidences: reports.flatMap((report) => report.falsePositives.map((item) => item.confidence)),
        dataIssues: sum(reports.map((report) => report.summary.dataIssues))
      })
    : normalizedSuite.summary;
  const lines = [
    "# Avaliacao do algoritmo de recorrencia",
    "",
    `Datasets: ${Array.isArray(suite) ? reports.length : normalizedSuite.summary.datasets}`,
    `Transacoes: ${Array.isArray(suite) ? sum(reports.map((report) => report.fingerprints.length)) : normalizedSuite.summary.transactions}`,
    `Recorrencias esperadas: ${summary.expected}`,
    `Armadilhas: ${summary.traps}`,
    `Precision: ${formatMetric(summary.precision)}`,
    `Recall: ${formatMetric(summary.recall)}`,
    `F1: ${formatMetric(summary.f1)}`,
    "",
    "| Empresa | Esperadas | Scored | Detectadas | TP | FP | FN | Traps | Trap hits | Precision | Recall | F1 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const report of reports) {
    lines.push(
      `| ${report.companyName} | ${report.summary.expected} | ${report.summary.scoredExpected} | ${report.summary.detected} | ${report.summary.truePositives} | ${report.summary.falsePositives} | ${report.summary.falseNegatives} | ${report.summary.traps} | ${report.summary.falsePositiveTrapHits} | ${formatMetric(report.summary.precision)} | ${formatMetric(report.summary.recall)} | ${formatMetric(report.summary.f1)} |`
    );
  }

  lines.push("", "## Erros por dataset");

  for (const report of reports) {
    if (
      report.falsePositives.length === 0 &&
      report.falseNegatives.length === 0 &&
      report.dataIssues.length === 0
    ) {
      continue;
    }

    lines.push("", `### ${report.companyName}`);

    for (const issue of report.dataIssues) {
      lines.push(`- Integridade: ${issue}`);
    }

    for (const item of report.falsePositives) {
      lines.push(
        `- FP ${item.detectedFingerprint}: ${item.type}/${item.frequency}, confidence ${formatMetric(item.confidence)}, traps ${item.matchedTrapIds.join(", ") || "-"}`
      );
    }

    for (const item of report.falseNegatives) {
      lines.push(`- FN ${item.label}: esperado ${item.expectedFingerprint ?? item.expectedId}`);
    }
  }

  return lines.join("\n");
}

function evaluateProjectablePatterns(input: {
  detectedPatterns: DetectedRecurringPattern[];
  fixedExpected: ExpectedRecurringPattern[];
  traps: FalsePositiveTrap[];
  transactionById: Map<string, TransactionForRecurrence>;
}) {
  const unmatchedDetected = new Set(
    input.detectedPatterns
      .map((pattern, index) => (pattern.recurrenceType === "fixed" ? index : null))
      .filter((index): index is number => index !== null)
  );
  const truePositives: EvaluationTruePositive[] = [];
  const falseNegatives: EvaluationFalseNegative[] = [];

  for (const expected of input.fixedExpected) {
    const match = findBestMatch(expected, input.detectedPatterns, unmatchedDetected, input.transactionById);

    if (!match) {
      falseNegatives.push({
        expectedId: expected.id,
        label: expected.label,
        expectedFingerprint: expected.expectedFingerprint,
        transactionIds: expected.transactionIds,
        tags: expected.tags ?? []
      });
      continue;
    }

    unmatchedDetected.delete(match.index);
    truePositives.push({
      expectedId: expected.id,
      label: expected.label,
      detectedFingerprint: match.pattern.descriptionPattern,
      expectedFingerprint: expected.expectedFingerprint,
      confidence: match.pattern.confidence,
      matchedTransactionIds: match.matchedTransactionIds,
      tokenSimilarity: match.tokenSimilarity,
      recurrenceStabilityScore: match.pattern.recurrenceStabilityScore,
      recurrenceType: match.pattern.recurrenceType
    });
  }

  const falsePositives = [...unmatchedDetected].map((index) => {
    const pattern = input.detectedPatterns[index];
    const matchedTrapIds = input.traps
      .filter((trap) => overlapsEnough(pattern.transactionIds, trap.transactionIds, 0.5, 0.5))
      .map((trap) => trap.id);

    return patternToFalsePositive(pattern, matchedTrapIds);
  });
  const falsePositiveTrapHits = input.traps.flatMap((trap) => {
    const matchedPattern = falsePositives.find((pattern) =>
      overlapsEnough(pattern.transactionIds, trap.transactionIds, 0.5, 0.5)
    );

    if (!matchedPattern) {
      return [];
    }

    return [
      {
        trapId: trap.id,
        label: trap.label,
        reason: trap.reason,
        detectedFingerprint: matchedPattern.detectedFingerprint,
        confidence: matchedPattern.confidence
      }
    ];
  });

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    falsePositiveTrapHits
  };
}

function patternToFalsePositive(
  pattern: DetectedRecurringPattern,
  matchedTrapIds: string[]
): EvaluationFalsePositive {
  return {
    detectedFingerprint: pattern.descriptionPattern,
    type: pattern.type,
    frequency: pattern.frequency,
    categoryId: pattern.categoryId,
    confidence: pattern.confidence,
    recurrenceStabilityScore: pattern.recurrenceStabilityScore,
    recurrenceType: pattern.recurrenceType,
    transactionIds: pattern.transactionIds,
    matchedTrapIds
  };
}

function findBestMatch(
  expected: ExpectedRecurringPattern,
  detectedPatterns: DetectedRecurringPattern[],
  unmatchedDetected: Set<number>,
  transactionById: Map<string, TransactionForRecurrence>
):
  | {
      index: number;
      pattern: DetectedRecurringPattern;
      matchedTransactionIds: string[];
      tokenSimilarity: number;
    }
  | null {
  const expectedTokens = fingerprintTokens(expected.expectedFingerprint ?? expected.label);
  const expectedTiming = inferExpectedTiming(expected, transactionById);
  const candidates = [...unmatchedDetected]
    .map((index) => {
      const pattern = detectedPatterns[index];
      const matchedTransactionIds = intersection(expected.transactionIds, pattern.transactionIds);
      const expectedOverlap = matchedTransactionIds.length / expected.transactionIds.length;
      const detectedOverlap = matchedTransactionIds.length / pattern.transactionIds.length;
      const tokenSimilarity = jaccard(expectedTokens, fingerprintTokens(pattern.descriptionPattern));
      const timingScore = timingMatchScore(expectedTiming, pattern);

      return {
        index,
        pattern,
        matchedTransactionIds,
        tokenSimilarity,
        timingScore,
        expectedOverlap,
        detectedOverlap,
        score: tokenSimilarity * 2 + expectedOverlap + detectedOverlap + timingScore
      };
    })
    .filter(
      (candidate) =>
        candidate.pattern.type === expected.type &&
        candidate.pattern.frequency === expected.frequency &&
        (expected.categoryId === undefined || candidate.pattern.categoryId === expected.categoryId) &&
        candidate.tokenSimilarity >= MIN_TOKEN_SIMILARITY &&
        candidate.timingScore > 0 &&
        candidate.expectedOverlap >= MIN_EXPECTED_TRANSACTION_OVERLAP &&
        candidate.detectedOverlap >= MIN_DETECTED_TRANSACTION_OVERLAP
    )
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
}

function inferExpectedTiming(
  expected: ExpectedRecurringPattern,
  transactionById: Map<string, TransactionForRecurrence>
) {
  const transactions = expected.transactionIds
    .map((id) => transactionById.get(id))
    .filter((transaction): transaction is TransactionForRecurrence => Boolean(transaction));

  if (expected.frequency === "monthly") {
    return {
      frequency: expected.frequency,
      expectedDayOfMonth: Math.round(median(transactions.map((transaction) => transaction.date.getUTCDate())))
    };
  }

  if (expected.frequency === "weekly") {
    return {
      frequency: expected.frequency,
      expectedWeekday: mode(transactions.map((transaction) => transaction.date.getUTCDay()))
    };
  }

  return { frequency: expected.frequency };
}

function timingMatchScore(
  expectedTiming: ReturnType<typeof inferExpectedTiming>,
  pattern: DetectedRecurringPattern
): number {
  if (expectedTiming.frequency === "monthly") {
    if (pattern.expectedDayOfMonth === null || expectedTiming.expectedDayOfMonth === undefined) {
      return 0;
    }

    return Math.abs(pattern.expectedDayOfMonth - expectedTiming.expectedDayOfMonth) <= 3 ? 1 : 0;
  }

  if (expectedTiming.frequency === "weekly") {
    if (pattern.expectedWeekday === null || expectedTiming.expectedWeekday === undefined) {
      return 0;
    }

    return pattern.expectedWeekday === expectedTiming.expectedWeekday ? 1 : 0;
  }

  return 1;
}

function buildSummary(input: {
  expected: number;
  scoredExpected: number;
  knownFalseNegativeExpected: number;
  unsupportedExpected: number;
  traps: number;
  detected: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  falsePositiveTrapHits: number;
  truePositiveConfidences: number[];
  falsePositiveConfidences: number[];
  dataIssues: number;
}): EvaluationSummary {
  const precision = input.truePositives + input.falsePositives === 0
    ? 1
    : input.truePositives / (input.truePositives + input.falsePositives);
  const recall = input.scoredExpected === 0 ? 1 : input.truePositives / input.scoredExpected;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    expected: input.expected,
    scoredExpected: input.scoredExpected,
    knownFalseNegativeExpected: input.knownFalseNegativeExpected,
    unsupportedExpected: input.unsupportedExpected,
    traps: input.traps,
    detected: input.detected,
    truePositives: input.truePositives,
    falsePositives: input.falsePositives,
    falseNegatives: input.falseNegatives,
    falsePositiveTrapHits: input.falsePositiveTrapHits,
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
    averageTruePositiveConfidence: averageOrNull(input.truePositiveConfidences),
    averageFalsePositiveConfidence: averageOrNull(input.falsePositiveConfidences),
    dataIssues: input.dataIssues
  };
}

function buildExpectedTagMetrics(
  datasets: RecurrenceEvaluationDataset[],
  reports: RecurrenceEvaluationReport[],
  mode: "detected" | "projectable" = "detected"
): Record<string, TagRecallMetric> {
  const byTag = new Map<string, { expected: number; truePositives: number }>();
  const truePositiveIdsByDataset = new Map(
    reports.map((report) => [
      report.datasetId,
      new Set(
        (mode === "projectable" ? report.projectableTruePositives : report.truePositives).map(
          (item) => item.expectedId
        )
      )
    ])
  );

  for (const dataset of datasets) {
    const truePositiveIds = truePositiveIdsByDataset.get(dataset.id) ?? new Set<string>();

    for (const expected of dataset.expectedPatterns) {
      if ((expected.evaluationMode ?? "scored") !== "scored") {
        continue;
      }

      if (mode === "projectable" && (expected.expectedRecurrenceType ?? "fixed") !== "fixed") {
        continue;
      }

      for (const tag of expected.tags ?? []) {
        const current = byTag.get(tag) ?? { expected: 0, truePositives: 0 };
        current.expected += 1;
        if (truePositiveIds.has(expected.id)) {
          current.truePositives += 1;
        }
        byTag.set(tag, current);
      }
    }
  }

  return Object.fromEntries(
    [...byTag.entries()].map(([tag, metric]) => [
      tag,
      {
        ...metric,
        recall: metric.expected === 0 ? 1 : round(metric.truePositives / metric.expected)
      }
    ])
  );
}

function buildTrapTagMetrics(
  datasets: RecurrenceEvaluationDataset[],
  reports: RecurrenceEvaluationReport[],
  mode: "detected" | "projectable" = "detected"
): Record<string, TrapPrecisionMetric> {
  const byTag = new Map<string, { traps: number; falsePositiveTrapHits: number }>();
  const trapHitsByDataset = new Map(
    reports.map((report) => [
      report.datasetId,
      new Set(
        (mode === "projectable" ? report.projectableFalsePositiveTrapHits : report.falsePositiveTrapHits).map(
          (item) => item.trapId
        )
      )
    ])
  );

  for (const dataset of datasets) {
    const trapHits = trapHitsByDataset.get(dataset.id) ?? new Set<string>();

    for (const trap of dataset.falsePositiveTraps ?? []) {
      for (const tag of trap.tags ?? []) {
        const current = byTag.get(tag) ?? { traps: 0, falsePositiveTrapHits: 0 };
        current.traps += 1;
        if (trapHits.has(trap.id)) {
          current.falsePositiveTrapHits += 1;
        }
        byTag.set(tag, current);
      }
    }
  }

  return Object.fromEntries(
    [...byTag.entries()].map(([tag, metric]) => [
      tag,
      {
        ...metric,
        precision: metric.traps === 0 ? 1 : round(1 - metric.falsePositiveTrapHits / metric.traps)
      }
    ])
  );
}

function validateDataset(dataset: RecurrenceEvaluationDataset): string[] {
  const issues: string[] = [];
  const transactionIds = new Set<string>();

  for (const transaction of dataset.transactions) {
    if (transactionIds.has(transaction.id)) {
      issues.push(`Transacao duplicada: ${transaction.id}`);
    }
    transactionIds.add(transaction.id);
  }

  for (const expected of dataset.expectedPatterns) {
    for (const id of expected.transactionIds) {
      if (!transactionIds.has(id)) {
        issues.push(`Recorrencia ${expected.id} referencia transacao inexistente: ${id}`);
      }
    }
  }

  for (const trap of dataset.falsePositiveTraps ?? []) {
    for (const id of trap.transactionIds) {
      if (!transactionIds.has(id)) {
        issues.push(`Armadilha ${trap.id} referencia transacao inexistente: ${id}`);
      }
    }
  }

  return issues;
}

function overlapsEnough(
  detectedIds: string[],
  expectedIds: string[],
  minExpectedOverlap: number,
  minDetectedOverlap: number
): boolean {
  const matched = intersection(expectedIds, detectedIds).length;
  return matched / expectedIds.length >= minExpectedOverlap && matched / detectedIds.length >= minDetectedOverlap;
}

function fingerprintTokens(value: string): string[] {
  return buildDescriptionFingerprint(value).split(" ").filter(Boolean);
}

function jaccard(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersectionSize = [...leftSet].filter((token) => rightSet.has(token)).length;
  const unionSize = new Set([...leftSet, ...rightSet]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function intersection(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function averageOrNull(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length === 0) {
    return 0;
  }

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMetric(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}

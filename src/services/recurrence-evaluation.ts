import { buildDescriptionFingerprint, detectRecurringPatterns } from "@/services/recurrence";
import type {
  DetectedRecurringPattern,
  RecurringFrequency,
  TransactionForRecurrence,
  TransactionType
} from "@/types/cashflow";

export type ExpectedRecurringPattern = {
  id: string;
  label: string;
  type: TransactionType;
  frequency: RecurringFrequency;
  categoryId: string | null;
  transactionIds: string[];
  expectedFingerprint?: string;
  minConfidence?: number;
};

export type RecurrenceEvaluationDataset = {
  id: string;
  companyName: string;
  transactions: TransactionForRecurrence[];
  expectedPatterns: ExpectedRecurringPattern[];
};

export type RecurrenceEvaluationReport = {
  datasetId: string;
  companyName: string;
  summary: {
    expected: number;
    detected: number;
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    averageTruePositiveConfidence: number | null;
  };
  fingerprints: Array<{
    transactionId: string;
    fingerprint: string;
  }>;
  truePositives: Array<{
    expectedId: string;
    label: string;
    detectedFingerprint: string;
    expectedFingerprint?: string;
    confidence: number;
    matchedTransactionIds: string[];
  }>;
  falsePositives: Array<{
    detectedFingerprint: string;
    type: TransactionType;
    frequency: RecurringFrequency;
    confidence: number;
    transactionIds: string[];
  }>;
  falseNegatives: Array<{
    expectedId: string;
    label: string;
    expectedFingerprint?: string;
    transactionIds: string[];
  }>;
};

export function runRecurringDetectionEvaluation(
  dataset: RecurrenceEvaluationDataset
): RecurrenceEvaluationReport {
  const detectedPatterns = detectRecurringPatterns(dataset.transactions);
  const unmatchedDetected = new Set(detectedPatterns.map((_, index) => index));
  const truePositives: RecurrenceEvaluationReport["truePositives"] = [];
  const falseNegatives: RecurrenceEvaluationReport["falseNegatives"] = [];

  for (const expected of dataset.expectedPatterns) {
    const match = findBestMatch(expected, detectedPatterns, unmatchedDetected);

    if (!match) {
      falseNegatives.push({
        expectedId: expected.id,
        label: expected.label,
        expectedFingerprint: expected.expectedFingerprint,
        transactionIds: expected.transactionIds
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
      matchedTransactionIds: match.matchedTransactionIds
    });
  }

  const falsePositives = [...unmatchedDetected].map((index) => {
    const pattern = detectedPatterns[index];

    return {
      detectedFingerprint: pattern.descriptionPattern,
      type: pattern.type,
      frequency: pattern.frequency,
      confidence: pattern.confidence,
      transactionIds: pattern.transactionIds
    };
  });

  return {
    datasetId: dataset.id,
    companyName: dataset.companyName,
    summary: {
      expected: dataset.expectedPatterns.length,
      detected: detectedPatterns.length,
      truePositives: truePositives.length,
      falsePositives: falsePositives.length,
      falseNegatives: falseNegatives.length,
      averageTruePositiveConfidence: averageOrNull(truePositives.map((item) => item.confidence))
    },
    fingerprints: dataset.transactions.map((transaction) => ({
      transactionId: transaction.id,
      fingerprint: buildDescriptionFingerprint(transaction.normalizedDescription)
    })),
    truePositives,
    falsePositives,
    falseNegatives
  };
}

export function runRecurringDetectionEvaluationSuite(
  datasets: RecurrenceEvaluationDataset[]
) {
  const reports = datasets.map(runRecurringDetectionEvaluation);

  return {
    reports,
    summary: {
      datasets: reports.length,
      expected: sum(reports.map((report) => report.summary.expected)),
      detected: sum(reports.map((report) => report.summary.detected)),
      truePositives: sum(reports.map((report) => report.summary.truePositives)),
      falsePositives: sum(reports.map((report) => report.summary.falsePositives)),
      falseNegatives: sum(reports.map((report) => report.summary.falseNegatives)),
      averageTruePositiveConfidence: averageOrNull(
        reports.flatMap((report) => report.truePositives.map((item) => item.confidence))
      )
    }
  };
}

export function formatRecurrenceEvaluationReport(
  reports: RecurrenceEvaluationReport[]
): string {
  const lines = [
    "# Avaliacao do algoritmo de recorrencia",
    "",
    "| Empresa | Esperadas | Detectadas | TP | FP | FN | Confidence media TP |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const report of reports) {
    lines.push(
      `| ${report.companyName} | ${report.summary.expected} | ${report.summary.detected} | ${report.summary.truePositives} | ${report.summary.falsePositives} | ${report.summary.falseNegatives} | ${formatConfidence(report.summary.averageTruePositiveConfidence)} |`
    );
  }

  for (const report of reports) {
    lines.push("", `## ${report.companyName}`, "", "### True positives");

    for (const item of report.truePositives) {
      lines.push(
        `- ${item.label}: fingerprint "${item.detectedFingerprint}", confidence ${formatConfidence(item.confidence)}`
      );
    }

    lines.push("", "### False positives");

    if (report.falsePositives.length === 0) {
      lines.push("- Nenhum.");
    } else {
      for (const item of report.falsePositives) {
        lines.push(
          `- ${item.detectedFingerprint}: ${item.frequency}, ${item.type}, confidence ${formatConfidence(item.confidence)}`
        );
      }
    }

    lines.push("", "### False negatives");

    if (report.falseNegatives.length === 0) {
      lines.push("- Nenhum.");
    } else {
      for (const item of report.falseNegatives) {
        lines.push(`- ${item.label}: esperado "${item.expectedFingerprint ?? item.expectedId}"`);
      }
    }

    lines.push("", "### Fingerprints gerados");

    for (const fingerprint of report.fingerprints) {
      lines.push(`- ${fingerprint.transactionId}: ${fingerprint.fingerprint || "(vazio)"}`);
    }
  }

  return lines.join("\n");
}

function findBestMatch(
  expected: ExpectedRecurringPattern,
  detectedPatterns: DetectedRecurringPattern[],
  unmatchedDetected: Set<number>
):
  | {
      index: number;
      pattern: DetectedRecurringPattern;
      matchedTransactionIds: string[];
    }
  | null {
  const expectedIds = new Set(expected.transactionIds);
  const candidates = [...unmatchedDetected]
    .map((index) => {
      const pattern = detectedPatterns[index];
      const detectedIds = new Set(pattern.transactionIds);
      const matchedTransactionIds = [...expectedIds].filter((id) => detectedIds.has(id));
      const expectedOverlap = matchedTransactionIds.length / expectedIds.size;
      const detectedOverlap = matchedTransactionIds.length / detectedIds.size;

      return {
        index,
        pattern,
        matchedTransactionIds,
        score: expectedOverlap + detectedOverlap,
        expectedOverlap,
        detectedOverlap
      };
    })
    .filter(
      (candidate) =>
        candidate.pattern.type === expected.type &&
        candidate.pattern.frequency === expected.frequency &&
        candidate.pattern.categoryId === expected.categoryId &&
        candidate.expectedOverlap >= 0.75 &&
        candidate.detectedOverlap >= 0.75
    )
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
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

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatConfidence(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}

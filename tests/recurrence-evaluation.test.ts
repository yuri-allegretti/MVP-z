import { describe, expect, it } from "vitest";
import {
  runRecurringDetectionEvaluation,
  runRecurringDetectionEvaluationSuite
} from "../src/services/recurrence-evaluation";
import { recurrenceEvaluationDatasets } from "./fixtures/recurrence-evaluation-datasets";

describe("recurrence evaluation bench", () => {
  it("detecta recorrencias esperadas em empresas diferentes sem falsos positivos", () => {
    const suite = runRecurringDetectionEvaluationSuite(recurrenceEvaluationDatasets);

    expect(suite.summary.datasets).toBe(4);
    expect(suite.summary.expected).toBe(5);
    expect(suite.summary.truePositives).toBe(5);
    expect(suite.summary.falsePositives).toBe(0);
    expect(suite.summary.falseNegatives).toBe(0);
    expect(suite.summary.averageTruePositiveConfidence).toBeGreaterThanOrEqual(0.75);
  });

  it("registra fingerprints e confidence para auditoria do algoritmo", () => {
    for (const dataset of recurrenceEvaluationDatasets) {
      const report = runRecurringDetectionEvaluation(dataset);

      expect(report.fingerprints).toHaveLength(dataset.transactions.length);
      expect(report.summary.detected).toBe(report.truePositives.length);
      expect(report.falsePositives).toEqual([]);
      expect(report.falseNegatives).toEqual([]);

      for (const expected of dataset.expectedPatterns) {
        const match = report.truePositives.find((item) => item.expectedId === expected.id);

        expect(match).toBeDefined();
        expect(match?.confidence).toBeGreaterThanOrEqual(expected.minConfidence ?? 0.75);
        expect(match?.matchedTransactionIds.sort()).toEqual(expected.transactionIds.sort());
      }
    }
  });
});

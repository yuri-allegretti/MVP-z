import { describe, expect, it } from "vitest";
import {
  runRecurringDetectionEvaluation,
  runRecurringDetectionEvaluationSuite
} from "../src/services/recurrence-evaluation";
import { recurrenceEvaluationDatasets } from "./fixtures/recurrence-evaluation-datasets";

describe("recurrence evaluation bench", () => {
  it("tem tamanho minimo para avaliar generalizacao", () => {
    const suite = runRecurringDetectionEvaluationSuite(recurrenceEvaluationDatasets);

    expect(suite.summary.datasets).toBeGreaterThanOrEqual(20);
    expect(suite.summary.expected).toBeGreaterThanOrEqual(50);
    expect(suite.summary.scoredExpected).toBeGreaterThanOrEqual(50);
    expect(suite.summary.traps).toBeGreaterThanOrEqual(30);
    expect(
      suite.summary.knownFalseNegativeExpected + suite.summary.unsupportedExpected
    ).toBeGreaterThanOrEqual(15);
    expect(suite.summary.transactions).toBeGreaterThan(250);
    expect(suite.dataIssues).toEqual([]);
  });

  it("calcula metricas separadas para recorrencia detectada e projetavel", () => {
    const suite = runRecurringDetectionEvaluationSuite(recurrenceEvaluationDatasets);
    const maxProjectableFalsePositivesFromTraps = Math.floor(suite.projectableSummary.traps * 0.3);

    expect(suite.summary.recall).toBeGreaterThanOrEqual(0.75);
    expect(suite.summary.f1).toBeGreaterThanOrEqual(0.8);
    expect(suite.projectableSummary.precision).toBeGreaterThanOrEqual(0.85);
    expect(suite.projectableSummary.recall).toBeGreaterThanOrEqual(0.75);
    expect(suite.projectableSummary.f1).toBeGreaterThanOrEqual(0.8);
    expect(suite.projectableSummary.precision).toBeGreaterThanOrEqual(suite.summary.precision);
    expect(suite.projectableSummary.falsePositiveTrapHits).toBeLessThanOrEqual(
      maxProjectableFalsePositivesFromTraps
    );
    expect(suite.summary.dataIssues).toBe(0);
    expect(suite.projectableSummary.dataIssues).toBe(0);
  });

  it("atinge metas iniciais por tipo de caso", () => {
    const suite = runRecurringDetectionEvaluationSuite(recurrenceEvaluationDatasets);

    expect(suite.expectedTagMetrics.fixed_monthly_expense.recall).toBeGreaterThanOrEqual(0.9);
    expect(suite.expectedTagMetrics.consistent_recurring_income.recall).toBeGreaterThanOrEqual(0.8);
    expect(suite.trapTagMetrics.variable_generic_income.precision).toBeGreaterThanOrEqual(0.9);
    expect(suite.expectedTagMetrics.alternating_common_tokens.recall).toBeGreaterThanOrEqual(0.8);
    expect(suite.projectableTrapTagMetrics.marketplace_payouts.precision).toBeGreaterThanOrEqual(0.9);
    expect(suite.projectableTrapTagMetrics.generic_card_or_fee.precision).toBeGreaterThanOrEqual(0.9);
  });

  it("registra fingerprints, confidence e erros detalhados por dataset", () => {
    for (const dataset of recurrenceEvaluationDatasets) {
      const report = runRecurringDetectionEvaluation(dataset);

      expect(report.fingerprints).toHaveLength(dataset.transactions.length);
      expect(report.summary.truePositives + report.summary.falseNegatives).toBe(report.summary.scoredExpected);

      for (const truePositive of report.truePositives) {
        expect(truePositive.detectedFingerprint).not.toBe("");
        expect(truePositive.confidence).toBeGreaterThan(0);
        expect(truePositive.tokenSimilarity).toBeGreaterThanOrEqual(0.4);
        expect(truePositive.recurrenceStabilityScore).toBeGreaterThanOrEqual(0);
      }

      for (const falsePositive of report.falsePositives) {
        expect(falsePositive.detectedFingerprint).not.toBe("");
        expect(falsePositive.confidence).toBeGreaterThan(0);
        expect(["fixed", "variable"]).toContain(falsePositive.recurrenceType);
      }
    }
  });
});

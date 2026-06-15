import { describe, expect, it } from "vitest";
import { generateCashflowProjection } from "../src/services/projection";

describe("generateCashflowProjection", () => {
  it("calcula saldo diario corretamente", () => {
    const projection = generateCashflowProjection({
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      openingBalance: 1000,
      horizonDays: 30,
      scenario: "likely",
      recurringPatterns: [
        {
          id: "income",
          descriptionPattern: "mensalidade cliente acme",
          averageAmount: 500,
          type: "income",
          frequency: "monthly",
          expectedDayOfMonth: 2,
          expectedWeekday: null,
          nextExpectedDate: new Date("2026-01-02T00:00:00.000Z"),
          confidence: 0.9,
          recurrenceStabilityScore: 1,
          recurrenceType: "fixed",
          status: "suggested"
        },
        {
          id: "expense",
          descriptionPattern: "software aws",
          averageAmount: 200,
          type: "expense",
          frequency: "monthly",
          expectedDayOfMonth: 3,
          expectedWeekday: null,
          nextExpectedDate: new Date("2026-01-03T00:00:00.000Z"),
          confidence: 0.9,
          recurrenceStabilityScore: 1,
          recurrenceType: "fixed",
          status: "suggested"
        }
      ]
    });

    expect(projection.days[0].closingBalance).toBe(1000);
    expect(projection.days[1].closingBalance).toBe(1500);
    expect(projection.days[2].closingBalance).toBe(1300);
    expect(projection.summary.totalIncome).toBe(500);
    expect(projection.summary.totalExpense).toBe(200);
    expect(projection.summary.lowestBalance).toBe(1000);
  });

  it("nao projeta recorrencias variaveis", () => {
    const projection = generateCashflowProjection({
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      openingBalance: 1000,
      horizonDays: 30,
      scenario: "likely",
      recurringPatterns: [
        {
          id: "variable",
          descriptionPattern: "repasse marketplace",
          averageAmount: 500,
          type: "income",
          frequency: "monthly",
          expectedDayOfMonth: 2,
          expectedWeekday: null,
          nextExpectedDate: new Date("2026-01-02T00:00:00.000Z"),
          confidence: 0.9,
          recurrenceStabilityScore: 0.5,
          recurrenceType: "variable",
          status: "suggested"
        }
      ]
    });

    expect(projection.summary.totalIncome).toBe(0);
    expect(projection.days.every((day) => day.items.length === 0)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { generateCashflowAlerts } from "../src/services/alerts";
import { generateCashflowProjection } from "../src/services/projection";

describe("generateCashflowAlerts", () => {
  it("gera alerta quando saldo fica negativo", () => {
    const projection = generateCashflowProjection({
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      openingBalance: 100,
      horizonDays: 30,
      scenario: "conservative",
      recurringPatterns: [
        {
          id: "expense",
          descriptionPattern: "aluguel",
          averageAmount: 200,
          type: "expense",
          frequency: "monthly",
          expectedDayOfMonth: 2,
          expectedWeekday: null,
          nextExpectedDate: new Date("2026-01-02T00:00:00.000Z"),
          confidence: 1,
          status: "confirmed"
        }
      ]
    });

    const alerts = generateCashflowAlerts({
      projection,
      uncategorizedTransactionCount: 0
    });

    expect(alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "negative_cash",
          severity: "critical"
        })
      ])
    );
  });
});

import { RecurringTable } from "@/components/recurring-table";
import { getActiveOrganizationId } from "@/lib/active-organization";
import { prisma } from "@/lib/db";
import { runRecurringDetectionAction } from "@/server/recurring.actions";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const organizationId = await getActiveOrganizationId();
  const patterns = await prisma.recurringPattern.findMany({
    where: { organizationId },
    include: { category: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { confidence: "desc" }, { nextExpectedDate: "asc" }]
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Recorrencias</h1>
          <p className="muted">Revise padroes detectados e confirme apenas o que deve entrar no cenario conservador.</p>
        </div>
        <form action={runRecurringDetectionAction}>
          <button type="submit">Detectar recorrencias</button>
        </form>
      </div>

      <section className="panel">
        {patterns.length === 0 ? (
          <p className="muted">Nenhuma recorrencia detectada ainda.</p>
        ) : (
          <RecurringTable
            patterns={patterns.map((pattern) => ({
              id: pattern.id,
              descriptionPattern: pattern.descriptionPattern,
              averageAmount: Number(pattern.averageAmount),
              minAmount: Number(pattern.minAmount),
              maxAmount: Number(pattern.maxAmount),
              type: pattern.type,
              frequency: pattern.frequency,
              expectedDayOfMonth: pattern.expectedDayOfMonth,
              expectedWeekday: pattern.expectedWeekday,
              confidence: Number(pattern.confidence),
              nextExpectedDate: pattern.nextExpectedDate,
              status: pattern.status,
              category: pattern.category
            }))}
          />
        )}
      </section>
    </div>
  );
}

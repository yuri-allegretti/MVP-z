import Link from "next/link";
import { AlertsList } from "@/components/alerts-list";
import { ProjectionTable } from "@/components/projection-table";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getDashboardData } from "@/server/projection.queries";
import { runRecurringDetectionAction } from "@/server/recurring.actions";
import { runCategorizationAction } from "@/server/transactions.actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const [projection30, projection60, projection90] = data.projections;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Visao simples do caixa atual, alertas e projecao provavel.</p>
        </div>
        <div className="actions">
          <form action={runCategorizationAction}>
            <button type="submit" className="secondary">
              Categorizar pendentes
            </button>
          </form>
          <form action={runRecurringDetectionAction}>
            <button type="submit">Detectar recorrencias</button>
          </form>
        </div>
      </div>

      <section className="grid grid-3">
        <div className="panel">
          <div className="muted">Saldo atual calculado</div>
          <div className="metric">{formatMoney(data.account.calculatedBalance)}</div>
          <div className="muted">{data.account.name}</div>
        </div>
        <SummaryCard title="Projecao 30 dias" projection={projection30} />
        <SummaryCard title="Projecao 90 dias" projection={projection90} />
      </section>

      <section className="grid grid-3">
        {data.projections.map((projection) => (
          <div className="panel" key={projection.horizonDays}>
            <div className="muted">{projection.horizonDays} dias - provavel</div>
            <div className="metric">{formatMoney(projection.summary.lowestBalance)}</div>
            <div className="muted">menor saldo em {formatDate(projection.summary.lowestBalanceDate)}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Alertas</h2>
        <AlertsList alerts={data.alerts} />
      </section>

      <section className="panel">
        <div className="page-header">
          <div>
            <h2>Proximos 14 dias</h2>
            <p className="muted">Recorte da projecao provavel de 30 dias.</p>
          </div>
          <Link className="button secondary" href="/projection">
            Ver projecao completa
          </Link>
        </div>
        <ProjectionTable projection={projection30} limit={14} />
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  projection
}: {
  title: string;
  projection: Awaited<ReturnType<typeof getDashboardData>>["projections"][number];
}) {
  return (
    <div className="panel">
      <div className="muted">{title}</div>
      <div className="metric">{formatMoney(projection.days[projection.days.length - 1].closingBalance)}</div>
      <div className="muted">
        entradas {formatMoney(projection.summary.totalIncome)} - saidas{" "}
        {formatMoney(projection.summary.totalExpense)}
      </div>
    </div>
  );
}

import { ProjectionTable } from "@/components/projection-table";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getProjectionData } from "@/server/projection.queries";
import type { ProjectionHorizon, ProjectionScenario } from "@/types/cashflow";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectionPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const horizonDays = parseHorizon(single(params.horizonDays));
  const scenario = parseScenario(single(params.scenario));
  const projection = await getProjectionData({ horizonDays, scenario });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Projecao</h1>
          <p className="muted">Fluxo de caixa diario calculado em memoria.</p>
        </div>
      </div>

      <section className="panel">
        <form className="form-grid">
          <label>
            Horizonte
            <select name="horizonDays" defaultValue={String(horizonDays)}>
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </label>
          <label>
            Cenario
            <select name="scenario" defaultValue={scenario}>
              <option value="conservative">Conservador</option>
              <option value="likely">Provavel</option>
              <option value="optimistic">Otimista</option>
            </select>
          </label>
          <div className="actions">
            <button type="submit">Atualizar</button>
          </div>
        </form>
      </section>

      <section className="grid grid-3">
        <div className="panel">
          <div className="muted">Menor saldo</div>
          <div className="metric">{formatMoney(projection.summary.lowestBalance)}</div>
          <div className="muted">{formatDate(projection.summary.lowestBalanceDate)}</div>
        </div>
        <div className="panel">
          <div className="muted">Total de entradas</div>
          <div className="metric">{formatMoney(projection.summary.totalIncome)}</div>
        </div>
        <div className="panel">
          <div className="muted">Total de saidas</div>
          <div className="metric">{formatMoney(projection.summary.totalExpense)}</div>
        </div>
      </section>

      <section className="panel">
        <ProjectionTable projection={projection} />
      </section>
    </div>
  );
}

function parseHorizon(value: string | undefined): ProjectionHorizon {
  if (value === "60") return 60;
  if (value === "90") return 90;
  return 30;
}

function parseScenario(value: string | undefined): ProjectionScenario {
  if (value === "conservative" || value === "optimistic") {
    return value;
  }

  return "likely";
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}

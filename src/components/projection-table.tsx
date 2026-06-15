import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CashflowProjection } from "@/types/cashflow";

export function ProjectionTable({
  projection,
  limit
}: {
  projection: CashflowProjection;
  limit?: number;
}) {
  const days = limit ? projection.days.slice(0, limit) : projection.days;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Saldo inicial</th>
            <th>Entradas</th>
            <th>Saidas</th>
            <th>Saldo final</th>
            <th>Itens</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date.toISOString()}>
              <td>{formatDate(day.date)}</td>
              <td>{formatMoney(day.openingBalance)}</td>
              <td>{formatMoney(day.income)}</td>
              <td>{formatMoney(day.expense)}</td>
              <td>{formatMoney(day.closingBalance)}</td>
              <td>
                {day.items.length === 0 ? (
                  <span className="muted">Sem itens</span>
                ) : (
                  day.items.map((item) => (
                    <div key={`${item.recurringPatternId}-${item.date.toISOString()}-${item.description}`}>
                      {item.description} - {formatMoney(item.amount)}
                    </div>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

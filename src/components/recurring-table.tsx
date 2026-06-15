import { updateRecurringStatusAction } from "@/server/recurring.actions";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { RecurringFrequency, RecurringStatus, TransactionType } from "@/types/cashflow";

type RecurringRow = {
  id: string;
  descriptionPattern: string;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  expectedDayOfMonth: number | null;
  expectedWeekday: number | null;
  confidence: number;
  nextExpectedDate: Date;
  status: RecurringStatus;
  category: { name: string } | null;
};

export function RecurringTable({ patterns }: { patterns: RecurringRow[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Descricao</th>
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Valor medio</th>
            <th>Frequencia</th>
            <th>Proxima data</th>
            <th>Confianca</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((pattern) => (
            <tr key={pattern.id}>
              <td>
                <div>{pattern.descriptionPattern}</div>
                <div className="muted">
                  min {formatMoney(pattern.minAmount)} - max {formatMoney(pattern.maxAmount)}
                </div>
              </td>
              <td>{pattern.category?.name ?? <span className="muted">Sem categoria</span>}</td>
              <td>
                <span className={`badge ${pattern.type}`}>{pattern.type}</span>
              </td>
              <td>{formatMoney(pattern.averageAmount)}</td>
              <td>{pattern.frequency}</td>
              <td>{formatDate(pattern.nextExpectedDate)}</td>
              <td>{Math.round(pattern.confidence * 100)}%</td>
              <td>{pattern.status}</td>
              <td>
                <div className="actions">
                  <form action={updateRecurringStatusAction}>
                    <input type="hidden" name="recurringPatternId" value={pattern.id} />
                    <input type="hidden" name="status" value="confirmed" />
                    <button type="submit">Confirmar</button>
                  </form>
                  <form action={updateRecurringStatusAction}>
                    <input type="hidden" name="recurringPatternId" value={pattern.id} />
                    <input type="hidden" name="status" value="ignored" />
                    <button className="secondary" type="submit">
                      Ignorar
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

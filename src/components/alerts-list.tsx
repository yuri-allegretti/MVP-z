import type { CashflowAlert } from "@/types/cashflow";

export function AlertsList({ alerts }: { alerts: CashflowAlert[] }) {
  if (alerts.length === 0) {
    return <p className="muted">Nenhum alerta no cenario atual.</p>;
  }

  return (
    <div className="stack">
      {alerts.map((alert) => (
        <div className={`panel alert ${alert.severity}`} key={alert.code}>
          <strong>{alert.severity.toUpperCase()}</strong>
          <div>{alert.message}</div>
        </div>
      ))}
    </div>
  );
}

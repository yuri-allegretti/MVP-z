import { updateTransactionCategoryAction } from "@/server/transactions.actions";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CategoryType, TransactionType } from "@/types/cashflow";

type CategoryOption = {
  id: string;
  name: string;
  type: CategoryType;
};

type TransactionRow = {
  id: string;
  date: Date;
  description: string;
  normalizedDescription: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  source: string;
  category: { name: string } | null;
};

export function TransactionsTable({
  transactions,
  categories
}: {
  transactions: TransactionRow[];
  categories: CategoryOption[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descricao</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Categoria</th>
            <th>Origem</th>
            <th>Editar</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{formatDate(transaction.date)}</td>
              <td>
                <div>{transaction.description}</div>
                <div className="muted">{transaction.normalizedDescription}</div>
              </td>
              <td>
                <span className={`badge ${transaction.type}`}>{transaction.type}</span>
              </td>
              <td>{formatMoney(transaction.amount)}</td>
              <td>{transaction.category?.name ?? <span className="muted">Sem categoria</span>}</td>
              <td>{transaction.source}</td>
              <td>
                <form action={updateTransactionCategoryAction} className="actions">
                  <input type="hidden" name="transactionId" value={transaction.id} />
                  <select name="newCategoryId" defaultValue={transaction.categoryId ?? ""} aria-label="Categoria">
                    <option value="" disabled>
                      Escolha
                    </option>
                    {categories
                      .filter((category) => category.type === "both" || category.type === transaction.type)
                      .map((category) => (
                        <option value={category.id} key={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <button type="submit">Salvar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

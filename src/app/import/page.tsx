import { getActiveOrganizationId } from "@/lib/active-organization";
import { prisma } from "@/lib/db";
import { dateKey, toDateOnly } from "@/lib/dates";
import {
  createManualTransactionAction,
  importCsvTransactionsAction
} from "@/server/transactions.actions";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const organizationId = await getActiveOrganizationId();
  const accounts = await prisma.account.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" }
  });
  const defaultAccount = accounts[0];

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Importar</h1>
          <p className="muted">Cadastro manual e import simples por CSV colado em textarea.</p>
        </div>
      </div>

      <section className="panel">
        <h2>Cadastro manual</h2>
        <form action={createManualTransactionAction} className="form-grid">
          <label>
            Conta
            <select name="accountId" defaultValue={defaultAccount?.id}>
              {accounts.map((account) => (
                <option value={account.id} key={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data
            <input name="date" type="date" defaultValue={dateKey(toDateOnly(new Date()))} />
          </label>
          <label>
            Tipo
            <select name="type" defaultValue="expense">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>
            Valor
            <input name="amount" type="number" step="0.01" min="0.01" />
          </label>
          <label className="wide">
            Descricao
            <input name="description" placeholder="Ex: PIX ENVIADO - IMOBILIARIA SAO JOSE LTDA 12345" />
          </label>
          <div className="actions">
            <button type="submit">Cadastrar</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>CSV por texto</h2>
        <form action={importCsvTransactionsAction} className="stack">
          <label>
            Conta
            <select name="accountId" defaultValue={defaultAccount?.id}>
              {accounts.map((account) => (
                <option value={account.id} key={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            CSV
            <textarea
              name="csvText"
              defaultValue={`date,description,amount,type\n${dateKey(
                toDateOnly(new Date())
              )},PIX RECEBIDO CLIENTE TESTE,12000.00,income`}
            />
          </label>
          <div className="actions">
            <button type="submit">Importar CSV</button>
          </div>
        </form>
      </section>
    </div>
  );
}

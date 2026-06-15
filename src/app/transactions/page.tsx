import { TransactionsTable } from "@/components/transactions-table";
import { getActiveOrganizationId } from "@/lib/active-organization";
import { prisma } from "@/lib/db";
import { runCategorizationAction } from "@/server/transactions.actions";
import type { TransactionType } from "@/types/cashflow";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const organizationId = await getActiveOrganizationId();
  const categoryId = single(params.categoryId);
  const type = single(params.type) as TransactionType | undefined;
  const dateFrom = single(params.dateFrom);
  const dateTo = single(params.dateTo);

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        organizationId,
        ...(categoryId ? { categoryId } : {}),
        ...(type === "income" || type === "expense" ? { type } : {}),
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {})
              }
            }
          : {})
      },
      include: { category: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200
    }),
    prisma.category.findMany({
      where: { organizationId },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Transacoes</h1>
          <p className="muted">Lista com filtros simples e correcao manual de categoria.</p>
        </div>
        <form action={runCategorizationAction}>
          <button type="submit">Categorizar pendentes</button>
        </form>
      </div>

      <section className="panel">
        <form className="form-grid">
          <label>
            Categoria
            <select name="categoryId" defaultValue={categoryId ?? ""}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select name="type" defaultValue={type ?? ""}>
              <option value="">Todos</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>
            Data inicial
            <input name="dateFrom" type="date" defaultValue={dateFrom ?? ""} />
          </label>
          <label>
            Data final
            <input name="dateTo" type="date" defaultValue={dateTo ?? ""} />
          </label>
          <div className="actions">
            <button type="submit">Filtrar</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <TransactionsTable
          categories={categories}
          transactions={transactions.map((transaction) => ({
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            normalizedDescription: transaction.normalizedDescription,
            amount: Number(transaction.amount),
            type: transaction.type,
            categoryId: transaction.categoryId,
            source: transaction.source,
            category: transaction.category
          }))}
        />
      </section>
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}

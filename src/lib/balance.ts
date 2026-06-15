import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/money";

export async function getCurrentAccountBalance(input: {
  organizationId: string;
  accountId: string;
}): Promise<number> {
  const account = await prisma.account.findFirst({
    where: {
      id: input.accountId,
      organizationId: input.organizationId
    },
    select: {
      initialBalance: true
    }
  });

  if (!account) {
    throw new Error("Conta nao encontrada para a organizacao ativa.");
  }

  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        organizationId: input.organizationId,
        accountId: input.accountId,
        type: "income"
      },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        organizationId: input.organizationId,
        accountId: input.accountId,
        type: "expense"
      },
      _sum: { amount: true }
    })
  ]);

  return roundMoney(
    Number(account.initialBalance) +
      Number(income._sum.amount ?? 0) -
      Number(expense._sum.amount ?? 0)
  );
}

export async function getPrimaryAccountWithBalance(organizationId: string) {
  const account = await prisma.account.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" }
  });

  if (!account) {
    throw new Error("Nenhuma conta encontrada. Rode o seed antes de usar o MVP.");
  }

  const balance = await getCurrentAccountBalance({
    organizationId,
    accountId: account.id
  });

  return { ...account, calculatedBalance: balance };
}

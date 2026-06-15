import { z } from "zod";

export const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  date: z.coerce.date(),
  description: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"])
});

export const transactionFiltersSchema = z.object({
  categoryId: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
});

export const updateTransactionCategorySchema = z.object({
  transactionId: z.string().min(1),
  newCategoryId: z.string().min(1)
});

import { z } from "zod";

export const csvImportSchema = z.object({
  accountId: z.string().min(1),
  csvText: z.string().trim().min(1)
});

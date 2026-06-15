import { z } from "zod";

export const recurringStatusSchema = z.object({
  recurringPatternId: z.string().min(1),
  status: z.enum(["confirmed", "ignored"])
});

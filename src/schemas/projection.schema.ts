import { z } from "zod";

export const projectionInputSchema = z.object({
  horizonDays: z.coerce.number().refine((value) => value === 30 || value === 60 || value === 90),
  scenario: z.enum(["conservative", "likely", "optimistic"])
});

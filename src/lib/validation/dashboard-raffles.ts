import { z } from "zod";

const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  });

const nullableNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const normalized = value.trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  });

const mysteryPrizeSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    prizeType: z.enum(["MONETARY", "PHYSICAL"]).default("PHYSICAL"),
    value: z.coerce.number().min(0),
    chance: z.coerce.number().gt(0).lte(1),
    description: nullableString,
  })
  .refine((value) => value.prizeType === "PHYSICAL" || value.value > 0, {
    message: "Premio monetario deve ter valor maior que zero",
    path: ["value"],
  });

export const dashboardRaffleSchema = z.object({
  slug: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(1, "Titulo obrigatorio").max(160),
  description: nullableString,
  banner: nullableString,
  pixValue: z.coerce.number().min(0),
  priceTicket: z.coerce.number().gt(0),
  minTickets: z.coerce.number().int().min(1),
  maxTickets: z.coerce.number().int().min(1),
  collaboratorPrizesEnabled: z.coerce.boolean().optional().default(false),
  collaboratorPrizeFirst: nullableNumber,
  collaboratorPrizeSecond: nullableNumber,
  collaboratorPrizeThird: nullableNumber,
  mysteryPrizes: z.array(mysteryPrizeSchema).optional().default([]),
});

export type DashboardRaffleInput = z.infer<typeof dashboardRaffleSchema>;

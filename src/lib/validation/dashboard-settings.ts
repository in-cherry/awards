import { z } from "zod";

export const dashboardSettingsSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatorio").max(120).optional(),
  customDomain: z.string().trim().toLowerCase().max(150).nullable().optional(),
  metaTitle: z.string().trim().max(120).nullable().optional(),
  metaDescription: z.string().trim().max(300).nullable().optional(),
  favicon: z.string().trim().max(500).nullable().optional(),
  logo: z.string().trim().max(500).nullable().optional(),
  instagram: z.string().trim().max(200).nullable().optional(),
  telegram: z.string().trim().max(200).nullable().optional(),
  supportUrl: z.string().trim().max(500).nullable().optional(),
});

export type DashboardSettingsInput = z.infer<typeof dashboardSettingsSchema>;

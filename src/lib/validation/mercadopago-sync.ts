import { z } from "zod";

export const mercadopagoSyncSchema = z.object({
  externalId: z.union([z.string().trim().min(1), z.number().int().positive()]),
});

export type MercadoPagoSyncInput = z.infer<typeof mercadopagoSyncSchema>;

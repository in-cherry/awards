import { z } from "zod";
import { onlyDigits } from "@/lib/utils";

function isValidCpf(cpf: string): boolean {
  const normalized = onlyDigits(cpf);
  return normalized.length === 11;
}

export const authLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
});

export const authRegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra")
    .regex(/\d/, "A senha deve conter ao menos um numero"),
  name: z.string().trim().min(2, "Nome obrigatorio").max(120),
  phone: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => value.length >= 10 && value.length <= 11, "Telefone invalido"),
  cpf: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => isValidCpf(value), "CPF invalido"),
});

export const publicClientLoginSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1, "Slug obrigatorio"),
  email: z.string().trim().toLowerCase().email("Email invalido"),
  cpf: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => isValidCpf(value), "CPF invalido"),
});

export const publicClientRegisterSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1, "Slug obrigatorio"),
  name: z.string().trim().min(2, "Nome obrigatorio").max(120),
  email: z.string().trim().toLowerCase().email("Email invalido"),
  phone: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => value.length >= 10 && value.length <= 11, "Telefone invalido"),
  cpf: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => isValidCpf(value), "CPF invalido"),
});

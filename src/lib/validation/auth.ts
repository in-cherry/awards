import { z } from "zod";
import { onlyDigits } from "@/lib/utils";

function isValidCpf(cpf: string): boolean {
  const normalized = onlyDigits(cpf);
  if (normalized.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(normalized)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(normalized[i]) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(normalized[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(normalized[i]) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(normalized[10]);
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

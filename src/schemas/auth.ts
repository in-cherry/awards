import { z } from 'zod';

// A sua função matemática exata movida para cá, para manter a confiabilidade
const validateCPFMath = (cpfValue: string) => {
  const cleanCpf = cpfValue.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCpf)) return false;

  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleanCpf.substring(10, 11))) return false;

  return true;
};

// Schema 1: Apenas CPF (Usado na primeira etapa do Checkout e no Login)
export const cpfSchema = z.object({
  cpf: z.string()
    .transform(v => v.replace(/\D/g, ''))
    .refine(validateCPFMath, "CPF inválido. Verifique os números informados.")
});

// Schema 2: Cadastro Completo (O formData do RaffleClient)
export const newUserSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  email: z.string().email("Por favor, informe um e-mail válido."),
  birthDate: z.string().min(10, "Informe uma data de nascimento válida."),
  phone: z.string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().min(10, "Telefone inválido. Inclua o DDD.")),
  confirmPhone: z.string()
    .transform(v => v.replace(/\D/g, ''))
}).refine((data) => data.phone === data.confirmPhone, {
  message: "Os números de telefone não coincidem.",
  path: ["confirmPhone"], // Aponta o erro especificamente para este campo
});

// Schema 3: Confirmacao de Email no Login
export const loginEmailSchema = z.object({
  email: z.string().email('Por favor, informe um e-mail valido.'),
});
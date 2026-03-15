import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const formatCPF = (cpf: string): string => {
  const cleanedCPF = cpf.replace(/\D/g, '');
  if (cleanedCPF.length !== 11) return cpf; // Retorna o CPF original se não tiver 11 dígitos

  return cleanedCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export const formatPhone = (phone: string): string => {
  const cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.length === 11) {
    return cleanedPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanedPhone.length === 10) {
    return cleanedPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone; // Retorna o telefone original se não tiver 10 ou 11 dígitos
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
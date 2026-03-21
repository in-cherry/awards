import { ReactNode } from 'react';
import { formatCPF, formatPhone, formatCurrency, formatNumber } from '@/lib/utils';

type FormattedTextProps = {
  value: string | number;
  type: 'cpf' | 'phone' | 'currency' | 'number';
  className?: string;
};

export function FormattedText({ value, type, className = '' }: FormattedTextProps): ReactNode {
  if (typeof value === 'number' && type !== 'currency' && type !== 'number') {
    return value;
  }

  let formatted = '';

  switch (type) {
    case 'cpf':
      formatted = formatCPF(String(value));
      break;
    case 'phone':
      formatted = formatPhone(String(value));
      break;
    case 'currency':
      formatted = formatCurrency(Number(value));
      break;
    case 'number':
      formatted = formatNumber(Number(value));
      break;
  }

  return <span className={className}>{formatted}</span>;
}

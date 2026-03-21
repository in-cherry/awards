import { useState, useCallback } from 'react';
import { formatCPFInput, formatPhoneInput, onlyDigits } from '@/lib/utils';

/**
 * Hook para formatar CPF enquanto digita
 * @returns [value, displayValue, handler]
 */
export function useFormatCPF() {
  const [value, setValue] = useState('');

  const handleChange = useCallback((input: string) => {
    const formatted = formatCPFInput(input);
    setValue(formatted);
  }, []);

  const getRawValue = useCallback(() => onlyDigits(value), [value]);

  return {
    displayValue: value,
    rawValue: getRawValue(),
    setValue: handleChange,
  };
}

/**
 * Hook para formatar telefone enquanto digita
 * @returns [value, displayValue, handler]
 */
export function useFormatPhone() {
  const [value, setValue] = useState('');

  const handleChange = useCallback((input: string) => {
    const formatted = formatPhoneInput(input);
    setValue(formatted);
  }, []);

  const getRawValue = useCallback(() => onlyDigits(value), [value]);

  return {
    displayValue: value,
    rawValue: getRawValue(),
    setValue: handleChange,
  };
}

/**
 * Hook genérico para formatar inputs
 */
export function useFormatInput(formatter: (value: string) => string) {
  const [value, setValue] = useState('');

  const handleChange = useCallback((input: string) => {
    const formatted = formatter(input);
    setValue(formatted);
  }, [formatter]);

  return {
    value,
    setValue: handleChange,
  };
}

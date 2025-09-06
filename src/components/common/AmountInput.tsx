
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';

interface AmountInputProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  form?: UseFormReturn<any>;
  maxValue?: number;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = "0,00",
  disabled = false,
  className = "",
  form,
  maxValue = 9999999.99 // Maximum value to prevent overflow
}) => {
  // Estado local para armazenar o valor como string durante a edição
  const [inputValue, setInputValue] = useState<string>(
    value ? formatNumberToString(value) : ''
  );

  // Sanitize input to prevent malicious content
  const sanitizeInput = (input: string): string => {
    // Remove any HTML tags, scripts, or dangerous characters
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>\"'&]/g, '') // Remove dangerous characters
      .substring(0, 15); // Limit length to prevent overflow
  };

  // Validate numeric input
  const validateNumericInput = (input: string): boolean => {
    const numericPattern = /^[\d.,\s-]*$/;
    return numericPattern.test(input);
  };

  // Converte string para número (para salvar) com validação aprimorada
  const stringToNumber = (str: string): number => {
    // Sanitize input first
    const sanitized = sanitizeInput(str);
    
    // Validate numeric pattern
    if (!validateNumericInput(sanitized)) {
      console.warn('Invalid numeric input detected:', str);
      return 0;
    }
    
    // Remove todos os caracteres não numéricos, exceto vírgula e ponto
    const cleanValue = sanitized.replace(/[^\d,.-]/g, '');
    
    // Substitui vírgula por ponto para parsing
    const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    
    // Converte para número ou retorna 0 se inválido
    const numValue = parseFloat(normalizedValue) || 0;
    
    // Apply maximum value constraint
    return Math.min(numValue, maxValue);
  };

  // Formata número para string (para exibição)
  function formatNumberToString(num: number): string {
    if (num === 0) return '';
    // Ensure number is within valid range
    const safeNum = Math.min(Math.abs(num), maxValue);
    return safeNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Manipula mudanças no input com validação
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Sanitize and validate input
    const sanitizedValue = sanitizeInput(newValue);
    
    if (!validateNumericInput(sanitizedValue)) {
      return; // Ignore invalid input
    }
    
    // Atualiza o estado local com o valor digitado
    setInputValue(sanitizedValue);
    
    // Converte para número e chama o callback onChange
    if (onChange) {
      onChange(stringToNumber(sanitizedValue));
    }
  };

  // Se o form for fornecido, renderiza como campo de formulário
  if (form) {
    return (
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => {
          // Sync local state with field value when form loads
          useEffect(() => {
            if (field.value && field.value !== stringToNumber(inputValue)) {
              setInputValue(formatNumberToString(field.value));
            }
          }, [field.value]);

          return (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={inputValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const sanitizedValue = sanitizeInput(newValue);
                    
                    if (!validateNumericInput(sanitizedValue)) {
                      return;
                    }
                    
                    setInputValue(sanitizedValue);
                    field.onChange(stringToNumber(sanitizedValue));
                  }}
                  onBlur={() => {
                    // Formata o valor ao perder o foco
                    const numValue = stringToNumber(inputValue);
                    setInputValue(numValue ? formatNumberToString(numValue) : '');
                  }}
                  placeholder={placeholder}
                  disabled={disabled}
                  className={className}
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  // Componente standalone
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={() => {
        // Formata o valor ao perder o foco
        const numValue = stringToNumber(inputValue);
        setInputValue(numValue ? formatNumberToString(numValue) : '');
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      maxLength={15}
    />
  );
};

export default AmountInput;

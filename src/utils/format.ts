/**
 * Formatting utilities for the Kaelo app
 */

/**
 * Formats a number as Mexican Peso currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56 MXN")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number with thousand separators
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value);
}

export const CURRENCY_SYMBOL = "\u20BC"; // ₼

export function formatCurrency(value: number): string {
  return `${value.toFixed(2)} ${CURRENCY_SYMBOL}`;
}

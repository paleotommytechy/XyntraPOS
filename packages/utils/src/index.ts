/**
 * Format an amount to a clean, readable currency string.
 * @param amount - The numeric amount to format.
 * @param currencyCode - The currency ISO code (e.g. NGN, USD, GHS).
 */
export function formatCurrency(amount: number, currencyCode: string = 'NGN'): string {
  const localeMap: Record<string, string> = {
    NGN: 'en-NG',
    USD: 'en-US',
    GHS: 'en-GH',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };

  const locale = localeMap[currencyCode.toUpperCase()] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback format if the currency is unrecognized
    return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a ISO timestamp or Date object into a readable date string.
 * @param date - The Date object or ISO string.
 * @param includeTime - Whether to include hours/minutes in formatting.
 */
export function formatDate(date: string | Date, includeTime: boolean = true): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a unique SKU or barcode if not specified
 */
export function generateRandomCode(prefix: string = 'ITEM', length: number = 8): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.toUpperCase()}-${result}`;
}

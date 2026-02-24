import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'CAD',
  locale: string = 'en-CA'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(numValue);
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  locale: string = 'en-CA'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format date and time for display
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'en-CA'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Generate a random PIN code (6 digits)
 */
export function generatePinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Slugify a string for URLs
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if running on server side
 */
export const isServer = typeof window === 'undefined';

/**
 * Check if running on client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Order status labels
 */
export const ORDER_STATUS_LABELS = {
  pending_quote: 'Pending Quote',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

/**
 * Stone type labels
 */
export const STONE_TYPE_LABELS = {
  quartz: 'Quartz',
  granite: 'Granite',
  marble: 'Marble',
  quartzite: 'Quartzite',
  porcelain: 'Porcelain',
} as const;

/**
 * Desired date labels
 */
export const DESIRED_DATE_LABELS = {
  ASAP: 'As Soon As Possible',
  within_2_weeks: 'Within 2 Weeks',
  within_a_month: 'Within a Month',
  not_in_a_hurry: 'Not in a Hurry',
} as const;

/**
 * Calculation unit labels
 */
export const CALCULATION_UNIT_LABELS = {
  per_sqft: 'Per Sq Ft',
  per_unit: 'Per Unit',
  per_hour: 'Per Hour',
} as const;

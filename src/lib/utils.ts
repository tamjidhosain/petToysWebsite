import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format price in BDT (Bangladeshi Taka)
 */
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date in a readable format
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Validate Bangladesh phone number
 */
export function isValidBDPhone(phone: string): boolean {
    const bdPhoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    return bdPhoneRegex.test(phone);
}

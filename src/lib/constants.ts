/**
 * Application-wide constants
 */

export const APP_NAME = 'Pet Toys Bangladesh';
export const APP_DESCRIPTION = 'Quality toys for your beloved pets';

// Pagination
export const PRODUCTS_PER_PAGE = 20;
export const REVIEWS_PER_PAGE = 10;
export const ORDERS_PER_PAGE = 10;

// Shipping costs (in BDT)
export const SHIPPING_COST_DHAKA = 60;
export const SHIPPING_COST_OUTSIDE_DHAKA = 120;
export const FREE_SHIPPING_THRESHOLD = 2000;

// Tax rate (15% VAT for Bangladesh)
export const TAX_RATE = 0.15;

// Product categories
export const CATEGORIES = [
    { id: 'dogs', name: 'Dogs', icon: '🐕' },
    { id: 'cats', name: 'Cats', icon: '🐈' },
    { id: 'birds', name: 'Birds', icon: '🦜' },
    { id: 'small-animals', name: 'Small Animals', icon: '🐹' },
    { id: 'exotic', name: 'Exotic Pets', icon: '🦎' },
] as const;

// Order statuses
export const ORDER_STATUSES = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;

// Payment statuses
export const PAYMENT_STATUSES = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
} as const;

// User roles
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
} as const;

// Review rating range
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// Stock thresholds
export const LOW_STOCK_THRESHOLD = 10;
export const OUT_OF_STOCK_THRESHOLD = 0;

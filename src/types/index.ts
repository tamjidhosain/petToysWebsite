/**
 * Common TypeScript types and interfaces
 */

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'user' | 'admin' | 'moderator';
    createdAt: Date;
    updatedAt: Date;
}

// Product types
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    price: number;
    cost: number;
    sku: string;
    stock: number;
    images: string[];
    attributes?: Record<string, any>;
    rating: number;
    reviewsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductVariant {
    id: string;
    productId: string;
    size?: string;
    color?: string;
    priceModifier: number;
    stock: number;
    sku: string;
}

// Category types
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
}

// Order types
export interface Order {
    id: string;
    userId: string;
    totalAmount: number;
    tax: number;
    shippingCost: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export type PaymentStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'refunded';

// Review types
export interface Review {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

// Cart types
export interface CartItem {
    id: string;
    userId: string;
    productId: string;
    variantId?: string;
    quantity: number;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

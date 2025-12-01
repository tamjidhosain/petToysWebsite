'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        images: string[];
    };
    variant?: {
        id: string;
        size?: string;
        color?: string;
        priceModifier: number;
        stock: number;
    };
}

interface CartContextType {
    items: CartItem[];
    loading: boolean;
    addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    totalItems: number;
    subtotal: number;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCart();
        } else {
            setItems([]);
        }
    }, [status]);

    const fetchCart = async () => {
        try {
            const res = await fetch('/api/cart');
            const data = await res.json();
            if (data.success) {
                setItems(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    };

    const addToCart = async (productId: string, quantity: number, variantId?: string) => {
        if (status !== 'authenticated') {
            router.push('/auth/signin?callbackUrl=' + window.location.pathname);
            return;
        }

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity, variantId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            await fetchCart();
        } catch (error) {
            console.error('Add to cart error:', error);
            throw error;
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            const res = await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to remove item');

            setItems((prev) => prev.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Remove from cart error:', error);
            throw error;
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        try {
            const res = await fetch(`/api/cart/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, quantity: data.data.quantity } : item
                )
            );
        } catch (error) {
            console.error('Update quantity error:', error);
            throw error;
        }
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const subtotal = items.reduce((acc, item) => {
        const price = item.variant
            ? item.product.price + item.variant.priceModifier
            : item.product.price;
        return acc + price * item.quantity;
    }, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                loading,
                addToCart,
                removeFromCart,
                updateQuantity,
                totalItems,
                subtotal,
                refreshCart: fetchCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

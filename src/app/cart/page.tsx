'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_COST_DHAKA } from '@/lib/constants';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="mb-4 text-3xl font-bold text-gray-900">
                        Your Cart is Empty
                    </h1>
                    <p className="mb-8 text-gray-600">
                        Looks like you haven't added any toys yet!
                    </p>
                    <Link
                        href="/products"
                        className="rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white transition hover:bg-primary-700"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-8">
                        <div className="space-y-4">
                            {items.map((item) => {
                                const price = item.variant
                                    ? item.product.price + item.variant.priceModifier
                                    : item.product.price;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex gap-6 rounded-lg bg-white p-6 shadow-sm"
                                    >
                                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                            {item.product.images[0] && (
                                                <Image
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        <Link href={`/products/${item.product.slug}`}>
                                                            {item.product.name}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {formatPrice(price * item.quantity)}
                                                    </p>
                                                </div>
                                                {item.variant && (
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {item.variant.size} {item.variant.color}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Unit Price: {formatPrice(price)}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.id, Math.max(1, item.quantity - 1))
                                                        }
                                                        className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-sm font-medium text-red-600 hover:text-red-500"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-medium text-gray-900">
                                Order Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-gray-200 pb-4">
                                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Shipping Estimate</span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(SHIPPING_COST_DHAKA)}
                                    </span>
                                </div>

                                <div className="flex justify-between border-t border-gray-200 pt-4">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-primary-600">
                                        {formatPrice(subtotal + SHIPPING_COST_DHAKA)}
                                    </span>
                                </div>
                            </div>

                            <button className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-primary-700">
                                Proceed to Checkout
                            </button>

                            <div className="mt-4 text-center text-sm text-gray-500">
                                <p>or</p>
                                <Link
                                    href="/products"
                                    className="mt-2 inline-block font-medium text-primary-600 hover:text-primary-500"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

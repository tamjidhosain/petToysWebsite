'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        images: string[];
        rating: number;
        reviewsCount: number;
        stock: number;
    };
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const isOutOfStock = product.stock === 0;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isOutOfStock || isAdding) return;

        setIsAdding(true);
        try {
            await addToCart(product.id, 1);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Link href={`/products/${product.slug}`} className="group">
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.images[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-6xl">🐾</span>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                        {isOutOfStock && (
                            <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                                Out of Stock
                            </span>
                        )}
                        {product.rating >= 4.5 && !isOutOfStock && (
                            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white">
                                Best Seller
                            </span>
                        )}
                    </div>

                    {/* Quick Add Button */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white opacity-0 shadow-lg transition-all hover:bg-primary-700 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Add to cart"
                        >
                            {isAdding ? (
                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <svg
                                    key={i}
                                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">({product.reviewsCount})</span>
                    </div>

                    {/* Name */}
                    <h3 className="mt-2 line-clamp-2 font-medium text-gray-900 group-hover:text-primary-600">
                        {product.name}
                    </h3>

                    {/* Price & Stock */}
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-lg font-bold text-primary-600">
                            {formatPrice(product.price)}
                        </p>
                        {!isOutOfStock && product.stock <= 5 && (
                            <span className="text-xs text-orange-600">
                                Only {product.stock} left
                            </span>
                        )}
                        {!isOutOfStock && product.stock > 5 && (
                            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                In Stock
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

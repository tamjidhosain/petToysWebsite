'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [product, setProduct] = useState<any>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${slug}`);
            const data = await res.json();

            if (data.success) {
                setProduct(data.data.product);
                setRelatedProducts(data.data.relatedProducts);
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
                    <a href="/products" className="mt-4 text-primary-600 hover:underline">
                        Back to products
                    </a>
                </div>
            </div>
        );
    }

    const currentPrice = selectedVariant
        ? product.price + selectedVariant.priceModifier
        : product.price;
    const isOutOfStock = product.stock === 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-8 flex items-center gap-2 text-sm text-gray-600">
                    <a href="/" className="hover:text-primary-600">
                        Home
                    </a>
                    <span>/</span>
                    <a href="/products" className="hover:text-primary-600">
                        Products
                    </a>
                    <span>/</span>
                    <span className="text-gray-900">{product.name}</span>
                </nav>

                {/* Product Details */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                            {product.images[0] ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    width={600}
                                    height={600}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    No Image Available
                                </div>
                            )}
                        </div>
                        {product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {product.images.slice(1, 5).map((img: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                                    >
                                        <Image
                                            src={img}
                                            alt={`${product.name} ${idx + 2}`}
                                            width={150}
                                            height={150}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold text-gray-900">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`h-5 w-5 ${i < Math.floor(product.rating)
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-gray-600">
                                    {product.rating.toFixed(1)} ({product.reviewsCount} reviews)
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-b border-gray-200 py-6">
                            <p className="text-4xl font-bold text-gray-900">
                                {formatPrice(currentPrice)}
                            </p>
                            {isOutOfStock ? (
                                <p className="mt-2 text-lg font-semibold text-red-600">
                                    Out of Stock
                                </p>
                            ) : (
                                <p className="mt-2 text-green-600">
                                    {product.stock} items in stock
                                </p>
                            )}
                        </div>

                        <div>
                            <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
                            <p className="text-gray-600">{product.description}</p>
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div>
                                <h3 className="mb-2 font-semibold text-gray-900">Options</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant: any) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`rounded-lg border px-4 py-2 ${selectedVariant?.id === variant.id
                                                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {variant.size || variant.color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        {!isOutOfStock && (
                            <div>
                                <h3 className="mb-2 font-semibold text-gray-900">Quantity</h3>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                    >
                                        -
                                    </button>
                                    <span className="text-lg font-semibold">{quantity}</span>
                                    <button
                                        onClick={() =>
                                            setQuantity(Math.min(product.stock, quantity + 1))
                                        }
                                        className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart */}
                        <div className="flex gap-4">
                            <button
                                disabled={isOutOfStock}
                                className="flex-1 rounded-lg bg-primary-600 px-8 py-4 font-semibold text-white transition hover:bg-primary-700 disabled:bg-gray-300"
                            >
                                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button className="rounded-lg border border-gray-300 px-6 py-4 hover:bg-gray-50">
                                ❤️
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-16">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                        Customer Reviews
                    </h2>
                    {product.reviews && product.reviews.length > 0 ? (
                        <div className="space-y-6">
                            {product.reviews.map((review: any) => (
                                <div key={review.id} className="rounded-lg bg-white p-6 shadow">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {review.user.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(review.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`h-5 w-5 ${i < review.rating
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                        }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700">{review.text}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No reviews yet. Be the first to review!</p>
                    )}
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">
                            Related Products
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedProducts.map((relatedProduct) => (
                                <a
                                    key={relatedProduct.id}
                                    href={`/products/${relatedProduct.slug}`}
                                    className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
                                >
                                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                                        {relatedProduct.images[0] && (
                                            <Image
                                                src={relatedProduct.images[0]}
                                                alt={relatedProduct.name}
                                                width={300}
                                                height={300}
                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                            />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                                            {relatedProduct.name}
                                        </h3>
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatPrice(relatedProduct.price)}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

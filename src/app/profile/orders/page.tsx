'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, formatPrice } from '@/lib/utils';

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/user/orders');
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">No orders yet</h2>
                <p className="mt-2 text-gray-600">
                    You haven't placed any orders yet. Start shopping!
                </p>
                <Link
                    href="/products"
                    className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white hover:bg-primary-700"
                >
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Order History</h2>

            <div className="space-y-6">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="overflow-hidden rounded-lg border border-gray-200"
                    >
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Order #{order.id.slice(-6).toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Placed on {formatDate(order.createdAt)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">
                                    {formatPrice(order.totalAmount)}
                                </p>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${order.status === 'DELIVERED'
                                            ? 'bg-green-100 text-green-800'
                                            : order.status === 'CANCELLED'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                >
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                                                {/* Image placeholder or actual image if available in order item snapshot */}
                                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                                    Img
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">
                                                    {item.product?.name || 'Product'}
                                                </h4>
                                                {item.variant && (
                                                    <p className="text-sm text-gray-500">
                                                        {item.variant.size} {item.variant.color}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {formatPrice(item.unitPrice * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

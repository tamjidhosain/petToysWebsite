'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderSuccessPage() {
    const params = useParams();
    const orderId = params.orderId;

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <svg
                        className="h-10 w-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                <h1 className="mb-2 text-3xl font-bold text-gray-900">Order Placed!</h1>
                <p className="mb-6 text-gray-600">
                    Thank you for your purchase. Your order has been received and is being
                    processed.
                </p>

                <div className="mb-8 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono font-medium text-gray-900">{orderId}</p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/products"
                        className="block w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700"
                    >
                        Continue Shopping
                    </Link>
                    <Link
                        href="/profile/orders"
                        className="block w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        View My Orders
                    </Link>
                </div>
            </div>
        </div>
    );
}

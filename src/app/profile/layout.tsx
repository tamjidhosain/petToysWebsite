'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navigation = [
        { name: 'Profile Settings', href: '/profile' },
        { name: 'Order History', href: '/profile/orders' },
        { name: 'Addresses', href: '/profile/addresses' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
                    <p className="mt-2 text-gray-600">
                        Welcome back, {session?.user?.name}
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Sidebar Navigation */}
                    <aside className="lg:col-span-3">
                        <nav className="space-y-1 rounded-lg bg-white p-4 shadow-sm">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`block rounded-md px-4 py-2 text-sm font-medium transition ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9">
                        <div className="rounded-lg bg-white p-6 shadow-sm">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}

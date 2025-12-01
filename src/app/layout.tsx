import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'Pet Toys Bangladesh - Quality Toys for Your Pets',
    description: 'Shop the best pet toys in Bangladesh. Quality toys for dogs, cats, birds, and small animals. Fast delivery across Bangladesh.',
    keywords: ['pet toys', 'dog toys', 'cat toys', 'Bangladesh', 'pet supplies'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="flex min-h-screen flex-col">
                <SessionProvider>
                    <CartProvider>
                        <Navbar />
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </CartProvider>
                </SessionProvider>
            </body>
        </html>
    );
}

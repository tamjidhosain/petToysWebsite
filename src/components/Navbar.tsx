'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useState, useRef, useEffect, Suspense } from 'react';

function NavbarContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const { totalItems } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
            setIsMenuOpen(false);
        }
    };

    const isActive = (path: string, category?: string) => {
        if (category) {
            return pathname === '/products' && searchParams.get('category') === category;
        }
        if (path === '/products' && !category) {
            return pathname === '/products' && !searchParams.get('category');
        }
        return pathname === path;
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/products', label: 'Shop' },
        { href: '/products?category=dogs', label: 'Dogs', category: 'dogs' },
        { href: '/products?category=cats', label: 'Cats', category: 'cats' },
        { href: '/products?category=birds', label: 'Birds', category: 'birds' },
    ];

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md' : 'bg-white'
            }`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">🐾</span>
                        <span className="text-xl font-bold text-primary-600">PetToys</span>
                        <span className="text-xl font-bold text-gray-700">BD</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-6 lg:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition-colors hover:text-primary-600 ${isActive(link.href.split('?')[0], link.category)
                                        ? 'text-primary-600'
                                        : 'text-gray-700'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden flex-1 max-w-md lg:block">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search for toys..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-2 pl-10 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="relative rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            {totalItems > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                                    {totalItems > 9 ? '9+' : totalItems}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {session ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 rounded-full border border-gray-200 p-1 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-sm font-medium text-white">
                                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                                        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                                            <p className="font-medium text-gray-900">{session.user?.name}</p>
                                            <p className="truncate text-sm text-gray-500">{session.user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <span>👤</span> Profile Settings
                                            </Link>
                                            <Link
                                                href="/orders"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <span>📦</span> Order History
                                            </Link>
                                            <hr className="my-1" />
                                            <button
                                                onClick={() => signOut()}
                                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <span>🚪</span> Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="hidden rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:block"
                            >
                                Sign In
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
                        >
                            {isMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="border-t border-gray-200 py-4 lg:hidden">
                        <form onSubmit={handleSearch} className="mb-4">
                            <input
                                type="text"
                                placeholder="Search for toys..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                            />
                        </form>
                        <div className="space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive(link.href.split('?')[0], link.category)
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {!session && (
                                <Link
                                    href="/auth/signin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default function Navbar() {
    return (
        <Suspense fallback={<div className="h-16 border-b border-gray-200 bg-white" />}>
            <NavbarContent />
        </Suspense>
    );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS_PER_PAGE } from '@/lib/constants';

interface Category {
    id: string;
    name: string;
    slug: string;
}

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initialize state from URL params
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<any>(null);

    // Filters - Initialize from URL
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

    // Update URL when filters change
    const updateUrl = () => {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy) params.set('sortBy', sortBy);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (inStockOnly) params.set('inStock', 'true');
        if (currentPage > 1) params.set('page', currentPage.toString());

        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Sync state with URL params when they change (e.g. navigation)
    useEffect(() => {
        setSelectedCategory(searchParams.get('category') || '');
        setSearchQuery(searchParams.get('search') || '');
        setSortBy(searchParams.get('sortBy') || 'createdAt');
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
        setInStockOnly(searchParams.get('inStock') === 'true');
        setCurrentPage(parseInt(searchParams.get('page') || '1'));
    }, [searchParams]);

    // Fetch products when filters change
    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, searchQuery, sortBy, minPrice, maxPrice, inStockOnly, currentPage]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                sortBy,
                order: 'desc',
            });

            if (selectedCategory) params.append('category', selectedCategory);
            if (searchQuery) params.append('search', searchQuery);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (inStockOnly) params.append('inStock', 'true');

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        updateUrl();
    };

    const handleFilterChange = (updater: () => void) => {
        updater();
        setCurrentPage(1);
        setTimeout(updateUrl, 0);
    };

    const handleCategoryClick = (categorySlug: string) => {
        if (selectedCategory === categorySlug) {
            // If clicking the same category, deselect it
            setSelectedCategory('');
        } else {
            setSelectedCategory(categorySlug);
        }
        setCurrentPage(1);
        setTimeout(updateUrl, 0);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">Shop All Products</h1>
                    <p className="mt-3 text-lg text-gray-600">
                        Find the perfect toy for your furry friend
                    </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-64 lg:flex-shrink-0">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            {/* Category Filter */}
                            <div className="mb-8">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Categories
                                </h3>
                                <div className="space-y-2">
                                    {/* All Products Option */}
                                    <button
                                        onClick={() => handleCategoryClick('')}
                                        className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all ${selectedCategory === ''
                                            ? 'bg-primary-50 text-primary-700 shadow-sm ring-2 ring-primary-500/20'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>All Products</span>
                                            {selectedCategory === '' && (
                                                <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>

                                    {/* Category List */}
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategoryClick(category.slug)}
                                            className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all ${selectedCategory === category.slug
                                                ? 'bg-primary-50 text-primary-700 shadow-sm ring-2 ring-primary-500/20'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{category.name}</span>
                                                {selectedCategory === category.slug && (
                                                    <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range Filter */}
                            <div className="mb-8 border-t border-gray-200 pt-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">Price Range</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Min Price (৳)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={minPrice}
                                            onChange={(e) => handleFilterChange(() => setMinPrice(e.target.value))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Max Price (৳)</label>
                                        <input
                                            type="number"
                                            placeholder="10000"
                                            value={maxPrice}
                                            onChange={(e) => handleFilterChange(() => setMaxPrice(e.target.value))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stock Filter */}
                            <div className="border-t border-gray-200 pt-6">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={(e) => handleFilterChange(() => setInStockOnly(e.target.checked))}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                                    />
                                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                                </label>
                            </div>

                            {/* Clear Filters */}
                            {(selectedCategory || searchQuery || minPrice || maxPrice || inStockOnly) && (
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setSearchQuery('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setInStockOnly(false);
                                        handleFilterChange(() => { });
                                    }}
                                    className="mt-6 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Sort & Stats Bar */}
                        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium text-gray-600">
                                Showing <span className="text-gray-900">{products.length}</span> results
                                {selectedCategory && (
                                    <span className="ml-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                                        {categories.find(c => c.slug === selectedCategory)?.name}
                                    </span>
                                )}
                            </p>

                            <div className="flex items-center gap-2">
                                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                                    Sort by:
                                </label>
                                <select
                                    id="sort"
                                    value={sortBy}
                                    onChange={(e) => handleFilterChange(() => setSortBy(e.target.value))}
                                    className="rounded-lg border-none bg-gray-50 py-2 pl-3 pr-8 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="createdAt">Newest Arrivals</option>
                                    <option value="price">Price: Low to High</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="sold">Most Popular</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="mt-4 text-sm text-gray-600">Loading products...</p>
                                </div>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                                <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="mt-4 text-lg font-semibold text-gray-900">No products found</h3>
                                <p className="mt-2 text-sm text-gray-600">Try adjusting your search or filters</p>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setSearchQuery('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setInStockOnly(false);
                                        handleFilterChange(() => { });
                                    }}
                                    className="mt-6 rounded-full bg-primary-50 px-6 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-100"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {products.map((product: any) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => {
                                                setCurrentPage((p) => Math.max(1, p - 1));
                                                setTimeout(updateUrl, 0);
                                            }}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Previous
                                        </button>

                                        <span className="text-sm text-gray-600">
                                            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                                            <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                                        </span>

                                        <button
                                            onClick={() => {
                                                setCurrentPage((p) => p + 1);
                                                setTimeout(updateUrl, 0);
                                            }}
                                            disabled={!pagination.hasMore}
                                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Next
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <ProductsPageContent />
        </Suspense>
    );
}

import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import prisma from '@/lib/db';

async function getFeaturedProducts() {
    const products = await prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { rating: 'desc' },
        take: 8,
        include: {
            category: {
                select: { id: true, name: true, slug: true },
            },
        },
    });
    return products;
}

async function getCategories() {
    const categories = await prisma.category.findMany({
        take: 6,
        orderBy: { name: 'asc' },
    });
    return categories;
}

const categoryImages: Record<string, string> = {
    dogs: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    cats: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    birds: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&q=80',
    'small-animals': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
    fish: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=800&q=80',
    exotic: 'https://images.unsplash.com/photo-1597526061937-f0cd46dcc423?w=800&q=80',
};

const features = [
    {
        icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Safety Tested',
        description: 'Every product undergoes rigorous safety testing before reaching your beloved pets.',
    },
    {
        icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Fast Delivery',
        description: 'Swift nationwide shipping across Bangladesh within 2-3 business days.',
    },
    {
        icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        title: '24/7 Support',
        description: 'Our dedicated support team is always ready to assist you with any queries.',
    },
    {
        icon: (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
        ),
        title: 'Easy Returns',
        description: '7-day hassle-free return policy for complete peace of mind.',
    },
];

const testimonials = [
    {
        name: 'Farhan Rahman',
        location: 'Dhaka',
        rating: 5,
        text: 'My dog absolutely loves the toys! Great quality and fast delivery. The customer service is exceptional. Highly recommended for all pet owners!',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    },
    {
        name: 'Nusrat Jahan',
        location: 'Chittagong',
        rating: 5,
        text: 'Finally found a reliable pet toy store in Bangladesh. My cats are obsessed with the interactive toys. Will definitely be ordering more!',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    },
    {
        name: 'Kamrul Hassan',
        location: 'Sylhet',
        rating: 5,
        text: 'Excellent customer service and the bird toys are amazing quality. Fast shipping and great packaging. This is now my go-to pet store!',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
    },
];

export default async function Home() {
    const [products, categories] = await Promise.all([
        getFeaturedProducts(),
        getCategories(),
    ]);

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] bg-gray-900">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1920&q=80"
                        alt="Happy dog with toy"
                        fill
                        className="object-cover opacity-40"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <span className="inline-block rounded-full bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-400 backdrop-blur-sm border border-primary-500/20">
                            Free shipping on orders over ৳1500
                        </span>
                        <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Premium Toys for Your{' '}
                            <span className="text-primary-400">Beloved Pets</span>
                        </h1>
                        <p className="mt-6 text-lg text-gray-300 leading-relaxed">
                            Discover our curated collection of high-quality toys and accessories
                            designed to keep your furry, feathered, or scaled companions happy and healthy.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href="/products"
                                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                Shop Collection
                                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                href="#categories"
                                className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
                            >
                                Browse Categories
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-gray-700 pt-8">
                            <div>
                                <p className="text-3xl font-bold text-white">5,000+</p>
                                <p className="mt-1 text-sm text-gray-400">Happy Customers</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">500+</p>
                                <p className="mt-1 text-sm text-gray-400">Products</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">4.9/5</p>
                                <p className="mt-1 text-sm text-gray-400">Customer Rating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section id="categories" className="bg-white py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Shop by Pet
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Find the perfect toys tailored for your companion
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/products?category=${category.slug}`}
                                className="group relative h-80 overflow-hidden rounded-2xl"
                            >
                                {/* Background Image */}
                                <Image
                                    src={categoryImages[category.slug] || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80'}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                                    <p className="mt-2 flex items-center text-sm font-medium text-primary-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
                                        Shop Now
                                        <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="bg-gray-50 py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Featured Products
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Our most loved toys by pets across Bangladesh
                            </p>
                        </div>
                        <Link
                            href="/products"
                            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                            View All Products
                            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Why Choose PetToys BD
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            We&apos;re committed to providing the best for your pets
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-primary-200 hover:shadow-lg"
                            >
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                                    {feature.icon}
                                </div>
                                <h3 className="mt-6 text-lg font-semibold text-gray-900">{feature.title}</h3>
                                <p className="mt-2 text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Promotional Banner */}
            <section className="relative overflow-hidden bg-gray-900 py-20">
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80"
                        alt="Dogs playing"
                        fill
                        className="object-cover opacity-30"
                    />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            New Arrivals Every Week
                        </h2>
                        <p className="mt-4 text-lg text-gray-300">
                            Stay updated with the latest toys and accessories for your pets.
                            Subscribe to our newsletter and get 10% off your first order.
                        </p>
                        <form className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="rounded-lg border-0 bg-white/10 px-5 py-3 text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-80"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-gray-50 py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            What Our Customers Say
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Join thousands of happy pet parents across Bangladesh
                        </p>
                    </div>

                    <div className="mt-16 grid gap-8 md:grid-cols-3">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
                            >
                                {/* Rating */}
                                <div className="flex gap-1">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                {/* Quote */}
                                <p className="mt-6 text-gray-700 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                                {/* Author */}
                                <div className="mt-6 flex items-center gap-4">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500">{testimonial.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary-600 py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                        Ready to Make Your Pet Happy?
                    </h2>
                    <p className="mt-4 text-lg text-primary-100">
                        Join 5,000+ pet parents who trust PetToys BD for quality toys and accessories.
                    </p>
                    <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href="/products"
                            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-sm font-semibold text-primary-600 transition-all hover:bg-gray-100"
                        >
                            Start Shopping
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

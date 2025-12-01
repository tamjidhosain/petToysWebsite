import Link from 'next/link';

const footerLinks = {
    shop: [
        { label: 'All Products', href: '/products' },
        { label: 'Dog Toys', href: '/products?category=dogs' },
        { label: 'Cat Toys', href: '/products?category=cats' },
        { label: 'Bird Toys', href: '/products?category=birds' },
        { label: 'Small Animal Toys', href: '/products?category=small-animals' },
    ],
    company: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
    ],
    support: [
        { label: 'FAQ', href: '/faq' },
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Returns', href: '/returns' },
        { label: 'Track Order', href: '/track-order' },
    ],
    legal: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Refund Policy', href: '/refund-policy' },
    ],
};

const socialLinks = [
    { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
    { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
    { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Newsletter Section */}
            <div className="border-b border-gray-800">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
                        <div className="text-center lg:text-left">
                            <h3 className="text-xl font-bold text-white">Stay Updated! 🐾</h3>
                            <p className="mt-1 text-gray-400">
                                Subscribe for exclusive deals, new arrivals, and pet care tips.
                            </p>
                        </div>
                        <form className="flex w-full max-w-md gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl">🐾</span>
                            <span className="text-xl font-bold text-white">PetToys</span>
                            <span className="text-xl font-bold text-primary-400">BD</span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-400">
                            Bangladesh&apos;s trusted destination for premium pet toys and accessories.
                            Making pets happy since 2024.
                        </p>
                        <div className="mt-6 flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-primary-600 hover:text-white"
                                    aria-label={social.label}
                                >
                                    {social.icon === 'facebook' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5L14.17.5C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" />
                                        </svg>
                                    )}
                                    {social.icon === 'instagram' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12,2.16c3.2,0,3.58,0,4.85.07,3.25.15,4.77,1.69,4.92,4.92.06,1.27.07,1.65.07,4.85s0,3.58-.07,4.85c-.15,3.23-1.66,4.77-4.92,4.92-1.27.06-1.65.07-4.85.07s-3.58,0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s0-3.58.07-4.85C2.38,3.92,3.9,2.38,7.15,2.23,8.42,2.18,8.8,2.16,12,2.16ZM12,0C8.74,0,8.33,0,7.05.07c-4.35.2-6.78,2.62-7,7C0,8.33,0,8.74,0,12s0,3.67.07,4.95c.2,4.36,2.62,6.78,7,7C8.33,24,8.74,24,12,24s3.67,0,4.95-.07c4.35-.2,6.78-2.62,7-7C24,15.67,24,15.26,24,12s0-3.67-.07-4.95c-.2-4.35-2.62-6.78-7-7C15.67,0,15.26,0,12,0Zm0,5.84A6.16,6.16,0,1,0,18.16,12,6.16,6.16,0,0,0,12,5.84ZM12,16a4,4,0,1,1,4-4A4,4,0,0,1,12,16ZM18.41,4.15a1.44,1.44,0,1,0,1.44,1.44A1.44,1.44,0,0,0,18.41,4.15Z" />
                                        </svg>
                                    )}
                                    {social.icon === 'youtube' && (
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.5,6.19a3.02,3.02,0,0,0-2.12-2.14C19.5,3.5,12,3.5,12,3.5s-7.5,0-9.38.55A3.02,3.02,0,0,0,.5,6.19,31.36,31.36,0,0,0,0,12a31.36,31.36,0,0,0,.5,5.81,3.02,3.02,0,0,0,2.12,2.14c1.88.55,9.38.55,9.38.55s7.5,0,9.38-.55a3.02,3.02,0,0,0,2.12-2.14A31.36,31.36,0,0,0,24,12,31.36,31.36,0,0,0,23.5,6.19ZM9.54,15.57V8.43L15.82,12Z" />
                                        </svg>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 className="font-semibold text-white">Shop</h4>
                        <ul className="mt-4 space-y-2">
                            {footerLinks.shop.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-semibold text-white">Company</h4>
                        <ul className="mt-4 space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="font-semibold text-white">Support</h4>
                        <ul className="mt-4 space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-semibold text-white">Contact Us</h4>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="mt-0.5">📍</span>
                                <span className="text-gray-400">
                                    House 42, Road 11, Banani<br />
                                    Dhaka 1213, Bangladesh
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span>📞</span>
                                <a href="tel:+8801700000000" className="text-gray-400 hover:text-white">
                                    +880 1700-000000
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <span>✉️</span>
                                <a href="mailto:hello@pettoysbd.com" className="text-gray-400 hover:text-white">
                                    hello@pettoysbd.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="mt-12 border-t border-gray-800 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <p className="text-sm text-gray-400">
                            We accept: bKash • Nagad • Visa • Mastercard • Cash on Delivery
                        </p>
                        <div className="flex gap-2">
                            <span className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">bKash</span>
                            <span className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">Nagad</span>
                            <span className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">Visa</span>
                            <span className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">COD</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 bg-gray-950">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-gray-500 md:flex-row">
                        <p>© 2024 PetToys BD. All rights reserved.</p>
                        <div className="flex gap-4">
                            {footerLinks.legal.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="transition-colors hover:text-gray-300"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

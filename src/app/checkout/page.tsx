'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { SHIPPING_COST_DHAKA, SHIPPING_COST_OUTSIDE_DHAKA, TAX_RATE } from '@/lib/constants';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, totalItems, refreshCart } = useCart();

    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD'); // Default to Cash on Delivery
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);

    // New Address Form State
    const [newAddress, setNewAddress] = useState({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        district: '',
        division: 'Dhaka',
        postalCode: '',
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await fetch('/api/user/addresses');
            const data = await res.json();
            if (data.success) {
                setAddresses(data.data);
                // Select default address if available
                const defaultAddr = data.data.find((a: any) => a.isDefault);
                if (defaultAddr) setSelectedAddressId(defaultAddr.id);
                else if (data.data.length > 0) setSelectedAddressId(data.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAddresses();
                setSelectedAddressId(data.data.id);
                setShowAddressForm(false);
                // Reset form
                setNewAddress({
                    fullName: '',
                    phone: '',
                    street: '',
                    city: '',
                    district: '',
                    division: 'Dhaka',
                    postalCode: '',
                });
            }
        } catch (error) {
            console.error('Failed to add address:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    addressId: selectedAddressId,
                    paymentMethod,
                }),
            });

            const data = await res.json();

            if (data.success) {
                await refreshCart(); // Clear cart in context
                router.push(`/orders/${data.data.id}/success`);
            } else {
                alert(data.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Order placement error:', error);
            alert('An error occurred while placing the order');
        } finally {
            setProcessing(false);
        }
    };

    // Calculate totals based on selected address
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    const isDhaka = selectedAddress?.city.toLowerCase().includes('dhaka') ||
        selectedAddress?.division.toLowerCase().includes('dhaka');
    const shippingCost = isDhaka ? SHIPPING_COST_DHAKA : SHIPPING_COST_OUTSIDE_DHAKA;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax + shippingCost;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (items.length === 0) {
        router.push('/cart');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Address & Payment */}
                    <div className="space-y-8 lg:col-span-8">

                        {/* Shipping Address Section */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                                <button
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                                >
                                    {showAddressForm ? 'Cancel' : '+ Add New Address'}
                                </button>
                            </div>

                            {showAddressForm ? (
                                <form onSubmit={handleAddAddress} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.fullName}
                                                onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                                            <input
                                                type="tel"
                                                required
                                                value={newAddress.phone}
                                                onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={newAddress.street}
                                            onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">City</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.city}
                                                onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.postalCode}
                                                onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">District</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAddress.district}
                                                onChange={e => setNewAddress({ ...newAddress, district: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Division</label>
                                            <select
                                                value={newAddress.division}
                                                onChange={e => setNewAddress({ ...newAddress, division: e.target.value })}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                            >
                                                <option value="Dhaka">Dhaka</option>
                                                <option value="Chittagong">Chittagong</option>
                                                <option value="Sylhet">Sylhet</option>
                                                <option value="Khulna">Khulna</option>
                                                <option value="Rajshahi">Rajshahi</option>
                                                <option value="Barisal">Barisal</option>
                                                <option value="Rangpur">Rangpur</option>
                                                <option value="Mymensingh">Mymensingh</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save Address'}
                                    </button>
                                </form>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => setSelectedAddressId(addr.id)}
                                            className={`cursor-pointer rounded-lg border p-4 transition ${selectedAddressId === addr.id
                                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-900">{addr.fullName}</span>
                                                {addr.isDefault && (
                                                    <span className="text-xs text-primary-600">Default</span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600">{addr.phone}</p>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {addr.street}, {addr.city}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {addr.district}, {addr.division} - {addr.postalCode}
                                            </p>
                                        </div>
                                    ))}
                                    {addresses.length === 0 && (
                                        <div className="col-span-2 py-4 text-center text-gray-500">
                                            No addresses found. Please add one.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Method Section */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">Payment Method</h2>
                            <div className="space-y-4">
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div>
                                        <span className="block font-medium text-gray-900">Cash on Delivery</span>
                                        <span className="block text-sm text-gray-500">Pay when you receive your order</span>
                                    </div>
                                </label>

                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="SSLCOMMERZ"
                                        checked={paymentMethod === 'SSLCOMMERZ'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div>
                                        <span className="block font-medium text-gray-900">Online Payment</span>
                                        <span className="block text-sm text-gray-500">Pay securely with Card, bKash, or Nagad</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-8 rounded-lg bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-medium text-gray-900">Order Summary</h2>

                            <div className="mb-4 max-h-60 overflow-y-auto space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {item.quantity}x {item.product.name}
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {formatPrice((item.variant ? item.product.price + item.variant.priceModifier : item.product.price) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 border-t border-gray-200 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium text-gray-900">
                                        {selectedAddressId ? formatPrice(shippingCost) : 'Select address'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax (15%)</span>
                                    <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-4">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-primary-600">
                                        {selectedAddressId ? formatPrice(total) : formatPrice(subtotal + tax)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={processing || !selectedAddressId}
                                className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

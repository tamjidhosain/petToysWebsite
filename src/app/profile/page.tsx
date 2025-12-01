'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (session?.user) {
            setFormData({
                name: session.user.name || '',
                email: session.user.email || '',
                phone: (session.user as any).phone || '',
            });
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                await update(); // Update session
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
                Profile Settings
            </h2>

            {message.text && (
                <div
                    className={`mb-6 rounded-lg p-4 ${message.type === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Full Name
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Email Address
                    </label>
                    <input
                        type="email"
                        disabled
                        value={formData.email}
                        className="mt-1 block w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Email address cannot be changed
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}

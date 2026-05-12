'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';

export default function FarmerCreateProduct() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: '',
        price: '',
        description: '',
        image_url: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: authData } = await supabase.auth.getUser();
            const authUser = authData?.user;

            if (authUser?.email) {
                const { data: userRow } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .eq('email', authUser.email.toLowerCase())
                    .maybeSingle();

                if (userRow) setProfile(userRow);
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name || !formData.category || !formData.quantity || !formData.price) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const { error: insertError } = await supabase.from('products').insert({
                farmer_id: profile.id,
                name: formData.name,
                category: formData.category,
                quantity: parseInt(formData.quantity),
                price: parseFloat(formData.price),
                description: formData.description,
                image_url: formData.image_url,
                location: profile?.location || 'Not specified', // Use location from profile
            });

            if (insertError) throw insertError;

            setSuccess('Product created successfully!');
            setTimeout(() => {
                router.push('/farmer/products');
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabsConfig = [
        { name: 'home', href: '/farmer', icon: '🏠', label: 'Home' },
        { name: 'products', href: '/farmer/products', icon: '🧺', label: 'Products' },
        { name: 'create', href: '/farmer/create', icon: '➕', label: 'Create' },
        { name: 'orders', href: '/farmer/orders', icon: '🛒', label: 'Orders' },
        { name: 'chat', href: '/farmer/chat', icon: '💬', label: 'Chat' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="farmer" userName={profile?.full_name} />

            <main className="max-w-2xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-6">Create New Product</h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                placeholder="e.g., Wheat"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Select Category</option>
                                <option value="Cereals">Cereals</option>
                                <option value="Vegetables">Vegetables</option>
                                <option value="Fruits">Fruits</option>
                                <option value="Legumes">Legumes</option>
                                <option value="Dairy">Dairy</option>
                                <option value="Livestock">Livestock</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB) *</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input-field"
                                placeholder="Describe your product..."
                                rows={4}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                className="input-field"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-primary btn-primary-farmer disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Product'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 btn-primary bg-gray-500 text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}

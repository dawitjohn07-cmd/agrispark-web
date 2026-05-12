'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import { formatMoney, resolveImageUrl } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    location: string;
    image_url: string;
    resolved_image_url: string;
}

export default function FarmerProducts() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data: authData } = await supabase.auth.getUser();
                const authUser = authData?.user;

                if (!authUser?.email) throw new Error('Not authenticated');

                const { data: userRow } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .eq('email', authUser.email.toLowerCase())
                    .maybeSingle();

                if (!userRow) throw new Error('User profile not found');

                setProfile(userRow);

                const { data: productRows, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('farmer_id', userRow.id)
                    .order('created_at', { ascending: false });

                if (productError) throw productError;

                const productsWithImages = await Promise.all(
                    (productRows || []).map(async (p) => ({
                        ...p,
                        resolved_image_url: resolveImageUrl(p.image_url),
                    }))
                );

                setProducts(productsWithImages);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (deleteError) throw deleteError;

            setProducts(products.filter((p) => p.id !== productId));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const tabsConfig = [
        { name: 'home', href: '/farmer', icon: '🏠', label: 'Home' },
        { name: 'products', href: '/farmer/products', icon: '🧺', label: 'Products' },
        { name: 'create', href: '/farmer/create', icon: '➕', label: 'Create' },
        { name: 'orders', href: '/farmer/orders', icon: '🛒', label: 'Orders' },
        { name: 'chat', href: '/farmer/chat', icon: '💬', label: 'Chat' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header role="farmer" userName={profile?.full_name} />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-farmer-green h-12 w-12 mb-4 mx-auto"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="farmer" userName={profile?.full_name} />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">My Products</h1>
                    <button
                        onClick={() => router.push('/farmer/create')}
                        className="btn-primary btn-primary-farmer"
                    >
                        + Create Product
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center">
                        <p className="text-gray-500 mb-4">No products yet</p>
                        <button
                            onClick={() => router.push('/farmer/create')}
                            className="btn-primary btn-primary-farmer"
                        >
                            Create Your First Product
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                            >
                                {product.resolved_image_url && (
                                    <img
                                        src={product.resolved_image_url}
                                        alt={product.name}
                                        className="w-full h-40 object-cover"
                                    />
                                )}
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                    <div className="mb-4">
                                        <p className="text-lg font-bold text-farmer-green">{formatMoney(product.price)}</p>
                                        <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/farmer/products/${product.id}`)}
                                            className="flex-1 bg-farmer-green text-white py-2 rounded hover:bg-opacity-90"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-opacity-90"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

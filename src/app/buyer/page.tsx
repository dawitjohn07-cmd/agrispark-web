'use client';

import { useEffect, useState, useCallback } from 'react';
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
    farmer_id: string;
}

export default function BuyerHome() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [error, setError] = useState('');

    const categories = ['All', 'Cereals', 'Vegetables', 'Fruits', 'Legumes', 'Dairy', 'Livestock'];

    const fetchProducts = useCallback(async () => {
        try {
            // Fetch all products (public, no auth required)
            const { data: productRows, error: productError } = await supabase
                .from('products')
                .select('*')
                .gt('quantity', 0)
                .order('created_at', { ascending: false });

            if (productError) throw productError;

            const productsWithImages = await Promise.all(
                (productRows || []).map(async (p) => ({
                    ...p,
                    resolved_image_url: resolveImageUrl(p.image_url),
                }))
            );

            setProducts(productsWithImages);
            setFilteredProducts(productsWithImages);

            // Optionally fetch authenticated buyer profile
            try {
                const { data: authData } = await supabase.auth.getUser();
                const authUser = authData?.user;

                if (authUser?.email) {
                    const { data: userRow } = await supabase
                        .from('users')
                        .select('id, full_name')
                        .eq('email', authUser.email.toLowerCase())
                        .maybeSingle();

                    if (userRow) {
                        setProfile(userRow);
                    }
                }
            } catch (authErr) {
                // Silently fail auth check - products load anyway
                console.log('Auth check failed:', authErr);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Filter products by category
    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter((p) => p.category === selectedCategory));
        }
    }, [selectedCategory, products]);

    const tabsConfig = [
        { name: 'home', href: '/buyer', icon: '🏠', label: 'Home' },
        { name: 'orders', href: '/buyer/orders', icon: '🛒', label: 'Orders' },
        { name: 'chat', href: '/buyer/chat', icon: '💬', label: 'Chat' },
        { name: 'profile', href: '/buyer/profile', icon: '👤', label: 'Profile' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header role="buyer" userName={profile?.full_name} />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-buyer-blue h-12 w-12 mb-4 mx-auto"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="buyer" userName={profile?.full_name} />

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-buyer-blue to-blue-600 text-white rounded-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Guest'}!</h1>
                    <p className="text-blue-100 mt-2">Discover fresh produce from local farmers</p>
                </div>

                {/* Category Filter */}
                <div className="mb-6 overflow-x-auto pb-2">
                    <div className="flex gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-buyer-blue text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-buyer-blue'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full bg-white rounded-lg p-8 text-center">
                            <p className="text-gray-500">No products available in this category</p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => router.push(`/buyer/product/${product.id}`)}
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
                                    <p className="text-xs text-gray-400 mb-3">📍 {product.location}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-buyer-blue">{formatMoney(product.price)}</span>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            Stock: {product.quantity}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/buyer/product/${product.id}`);
                                        }}
                                        className="w-full mt-3 bg-buyer-blue text-white py-2 rounded hover:bg-opacity-90 transition-all"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

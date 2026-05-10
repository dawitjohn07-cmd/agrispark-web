'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    description: string;
    image_url: string;
    resolved_image_url: string;
    farmer_id: string;
    created_at: string;
}

interface Farmer {
    id: string;
    full_name: string;
    phone_number: string;
    location: string;
}

export default function ProductDetail() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [farmer, setFarmer] = useState<Farmer | null>(null);
    const [buyerProfile, setBuyerProfile] = useState<any>(null);
    const [orderQuantity, setOrderQuantity] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get authenticated user
                const { data: authData } = await supabase.auth.getUser();
                if (!authData?.user) {
                    router.push('/login');
                    return;
                }

                // Get buyer profile
                const { data: buyerData } = await supabase
                    .from('users')
                    .select('id, full_name, role')
                    .eq('email', authData.user.email!.toLowerCase())
                    .single();

                if (buyerData?.role !== 'buyer') {
                    router.push('/farmer');
                    return;
                }

                setBuyerProfile(buyerData);

                // Fetch product
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (productError) throw new Error('Product not found');
                if (!productData) throw new Error('Product not found');

                const resolvedProduct = {
                    ...productData,
                    resolved_image_url: resolveImageUrl(productData.image_url),
                };
                setProduct(resolvedProduct);

                // Fetch farmer
                const { data: farmerData } = await supabase
                    .from('users')
                    .select('id, full_name, phone_number, location')
                    .eq('id', productData.farmer_id)
                    .single();

                setFarmer(farmerData);
            } catch (err: any) {
                setError(err.message || 'Error loading product');
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchData();
    }, [productId, router]);

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!product || !buyerProfile) {
            setError('Product or buyer information not found');
            return;
        }

        const qty = parseInt(orderQuantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        if (qty > product.quantity) {
            setError(`Only ${product.quantity} units available`);
            return;
        }

        setIsSubmitting(true);

        try {
            const totalPrice = qty * product.price;

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    product_id: product.id,
                    buyer_id: buyerProfile.id,
                    quantity: qty,
                    total_price: totalPrice,
                    status: 'pending',
                })
                .select()
                .single();

            if (orderError) throw orderError;

            setSuccess('Order placed successfully!');
            setTimeout(() => {
                router.push('/buyer/orders');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to place order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header role="buyer" userName={buyerProfile?.full_name} />
                <div className="flex items-center justify-center py-20">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!product || !farmer) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header role="buyer" userName={buyerProfile?.full_name} />
                <main className="max-w-4xl mx-auto px-4 py-6">
                    <div className="text-center py-12">
                        <p className="text-red-600 text-lg">{error || 'Product not found'}</p>
                        <button
                            onClick={() => router.push('/buyer')}
                            className="mt-4 px-6 py-2 bg-buyer-blue text-white rounded-lg hover:bg-opacity-90"
                        >
                            Back to Products
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="buyer" userName={buyerProfile?.full_name} />

            <main className="max-w-4xl mx-auto px-4 py-6">
                <button
                    onClick={() => router.push('/buyer')}
                    className="mb-6 text-buyer-blue hover:underline"
                >
                    ← Back to Products
                </button>

                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <div className="grid md:grid-cols-2 gap-8 p-8">
                        {/* Product Image */}
                        <div>
                            {product.resolved_image_url ? (
                                <img
                                    src={product.resolved_image_url}
                                    alt={product.name}
                                    className="w-full h-96 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <p className="text-gray-400">No image available</p>
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-col justify-between">
                            <div>
                                <div className="mb-4">
                                    <span className="inline-block px-3 py-1 bg-buyer-blue text-white rounded-full text-sm font-semibold">
                                        {product.category}
                                    </span>
                                </div>

                                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                                <p className="text-gray-600 mb-6">{product.description}</p>

                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">Price per unit:</span>
                                        <span className="text-2xl font-bold text-farmer-green">
                                            {formatMoney(product.price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">Available quantity:</span>
                                        <span className="text-xl font-semibold">
                                            {product.quantity} units
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">Location:</span>
                                        <span className="font-semibold">{product.location}</span>
                                    </div>
                                </div>

                                {/* Farmer Info */}
                                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                    <h3 className="font-bold text-gray-900 mb-2">Farmer Information</h3>
                                    <p className="text-sm text-gray-700 mb-1">
                                        <strong>Name:</strong> {farmer.full_name}
                                    </p>
                                    <p className="text-sm text-gray-700 mb-1">
                                        <strong>Location:</strong> {farmer.location}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <strong>Phone:</strong> {farmer.phone_number}
                                    </p>
                                </div>
                            </div>

                            {/* Order Form */}
                            <form onSubmit={handlePlaceOrder} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                        {success}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity (units)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={product.quantity}
                                        value={orderQuantity}
                                        onChange={(e) => setOrderQuantity(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-buyer-blue focus:border-transparent"
                                    />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600">Total Price:</span>
                                        <span className="text-2xl font-bold text-farmer-green">
                                            {formatMoney(parseInt(orderQuantity || '0') * product.price)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-buyer-blue text-white font-bold rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all"
                                >
                                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

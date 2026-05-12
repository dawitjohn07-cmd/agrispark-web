'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import { formatMoney } from '@/lib/utils';

interface Order {
    id: string;
    product_id: string;
    buyer_id: string;
    quantity: number;
    total_price: number;
    status: string;
    created_at: string;
    products?: { name: string; price: number };
}

export default function FarmerOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const { data: authData } = await supabase.auth.getUser();
            const authUser = authData?.user;

            if (!authUser?.email) throw new Error('Not authenticated');

            const { data: userRow } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('email', authUser.email.toLowerCase())
                .maybeSingle();

            if (!userRow) throw new Error('User not found');
            setProfile(userRow);

            // Get farmer's products
            const { data: products } = await supabase
                .from('products')
                .select('id')
                .eq('farmer_id', userRow.id);

            if (products && products.length > 0) {
                const productIds = products.map((p) => p.id);

                const { data: orderRows } = await supabase
                    .from('orders')
                    .select('*, products(name, price)')
                    .in('product_id', productIds)
                    .order('created_at', { ascending: false });

                setOrders(orderRows || []);
            }
        } catch (err: any) {
            console.error('Error fetching orders:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOrderAction = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);

        try {
            const order = orders.find((o) => o.id === orderId);
            if (!order) throw new Error('Order not found');

            // If accepting, reduce product quantity
            if (newStatus === 'accepted') {
                const { data: product } = await supabase
                    .from('products')
                    .select('quantity')
                    .eq('id', order.product_id)
                    .single();

                if (product && product.quantity >= order.quantity) {
                    await supabase
                        .from('products')
                        .update({ quantity: product.quantity - order.quantity })
                        .eq('id', order.product_id);
                } else {
                    throw new Error('Insufficient stock');
                }
            }

            // Update order status
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // Refresh orders
            await fetchOrders();
        } catch (err: any) {
            console.error('Error updating order:', err.message);
            alert('Error: ' + (err.message || 'Failed to update order'));
        } finally {
            setUpdatingId(null);
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
                    <p className="text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="farmer" userName={profile?.full_name} />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-6">Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center">
                        <p className="text-gray-500">No orders yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        <table className="w-full">
                            <thead className="bg-farmer-green text-white">
                                <tr>
                                    <th className="px-6 py-3 text-left">Order ID</th>
                                    <th className="px-6 py-3 text-left">Product</th>
                                    <th className="px-6 py-3 text-center">Quantity</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-left">Date</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-mono">{order.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">{order.products?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-center">{order.quantity}</td>
                                        <td className="px-6 py-4 text-right font-bold text-farmer-green">
                                            {formatMoney(order.total_price)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {order.status === 'pending' && (
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleOrderAction(order.id, 'accepted')}
                                                        disabled={updatingId === order.id}
                                                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleOrderAction(order.id, 'rejected')}
                                                        disabled={updatingId === order.id}
                                                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

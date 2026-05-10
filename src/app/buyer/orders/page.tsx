'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import { formatMoney } from '@/lib/utils';

interface Order {
    id: string;
    product_id: string;
    quantity: number;
    total_price: number;
    status: string;
    created_at: string;
    products?: { name: string; price: number };
}

export default function BuyerOrders() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

                const { data: orderRows } = await supabase
                    .from('orders')
                    .select('*, products(name, price)')
                    .eq('buyer_id', userRow.id)
                    .order('created_at', { ascending: false });

                setOrders(orderRows || []);
            } catch (err: any) {
                console.error('Error fetching orders:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

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
                    <p className="text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="buyer" userName={profile?.full_name} />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-6">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center">
                        <p className="text-gray-500">No orders yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        <table className="w-full">
                            <thead className="bg-buyer-blue text-white">
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
                                        <td className="px-6 py-4 text-right font-bold text-buyer-blue">
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
                                            <button
                                                onClick={() => router.push(`/chat/${order.id}`)}
                                                className="px-3 py-1 bg-buyer-blue text-white text-xs rounded hover:bg-opacity-90"
                                            >
                                                Chat
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <TabBar tabs={tabsConfig} role="buyer" />
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

interface Analytics {
    totalFarmers: number;
    totalBuyers: number;
    totalProducts: number;
    totalOrders: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [adminProfile, setAdminProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            try {
                // Check if admin
                const { data: authData } = await supabase.auth.getUser();
                if (!authData?.user) {
                    router.push('/login');
                    return;
                }

                const { data: userData } = await supabase
                    .from('users')
                    .select('id, full_name, role')
                    .eq('id', authData.user.id)
                    .single();

                if (userData?.role !== 'admin') {
                    router.push(userData?.role === 'farmer' ? '/farmer' : '/buyer');
                    return;
                }

                setAdminProfile(userData);

                // Fetch users
                const { data: usersData } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                setUsers(usersData || []);

                // Fetch analytics
                const { count: farmerCount } = await supabase
                    .from('users')
                    .select('id', { count: 'exact' })
                    .eq('role', 'farmer');

                const { count: buyerCount } = await supabase
                    .from('users')
                    .select('id', { count: 'exact' })
                    .eq('role', 'buyer');

                const { count: productCount } = await supabase
                    .from('products')
                    .select('id', { count: 'exact' });

                const { count: orderCount } = await supabase
                    .from('orders')
                    .select('id', { count: 'exact' });

                setAnalytics({
                    totalFarmers: farmerCount || 0,
                    totalBuyers: buyerCount || 0,
                    totalProducts: productCount || 0,
                    totalOrders: orderCount || 0,
                });
            } catch (err: any) {
                setError('Error loading admin dashboard');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkAdminAndFetch();
    }, [router]);

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        setDeletingId(userId);

        try {
            const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (deleteError) throw deleteError;

            setUsers(users.filter((u) => u.id !== userId));
        } catch (err: any) {
            setError('Failed to delete user: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
        );
    }

    if (!adminProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Access denied. Admin only.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-farmer-green text-white rounded-lg"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">AgriSpark Admin</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Welcome, {adminProfile?.full_name}</span>
                        <button
                            onClick={() => {
                                supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 flex gap-8">
                    {['overview', 'users', 'products', 'orders'].map((tabName) => (
                        <button
                            key={tabName}
                            onClick={() => setTab(tabName)}
                            className={`py-3 px-2 border-b-2 font-medium capitalize transition-all ${tab === tabName
                                ? 'border-farmer-green text-farmer-green'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tabName}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                        <button onClick={() => setError('')} className="ml-4 text-red-600 hover:text-red-800">
                            ✕
                        </button>
                    </div>
                )}

                {/* Overview Tab */}
                {tab === 'overview' && analytics && (
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Farmers', value: analytics.totalFarmers, color: 'green' },
                            { label: 'Total Buyers', value: analytics.totalBuyers, color: 'blue' },
                            { label: 'Total Products', value: analytics.totalProducts, color: 'purple' },
                            { label: 'Total Orders', value: analytics.totalOrders, color: 'orange' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className={`bg-${stat.color}-50 border-2 border-${stat.color}-200 rounded-lg p-6 text-center`}
                            >
                                <p className={`text-gray-600 text-sm font-medium mb-2`}>{stat.label}</p>
                                <p className={`text-4xl font-bold text-${stat.color}-700`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Users Tab */}
                {tab === 'users' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-xl font-bold">User Management</h2>
                            <p className="text-sm text-gray-600 mt-1">Total Users: {users.length}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Full Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                                        <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm">{user.email}</td>
                                            <td className="px-6 py-4 text-sm">{user.full_name}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'farmer'
                                                    ? 'bg-green-100 text-green-800'
                                                    : user.role === 'buyer'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={deletingId === user.id || user.id === adminProfile.id}
                                                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Products Tab */}
                {tab === 'products' && (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-gray-600">Product monitoring feature coming soon</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Total Products: {analytics?.totalProducts}
                        </p>
                    </div>
                )}

                {/* Orders Tab */}
                {tab === 'orders' && (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <p className="text-gray-600">Order monitoring feature coming soon</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Total Orders: {analytics?.totalOrders}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

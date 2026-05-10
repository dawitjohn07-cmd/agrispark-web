'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Home() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session as any);
            setLoading(false);

            // Auto redirect if already logged in based on role
            if (session) {
                const fetchRole = async () => {
                    const { data } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    const role = data?.role || 'buyer';
                    if (role === 'farmer') {
                        router.push('/farmer');
                    } else if (role === 'admin') {
                        router.push('/admin');
                    } else {
                        router.push('/buyer');
                    }
                };
                fetchRole();
            }
        });
    }, [router]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
                <div className="text-center">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-farmer-green h-12 w-12 mb-4 mx-auto"></div>
                    <h2 className="text-gray-600">Loading...</h2>
                </div>
            </div>
        );
    }

    if (session) return null; // Will redirect

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            {/* Navigation */}
            <nav className="sticky top-0 bg-white shadow-sm z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-farmer-green to-buyer-blue bg-clip-text text-transparent">
                        🌾 AgriSpark
                    </h1>
                    <div className="flex gap-4">
                        <Link
                            href="/login"
                            className="px-6 py-2 text-farmer-green font-semibold border-2 border-farmer-green rounded-lg hover:bg-farmer-light transition-all"
                        >
                            Login
                        </Link>
                        <Link
                            href="/login"
                            className="px-6 py-2 bg-farmer-green text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                    Direct Connection Between
                    <br />
                    <span className="bg-gradient-to-r from-farmer-green to-buyer-blue bg-clip-text text-transparent">
                        Farmers & Buyers
                    </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    AgriSpark eliminates middlemen and enables direct transactions between farmers and bulk buyers,
                    ensuring fair pricing and fresh produce.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-farmer-green text-white font-bold rounded-lg hover:shadow-lg transition-all text-lg"
                    >
                        Get Started
                    </Link>
                    <button
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-white text-farmer-green font-bold border-2 border-farmer-green rounded-lg hover:bg-farmer-light transition-all text-lg"
                    >
                        Learn More
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-7xl mx-auto px-4 py-20">
                <h3 className="text-4xl font-bold text-center mb-12">Why AgriSpark?</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: '🚀',
                            title: 'Direct Connection',
                            desc: 'Connect directly with farmers or buyers without intermediaries',
                        },
                        {
                            icon: '💰',
                            title: 'Fair Pricing',
                            desc: 'Competitive prices by eliminating unnecessary middlemen',
                        },
                        {
                            icon: '🌱',
                            title: 'Fresh Produce',
                            desc: 'Access to the freshest farm products from trusted sources',
                        },
                        {
                            icon: '📊',
                            title: 'Real-time Orders',
                            desc: 'Track orders and inventory in real-time',
                        },
                        {
                            icon: '🛡️',
                            title: 'Secure Transactions',
                            desc: 'Safe and verified transactions with trusted partners',
                        },
                        {
                            icon: '💬',
                            title: 'Direct Communication',
                            desc: 'Chat directly with farmers to discuss products and prices',
                        },
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-all">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                            <p className="text-gray-600">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="max-w-7xl mx-auto px-4 py-20">
                <h3 className="text-4xl font-bold text-center mb-12">How It Works</h3>
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <h4 className="text-2xl font-bold text-farmer-green">For Farmers 🌾</h4>
                        {[
                            'Create an account and set up your farm profile',
                            'List your products with prices and quantities',
                            'Receive orders from bulk buyers',
                            'Chat with buyers to negotiate deals',
                            'Track all transactions and payments',
                        ].map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-farmer-green text-white font-bold">
                                        {idx + 1}
                                    </div>
                                </div>
                                <p className="text-gray-700 pt-1">{step}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-8">
                        <h4 className="text-2xl font-bold text-buyer-blue">For Buyers 🛒</h4>
                        {[
                            'Create an account as a bulk buyer',
                            'Browse products from verified farmers',
                            'Filter by category, price, and location',
                            'Place orders directly from farmers',
                            'Communicate with farmers about delivery and quality',
                        ].map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-buyer-blue text-white font-bold">
                                        {idx + 1}
                                    </div>
                                </div>
                                <p className="text-gray-700 pt-1">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-farmer-green to-buyer-blue text-white max-w-7xl mx-auto rounded-2xl my-20 p-12 text-center">
                <h3 className="text-4xl font-bold mb-4">Ready to Join AgriSpark?</h3>
                <p className="text-xl mb-8 opacity-90">Start trading directly with farmers or bulk buyers today</p>
                <Link
                    href="/login"
                    className="inline-block px-8 py-4 bg-white text-farmer-green font-bold rounded-lg hover:shadow-lg transition-all text-lg"
                >
                    Get Started Now →
                </Link>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        © 2024 AgriSpark. Connecting farmers and buyers for direct commerce.
                    </p>
                </div>
            </footer>
        </div>
    );
}

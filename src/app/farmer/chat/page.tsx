'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';

export default function FarmerChat() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

            setLoading(false);
        };

        fetchProfile();
    }, []);

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

            <main className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-6">Chat</h1>

                <div className="bg-white rounded-lg p-8 text-center shadow">
                    <p className="text-gray-500 mb-4">Chatbot integration coming soon...</p>
                    <p className="text-gray-400 text-sm">This section will include AI-powered assistance for farmers</p>
                </div>
            </main>

            <TabBar tabs={tabsConfig} role="farmer" />
        </div>
    );
}

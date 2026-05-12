'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';

export default function BuyerChat() {
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
        { name: 'home', href: '/buyer', icon: '🏠', label: 'Home' },
        { name: 'orders', href: '/buyer/orders', icon: '🛒', label: 'Orders' },
        { name: 'chat', href: '/buyer/chat', icon: '💬', label: 'Chat' },
        { name: 'profile', href: '/buyer/profile', icon: '👤', label: 'Profile' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="buyer" userName={profile?.full_name} />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-6">Chat with Farmers</h1>

                <div className="bg-white rounded-lg p-8 text-center shadow">
                    <p className="text-gray-500 mb-4">Direct messaging with farmers coming soon...</p>
                    <p className="text-gray-400 text-sm">Stay connected with your product suppliers</p>
                </div>
            </main>
        </div>
    );
}

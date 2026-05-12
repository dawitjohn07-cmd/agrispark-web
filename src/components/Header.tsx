'use client';

import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
    role?: 'farmer' | 'buyer';
    userName?: string;
}

export default function Header({ role = 'farmer', userName }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const bgColor = role === 'farmer' ? 'bg-farmer-green' : 'bg-buyer-blue';
    const accentColor = role === 'farmer' ? 'text-farmer-green' : 'text-buyer-blue';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className={`${bgColor} text-white shadow-md sticky top-0 z-50`}>
            <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href={role === 'farmer' ? '/farmer' : '/buyer'} className="text-2xl font-bold">
                    AgriSpark
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <span className="text-sm">Welcome, {userName || 'User'}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-farmer-green px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile: no hamburger (sidebar always visible) */}
            </nav>

            {/* no mobile menu: sidebar visible at all sizes */}
        </header>
    );
}

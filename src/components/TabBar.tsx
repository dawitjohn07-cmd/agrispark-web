'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getInitials } from '@/lib/utils';

interface TabsProps {
    role?: 'farmer' | 'buyer';
}

export default function TabBar({ role }: TabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null);
    const [sessionReady, setSessionReady] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    const publicRoutes = ['/', '/login', '/reset-password', '/reset-password-confirm', '/admin'];
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

    // derive role from pathname if not provided
    const derivedRole: 'farmer' | 'buyer' = role || (pathname?.startsWith('/buyer') ? 'buyer' : 'farmer');

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const { data: authData } = await supabase.auth.getUser();
                const authUser = authData?.user;
                if (!mounted) return;

                setHasSession(!!authUser?.id);

                if (!authUser?.id) return;

                const { data: userRow } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', authUser.id)
                    .maybeSingle();

                if (mounted && userRow?.full_name) setUserName(userRow.full_name);
            } catch (e) {
                // silent
            } finally {
                if (mounted) setSessionReady(true);
            }
        };
        load();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            setHasSession(!!session?.user?.id);
            setSessionReady(true);
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (!sessionReady || !hasSession || isPublicRoute) {
        return null;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const farmerLinks = [
        { icon: '🏠', label: 'Home', href: '/farmer' },
        { icon: '📦', label: 'Products', href: '/farmer/products' },
        { icon: '➕', label: 'Add Product', href: '/farmer/create' },
        { icon: '📋', label: 'Orders', href: '/farmer/orders' },
        { icon: '💬', label: 'Chat', href: '/farmer/chat' },
        { icon: '👤', label: 'Profile', href: '/farmer/profile' },
    ];

    const buyerLinks = [
        { icon: '🏠', label: 'Home', href: '/buyer' },
        { icon: '📋', label: 'My Orders', href: '/buyer/orders' },
        { icon: '💬', label: 'Chat', href: '/buyer/chat' },
        { icon: '👤', label: 'Profile', href: '/buyer/profile' },
    ];

    const links = derivedRole === 'farmer' ? farmerLinks : buyerLinks;

    return (
        <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex flex-col">
                <div className="text-2xl font-extrabold text-green-600">🌾 <span className="align-middle">AgriSpark</span></div>
                <div className="mt-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">{getInitials(userName || 'User')}</div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">{userName || 'User'}</div>
                        <div className="text-xs text-gray-500">{derivedRole === 'farmer' ? 'Farmer' : 'Buyer'}</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${active ? 'bg-green-600 text-white font-medium' : 'text-gray-600 hover:bg-green-50'}`}
                        >
                            <span className="text-xl" style={{ width: 20 }}>{link.icon}</span>
                            <span className="text-sm">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition">
                    <span className="text-xl">🔓</span>
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
}


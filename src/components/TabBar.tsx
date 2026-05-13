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
    const [userRole, setUserRole] = useState<'farmer' | 'buyer' | null>(null);
    const [sessionReady, setSessionReady] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    const publicRoutes = ['/', '/login', '/reset-password', '/reset-password-confirm', '/admin'];
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

    // derive role from explicit prop or authenticated user when available
    // do NOT infer role from the current pathname — that caused incorrect sidebar labels
    const derivedRole: 'farmer' | 'buyer' = (role as any) || (userRole as any) || 'buyer';

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
                    .select('full_name, role')
                    .eq('id', authUser.id)
                    .maybeSingle();

                if (mounted && userRow) {
                    if (userRow.full_name) setUserName(userRow.full_name);
                    if (userRow.role) setUserRole(userRow.role === 'farmer' ? 'farmer' : 'buyer');
                }
            } catch (e) {
                // silent
            } finally {
                if (mounted) setSessionReady(true);
            'use client';

            import Link from 'next/link';
            import { usePathname } from 'next/navigation';
            import { useEffect, useState } from 'react';
            import { supabase } from '@/lib/supabaseClient';
            import { getInitials } from '@/lib/utils';

            interface TabNavigation {
                name: string;
                href: string;
                icon: string;
                label: string;
            }

            interface TabsProps {
                tabs?: TabNavigation[];
                role?: 'farmer' | 'buyer';
            }

            export default function TabBar(_props: TabsProps) {
                const pathname = usePathname();
                const [userName, setUserName] = useState<string | null>(null);
                const [authRole, setAuthRole] = useState<'farmer' | 'buyer' | null>(null);
                const [sessionReady, setSessionReady] = useState(false);

                useEffect(() => {
                    let mounted = true;

                    const load = async () => {
                        try {
                            const { data: { user } } = await supabase.auth.getUser();

                            if (!mounted) return;

                            if (!user) {
                                setSessionReady(true);
                                return;
                            }

                            const { data: userRow } = await supabase
                                .from('users')
                                .select('full_name, role')
                                .eq('id', user.id)
                                .maybeSingle();

                            if (!mounted) return;

                            setUserName(userRow?.full_name || null);
                            setAuthRole((userRow?.role as 'farmer' | 'buyer') || 'buyer');
                        } catch (e) {
                            // silent
                        } finally {
                            if (mounted) setSessionReady(true);
                        }
                    };

                    load();

                    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                        if (!mounted) return;

                        if (!session?.user) {
                            setAuthRole(null);
                            setUserName(null);
                            setSessionReady(true);
                            return;
                        }

                        try {
                            const { data: userRow } = await supabase
                                .from('users')
                                .select('full_name, role')
                                .eq('id', session.user.id)
                                .maybeSingle();

                            if (!mounted) return;

                            setUserName(userRow?.full_name || null);
                            setAuthRole((userRow?.role as 'farmer' | 'buyer') || 'buyer');
                        } catch (e) {
                            // silent
                        } finally {
                            if (mounted) setSessionReady(true);
                        }
                    });

                    return () => {
                        mounted = false;
                        subscription?.unsubscribe();
                    };
                }, []);

                if (!sessionReady || !authRole) return null;

                const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

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

                const links = authRole === 'farmer' ? farmerLinks : buyerLinks;

                return (
                    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:relative md:shadow-none md:border-none md:bottom-auto md:flex md:gap-4 md:py-4 md:px-4">
                        <div className="flex md:flex-col justify-around md:justify-start items-center gap-0 md:gap-2">
                            {links.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-4 py-3 rounded-lg transition-all ${active
                                            ? 'bg-green-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-xl md:text-lg">{link.icon}</span>
                                        <span className="text-xs md:text-sm font-medium text-center md:text-left">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                );
            }
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

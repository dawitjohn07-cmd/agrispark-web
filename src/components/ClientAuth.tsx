'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ClientAuth() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const publicRoutes = ['/', '/login', '/reset-password', '/reset-password-confirm'];
        const isPublic = publicRoutes.includes(pathname);

        const check = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session && !isPublic) {
                    router.push('/login');
                    return;
                }

                if (session) {
                    // fetch role
                    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single();
                    const role = user?.role || 'buyer';

                    if (pathname.startsWith('/farmer') && role !== 'farmer') return router.push('/buyer');
                    if (pathname.startsWith('/buyer') && role !== 'buyer') return router.push('/farmer');
                    if (pathname.startsWith('/admin') && role !== 'admin') return router.push(role === 'farmer' ? '/farmer' : '/buyer');
                }
            } catch (err) {
                console.error('ClientAuth error', err);
            } finally {
                setLoading(false);
            }
        };

        check();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && !isPublic) router.push('/login');
        });

        return () => subscription?.unsubscribe();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="w-full h-24 flex items-center justify-center">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-farmer-green h-8 w-8 mx-auto" />
            </div>
        );
    }

    return null;
}

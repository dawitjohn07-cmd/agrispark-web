"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getInitials } from "@/lib/utils";

interface NavLink {
    icon: string;
    label: string;
    href: string;
}

export default function TabBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null);
    const [role, setRole] = useState<"farmer" | "buyer" | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!mounted) return;
                if (!user) {
                    setReady(true);
                    return;
                }

                const { data: userRow } = await supabase
                    .from("users")
                    .select("full_name, role")
                    .eq("id", user.id)
                    .maybeSingle();

                if (!mounted) return;
                setUserName(userRow?.full_name || null);
                setRole((userRow?.role as "farmer" | "buyer") || "buyer");
            } catch (e) {
                // silent
            } finally {
                if (mounted) setReady(true);
            }
        };

        load();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            if (!session?.user) {
                setRole(null);
                setUserName(null);
                setReady(true);
                return;
            }

            try {
                const { data: userRow } = await supabase
                    .from("users")
                    .select("full_name, role")
                    .eq("id", session.user.id)
                    .maybeSingle();


                if (!mounted) return;
                setUserName(userRow?.full_name || null);
                setRole((userRow?.role as "farmer" | "buyer") || "buyer");
            } catch (e) {
                // silent
            } finally {
                if (mounted) setReady(true);
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    if (!ready || !role) return null;

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

    const farmerLinks: NavLink[] = [
        { icon: "🏠", label: "Home", href: "/farmer" },
        { icon: "📦", label: "Products", href: "/farmer/products" },
        { icon: "➕", label: "Add Product", href: "/farmer/create" },
        { icon: "📋", label: "Orders", href: "/farmer/orders" },
        { icon: "💬", label: "Chat", href: "/farmer/chat" },
        { icon: "👤", label: "Profile", href: "/farmer/profile" },
    ];

    const buyerLinks: NavLink[] = [
        { icon: "🏠", label: "Home", href: "/buyer" },
        { icon: "📋", label: "My Orders", href: "/buyer/orders" },
        { icon: "💬", label: "Chat", href: "/buyer/chat" },
        { icon: "👤", label: "Profile", href: "/buyer/profile" },
    ];

    const links = role === "farmer" ? farmerLinks : buyerLinks;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex flex-col">
                <div className="text-2xl font-extrabold text-green-600">🌾 <span className="align-middle">AgriSpark</span></div>
                <div className="mt-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">{getInitials(userName || 'User')}</div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">{userName || 'User'}</div>
                        <div className="text-xs text-gray-500">{role === 'farmer' ? 'Farmer' : 'Buyer'}</div>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabNavigation {
    name: string;
    href: string;
    icon: string;
    label: string;
}

interface TabsProps {
    tabs: TabNavigation[];
    role?: 'farmer' | 'buyer';
}

export default function TabBar({ tabs, role = 'farmer' }: TabsProps) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
    const accentColor = role === 'farmer' ? '#0F9D58' : '#0E698C';
    const bgColor = role === 'farmer' ? 'bg-farmer-green' : 'bg-buyer-blue';

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:relative md:shadow-none md:border-none md:bottom-auto md:flex md:gap-4 md:py-4 md:px-4">
            <div className="flex md:flex-col justify-around md:justify-start items-center gap-0 md:gap-2">
                {tabs.map((tab) => {
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-4 py-3 rounded-lg transition-all ${active
                                ? `${bgColor} text-white`
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span className="text-xl md:text-lg">{tab.icon}</span>
                            <span className="text-xs md:text-sm font-medium text-center md:text-left">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

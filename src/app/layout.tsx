import '../styles/globals.css';
import TabBar from '@/components/TabBar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>AgriSpark - Connect Farmers & Buyers</title>
                <meta name="description" content="AgriSpark: Direct produce transactions between farmers and bulk buyers" />
            </head>
            <body className="bg-gray-50">
                <div className="flex h-screen">
                    <TabBar />
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}

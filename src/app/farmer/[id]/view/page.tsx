'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { formatMoney, getInitials, PROFILE_MEDIA_BUCKET, resolveImageUrl, resolvePublicStorageUrl } from '@/lib/utils';

interface FarmerProfile {
    id: string;
    full_name: string;
    role: string;
    location: string;
    phone_number: string;
    email: string;
    farm_name: string;
    avatar_url: string;
    cover_url: string;
    created_at: string;
}

interface FarmerProduct {
    id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    location: string;
    image_url: string;
    created_at: string;
}

export default function FarmerPublicViewPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState<FarmerProfile | null>(null);
    const [products, setProducts] = useState<FarmerProduct[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');

            try {
                console.log('Profile route id:', id);

                const { data: farmerRow, error: farmerError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (farmerError) throw farmerError;
                if (!farmerRow) {
                    setError('Farmer profile not found');
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                const { data: productRows, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('farmer_id', id)
                    .order('created_at', { ascending: false });

                if (productsError) throw productsError;

                setProfile(farmerRow as FarmerProfile);
                setProducts((productRows || []) as FarmerProduct[]);
            } catch (err: any) {
                setError(err?.message || 'Failed to load farmer profile');
            } finally {
                setLoading(false);
            }
        };

        if (id) load();
    }, [id]);

    const coverUrl = useMemo(() => resolvePublicStorageUrl(profile?.cover_url || '', PROFILE_MEDIA_BUCKET), [profile?.cover_url]);
    const avatarUrl = useMemo(() => resolvePublicStorageUrl(profile?.avatar_url || '', PROFILE_MEDIA_BUCKET), [profile?.avatar_url]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-green-600 h-12 w-12 mb-4 mx-auto"></div>
                    <p className="text-gray-600">Loading farmer profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-8">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-red-600 text-lg font-semibold">{error || 'Farmer profile not found'}</p>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-6 text-green-600 hover:text-green-800 font-medium"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <div className="max-w-6xl mx-auto px-4 pt-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-green-600 hover:text-green-800 font-medium"
                >
                    ← Back
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-4">
                <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                    <div className="relative">
                        {coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverUrl} alt="Farmer cover" className="w-full h-48 object-cover" />
                        ) : (
                            <div className="w-full h-48 bg-gradient-to-r from-green-600 to-green-700" />
                        )}

                        <div className="absolute -bottom-14 left-6">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatarUrl}
                                    alt={profile.full_name}
                                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-green-600 text-white flex items-center justify-center text-3xl font-bold">
                                    {getInitials(profile.full_name || profile.farm_name || 'F')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-16 px-6 pb-6 border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-800">{profile.full_name || profile.farm_name || 'Farmer'}</h1>
                        <p className="text-sm text-gray-500 mt-1">Farmer</p>
                        <p className="text-gray-600 mt-2">📍 {profile.location || 'Location not provided'}</p>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Farmer Information</h2>
                            <div className="space-y-3 text-sm">
                                <p className="text-gray-700"><span className="font-medium">📞 Phone:</span> {profile.phone_number || 'Not provided'}</p>
                                <p className="text-gray-700"><span className="font-medium">✉️ Email:</span> {profile.email || 'Not provided'}</p>
                                <p className="text-gray-700"><span className="font-medium">📍 Location:</span> {profile.location || 'Not provided'}</p>
                                <p className="text-gray-700"><span className="font-medium">🌾 Farm name:</span> {profile.farm_name || 'Not provided'}</p>
                                <p className="text-gray-700"><span className="font-medium">📅 Member since:</span> {new Date(profile.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Products by this Farmer</h2>

                            {products.length === 0 ? (
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-gray-500 text-center">
                                    No products listed yet
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {products.map((item) => (
                                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="h-36 bg-gray-100">
                                                {resolveImageUrl(item.image_url) ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={resolveImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                                                ) : null}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{formatMoney(item.price)}</p>
                                                <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => router.push(`/buyer/product/${item.id}`)}
                                                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition"
                                                >
                                                    View Product
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

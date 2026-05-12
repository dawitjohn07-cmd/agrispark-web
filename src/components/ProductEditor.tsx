'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import { formatMoney, resolveImageUrl } from '@/lib/utils';

interface ProductEditorProps {
    productId: string;
}

export default function ProductEditor({ productId }: ProductEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profile, setProfile] = useState<any>(null);
    const [product, setProduct] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const { data: authData } = await supabase.auth.getUser();
                const authUser = authData?.user;

                if (!authUser?.id) {
                    router.push('/login');
                    return;
                }

                const { data: userRow, error: userError } = await supabase
                    .from('users')
                    .select('id, full_name, role, location')
                    .eq('id', authUser.id)
                    .maybeSingle();

                if (userError) throw userError;
                if (!userRow || userRow.role !== 'farmer') {
                    throw new Error('Only farmer accounts can edit products.');
                }

                const { data: productRow, error: productError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .maybeSingle();

                if (productError) throw productError;
                if (!productRow) throw new Error('Product not found.');
                if (productRow.farmer_id !== userRow.id) throw new Error('You do not have permission to edit this product.');

                setProfile(userRow);
                setProduct(productRow);
                setPreviewUrl(resolveImageUrl(productRow.image_url || ''));
            } catch (err: any) {
                setError(err?.message || 'Could not load product.');
            } finally {
                setLoading(false);
            }
        };

        if (productId) load();
    }, [productId, router]);

    const updateField = (field: string, value: string) => {
        setProduct((current: any) => (current ? { ...current, [field]: value } : current));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!product?.id) return;
        if (!profile?.id) {
            throw new Error('Farmer profile is unavailable.');
        }

        setSaving(true);

        try {
            const payload = {
                name: product.name?.trim(),
                category: product.category?.trim(),
                quantity: Number(product.quantity),
                price: Number(product.price),
                description: product.description?.trim() || '',
                image_url: product.image_url?.trim() || '',
                location: product.location?.trim() || profile?.location || '',
            };

            if (!payload.name || !payload.category || !Number.isFinite(payload.quantity) || !Number.isFinite(payload.price)) {
                throw new Error('Please fill in the required fields.');
            }

            const { error: updateError } = await supabase
                .from('products')
                .update(payload)
                .eq('id', product.id)
                .eq('farmer_id', profile.id);

            if (updateError) throw updateError;

            setSuccess('Product updated successfully.');
            setTimeout(() => {
                router.push('/farmer/products');
            }, 900);
        } catch (err: any) {
            setError(err?.message || 'Failed to update product.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header role="farmer" userName={profile?.full_name} />
                <div className="flex items-center justify-center py-20">
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="farmer" userName={profile?.full_name} />

            <main className="mx-auto max-w-4xl px-4 py-6">
                <button onClick={() => router.back()} className="mb-6 text-farmer-green hover:underline">
                    ← Back to products
                </button>

                <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Edit Product</h1>
                            <p className="mt-1 text-sm text-slate-500">Update the existing listing and save the changes.</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                            {product?.category || 'Product'}
                        </span>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-4">
                            <Field label="Product name *" value={product?.name || ''} onChange={(value) => updateField('name', value)} />
                            <Field label="Category *" value={product?.category || ''} onChange={(value) => updateField('category', value)} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Quantity *" type="number" value={String(product?.quantity ?? '')} onChange={(value) => updateField('quantity', value)} />
                                <Field label="Price (ETB) *" type="number" value={String(product?.price ?? '')} onChange={(value) => updateField('price', value)} />
                            </div>
                            <Field label="Location" value={product?.location || ''} onChange={(value) => updateField('location', value)} />
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    value={product?.description || ''}
                                    onChange={(event) => updateField('description', event.target.value)}
                                    rows={6}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <Field
                                label="Image URL"
                                value={product?.image_url || ''}
                                onChange={(value) => {
                                    updateField('image_url', value);
                                    setPreviewUrl(resolveImageUrl(value));
                                }}
                            />
                        </div>

                        <aside className="space-y-4">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                <div className="h-56 bg-slate-200">
                                    {previewUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewUrl} alt={product?.name || 'Product preview'} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-slate-500">No image preview</div>
                                    )}
                                </div>
                                <div className="p-4 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">Preview</p>
                                    <p className="mt-1">{product?.name || 'Untitled product'}</p>
                                    <p className="mt-1">{formatMoney(product?.price || 0)}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                                <p className="font-semibold text-slate-900">Saved by</p>
                                <p className="mt-1">{profile?.full_name || 'Farmer'}</p>
                                <p className="mt-1">{profile?.location || 'Location not shared'}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-farmer-green px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {saving ? 'Saving changes...' : 'Save changes'}
                            </button>
                        </aside>
                    </form>
                </div>
            </main>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string; }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-emerald-500"
            />
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import { getInitials } from '@/lib/utils';

export default function BuyerProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        email: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: authData } = await supabase.auth.getUser();
                const authUser = authData?.user;

                if (!authUser?.email) throw new Error('Not authenticated');

                const { data: userRow } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', authUser.email.toLowerCase())
                    .maybeSingle();

                if (!userRow) throw new Error('Profile not found');

                setProfile(userRow);
                setFormData({
                    full_name: userRow.full_name || '',
                    phone_number: userRow.phone_number || '',
                    email: userRow.email || '',
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.full_name.trim()) {
            setError('Please enter your full name');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setSuccess('Profile updated successfully!');
            setProfile({ ...profile, ...formData });
            setEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabsConfig = [
        { name: 'home', href: '/buyer', icon: '🏠', label: 'Home' },
        { name: 'orders', href: '/buyer/orders', icon: '🛒', label: 'Orders' },
        { name: 'chat', href: '/buyer/chat', icon: '💬', label: 'Chat' },
        { name: 'profile', href: '/buyer/profile', icon: '👤', label: 'Profile' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header role="buyer" userName={profile?.full_name} />
                <div className="flex items-center justify-center py-20">
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header role="buyer" userName={profile?.full_name} />

            <main className="max-w-2xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        {success}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow p-6">
                    {/* Profile Avatar */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                        <div className="w-16 h-16 rounded-full bg-buyer-blue text-white flex items-center justify-center text-2xl font-bold">
                            {getInitials(profile?.full_name)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                            <p className="text-gray-600">{profile?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-buyer-light text-buyer-blue rounded-full text-sm font-semibold">
                                Buyer
                            </span>
                        </div>
                    </div>

                    {/* Edit Form */}
                    {editing ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="input-field"
                                    placeholder="+251..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="input-field bg-gray-100 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 btn-primary btn-primary-buyer disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="flex-1 btn-primary bg-gray-500 text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <p className="mt-1 text-gray-900">{profile?.full_name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-gray-900">{profile?.email}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <p className="mt-1 text-gray-900">{profile?.phone_number || 'Not provided'}</p>
                            </div>

                            <button
                                onClick={() => setEditing(true)}
                                className="btn-primary btn-primary-buyer"
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <TabBar tabs={tabsConfig} role="buyer" />
        </div>
    );
}

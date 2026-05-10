import { supabase } from './supabaseClient';

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
};

// Get user role from database
export const resolveUserRole = async (userId: string, fallbackRole?: string) => {
    const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    return data?.role || fallbackRole || 'buyer';
};

// Sync user profile to database
export const syncUserProfile = async (user: any) => {
    const meta = user.user_metadata || {};

    const profile = {
        id: user.id,
        full_name: meta.full_name || '',
        email: user.email,
        role: meta.role || 'buyer',
        phone_number: meta.phone_number || '',
        farm_name: meta.business_name || meta.farm_name || '',
        location: meta.location || '',
    };

    const { error } = await supabase
        .from('users')
        .upsert(profile, { onConflict: 'id' });

    if (error) {
        throw error;
    }
};

// Format money with ETB currency
export const formatMoney = (value: number | string): string => {
    return `ETB ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

// Get initials from name
export const getInitials = (name: string): string => {
    const value = String(name || '').trim();
    if (!value) return 'F';

    return value
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

// Resolve image URL from Supabase storage
export const resolveImageUrl = (value: string): string => {
    if (!value) return '';

    const v = value.trim();

    // If already full URL → return as is
    if (v.startsWith('http')) return v;

    // Clean path (remove leading slash + bucket name)
    const path = v.replace(/^\/|^product-images\//g, '');

    // Return public URL
    return supabase.storage
        .from('product-images')
        .getPublicUrl(path).data.publicUrl;
};

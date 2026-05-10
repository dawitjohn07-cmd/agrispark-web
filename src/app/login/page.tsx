'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { syncUserProfile, validateEmail } from '@/lib/utils';

const mapAuthError = (message: string) => {
    const lower = String(message || '').toLowerCase();

    if (lower.includes('email not confirmed')) {
        return 'Your email is not confirmed yet. Either confirm your email or disable Confirm email in Supabase Auth settings for development.';
    }

    if (lower.includes('invalid login credentials') || lower.includes('email not registered')) {
        return 'Invalid email or password. If you just signed up, verify email confirmation settings in Supabase.';
    }

    if (lower.includes('user already registered')) {
        return 'This email is already registered. Please sign in instead.';
    }

    return message || 'Authentication error occurred.';
};

export default function LoginRegister() {
    const router = useRouter();
    const [mode, setMode] = useState('login');
    const [role, setRole] = useState('farmer');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [location, setLocation] = useState('');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const ensureFreshAuthState = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const hasSession = !!sessionData?.session;

        if (!hasSession) return;

        const { data: authUserData, error: authUserError } = await supabase.auth.getUser();

        if (authUserError || !authUserData?.user) {
            await supabase.auth.signOut();
        }
    };

    useEffect(() => {
        ensureFreshAuthState();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!fullName.trim() || !registerEmail.trim() || !password) {
            setError('Please fill in all required fields');
            return;
        }

        if (!validateEmail(registerEmail)) {
            setError('Invalid email address');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const normalizedEmail = registerEmail.trim().toLowerCase();

        setIsSubmitting(true);

        try {
            // Sign up
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                        phone_number: phoneNumber,
                        farm_name: businessName,
                        location: location,
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (authData?.user) {
                try {
                    // Try to sync profile row immediately. If RLS blocks due email-confirmation mode,
                    // the DB trigger should still create users row once auth user is inserted.
                    await syncUserProfile({
                        id: authData.user.id,
                        email: authData.user.email,
                        user_metadata: {
                            full_name: fullName,
                            role: role,
                            phone_number: phoneNumber,
                            farm_name: businessName,
                            location: location,
                        },
                    });
                } catch (profileErr: any) {
                    console.warn('Profile sync warning:', profileErr?.message || profileErr);
                }

                if (!authData.session) {
                    // Try to sign in automatically (may fail if email confirmation is required)
                    try {
                        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                            email: normalizedEmail,
                            password: password,
                        });

                        if (!signInErr && signInData?.user) {
                            // Logged in automatically
                            setSuccess('Registration successful and signed in. Redirecting...');
                            const { data: userRow } = await supabase
                                .from('users')
                                .select('role')
                                .eq('id', signInData.user.id)
                                .maybeSingle();

                            const userRole = userRow?.role || 'buyer';
                            setTimeout(() => {
                                if (userRole === 'farmer') router.push('/farmer');
                                else router.push('/buyer');
                            }, 800);
                        } else {
                            setSuccess('Registration successful. Check your inbox to confirm email before login (or disable Confirm email in Supabase for development).');
                        }
                    } catch (err) {
                        setSuccess('Registration successful. Check your inbox to confirm email before login (or disable Confirm email in Supabase for development).');
                    }
                } else {
                    setSuccess('Registration successful! You can sign in now.');
                }
                setTimeout(() => {
                    setMode('login');
                }, 2000);
            }
        } catch (err: any) {
            setError(mapAuthError(err?.message || 'Registration failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!loginIdentifier.trim() || !password) {
            setError('Please enter email and password');
            return;
        }

        const normalizedEmail = loginIdentifier.trim().toLowerCase();

        setIsSubmitting(true);

        try {
            const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password,
            });

            if (loginError) throw loginError;

            if (authData?.user) {
                // Get user role
                const { data: userRow } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                const userRole = userRow?.role || 'buyer';

                // Redirect based on role
                if (userRole === 'farmer') {
                    router.push('/farmer');
                } else {
                    router.push('/buyer');
                }
            }
        } catch (err: any) {
            console.error('Login error', err);
            const msg = err?.message || (err && typeof err === 'object' ? JSON.stringify(err) : 'Login failed');
            setError(mapAuthError(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg">
                {/* Header */}
                <div className="bg-gradient-to-r from-farmer-green to-buyer-blue text-white p-8 text-center rounded-t-2xl">
                    <h1 className="text-3xl font-bold">AgriSpark</h1>
                    <p className="text-green-100 mt-2">Connect Farmers & Buyers</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Mode Toggle */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${mode === 'login'
                                ? 'bg-farmer-green text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${mode === 'register'
                                ? 'bg-farmer-green text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            {success}
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    placeholder="your@email.com"
                                    className="input-field border-farmer-green focus:ring-farmer-green"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field border-farmer-green focus:ring-farmer-green"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-500"
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <Link href="/reset-password" className="text-sm text-farmer-green hover:underline">
                                Forgot password?
                            </Link>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary btn-primary-farmer disabled:opacity-50"
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="farmer"
                                            checked={role === 'farmer'}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Farmer</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="buyer"
                                            checked={role === 'buyer'}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Buyer</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+251..."
                                    className="input-field"
                                />
                            </div>

                            {role === 'farmer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="My Farm"
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Region, District"
                                            className="input-field"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary btn-primary-farmer disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

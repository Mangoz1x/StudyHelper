'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { Sparkles } from 'lucide-react';

/**
 * Sign Up Page
 *
 * Clean, modern sign-up page with social login options
 * For OAuth-only auth, sign-up and sign-in are essentially the same flow
 */
export default function SignUpPage() {
    const [loading, setLoading] = useState(null);

    const handleSocialLogin = async (provider) => {
        setLoading(provider);
        try {
            await signIn(provider, { callbackUrl: '/dashboard' });
        } catch (err) {
            console.error('Sign up error:', err);
            setLoading(null);
        }
    };

    return (
        <Card variant="glass" padding="lg">
            <CardContent>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                        <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Start your learning journey today
                    </p>
                </div>

                {/* Features preview */}
                <div className="mb-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            AI-powered study assistance
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Personalized learning paths
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Track your progress
                        </li>
                    </ul>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                    <SocialLoginButton
                        provider="google"
                        onClick={() => handleSocialLogin('google')}
                        loading={loading === 'google'}
                    />

                    {/* Add more providers here as you enable them */}
                    {/*
                    <SocialLoginButton
                        provider="github"
                        onClick={() => handleSocialLogin('github')}
                        loading={loading === 'github'}
                    />
                    */}
                </div>

                {/* Sign in link */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            href="/signin"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

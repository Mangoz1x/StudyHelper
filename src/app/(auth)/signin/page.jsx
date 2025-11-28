'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Sign In Page Content
 *
 * Inner component that uses useSearchParams
 */
function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const error = searchParams.get('error');

    const [loading, setLoading] = useState(null);

    const handleSocialLogin = async (provider) => {
        setLoading(provider);
        try {
            await signIn(provider, { callbackUrl });
        } catch (err) {
            console.error('Sign in error:', err);
            setLoading(null);
        }
    };

    const errorMessages = {
        OAuthAccountNotLinked: 'This email is already linked to another account. Please sign in with the original provider.',
        OAuthSignin: 'Could not start sign in. Please try again.',
        OAuthCallback: 'Could not complete sign in. Please try again.',
        default: 'An error occurred during sign in. Please try again.',
    };

    return (
        <Card variant="glass" padding="lg">
            <CardContent>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Sign in to continue to StudyHelper
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {errorMessages[error] || errorMessages.default}
                            </p>
                        </div>
                    </div>
                )}

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

                {/* Sign up link */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/signup"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Sign In Page Loading Fallback
 */
function SignInLoading() {
    return (
        <Card variant="glass" padding="lg">
            <CardContent>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Sign In Page
 *
 * Clean, modern sign-in page with social login options
 * Wrapped in Suspense for useSearchParams
 */
export default function SignInPage() {
    return (
        <Suspense fallback={<SignInLoading />}>
            <SignInContent />
        </Suspense>
    );
}

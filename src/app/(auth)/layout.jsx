/**
 * Auth Layout
 *
 * Shared layout for authentication pages (sign-in, sign-up)
 * Provides centered card layout with subtle gradient background
 */

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Subtle decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl" />
            </div>

            {/* Logo / Brand */}
            <div className="relative z-10 mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    StudyHelper
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your intelligent study companion
                </p>
            </div>

            {/* Auth content */}
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}

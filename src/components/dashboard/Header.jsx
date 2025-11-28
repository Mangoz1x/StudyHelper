'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Avatar } from '@/components/ui';
import {
    LogOut,
    Settings,
    User,
    ChevronDown,
    BookOpen,
} from 'lucide-react';

/**
 * Dashboard Header Component
 *
 * Sticky header with logo and user menu
 */
export function DashboardHeader({ user }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/dashboard/projects" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                            StudyHelper
                        </span>
                    </Link>

                    {/* Right side - User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Avatar
                                src={user?.image}
                                name={user?.name}
                                size="sm"
                            />
                            <span className="hidden sm:block text-sm font-medium text-gray-700">
                                {user?.name || user?.email}
                            </span>
                            <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                    menuOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpen(false)}
                                />

                                {/* Menu */}
                                <div className="absolute right-0 mt-2 w-56 z-20 py-2 bg-white rounded-xl shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user?.email}
                                        </p>
                                    </div>

                                    {/* Sign out */}
                                    <div className="pt-1">
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X } from 'lucide-react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass py-3 shadow-lg'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[var(--text-primary)]">
              StudyHelper
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              How It Works
            </a>
            <a href="#demo" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Demo
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-primary)]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-[var(--border-light)] pt-4">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-medium text-[var(--text-secondary)]">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-[var(--text-secondary)]">How It Works</a>
              <a href="#demo" className="text-sm font-medium text-[var(--text-secondary)]">Demo</a>
              <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-light)]">
                <Link href="/signin" className="text-center py-2 text-sm font-medium text-[var(--text-primary)]">
                  Log in
                </Link>
                <Link href="/signup" className="text-center py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-full">
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

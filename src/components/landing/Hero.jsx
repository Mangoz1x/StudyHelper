'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play } from 'lucide-react';

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  // Use ref to track if component has mounted (null check pattern for React Compiler)
  const mountedRef = useRef(null);
  if (mountedRef.current == null) {
    mountedRef.current = true;
    // Trigger animation on next frame
    requestAnimationFrame(() => setMounted(true));
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div
          className={`absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
          }`}
        />
        <div
          className={`absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl transition-all duration-1000 delay-200 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-full blur-3xl transition-opacity duration-1000 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px),
                              linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-32 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 mb-8 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            AI-Powered Learning Platform
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-6 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Study Smarter,
          <br />
          <span className="text-gradient">Not Harder</span>
        </h1>

        {/* Subheadline */}
        <p
          className={`max-w-2xl mx-auto text-xl text-[var(--text-secondary)] mb-10 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Transform your study materials into interactive assessments with AI.
          Upload notes, generate quizzes, and track your progress effortlessly.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-full hover:shadow-xl hover:shadow-blue-500/25 transition-all hover:-translate-y-1 animate-pulse-glow"
          >
            Start Learning Free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#demo"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-full hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-light)]"
          >
            <Play className="h-5 w-5" />
            Watch Demo
          </a>
        </div>

        {/* Stats */}
        <div
          className={`mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {[
            { value: '10K+', label: 'Students' },
            { value: '50K+', label: 'Assessments' },
            { value: '95%', label: 'Accuracy' },
            { value: '4.9', label: 'Rating' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient">{stat.value}</div>
              <div className="text-sm text-[var(--text-tertiary)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-700 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-6 h-10 rounded-full border-2 border-[var(--border-medium)] flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}

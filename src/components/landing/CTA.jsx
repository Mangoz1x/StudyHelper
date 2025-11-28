'use client';

import Link from 'next/link';
import ScrollReveal from './ScrollReveal';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-32 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-violet-600/5" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <ScrollReveal animation="scale">
          <div className="relative p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-violet-600 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Start for free
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to transform
                <br />
                your learning?
              </h2>

              <p className="max-w-xl mx-auto text-lg text-white/80 mb-8">
                Join thousands of students who are already studying smarter
                with AI-powered assessments. Get started in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:shadow-xl hover:shadow-black/20 transition-all hover:-translate-y-1"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

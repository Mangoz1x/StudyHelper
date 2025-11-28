'use client';

import ScrollReveal from './ScrollReveal';
import { Upload, Sparkles, ClipboardCheck, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Materials',
    description: 'Drop in your notes, PDFs, videos, or any study content. Our system accepts all common formats.',
    color: 'blue',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI Analyzes Content',
    description: 'Our AI extracts key concepts, identifies important topics, and prepares personalized questions.',
    color: 'violet',
  },
  {
    number: '03',
    icon: ClipboardCheck,
    title: 'Take Assessments',
    description: 'Complete AI-generated quizzes with multiple choice, true/false, short answer, and more.',
    color: 'emerald',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Review your scores, identify weak areas, and watch your understanding improve over time.',
    color: 'amber',
  },
];

const colorVariants = {
  blue: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    gradient: 'from-blue-500 to-blue-600',
  },
  violet: {
    bg: 'bg-violet-500',
    bgLight: 'bg-violet-500/10',
    text: 'text-violet-600',
    border: 'border-violet-500/20',
    gradient: 'from-violet-500 to-violet-600',
  },
  emerald: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
    gradient: 'from-amber-500 to-amber-600',
  },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-[var(--bg-primary)] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up" className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Simple steps to
            <br />
            <span className="text-gradient">learning success</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)]">
            Get started in minutes. Our streamlined process makes it easy to transform
            any study material into effective learning tools.
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div className="relative">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500 opacity-20" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const colors = colorVariants[step.color];
              return (
                <ScrollReveal
                  key={step.number}
                  animation="fade-up"
                  delay={index}
                >
                  <div className="relative text-center lg:text-left">
                    {/* Step number badge */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${colors.bgLight} ${colors.border} border-2 mb-6 relative`}>
                      <step.icon className={`h-8 w-8 ${colors.text}`} />
                      <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${colors.bg} text-white text-xs font-bold flex items-center justify-center`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

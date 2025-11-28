'use client';

import ScrollReveal from './ScrollReveal';
import {
  Brain,
  FileText,
  BarChart3,
  Zap,
  Shield,
  Sparkles,
  Upload,
  BookOpen,
  Target
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Generation',
    description: 'Our advanced AI analyzes your materials and creates personalized assessments tailored to your learning goals.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: 'Any Format Welcome',
    description: 'Upload PDFs, images, videos, or paste text. StudyHelper works with all your study materials seamlessly.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed analytics. See what you\'ve mastered and where to focus next.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get immediate feedback on your answers with detailed explanations to reinforce your understanding.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Target,
    title: 'Adaptive Difficulty',
    description: 'Assessments adapt to your skill level, ensuring you\'re always challenged but never overwhelmed.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your study materials are encrypted and private. We never share your data with third parties.',
    gradient: 'from-indigo-500 to-blue-500',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-32 bg-[var(--bg-secondary)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up" className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">
            Everything you need to
            <br />
            <span className="text-gradient">ace your studies</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)]">
            StudyHelper combines cutting-edge AI with intuitive design to transform
            how you learn and retain information.
          </p>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollReveal
              key={feature.title}
              animation="scale"
              delay={index % 3}
            >
              <div className="group relative p-8 rounded-3xl bg-[var(--bg-primary)] border border-[var(--border-light)] hover:border-transparent hover:shadow-2xl transition-all duration-500 hover-lift">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

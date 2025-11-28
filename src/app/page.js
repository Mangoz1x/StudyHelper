'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Upload,
  Brain,
  CheckCircle2,
  BookOpen,
  FileText,
  Video,
  Image,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';

// Hook for detecting when section is in view
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView, hasAnimated };
}

// Floating nav
function Nav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between px-6 py-3 rounded-full bg-white/90 backdrop-blur-xl border border-gray-200 shadow-lg shadow-gray-200/50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">StudyHelper</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm font-medium px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Hero
function Hero() {
  const [mounted, setMounted] = useState(false);

  // Use ref to track if component has mounted (null check pattern for React Compiler)
  const mountedRef = useRef(null);
  if (mountedRef.current == null) {
    mountedRef.current = true;
    // Trigger animation on next frame
    requestAnimationFrame(() => setMounted(true));
  }

  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-b from-blue-50 via-white to-white relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-60" />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Learning
          </div>
        </div>

        <h1 className={`text-6xl md:text-8xl lg:text-[10rem] font-bold leading-[0.85] tracking-tight text-gray-900 transition-all duration-1000 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Study
          <br />
          <span className="text-gradient">Smarter</span>
        </h1>

        <p className={`mt-10 text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Transform your notes into personalized quizzes with AI.
          Learn faster, remember longer.
        </p>

        <div className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link href="/signup" className="group inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-lg font-medium rounded-full hover:bg-gray-800 hover:scale-105 transition-all shadow-xl shadow-gray-300/50">
            Start Free
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/signin" className="px-8 py-4 text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Sign In
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-widest">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Step 1: Upload Section
function UploadSection() {
  const { ref, hasAnimated } = useInView(0.3);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hasAnimated) {
      const timers = [
        setTimeout(() => setStep(1), 100),
        setTimeout(() => setStep(2), 600),
        setTimeout(() => setStep(3), 1200),
        setTimeout(() => setStep(4), 2400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [hasAnimated]);

  const files = [
    { icon: FileText, name: 'Chapter 5 Notes.pdf', color: 'bg-red-500' },
    { icon: Image, name: 'Diagram.png', color: 'bg-blue-500' },
    { icon: Video, name: 'Lecture 12.mp4', color: 'bg-purple-500' },
  ];

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-6 py-24 bg-white">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">
              Step 01
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6">
              Drop in your
              <br />
              <span className="text-gradient">materials</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md">
              PDFs, images, videos, notes — anything you&apos;re studying.
              We process all formats instantly.
            </p>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-8 min-h-[420px]">
              {/* Files list */}
              <div className="space-y-3 mb-6">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-500 ${
                      step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className={`w-12 h-12 ${file.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <file.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-400">
                        {step >= 3 ? 'Processed' : step >= 2 ? 'Processing...' : 'Ready'}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step >= 3 ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {step >= 3 && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className={`transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step >= 3 ? 'bg-green-500' : 'bg-blue-500'}`}>
                    {step >= 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Zap className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {step >= 3 ? 'All files processed!' : 'Processing files...'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${step >= 3 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
                    style={{ width: step >= 3 ? '100%' : step >= 2 ? '60%' : '0%' }}
                  />
                </div>
              </div>

              {/* Success message */}
              <div className={`mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl transition-all duration-500 ${
                step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-800">3 files ready for AI analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Step 2: AI Analysis Section
function AISection() {
  const { ref, hasAnimated } = useInView(0.3);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hasAnimated) {
      const timers = [
        setTimeout(() => setStep(1), 100),
        setTimeout(() => setStep(2), 800),
        setTimeout(() => setStep(3), 1600),
        setTimeout(() => setStep(4), 2400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [hasAnimated]);

  const concepts = ['Mitochondria', 'ATP Production', 'Cellular Respiration', 'Krebs Cycle', 'Electron Transport'];
  const questions = [
    'What is the primary function of mitochondria?',
    'Describe the stages of cellular respiration.',
    'How is ATP synthesized in cells?'
  ];

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-6 py-24 bg-gradient-to-b from-white to-violet-50">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Visual */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">AI Analysis</p>
                  <p className="text-sm text-gray-500">
                    {step >= 3 ? 'Complete' : 'Processing...'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-green-500' : 'bg-violet-500 animate-pulse'}`} />
              </div>

              {/* Concepts */}
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-500 mb-4">Extracted Concepts</p>
                <div className="flex flex-wrap gap-2">
                  {concepts.map((concept, i) => (
                    <span
                      key={i}
                      className={`px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium transition-all duration-500 ${
                        step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                      }`}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-4">Generated Questions</p>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-4 bg-gray-50 rounded-xl transition-all duration-500 ${
                        step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                      }`}
                      style={{ transitionDelay: `${i * 120}ms` }}
                    >
                      <span className="w-7 h-7 bg-violet-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 pt-1">{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Analysis Progress</span>
                  <span className="font-medium text-gray-900">{step >= 3 ? '100%' : step >= 2 ? '75%' : '40%'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
                    style={{ width: step >= 3 ? '100%' : step >= 2 ? '75%' : step >= 1 ? '40%' : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-sm font-semibold text-violet-600 uppercase tracking-widest mb-4">
              Step 02
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6">
              AI extracts
              <br />
              <span className="text-gradient">key concepts</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md">
              Our AI reads your materials, identifies important topics,
              and generates targeted questions automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Step 3: Assessment Section
function AssessmentSection() {
  const { ref, hasAnimated } = useInView(0.3);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hasAnimated) {
      const timers = [
        setTimeout(() => setStep(1), 100),
        setTimeout(() => setStep(2), 1000),
        setTimeout(() => setStep(3), 2000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [hasAnimated]);

  const options = [
    { text: 'Store genetic material', letter: 'A' },
    { text: 'Produce ATP energy', letter: 'B', correct: true },
    { text: 'Build proteins', letter: 'C' },
    { text: 'Digest cellular waste', letter: 'D' }
  ];

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-6 py-24 bg-gradient-to-b from-violet-50 to-emerald-50">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-4">
              Step 03
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6">
              Test your
              <br />
              <span className="text-gradient">knowledge</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md">
              Take interactive quizzes tailored to your materials.
              Multiple formats to match how you learn best.
            </p>
          </div>

          {/* Quiz */}
          <div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-8 py-5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Question 1 of 10</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-[10%] bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  What is the primary function of mitochondria in a cell?
                </h3>

                <div className="space-y-3">
                  {options.map((option, i) => {
                    const isSelected = step >= 1 && option.correct;
                    const showCorrect = step >= 2 && option.correct;

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                          showCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${
                          showCorrect
                            ? 'bg-emerald-500 text-white'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {showCorrect ? <CheckCircle2 className="w-5 h-5" /> : option.letter}
                        </div>
                        <span className={`font-medium ${showCorrect ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {option.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Feedback */}
                <div className={`mt-6 p-4 bg-emerald-100 rounded-xl transition-all duration-500 ${
                  step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-800">Correct!</p>
                      <p className="text-emerald-700 text-sm mt-1">
                        Mitochondria are the powerhouse of the cell, producing ATP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Step 4: Progress Section
function ProgressSection() {
  const { ref, hasAnimated } = useInView(0.3);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hasAnimated) {
      const timers = [
        setTimeout(() => setStep(1), 100),
        setTimeout(() => setStep(2), 800),
        setTimeout(() => setStep(3), 1600),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [hasAnimated]);

  const weekData = [
    { day: 'M', score: 65 },
    { day: 'T', score: 72 },
    { day: 'W', score: 68 },
    { day: 'T', score: 85 },
    { day: 'F', score: 78 },
    { day: 'S', score: 92 },
    { day: 'S', score: 88 }
  ];

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-6 py-24 bg-gradient-to-b from-emerald-50 to-amber-50">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Chart */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Weekly Progress</h3>
                  <p className="text-gray-500 text-sm mt-1">Your performance this week</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full transition-all duration-500 ${
                  step >= 2 ? 'opacity-100' : 'opacity-0'
                }`}>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-600">+12%</span>
                </div>
              </div>

              {/* Chart */}
              <div className="flex items-end justify-between gap-3 h-48 mb-6">
                {weekData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full h-full bg-gray-100 rounded-xl relative overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-orange-400 rounded-xl transition-all duration-700 ease-out"
                        style={{
                          height: step >= 1 ? `${day.score}%` : '0%',
                          transitionDelay: `${i * 60}ms`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                {[
                  { label: 'Avg Score', value: '78%' },
                  { label: 'Quizzes', value: '24' },
                  { label: 'Streak', value: '7 days' }
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`text-center transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-sm font-semibold text-amber-600 uppercase tracking-widest mb-4">
              Step 04
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6">
              Watch yourself
              <br />
              <span className="text-gradient">improve</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md">
              Track your progress with detailed analytics.
              See what you&apos;ve mastered and where to focus next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Final CTA
function FinalCTA() {
  const { ref, hasAnimated } = useInView(0.3);

  return (
    <section ref={ref} className="py-32 px-6 bg-black">
      <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
        hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[0.95] mb-8">
          Ready to study
          <br />
          smarter?
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-md mx-auto">
          Join thousands of students learning faster with AI-powered assessments.
        </p>
        <Link
          href="/signup"
          className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-lg font-medium rounded-full hover:bg-gray-100 transition-all hover:scale-105"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <p className="mt-4 text-sm text-gray-500">No credit card required</p>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="px-6 py-12 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-black" />
          </div>
          <span className="font-semibold text-white">StudyHelper</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-gray-500">
          <Link href="/signin" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}

// Progress bar
function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(window.scrollY / scrollHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-gray-100">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-all duration-100"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-white">
      <ProgressBar />
      <Nav />
      <Hero />
      <UploadSection />
      <AISection />
      <AssessmentSection />
      <ProgressSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

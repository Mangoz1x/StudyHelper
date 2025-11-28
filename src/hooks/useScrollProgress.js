'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Track scroll progress within a section (0 to 1)
 */
export function useSectionProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;

      // Calculate how far through the section we've scrolled
      // 0 = section just entering viewport from bottom
      // 1 = section fully scrolled past
      const start = windowHeight; // When top of element is at bottom of viewport
      const end = -elementHeight; // When bottom of element is at top of viewport
      const current = rect.top;

      const rawProgress = 1 - (current - end) / (start - end);
      setProgress(Math.max(0, Math.min(1, rawProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return [ref, progress];
}

/**
 * Track progress within viewport (when element is visible)
 */
export function useViewportProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Is element in viewport?
      const inView = rect.top < windowHeight && rect.bottom > 0;
      setIsInView(inView);

      if (inView) {
        // Progress from 0 (just entering) to 1 (just leaving)
        const total = windowHeight + rect.height;
        const scrolled = windowHeight - rect.top;
        setProgress(Math.max(0, Math.min(1, scrolled / total)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return [ref, progress, isInView];
}

/**
 * Lock scroll within a section (scroll-jacking)
 */
export function useScrollLock(totalSteps = 5) {
  const ref = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if section is in "lock zone" (taking up most of viewport)
      const shouldLock = rect.top <= 0 && rect.bottom >= windowHeight;

      if (shouldLock && !isLocked) {
        setIsLocked(true);
      } else if (!shouldLock && isLocked) {
        setIsLocked(false);
      }
    };

    const handleWheel = (e) => {
      if (!isLocked) return;

      const delta = e.deltaY;
      accumulatedDelta.current += delta;

      // Threshold to move to next step
      const threshold = 100;

      if (accumulatedDelta.current > threshold && currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
        accumulatedDelta.current = 0;
        e.preventDefault();
      } else if (accumulatedDelta.current < -threshold && currentStep > 0) {
        setCurrentStep(prev => prev - 1);
        accumulatedDelta.current = 0;
        e.preventDefault();
      } else if (
        (currentStep === 0 && delta < 0) ||
        (currentStep === totalSteps - 1 && delta > 0)
      ) {
        // Allow scrolling out of section
        return;
      } else {
        e.preventDefault();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isLocked, currentStep, totalSteps]);

  return [ref, currentStep, isLocked];
}

/**
 * Smooth scroll progress for entire page
 */
export function usePageProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setProgress(scrollHeight > 0 ? scrolled / scrollHeight : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/**
 * Wrapper component for scroll-triggered animations
 */
export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  className = '',
  threshold = 0.1,
  ...props
}) {
  const [ref, isVisible] = useScrollAnimation({ threshold });

  const animationClasses = {
    'fade-up': 'scroll-fade-up',
    'fade-left': 'scroll-fade-left',
    'fade-right': 'scroll-fade-right',
    'scale': 'scroll-scale',
    'blur': 'scroll-blur',
  };

  const delayClasses = {
    0: '',
    1: 'stagger-1',
    2: 'stagger-2',
    3: 'stagger-3',
    4: 'stagger-4',
    5: 'stagger-5',
  };

  return (
    <div
      ref={ref}
      className={`${animationClasses[animation] || 'scroll-fade-up'} ${
        isVisible ? 'visible' : ''
      } ${delayClasses[delay] || ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Lightweight smooth scroll with momentum
 * Creates a buttery smooth scrolling experience similar to Lenis/Locomotive
 */
export function useSmoothScroll(options = {}) {
  const {
    lerp = 0.08, // Lower = smoother/slower, Higher = snappier
    wheelMultiplier = 1,
    touchMultiplier = 2,
    smoothTouch = false,
  } = options;

  const scrollData = useRef({
    current: 0,
    target: 0,
    limit: 0,
    velocity: 0,
    direction: 0,
    isScrolling: false,
    rafId: null,
  });

  const containerRef = useRef(null);

  const lerp_fn = useCallback((start, end, factor) => {
    return start + (end - start) * factor;
  }, []);

  const clamp = useCallback((value, min, max) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  useEffect(() => {
    const data = scrollData.current;

    // Set initial scroll limit
    const updateLimit = () => {
      data.limit = document.documentElement.scrollHeight - window.innerHeight;
    };

    // Sync with actual scroll position on load
    data.current = window.scrollY;
    data.target = window.scrollY;
    updateLimit();

    // Handle wheel events
    const onWheel = (e) => {
      e.preventDefault();

      const delta = e.deltaY * wheelMultiplier;
      data.target = clamp(data.target + delta, 0, data.limit);
      data.direction = Math.sign(delta);
      data.isScrolling = true;
    };

    // Handle touch events
    let touchStart = 0;
    let touchStartTarget = 0;

    const onTouchStart = (e) => {
      touchStart = e.touches[0].clientY;
      touchStartTarget = data.target;
    };

    const onTouchMove = (e) => {
      if (!smoothTouch) {
        // Let native scroll handle touch
        data.target = window.scrollY;
        data.current = window.scrollY;
        return;
      }

      const touchCurrent = e.touches[0].clientY;
      const delta = (touchStart - touchCurrent) * touchMultiplier;
      data.target = clamp(touchStartTarget + delta, 0, data.limit);
      data.direction = Math.sign(delta);
      data.isScrolling = true;
    };

    // Handle keyboard
    const onKeyDown = (e) => {
      let delta = 0;
      const step = window.innerHeight * 0.3;

      switch (e.key) {
        case 'ArrowDown':
          delta = step;
          break;
        case 'ArrowUp':
          delta = -step;
          break;
        case 'PageDown':
          delta = window.innerHeight;
          break;
        case 'PageUp':
          delta = -window.innerHeight;
          break;
        case 'Home':
          data.target = 0;
          data.isScrolling = true;
          return;
        case 'End':
          data.target = data.limit;
          data.isScrolling = true;
          return;
        case ' ':
          delta = e.shiftKey ? -window.innerHeight : window.innerHeight;
          break;
        default:
          return;
      }

      e.preventDefault();
      data.target = clamp(data.target + delta, 0, data.limit);
      data.direction = Math.sign(delta);
      data.isScrolling = true;
    };

    // Animation loop
    const animate = () => {
      const previous = data.current;

      // Smooth interpolation
      data.current = lerp_fn(data.current, data.target, lerp);
      data.velocity = data.current - previous;

      // Stop animating when close enough
      if (Math.abs(data.target - data.current) < 0.1) {
        data.current = data.target;
        data.velocity = 0;
        data.isScrolling = false;
      }

      // Apply scroll position
      window.scrollTo(0, data.current);

      // Continue animation
      data.rafId = requestAnimationFrame(animate);
    };

    // Handle resize
    const onResize = () => {
      updateLimit();
      data.target = clamp(data.target, 0, data.limit);
    };

    // Handle native scroll (for touch, anchor links, etc.)
    const onScroll = () => {
      if (!data.isScrolling && !smoothTouch) {
        data.current = window.scrollY;
        data.target = window.scrollY;
      }
    };

    // Add event listeners
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Start animation loop
    data.rafId = requestAnimationFrame(animate);

    // Add smooth-scroll class to html
    document.documentElement.classList.add('smooth-scroll');

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);

      if (data.rafId) {
        cancelAnimationFrame(data.rafId);
      }

      document.documentElement.classList.remove('smooth-scroll');
    };
  }, [lerp, wheelMultiplier, touchMultiplier, smoothTouch, lerp_fn, clamp]);

  return {
    containerRef,
    scrollTo: useCallback((target, immediate = false) => {
      const data = scrollData.current;
      const targetValue = typeof target === 'number'
        ? target
        : document.querySelector(target)?.offsetTop || 0;

      data.target = clamp(targetValue, 0, data.limit);

      if (immediate) {
        data.current = data.target;
        window.scrollTo(0, data.current);
      }
    }, [clamp]),
  };
}

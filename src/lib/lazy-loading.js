import { lazy, Suspense } from 'react';

/**
 * Lazy load images with native lazy attribute and fallback
 */
export const lazyLoadImage = (src, alt = '') => ({
  src,
  alt,
  loading: 'lazy',
  decoding: 'async',
});

/**
 * Create a lazy-loaded component with Suspense fallback
 * @param {Promise} importFunc - Dynamic import function
 * @param {React.Component} fallback - Fallback component during loading
 */
export const lazyLoadComponent = (importFunc, fallback) => {
  const LazyComponent = lazy(importFunc);
  return (
    <Suspense fallback={fallback || <div className="p-4 text-center text-muted-foreground">Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
};

/**
 * Setup Intersection Observer for lazy loading elements
 */
export const observeLazyElements = (selector = '[data-lazy]') => {
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        if (element.dataset.src && element.tagName === 'IMG') {
          element.src = element.dataset.src;
          element.removeAttribute('data-src');
        }
        observer.unobserve(element);
      }
    });
  }, { rootMargin: '50px' });

  document.querySelectorAll(selector).forEach((el) => observer.observe(el));

  return observer;
};
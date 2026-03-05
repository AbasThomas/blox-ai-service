'use client';
import { useEffect } from 'react';

export function SmoothScroll() {
  useEffect(() => {
    document.documentElement.classList.add('scroll-smooth');
    return () => document.documentElement.classList.remove('scroll-smooth');
  }, []);
  return null;
}

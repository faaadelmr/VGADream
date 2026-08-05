'use client';

import { useEffect } from 'react';

export function SmoothTransitionInitializer() {
  useEffect(() => {
    // Dynamic import on client side ensures window exists when IIFE executes,
    // activating both smooth vh transitions and the 'f+m+r' keyboard easter egg.
    import('smooth-transitionv2').then(({ smoothTransitionV2 }) => {
      if (typeof smoothTransitionV2 === 'function') {
        smoothTransitionV2();
      }
    });
  }, []);

  return null;
}

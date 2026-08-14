import { useEffect, useState } from 'react';

/**
 * useBreakpoint
 *
 * The diesel pages use raw inline `style={{}}` objects (no CSS modules,
 * no styled-components), which have no way to express a media query.
 * Confirmed during a UI/UX audit: zero `@media` queries exist anywhere
 * across all 16 diesel pages, and several use fixed multi-column grid
 * layouts (`repeat(5,1fr)`, `'420px 1fr'`, etc.) with no fallback for
 * narrow viewports — genuinely broken (cramped/overflowing) on a tablet
 * or phone-width browser.
 *
 * This hook is the fix that fits the existing pattern: instead of
 * introducing a whole new styling approach, pages read `isNarrow` (or the
 * more granular `breakpoint`) and choose a different `gridTemplateColumns`
 * value at render time — same inline-style pattern, just responsive.
 *
 * Usage:
 *   const { isNarrow } = useBreakpoint();
 *   <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(4,1fr)' }}>
 */

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const MOBILE_MAX = 640;
const TABLET_MAX = 1024;

function getBreakpoint(width: number): Breakpoint {
  if (width <= MOBILE_MAX) return 'mobile';
  if (width <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function useBreakpoint() {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    const onResize = () => {
      // rAF-throttle — resize fires rapidly while dragging a window edge
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const breakpoint = getBreakpoint(width);
  return {
    width,
    breakpoint,
    isMobile:  breakpoint === 'mobile',
    isNarrow:  breakpoint !== 'desktop', // tablet or mobile
    isDesktop: breakpoint === 'desktop',
  };
}

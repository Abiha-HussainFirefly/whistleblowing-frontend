import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query from React.
 *
 * Used where a layout decision cannot be expressed in CSS alone — for example
 * choosing to render a card list instead of a table, rather than rendering both
 * and hiding one, which would double the DOM and make the hidden copy
 * reachable by screen readers and keyboard users.
 *
 * SSR/JSDOM-safe: returns `false` until mounted, and tolerates the older
 * `addListener` API so tests running in an older jsdom do not blow up.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const list = window.matchMedia(query);
    const update = (): void => {
      setMatches(list.matches);
    };
    update();

    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', update);
      return () => {
        list.removeEventListener('change', update);
      };
    }
    list.addListener(update);
    return () => {
      list.removeListener(update);
    };
  }, [query]);

  return matches;
}

/** Tailwind's `lg` breakpoint. Below this a dense data table stops working. */
export const useIsCompactViewport = (): boolean => useMediaQuery('(max-width: 1023.98px)');

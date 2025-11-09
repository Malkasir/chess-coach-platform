import { useEffect, useRef } from 'react';

/**
 * Auto-scrolls a container to bottom when content changes
 * @param dependency - Value to watch for changes (e.g., moveHistory.length)
 * @returns Ref to attach to the scrollable container
 */
export const useScrollToBottom = (dependency: number) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [dependency]);

  return containerRef;
};

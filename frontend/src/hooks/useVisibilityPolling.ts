import { useEffect, useRef } from 'react';

interface UseVisibilityPollingOptions {
  onPoll: () => void;
  interval: number;
  slowInterval?: number;
  enabled?: boolean;
}

export const useVisibilityPolling = ({
  onPoll,
  interval,
  slowInterval = interval * 3,
  enabled = true,
}: UseVisibilityPollingOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const scheduleNext = () => {
    if (!enabled) return;
    
    const currentInterval = document.hidden ? slowInterval : interval;
    timeoutRef.current = setTimeout(async () => {
      await onPoll();
      scheduleNext();
    }, currentInterval);
  };

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Start initial poll
    onPoll();
    scheduleNext();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (!document.hidden) {
        // Tab became visible, poll immediately and reset schedule
        onPoll();
      }
      
      scheduleNext();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, slowInterval, onPoll]);
};
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialTime?: number;
  onTick?: (time: number) => void;
  onTimeUp?: () => void;
  syncInterval?: number; // How often to sync with backend (in ms)
}

interface UseTimerReturn {
  time: number;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newTime?: number) => void;
  stop: () => void;
  formatTime: (seconds?: number) => string;
}

export function useTimer({
  initialTime = 0,
  onTick,
  onTimeUp,
  syncInterval = 5000 // Sync every 5 seconds
}: UseTimerOptions = {}): UseTimerReturn {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Start the timer
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      
      // Main timer interval (updates every second)
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const newTime = initialTime > 0 ? Math.max(0, initialTime - elapsed) : initialTime + elapsed;
          setTime(newTime);
          onTick?.(newTime);
          
          // Check if countdown reached zero
          if (initialTime > 0 && newTime <= 0 && onTimeUp) {
            onTimeUp();
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      }, 1000);
      
      // Sync interval for backend synchronization
      if (syncInterval > 0) {
        syncIntervalRef.current = setInterval(() => {
          if (startTimeRef.current !== null) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const newTime = initialTime > 0 ? Math.max(0, initialTime - elapsed) : initialTime + elapsed;
            onTick?.(newTime);
          }
        }, syncInterval);
      }
    }
  }, [isRunning, initialTime, onTick, syncInterval]);

  // Pause the timer
  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      
      if (startTimeRef.current !== null) {
        pausedTimeRef.current = Date.now() - startTimeRef.current;
      }
      
      // Clear intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }
  }, [isRunning, isPaused]);

  // Resume the timer
  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      
      // Restart intervals
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setTime(initialTime + elapsed);
          onTick?.(initialTime + elapsed);
        }
      }, 1000);
      
      if (syncInterval > 0) {
        syncIntervalRef.current = setInterval(() => {
          if (startTimeRef.current !== null) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            onTick?.(initialTime + elapsed);
          }
        }, syncInterval);
      }
    }
  }, [isRunning, isPaused, initialTime, onTick, syncInterval]);

  // Reset the timer
  const reset = useCallback((newTime = 0) => {
    setTime(newTime);
    setIsRunning(false);
    setIsPaused(false);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    
    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Stop the timer (same as reset but keeps current time)
  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    
    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback((seconds = time) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
  }, [time]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Handle page visibility changes (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && !isPaused) {
        pause();
      } else if (!document.hidden && isRunning && isPaused) {
        resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, isPaused, pause, resume]);

  return {
    time,
    timeLeft: Math.max(0, initialTime - time), // Calculate time remaining
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    stop,
    formatTime,
  };
}

// Alternative hook for question-level timing
export function useQuestionTimer(onQuestionComplete?: (timeSpent: number) => void) {
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startQuestionTimer = useCallback(() => {
    setQuestionStartTime(Date.now());
    setTimeSpent(0);
    
    intervalRef.current = setInterval(() => {
      if (questionStartTime) {
        const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
        setTimeSpent(elapsed);
      }
    }, 1000);
  }, [questionStartTime]);

  const stopQuestionTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (questionStartTime) {
      const finalTimeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setTimeSpent(finalTimeSpent);
      onQuestionComplete?.(finalTimeSpent);
      return finalTimeSpent;
    }
    
    return 0;
  }, [questionStartTime, onQuestionComplete]);

  const resetQuestionTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setQuestionStartTime(null);
    setTimeSpent(0);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeSpent,
    startQuestionTimer,
    stopQuestionTimer,
    resetQuestionTimer,
    formatTime: (seconds = timeSpent) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    },
  };
}

export default useTimer;
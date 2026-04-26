import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';

/**
 * 视频上传 Hook
 */
export const useVideoUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (
      videoUri: string,
      fileName: string,
      fileSize: number,
      onProgress?: (progress: number) => void
    ) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 模拟上传过程
        // 实际项目中这里会调用 uploadVideoChunk 进行分片上传
        const chunkSize = 5 * 1024 * 1024; // 5MB
        const totalChunks = Math.ceil(fileSize / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
          // 检查是否已取消
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('上传已取消');
          }

          // 模拟上传延迟
          await new Promise((resolve) => setTimeout(resolve, 200));

          const currentProgress = ((i + 1) / totalChunks) * 100;
          setProgress(currentProgress);
          onProgress?.(currentProgress);
        }

        return { success: true };
      } catch (err: any) {
        setError(err.message || '上传失败');
        return { success: false, error: err.message };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    cancel,
    reset,
    isUploading,
    progress,
    error,
  };
};

/**
 * 视频分析 Hook
 */
export const useVideoAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const analyze = useCallback(async (videoId: string) => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // 模拟分析进度
      // 实际项目中这里会调用 startAnalysis 并轮询状态
      for (let i = 0; i <= 100; i += 5) {
        if (pollingRef.current === null) {
          // 已取消
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProgress(i);
      }

      return { success: true };
    } catch (err: any) {
      setError(err.message || '分析失败');
      return { success: false, error: err.message };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsAnalyzing(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    analyze,
    cancel,
    isAnalyzing,
    progress,
    error,
  };
};

/**
 * 倒计时 Hook
 */
export const useCountdown = (initialSeconds: number) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(
    (newSeconds?: number) => {
      setSeconds(newSeconds ?? initialSeconds);
      setIsRunning(false);
    },
    [initialSeconds]
  );

  return { seconds, isRunning, start, pause, reset };
};

/**
 * 本地存储 Hook（简化版）
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};

/**
 * 深比较 Hook
 */
export const useDeepCompare = <T>(value: T): boolean => {
  const prevValueRef = useRef<T | null>(null);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    const isEqual = JSON.stringify(value) === JSON.stringify(prevValueRef.current);
    if (!isEqual) {
      setIsChanged(true);
      prevValueRef.current = value;
      // 重置标志
      setTimeout(() => setIsChanged(false), 100);
    }
  }, [value]);

  return isChanged;
};

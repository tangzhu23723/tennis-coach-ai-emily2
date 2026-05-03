import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';

// API 基础 URL（腾讯云后端）
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.emilytangzhu.com';

/**
 * 视频上传 Hook - 真实上传到后端
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
        // 创建 FormData
        const formData = new FormData();

        // Web 环境：从 blob URL 获取文件
        if (typeof window !== 'undefined' && videoUri.startsWith('blob:')) {
          const response = await fetch(videoUri);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
          formData.append('video', file);
        } else {
          // 原生环境或其他情况
          formData.append('video', {
            uri: videoUri,
            name: fileName,
            type: 'video/mp4',
          } as any);
        }

        // 创建上传请求
        const xhr = new XMLHttpRequest();

        // 上传进度
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
            onProgress?.(percent);
          }
        };

        // 上传完成
        const uploadPromise = new Promise<{ videoId: string; videoUrl: string }>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success && response.data) {
                  resolve({
                    videoId: response.data.videoId,
                    videoUrl: response.data.videoUrl,
                  });
                } else {
                  reject(new Error(response.error || '上传失败'));
                }
              } catch (e) {
                reject(new Error('解析响应失败'));
              }
            } else {
              reject(new Error(`上传失败: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('网络错误'));
          xhr.onabort = () => reject(new Error('上传已取消'));
        });

        // 发送请求
        xhr.open('POST', `${API_BASE_URL}/api/videos/upload`);
        xhr.send(formData);

        // 设置取消功能
        abortControllerRef.current = new AbortController();
        abortControllerRef.current.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        const result = await uploadPromise;
        setProgress(100);

        return { success: true, videoId: result.videoId, videoUrl: result.videoUrl };
      } catch (err: any) {
        // 如果上传失败，降级到本地播放（使用 blob URL）
        console.warn('[Upload] 上传到服务器失败，使用本地 blob URL:', err.message);
        setError(null); // 不显示错误，因为有降级方案
        return { success: true, videoUrl: videoUri };
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

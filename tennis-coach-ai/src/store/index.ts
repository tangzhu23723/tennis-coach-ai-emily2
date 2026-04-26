import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoRecord, AnalysisResult, UploadTask } from '../types';

interface AppState {
  // 当前视频
  currentVideo: VideoRecord | null;
  setCurrentVideo: (video: VideoRecord | null) => void;
  updateCurrentVideo: (updates: Partial<VideoRecord>) => void;

  // 视频元数据（用于模拟分析）
  videoDuration: number;
  detectedShotTypes: string[];
  setVideoMeta: (duration: number, shotTypes: string[]) => void;

  // 分析结果
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;

  // 历史记录
  videoHistory: VideoRecord[];
  addToHistory: (video: VideoRecord) => void;
  updateInHistory: (id: string, updates: Partial<VideoRecord>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // 上传任务
  uploadTask: UploadTask | null;
  setUploadTask: (task: UploadTask | null) => void;
  updateUploadProgress: (uploadedSize: number) => void;

  // 处理进度
  processingProgress: number;
  setProcessingProgress: (progress: number) => void;

  // 主题
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // 清理状态
  reset: () => void;
}

const initialState = {
  currentVideo: null,
  videoDuration: 15,
  detectedShotTypes: ['serve'] as string[],
  analysisResult: null,
  videoHistory: [],
  uploadTask: null,
  processingProgress: 0,
  theme: 'dark' as const,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentVideo: (video) => set({ currentVideo: video }),

      updateCurrentVideo: (updates) => {
        const current = get().currentVideo;
        if (current) {
          set({ currentVideo: { ...current, ...updates } });
        }
      },

      setVideoMeta: (duration, shotTypes) => {
        set({ videoDuration: duration, detectedShotTypes: shotTypes });
      },

      setAnalysisResult: (result) => set({ analysisResult: result }),

      addToHistory: (video) => {
        const history = get().videoHistory;
        const existing = history.findIndex((v) => v.id === video.id);
        if (existing >= 0) {
          history[existing] = video;
          set({ videoHistory: [...history] });
        } else {
          set({ videoHistory: [video, ...history] });
        }
      },

      updateInHistory: (id, updates) => {
        const history = get().videoHistory.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        );
        set({ videoHistory: history });
      },

      removeFromHistory: (id) => {
        const history = get().videoHistory.filter((v) => v.id !== id);
        set({ videoHistory: history });
      },

      clearHistory: () => set({ videoHistory: [] }),

      setUploadTask: (task) => set({ uploadTask: task }),

      updateUploadProgress: (uploadedSize) => {
        const task = get().uploadTask;
        if (task) {
          set({
            uploadTask: {
              ...task,
              uploadedSize,
              status: uploadedSize >= task.fileSize ? 'completed' : 'uploading',
            },
          });
        }
      },

      setProcessingProgress: (progress) => set({ processingProgress: progress }),

      setTheme: (theme) => set({ theme }),

      reset: () => set(initialState),
    }),
    {
      name: 'tennis-coach-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        videoHistory: state.videoHistory,
        theme: state.theme,
      }),
    }
  )
);

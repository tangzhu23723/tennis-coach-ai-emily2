// 视频记录
export interface VideoRecord {
  id: string;
  userId: string;
  title: string;
  uploadTime: string;
  duration: number; // 秒
  thumbnailUrl?: string;
  localUri?: string;
  videoUrl?: string;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  uploadProgress: number;
}

// 有效片段
export interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  type: 'forehand' | 'backhand' | 'serve' | 'volley' | 'unknown';
  confidence: number;
  thumbnailUrl?: string;
  description?: string;
}

// 评分
export interface Scores {
  forehand: number;
  backhand: number;
  serve: number;
  footwork: number;
  stability: number;
}

// 改进建议
export interface Suggestion {
  id: string;
  category: 'forehand' | 'backhand' | 'serve' | 'footwork' | 'stability' | 'mental';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  trainingTip: string;
  videoClipId?: string;
}

// 分析结果
export interface AnalysisResult {
  videoId: string;
  overallScore: number;
  grade: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  scores: Scores;
  validClips: Clip[];
  suggestions: Suggestion[];
  summary: string;
  strongPoints: string[];
  weakPoints: string[];
  generatedAt: string;
  processingTime: number; // 处理耗时（秒）
}

// 上传任务
export interface UploadTask {
  id: string;
  videoId: string;
  fileName: string;
  fileSize: number;
  uploadedSize: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 报告数据
export interface ReportData {
  videoInfo: {
    title: string;
    duration: number;
    validClipCount: number;
    analyzedAt: string;
  };
  analysis: AnalysisResult;
}

// 导航参数
export type RootStackParamList = {
  Home: undefined;
  VideoPicker: undefined;
  Upload: { videoUri: string; fileName: string; fileSize: number };
  Processing: { videoId: string };
  Result: { videoId: string };
  History: undefined;
  ResultDetail: { videoId: string };
};

// 主题色
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

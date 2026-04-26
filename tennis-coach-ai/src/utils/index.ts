import { GRADE_CONFIG } from '../constants';

/**
 * 格式化时长（秒 -> MM:SS 或 HH:MM:SS）
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`;
  }
  // 24小时内
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
  }
  // 7天内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 根据分数获取等级
 */
export const getGrade = (
  score: number
): { label: string; color: string } => {
  if (score <= 40) return { label: '初级', color: GRADE_CONFIG.beginner.color };
  if (score <= 70) return { label: '中级', color: GRADE_CONFIG.intermediate.color };
  if (score <= 90) return { label: '高级', color: GRADE_CONFIG.advanced.color };
  return { label: '专业', color: GRADE_CONFIG.professional.color };
};

/**
 * 获取等级描述
 */
export const getGradeDescription = (grade: string): string => {
  const descriptions: Record<string, string> = {
    beginner: '刚开始学习网球，需要大量基础练习',
    intermediate: '有一定基础，可以进行常规对打',
    advanced: '技术全面，比赛能力较强',
    professional: '接近专业水平，技术动作标准',
  };
  return descriptions[grade] || '';
};

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 计算置信度百分比
 */
export const confidenceToPercent = (confidence: number): number => {
  return Math.round(confidence * 100);
};

/**
 * 获取置信度等级
 */
export const getConfidenceLevel = (
  confidence: number
): { label: string; color: string } => {
  if (confidence >= 0.9) return { label: '很高', color: '#4CAF50' };
  if (confidence >= 0.7) return { label: '较高', color: '#8BC34A' };
  if (confidence >= 0.5) return { label: '一般', color: '#FF9800' };
  return { label: '较低', color: '#F44336' };
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 验证视频文件类型
 */
export const isValidVideoFile = (mimeType: string): boolean => {
  const validTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-m4v',
    'video/webm',
  ];
  return validTypes.includes(mimeType);
};

/**
 * 获取视频时长（异步）
 */
export const getVideoDuration = (uri: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    // 在 React Native 中使用 Video 组件获取时长
    // 这里用 setTimeout 模拟，实际需要用 expo-video
    setTimeout(() => {
      resolve(60); // 默认返回 60 秒
    }, 100);
  });
};

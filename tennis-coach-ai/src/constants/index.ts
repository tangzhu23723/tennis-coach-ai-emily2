import { ThemeColors } from '../types';

// ============================================================
// 应用版本号 - 每次更新请修改此版本
// ============================================================
export const APP_VERSION = '2.2.0';
export const APP_BUILD_DATE = '2026-04-26';

// ============================================================
// ⚠️ 重要提示 - 当前为演示版本
// ============================================================
// 视频截取：基于音频能量分析，有效过滤无效片段
// 技术分析：模拟数据，需接入真实 AI
// ============================================================

// ============================================================
// 颜色配置
// ============================================================
export const COLORS: ThemeColors = {
  primary: '#2E7D32', // 网球绿
  secondary: '#1B5E20', // 深绿
  background: '#0D1B0F', // 深色背景
  surface: '#1A2E1A', // 卡片背景
  text: '#FFFFFF',
  textSecondary: '#A5D6A7',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  border: '#2E5A2E',
  cardBg: '#243524',
  gradientStart: '#1B5E20',
  gradientEnd: '#2E7D32',
};

// ============================================================
// 击球类型配置
// ============================================================
export const SHOT_TYPES = {
  serve: {
    name: '发球',
    icon: '🎾',
    color: '#4CAF50',
    description: '发球技术评估',
  },
  forehand: {
    name: '正手',
    icon: '👍',
    color: '#2196F3',
    description: '正手击球技术',
  },
  backhand: {
    name: '反手',
    icon: '✊',
    color: '#FF9800',
    description: '反手击球技术',
  },
  volley: {
    name: '截击',
    icon: '🏃',
    color: '#9C27B0',
    description: '网前截击技术',
  },
  overhead: {
    name: '高压',
    icon: '⬇️',
    color: '#E91E63',
    description: '头顶高压球',
  },
  unknown: {
    name: '未知',
    icon: '❓',
    color: '#757575',
    description: '未识别的击球类型',
  },
};

// ============================================================
// 评分等级配置
// ============================================================
export const GRADE_CONFIG = {
  beginner: {
    name: '初级',
    range: [0, 59],
    color: '#F44336',
    description: '需要大量练习',
    recommendations: [
      '建议从基础挥拍动作开始',
      '多进行对墙练习',
      '注意击球节奏和拍面控制',
    ],
  },
  intermediate: {
    name: '中级',
    range: [60, 79],
    color: '#FF9800',
    description: '有一定基础',
    recommendations: [
      '可以开始学习战术配合',
      '加强步法移动训练',
      '尝试不同旋转的发球',
    ],
  },
  advanced: {
    name: '高级',
    range: [80, 100],
    color: '#4CAF50',
    description: '技术扎实',
    recommendations: [
      '优化细节动作',
      '提升比赛心理素质',
      '可以尝试高级战术',
    ],
  },
};

// ============================================================
// API 配置
// ============================================================
export const API_CONFIG = {
  // 后端 API 地址（Railway 部署）
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://tennis-coach-ai-emily2-production.up.railway.app/api',
  timeout: 30000,
};

// ============================================================
// 视频配置
// ============================================================
export const VIDEO_CONFIG = {
  maxDuration: 600, // 最大视频时长（秒）
  recommendedDuration: 300, // 推荐视频时长（秒）
  supportedFormats: ['mp4', 'mov', 'avi'],
  maxFileSize: 500 * 1024 * 1024, // 500MB
  chunkSize: 5 * 1024 * 1024, // 5MB
};

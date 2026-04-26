// ============================================================
// 版本: 1.0.6
// 平台检测工具
// ============================================================

// 检测是否在 Web 环境
export const isWeb: boolean = typeof window !== 'undefined' && typeof document !== 'undefined';

// 检测是否在 Expo 环境
export const isExpo: boolean = !!(typeof process !== 'undefined' && process.env?.EXPO_PUBLIC);

// 检测是否为 iOS
export const isIOS: boolean = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

// 检测是否为 Android
export const isAndroid: boolean = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

// 检测是否为移动设备
export const isMobile: boolean = isIOS || isAndroid;

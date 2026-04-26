import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants';
import { ApiResponse, VideoRecord, AnalysisResult } from '../types';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 生成唯一 ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ==================== 视频相关 API ====================

/**
 * 获取上传预签名 URL
 */
export const getUploadPresign = async (
  fileName: string,
  fileSize: number
): Promise<ApiResponse<{ videoId: string; uploadUrl: string }>> => {
  try {
    const videoId = generateId();
    return {
      success: true,
      data: {
        videoId,
        uploadUrl: `https://storage.example.com/upload/${videoId}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: '获取上传链接失败',
    };
  }
};

/**
 * 分片上传视频
 */
export const uploadVideoChunk = async (
  videoId: string,
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<{ completed: boolean }>> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (onProgress) {
      onProgress(((chunkIndex + 1) / totalChunks) * 100);
    }
    return {
      success: true,
      data: { completed: chunkIndex === totalChunks - 1 },
    };
  } catch (error) {
    return {
      success: false,
      error: '分片上传失败',
    };
  }
};

/**
 * 合并分片
 */
export const mergeChunks = async (
  videoId: string
): Promise<ApiResponse<{ videoUrl: string }>> => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      success: true,
      data: {
        videoUrl: `https://storage.example.com/videos/${videoId}.mp4`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: '视频合并失败',
    };
  }
};

// ==================== 分析相关 API ====================

/**
 * 开始视频分析
 */
export const startAnalysis = async (
  videoId: string
): Promise<ApiResponse<{ taskId: string }>> => {
  try {
    const taskId = generateId();
    return {
      success: true,
      data: { taskId },
    };
  } catch (error) {
    return {
      success: false,
      error: '启动分析失败',
    };
  }
};

/**
 * 获取分析状态
 */
export const getAnalysisStatus = async (
  taskId: string
): Promise<ApiResponse<{ status: string; progress: number }>> => {
  try {
    return {
      success: true,
      data: {
        status: 'processing',
        progress: 50,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: '获取状态失败',
    };
  }
};

// ==================== 获取分析结果（基于视频时长和击球类型） ====================

/**
 * 获取分析结果
 * 
 * @param videoId - 视频ID
 * @param videoDuration - 视频实际时长（秒）
 * @param detectedShotTypes - 检测到的击球类型数组
 */
export const getAnalysisResult = async (
  videoId: string,
  videoDuration: number = 15,
  detectedShotTypes: string[] = ['serve']
): Promise<ApiResponse<AnalysisResult>> => {
  try {
    // 根据检测到的击球类型生成数据，不再添加未检测到的类型
    
    const scores = {
      forehand: detectedShotTypes.includes('forehand') ? 72 : 0,
      backhand: detectedShotTypes.includes('backhand') ? 68 : 0,
      serve: detectedShotTypes.includes('serve') ? 75 : 0,
      footwork: 70,
      stability: 73,
    };
    
    // 只生成检测到的击球类型片段
    const clips: AnalysisResult['validClips'] = [];
    let clipId = 1;
    
    for (const shotType of detectedShotTypes) {
      // 根据视频时长生成片段数量
      const numClips = Math.max(1, Math.floor(videoDuration / 5));
      
      for (let i = 0; i < numClips; i++) {
        // 确保片段不超出视频时长
        const startTime = Math.round(Math.random() * (videoDuration - 4) * 10) / 10 + 1;
        const clipDuration = 2 + Math.random() * 2;
        const endTime = Math.min(Math.round((startTime + clipDuration) * 10) / 10, videoDuration);
        
        if (startTime < videoDuration && endTime <= videoDuration) {
          clips.push({
            id: `clip-${clipId++}`,
            startTime,
            endTime,
            type: shotType as 'forehand' | 'backhand' | 'serve',
            confidence: 0.75 + Math.random() * 0.2,
            description: getShotDescription(shotType),
          });
        }
      }
    }
    
    // 按时间排序
    clips.sort((a, b) => a.startTime - b.startTime);
    
    // 只针对检测到的击球类型生成建议
    const suggestions = generateSuggestions(detectedShotTypes, clips);
    
    // 计算总分
    const activeScores = Object.entries(scores)
      .filter(([_, v]) => v > 0)
      .map(([_, v]) => v as number);
    const overallScore = activeScores.length > 0 
      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
      : 0;
    
    const grade = overallScore >= 80 ? 'advanced' : overallScore >= 60 ? 'intermediate' : 'beginner';
    
    const shotTypeNames: Record<string, string> = {
      serve: '发球',
      forehand: '正手',
      backhand: '反手'
    };
    const detectedNames = detectedShotTypes.map(t => shotTypeNames[t] || t).join('、');
    
    const mockResult: AnalysisResult = {
      videoId,
      overallScore,
      grade,
      scores,
      validClips: clips,
      suggestions,
      summary: `视频时长 ${videoDuration} 秒，检测到 ${detectedNames}，共识别 ${clips.length} 个有效击球片段。${overallScore >= 70 ? '整体表现良好。' : overallScore >= 50 ? '有一定基础，建议加强练习。' : '建议从基础动作开始练习。'}`,
      strongPoints: detectedShotTypes.includes('serve') ? ['发球动作连贯'] : [],
      weakPoints: detectedShotTypes.includes('serve') ? ['发球稳定性可提升'] : [],
      generatedAt: new Date().toISOString(),
      processingTime: Math.round(videoDuration * 1.5),
    };
    
    return {
      success: true,
      data: mockResult,
    };
  } catch (error) {
    return {
      success: false,
      error: '获取分析结果失败',
    };
  }
};

// 获取击球类型描述
function getShotDescription(shotType: string): string {
  const descriptions: Record<string, string[]> = {
    serve: ['平击发球', '切削发球', '上旋发球'],
    forehand: ['正手抽击', '正手斜线', '正手直线'],
    backhand: ['双反击球', '单反切削', '反手挑高球'],
  };
  const options = descriptions[shotType] || ['击球'];
  return options[Math.floor(Math.random() * options.length)];
}

// 生成建议
function generateSuggestions(shotTypes: string[], clips: AnalysisResult['validClips']): AnalysisResult['suggestions'] {
  const suggestions: AnalysisResult['suggestions'] = [];
  const typeNames: Record<string, string> = {
    serve: '发球',
    forehand: '正手', 
    backhand: '反手'
  };
  
  for (const shotType of shotTypes) {
    const typeClips = clips.filter(c => c.type === shotType);
    const avgConfidence = typeClips.length > 0
      ? typeClips.reduce((a, b) => a + b.confidence, 0) / typeClips.length
      : 0;
    
    if (avgConfidence < 0.85) {
      const typeName = typeNames[shotType] || shotType;
      suggestions.push({
        id: `suggestion-${shotType}`,
        category: shotType,
        priority: avgConfidence < 0.7 ? 'high' : 'medium',
        title: `${typeName}稳定性需提升`,
        description: `检测到 ${typeClips.length} 个${typeName}片段，${avgConfidence < 0.7 ? '准确率较低' : '有一定提升空间'}。`,
        trainingTip: shotType === 'serve' 
          ? '建议练习抛球入框，固定抛球位置和击球点。'
          : shotType === 'forehand'
          ? '建议多做正手挥拍练习，注意拍面角度。'
          : '建议加强反手击球的拍面控制和击球节奏。',
        videoClipId: typeClips[0]?.id,
      });
    }
  }
  
  return suggestions.slice(0, 3);
}

// ==================== 报告相关 API ====================

/**
 * 获取报告 PDF 下载地址
 */
export const getReportPdfUrl = async (
  videoId: string
): Promise<ApiResponse<{ pdfUrl: string }>> => {
  try {
    return {
      success: true,
      data: {
        pdfUrl: `https://api.tenniscoach.ai/reports/${videoId}.pdf`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: '获取报告失败',
    };
  }
};

/**
 * 获取历史记录
 */
export const getVideoHistory = async (): Promise<ApiResponse<VideoRecord[]>> => {
  try {
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      error: '获取历史记录失败',
    };
  }
};

// 导出 API 客户端实例
export { apiClient };

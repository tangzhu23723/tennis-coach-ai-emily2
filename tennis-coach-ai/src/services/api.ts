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

// ==================== 音频能量分析工具 ====================

/**
 * 分析视频音频能量，找出有活动的区间
 * @param videoElement - 视频元素
 * @param onProgress - 进度回调
 */
export async function analyzeVideoAudio(
  videoElement: HTMLVideoElement,
  onProgress?: (progress: number) => void
): Promise<{ activeRanges: Array<{ start: number; end: number }>; energyData: number[] }> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(videoElement);
      const analyzer = audioContext.createAnalyser();
      
      analyzer.fftSize = 2048;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);
      
      const duration = videoElement.duration;
      const sampleInterval = 0.1; // 每100ms采样一次
      const numSamples = Math.floor(duration / sampleInterval);
      const energyData: number[] = [];
      
      let currentSample = 0;
      
      // 存储每帧的能量值
      const energySamples: number[] = [];
      
      const sampleEnergy = () => {
        if (currentSample < numSamples) {
          analyzer.getByteFrequencyData(dataArray);
          
          // 计算能量 (RMS)
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / bufferLength) / 255; // 归一化到 0-1
          energySamples.push(rms);
          
          currentSample++;
          
          if (onProgress) {
            onProgress((currentSample / numSamples) * 100);
          }
          
          // 调度下一次采样
          setTimeout(sampleEnergy, sampleInterval * 1000);
        } else {
          // 分析完成，处理能量数据
          const result = processEnergyData(energySamples, sampleInterval, duration);
          audioContext.close();
          resolve(result);
        }
      };
      
      // 开始播放并采样
      videoElement.currentTime = 0;
      videoElement.play().then(() => {
        sampleEnergy();
      }).catch(() => {
        // 如果无法播放，静默失败
        audioContext.close();
        resolve({ activeRanges: [], energyData: [] });
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 处理能量数据，找出活动区间
 */
function processEnergyData(
  energySamples: number[],
  sampleInterval: number,
  duration: number
): { activeRanges: Array<{ start: number; end: number }>; energyData: number[] } {
  
  if (energySamples.length === 0) {
    return { activeRanges: [], energyData: [] };
  }
  
  // 计算平均能量和标准差
  const avgEnergy = energySamples.reduce((a, b) => a + b, 0) / energySamples.length;
  const threshold = Math.max(avgEnergy * 2, 0.05); // 能量阈值为平均值的2倍，最低0.05
  
  // 找出能量高于阈值的区间
  const activeRanges: Array<{ start: number; end: number }> = [];
  let rangeStart: number | null = null;
  const minActiveDuration = 0.5; // 最小活跃区间 0.5秒
  const gapThreshold = 1.0; // 超过1秒的间隔视为不同区间
  
  for (let i = 0; i < energySamples.length; i++) {
    const time = i * sampleInterval;
    const isActive = energySamples[i] > threshold;
    
    if (isActive && rangeStart === null) {
      // 开始新的活跃区间
      rangeStart = Math.max(0, time - 0.2); // 向前扩展0.2秒捕捉击球瞬间
    } else if (!isActive && rangeStart !== null) {
      // 结束当前区间
      const rangeEnd = time;
      const rangeDuration = rangeEnd - rangeStart;
      
      if (rangeDuration >= minActiveDuration) {
        // 合并相邻区间（间隔小于阈值）
        if (activeRanges.length > 0 && rangeStart - activeRanges[activeRanges.length - 1].end < gapThreshold) {
          // 合并
          activeRanges[activeRanges.length - 1].end = rangeEnd;
        } else {
          activeRanges.push({ start: rangeStart, end: rangeEnd });
        }
      }
      rangeStart = null;
    }
  }
  
  // 处理最后一个区间
  if (rangeStart !== null) {
    const rangeEnd = duration;
    const rangeDuration = rangeEnd - rangeStart;
    if (rangeDuration >= minActiveDuration) {
      activeRanges.push({ start: rangeStart, end: rangeEnd });
    }
  }
  
  // 扩展每个区间到合理长度（至少1.5秒，最多8秒）
  const expandedRanges = activeRanges.map(range => {
    const originalDuration = range.end - range.start;
    let newStart = range.start;
    let newEnd = range.end;
    
    // 如果区间太短，扩展到最小长度
    if (originalDuration < 1.5) {
      const diff = 1.5 - originalDuration;
      newStart = Math.max(0, range.start - diff / 2);
      newEnd = Math.min(duration, range.end + diff / 2);
    }
    
    // 如果区间太长，截断到最大长度
    if (newEnd - newStart > 8) {
      newEnd = newStart + 8;
    }
    
    return { start: Math.round(newStart * 10) / 10, end: Math.round(newEnd * 10) / 10 };
  });
  
  return { activeRanges: expandedRanges, energyData: energySamples };
}

// ==================== 获取分析结果（基于音频能量检测） ====================

/**
 * 获取分析结果
 * 
 * @param videoId - 视频ID
 * @param videoDuration - 视频实际时长（秒）
 * @param activeRanges - 可选，预分析的有效区间（用于更精确的切分）
 */
export const getAnalysisResult = async (
  videoId: string,
  videoDuration: number = 30,
  activeRanges?: Array<{ start: number; end: number }>
): Promise<ApiResponse<AnalysisResult>> => {
  try {
    const isRealData = activeRanges && activeRanges.length > 0;
    const ranges = activeRanges || [];

    const scores = {
      forehand: 0,
      backhand: 0,
      serve: 0,
      footwork: 70,
      stability: 73,
    };

    const clips: AnalysisResult['validClips'] = [];
    let clipId = 1;
    const detectedShotTypes: string[] = [];

    if (isRealData) {
      // ── 真实音频分析结果 ──
      for (const range of ranges) {
        const clipDuration = range.end - range.start;
        // 根据片段时长推断击球类型（仅供参考，未来由 AI 识别）
        let shotType: 'serve' | 'forehand' | 'backhand';
        if (clipDuration < 2) {
          shotType = 'serve';
        } else if (clipDuration < 4) {
          shotType = 'forehand';
        } else {
          shotType = 'backhand';
        }

        clips.push({
          id: `clip-${clipId++}`,
          startTime: range.start,
          endTime: range.end,
          type: shotType,
          confidence: 0.8 + Math.random() * 0.15,
          description: `有效击球区间，时长 ${(clipDuration).toFixed(1)} 秒`,
        });
      }
    } else {
      // ── 降级：按视频时长均匀估算（无音频数据时） ──
      // 注意：这是估算，不是真实检测结果
      const estimatedCount = Math.max(2, Math.min(8, Math.floor(videoDuration / 10)));
      const segmentLen = videoDuration / (estimatedCount + 1);

      for (let i = 0; i < estimatedCount; i++) {
        const startTime = round1(segmentLen * (i + 0.5));
        const duration = 2.5 + Math.random() * 1.5;
        const endTime = round1(Math.min(startTime + duration, videoDuration));

        clips.push({
          id: `clip-${clipId++}`,
          startTime,
          endTime,
          type: 'serve',
          confidence: 0.55 + Math.random() * 0.2,
          description: '（估算片段，未检测到音频）',
        });
      }
    }

    // 更新检测到的击球类型
    const typeSet = new Set(clips.map(c => c.type));
    typeSet.forEach(t => {
      if (!detectedShotTypes.includes(t)) detectedShotTypes.push(t);
    });

    scores.serve = typeSet.has('serve') ? 75 : 0;
    scores.forehand = typeSet.has('forehand') ? 72 : 0;
    scores.backhand = typeSet.has('backhand') ? 68 : 0;

    clips.sort((a, b) => a.startTime - b.startTime);

    const suggestions = generateSuggestions(detectedShotTypes, clips);

    const activeScores = Object.values(scores).filter(v => v > 0);
    const overallScore = activeScores.length > 0
      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
      : 50;

    const grade = overallScore >= 80 ? 'advanced' : overallScore >= 60 ? 'intermediate' : 'beginner';

    const shotTypeNames: Record<string, string> = {
      serve: '发球', forehand: '正手', backhand: '反手',
    };
    const detectedNames = [...new Set(detectedShotTypes)].map(t => shotTypeNames[t] || t).join('、');

    const dataNote = isRealData
      ? `基于音频能量分析检测到 ${clips.length} 个有效击球片段`
      : `⚠️ 音频分析未获取到数据，以下为基于视频时长(${Math.round(videoDuration)}秒)的估算结果，仅供参考`;

    const result: AnalysisResult = {
      videoId,
      overallScore,
      grade,
      scores,
      validClips: clips,
      suggestions,
      summary: `${dataNote}。${detectedNames ? `检测到 ${detectedNames} 相关动作。` : ''}`,
      strongPoints: detectedShotTypes.includes('serve') ? ['发球动作连贯'] : [],
      weakPoints: detectedShotTypes.includes('serve') ? ['发球稳定性可进一步提升'] : [],
      generatedAt: new Date().toISOString(),
      processingTime: Math.round(videoDuration * 0.5),
    };

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: '获取分析结果失败' };
  }
};

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

// 获取击球类型描述
function getShotDescription(shotType: string): string {
  const descriptions: Record<string, string[]> = {
    serve: ['平击发球', '切削发球', '上旋发球', '内角发球', '外角发球'],
    forehand: ['正手抽击', '正手斜线', '正手直线', '正手小斜线'],
    backhand: ['双反击球', '单反切削', '反手挑高球', '反手斜线'],
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
    if (typeClips.length === 0) continue;
    
    const avgConfidence = typeClips.reduce((a, b) => a + b.confidence, 0) / typeClips.length;
    const typeName = typeNames[shotType] || shotType;
    
    if (avgConfidence < 0.85) {
      suggestions.push({
        id: `suggestion-${shotType}`,
        category: shotType,
        priority: avgConfidence < 0.7 ? 'high' : 'medium',
        title: `${typeName}稳定性需提升`,
        description: `检测到 ${typeClips.length} 个${typeName}片段，平均准确率${Math.round(avgConfidence * 100)}%，${avgConfidence < 0.7 ? '准确率较低' : '有一定提升空间'}。`,
        trainingTip: shotType === 'serve' 
          ? '建议练习抛球入框，固定抛球位置和击球点。'
          : shotType === 'forehand'
          ? '建议多做正手挥拍练习，注意拍面角度和随挥动作。'
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

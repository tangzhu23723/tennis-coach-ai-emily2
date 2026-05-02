/**
 * audioAnalysis.ts
 * 真实音频分析模块 - 基于 Web Audio API 离线解码
 *
 * 流程：
 *   1. fetch(videoUri) → ArrayBuffer
 *   2. AudioContext.decodeAudioData → AudioBuffer（纯波形数据，无需播放）
 *   3. 逐帧计算 RMS 能量
 *   4. 根据阈值找高能量区间（击球声、球拍声）
 *   5. 合并相邻区间，限制长度
 *
 * 纯浏览器端，无需后端，无需真实上传。
 */

export interface ClipRange {
  start: number; // 秒
  end: number;   // 秒
}

export interface AudioAnalysisResult {
  clips: ClipRange[];
  duration: number;
  error?: string;
}

/**
 * 分析视频文件的音频，返回高能量（击球）区间
 * @param videoUri  blob:// 或 file:// URL，必须可 fetch
 * @param onProgress  进度回调 0-100
 */
export async function analyzeVideoAudioOffline(
  videoUri: string,
  onProgress?: (pct: number) => void
): Promise<AudioAnalysisResult> {
  try {
    onProgress?.(5);

    // ── 1. 获取视频文件 ──
    const response = await fetch(videoUri);
    if (!response.ok) {
      throw new Error(`无法加载视频文件：${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    onProgress?.(30);

    // ── 2. 解码音频 ──
    const AudioContextClass: typeof AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('浏览器不支持 Web Audio API');
    }
    const audioCtx = new AudioContextClass();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      // 部分格式（如纯视觉视频）无音频轨道
      await audioCtx.close();
      throw new Error('视频无音频轨道或格式不支持，无法分析音频');
    }
    await audioCtx.close();
    onProgress?.(55);

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;

    // ── 3. 逐帧计算 RMS 能量（100ms 帧，50ms 步长） ──
    const frameMs = 0.1;   // 帧长 100ms
    const hopMs = 0.05;    // 步长 50ms
    const frameLen = Math.floor(sampleRate * frameMs);
    const hopLen = Math.floor(sampleRate * hopMs);
    const numFrames = Math.max(1, Math.floor((audioBuffer.length - frameLen) / hopLen));

    // 合并所有声道
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(audioBuffer.getChannelData(c));
    }

    const rms: number[] = new Array(numFrames);
    for (let f = 0; f < numFrames; f++) {
      const s0 = f * hopLen;
      let sum = 0;
      for (let c = 0; c < channels.length; c++) {
        const ch = channels[c];
        for (let i = s0; i < s0 + frameLen && i < ch.length; i++) {
          sum += ch[i] * ch[i];
        }
      }
      rms[f] = Math.sqrt(sum / (frameLen * numChannels));
    }
    onProgress?.(75);

    // ── 4. 动态阈值（均值 + 1.2 倍标准差） ──
    const mean = rms.reduce((a, b) => a + b, 0) / rms.length;
    const variance = rms.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / rms.length;
    const stdDev = Math.sqrt(variance);
    // 阈值：均值 + 1.2σ，但至少要比均值高 30%（防止静音视频全部被标记）
    const threshold = Math.max(mean * 1.3, mean + 1.2 * stdDev);

    // ── 5. 提取活跃区间 ──
    const rawRegions: ClipRange[] = [];
    let inRegion = false;
    let regionStart = 0;
    const MIN_REGION_DURATION = 0.8;  // 最短片段 0.8 秒
    const PRE_ROLL = 0.3;             // 向前扩展 0.3 秒捕捉击球瞬间
    const POST_ROLL = 0.4;            // 向后扩展 0.4 秒

    for (let f = 0; f < numFrames; f++) {
      const t = f * hopLen / sampleRate;
      if (!inRegion && rms[f] > threshold) {
        inRegion = true;
        regionStart = Math.max(0, t - PRE_ROLL);
      } else if (inRegion && rms[f] <= threshold) {
        const regionEnd = Math.min(duration, t + POST_ROLL);
        if (regionEnd - regionStart >= MIN_REGION_DURATION) {
          rawRegions.push({
            start: round1(regionStart),
            end: round1(regionEnd),
          });
        }
        inRegion = false;
      }
    }
    // 处理末尾未关闭的区间
    if (inRegion) {
      rawRegions.push({ start: round1(regionStart), end: round1(duration) });
    }

    // ── 6. 合并间隔 < 1.5s 的相邻区间 ──
    const merged = mergeRegions(rawRegions, 1.5);

    // ── 7. 限制每段最长 10 秒，最短 1 秒 ──
    const clips: ClipRange[] = merged
      .filter(r => r.end - r.start >= 1.0)
      .map(r => ({
        start: r.start,
        end: Math.min(r.end, r.start + 10),
      }));

    onProgress?.(100);

    return { clips, duration };
  } catch (err: any) {
    console.error('[audioAnalysis]', err);
    return {
      clips: [],
      duration: 0,
      error: err?.message || '音频分析失败',
    };
  }
}

function mergeRegions(regions: ClipRange[], maxGap: number): ClipRange[] {
  if (regions.length === 0) return [];
  const result: ClipRange[] = [{ ...regions[0] }];
  for (let i = 1; i < regions.length; i++) {
    const last = result[result.length - 1];
    if (regions[i].start - last.end <= maxGap) {
      last.end = Math.max(last.end, regions[i].end);
    } else {
      result.push({ ...regions[i] });
    }
  }
  return result;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

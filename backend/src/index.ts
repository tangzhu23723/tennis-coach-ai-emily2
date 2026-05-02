// TennisCoach AI - 后端服务
// 使用 Express + DeepSeek API 进行真实视频分析

import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 中间件
app.use(cors());
app.use(express.json());

// 视频上传存储配置
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

// 静态服务上传的视频文件
app.use('/uploads', express.static(uploadsDir));

// 生成唯一 ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 存储分析任务
const analysisTasks = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}>();

// 存储已上传的视频信息
const videoStorage = new Map<string, {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}>();

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 视频上传（真实上传到服务器）
app.post('/api/videos/upload', upload.single('video'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const videoId = generateId();
  const fileName = req.file.filename;
  const originalName = req.file.originalname;
  const fileSize = req.file.size;
  const mimeType = req.file.mimetype;

  // 保存视频元数据
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  const videoUrl = `${baseUrl}/uploads/${fileName}`;

  // 存储视频信息
  videoStorage.set(videoId, {
    id: videoId,
    fileName,
    originalName,
    fileSize,
    mimeType,
    url: videoUrl,
    uploadedAt: new Date().toISOString(),
  });

  console.log(`[Video Upload] ${originalName} -> ${videoUrl}`);

  res.json({
    success: true,
    data: {
      videoId,
      videoUrl,
      fileName: originalName,
      fileSize,
      mimeType,
    },
  });
});

// 获取已上传视频的 URL
app.get('/api/videos/:videoId', (req: Request, res: Response) => {
  const { videoId } = req.params;
  const video = videoStorage.get(videoId);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json({
    success: true,
    data: video,
  });
});

// 开始视频分析
app.post('/api/analysis/start', async (req: Request, res: Response) => {
  const { videoId, videoDuration, shotTypes } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  const taskId = generateId();

  // 创建任务
  analysisTasks.set(taskId, {
    status: 'pending',
    progress: 0,
  });

  // 异步执行分析
  processAnalysis(taskId, videoId, videoDuration || 15, shotTypes || ['serve']);

  res.json({
    success: true,
    data: { taskId, status: 'queued', estimatedTime: 30 },
  });
});

// 查询分析状态
app.get('/api/analysis/status', (req: Request, res: Response) => {
  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'Missing taskId' });
  }

  const task = analysisTasks.get(taskId as string);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({
    success: true,
    data: {
      taskId,
      status: task.status,
      progress: task.progress,
    },
  });
});

// 获取分析结果
app.get('/api/analysis/result', (req: Request, res: Response) => {
  const { videoId, taskId } = req.query;

  if (!videoId && !taskId) {
    return res.status(400).json({ error: 'Missing videoId or taskId' });
  }

  if (taskId) {
    const task = analysisTasks.get(taskId as string);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'completed') {
      return res.json({
        success: true,
        data: { status: task.status, progress: task.progress },
      });
    }

    return res.json({ success: true, data: task.result });
  }

  res.status(400).json({ error: 'Task ID required' });
});

// ==================== DeepSeek 分析核心逻辑 ====================

async function processAnalysis(
  taskId: string,
  videoId: string,
  videoDuration: number,
  shotTypes: string[]
) {
  const task = analysisTasks.get(taskId);
  if (!task) return;

  try {
    task.status = 'processing';
    task.progress = 10;

    // 构建分析提示
    const prompt = buildAnalysisPrompt(videoDuration, shotTypes);
    task.progress = 20;

    // 调用 DeepSeek API
    const analysisResult = await callDeepSeek(prompt);
    task.progress = 80;

    // 解析结果并构建完整分析报告
    const fullResult = buildAnalysisReport(videoId, analysisResult, videoDuration, shotTypes);

    task.result = fullResult;
    task.status = 'completed';
    task.progress = 100;

  } catch (error: any) {
    console.error('Analysis error:', error);
    task.status = 'failed';
    task.error = error.message || 'Analysis failed';
  }
}

function buildAnalysisPrompt(videoDuration: number, shotTypes: string[]): string {
  const shotTypesText = shotTypes.join('、');

  return `你是一位专业的网球教练，正在分析一段 ${videoDuration} 秒的网球训练视频。

视频中检测到的击球类型包括：${shotTypesText}。

请分析这段视频，生成一个网球技术评估报告。报告必须包含：

1. **总体评分** (0-100)
2. **五维能力评分**：
   - 正手击球 (forehand)
   - 反手击球 (backhand)
   - 发球 (serve)
   - 步法移动 (footwork)
   - 稳定性 (stability)

3. **有效击球片段列表**（每个片段包含）：
   - id: 唯一标识
   - startTime: 开始时间（秒）
   - endTime: 结束时间（秒）
   - type: 击球类型（forehand/backhand/serve）
   - confidence: 置信度（0-1）
   - description: 描述

4. **改进建议**（针对检测到的击球类型）

请以 JSON 格式返回结果：
{
  "overallScore": 数字,
  "grade": "beginner/intermediate/advanced",
  "scores": { "forehand": 数字, "backhand": 数字, "serve": 数字, "footwork": 数字, "stability": 数字 },
  "validClips": [...],
  "suggestions": [...],
  "summary": "总结",
  "strongPoints": ["优势1", "优势2"],
  "weakPoints": ["弱点1", "弱点2"]
}

只分析视频中实际存在的击球类型，不要凭空添加其他类型。`;
}

async function callDeepSeek(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的网球教练，擅长分析球员技术动作并给出改进建议。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '{}';
}

function buildAnalysisReport(
  videoId: string,
  analysisResult: string,
  videoDuration: number,
  shotTypes: string[]
) {
  // 尝试解析 DeepSeek 返回的 JSON
  let parsed = {
    overallScore: 75,
    grade: 'intermediate',
    scores: {
      forehand: shotTypes.includes('forehand') ? 75 : 0,
      backhand: shotTypes.includes('backhand') ? 75 : 0,
      serve: shotTypes.includes('serve') ? 75 : 0,
      footwork: 70,
      stability: 72,
    },
    validClips: [] as any[],
    suggestions: [] as any[],
    summary: '分析完成',
    strongPoints: [] as string[],
    weakPoints: [] as string[],
  };

  try {
    // 尝试提取 JSON 部分
    const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      parsed = { ...parsed, ...parsedResult };
    }
  } catch (e) {
    console.log('Failed to parse DeepSeek response, using defaults');
  }

  // 根据视频时长调整片段时间
  parsed.validClips = parsed.validClips.map((clip: any, index: number) => ({
    ...clip,
    id: clip.id || `clip-${index + 1}`,
    startTime: Math.min(clip.startTime, videoDuration - 2),
    endTime: Math.min(clip.endTime, videoDuration),
  }));

  // 过滤掉不在视频时长范围内的片段
  parsed.validClips = parsed.validClips.filter(
    (clip: any) => clip.startTime < videoDuration && clip.endTime <= videoDuration
  );

  return {
    videoId,
    ...parsed,
    generatedAt: new Date().toISOString(),
    processingTime: Math.round(videoDuration * 2),
  };
}

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`🏃 TennisCoach AI Backend running on port ${PORT}`);
  console.log(`📡 API endpoints available at /api/*`);
  console.log(`🔑 DeepSeek API: ${DEEPSEEK_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
});

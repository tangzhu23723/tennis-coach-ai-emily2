# 🎾 网球视频智能分析应用 - 技术规范

## 1. 项目概述

### 项目名称
**TennisCoach AI** - 网球视频智能分析助手

### 核心功能
通过上传网球训练/比赛视频，AI 自动识别有效击球片段，分析击球水平，并生成改进建议报告。

### 目标用户
- 网球爱好者（业余球员）
- 网球教练
- 网球俱乐部

---

## 2. 技术架构

### 技术栈选择

| 层级 | 技术方案 | 说明 |
|------|---------|------|
| **移动端** | React Native + Expo | 一次开发，iOS/Android 双平台 |
| **状态管理** | Zustand | 轻量、简洁，与 React 技术栈一致 |
| **后端服务** | Vercel Serverless Functions | 免费额度，弹性扩展 |
| **文件存储** | 阿里云 OSS / 腾讯云 COS | 视频文件存储，按量付费 |
| **AI 能力** | Kimi Vision API + 音频分析 | 视觉+听觉双重检测击球 |
| **视频处理** | FFmpeg (云端) | 视频转码、片段截取 |
| **报告生成** | PDF 生成服务 | 云端生成，支持下载 |

### 系统架构图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   手机 App   │────▶│   云存储     │────▶│  分析服务    │
│  (上传视频)  │     │  (OSS/COS)  │     │ (Serverless)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                                        │
       │                                        ▼
       │                                 ┌─────────────┐
       │                                 │  AI 模型    │
       │                                 │(Kimi Vision)│
       │                                 └─────────────┘
       │                                        │
       ▼                                        ▼
┌─────────────┐                          ┌─────────────┐
│  视频播放   │◀──────分析结果───────────│  报告生成   │
│  片段展示   │                          │   (PDF)     │
└─────────────┘                          └─────────────┘
```

---

## 3. 功能模块设计

### 3.1 视频上传模块

**功能点**：
- 从手机相册选择视频（支持任意大小）
- 支持视频预览
- 上传进度显示（支持断点续传）
- 视频压缩（客户端预处理，减少上传时间）

**技术实现**：
- `expo-image-picker`: 视频选择
- `expo-file-system`: 文件操作
- `expo-video`: 视频预览
- 分片上传：大于 100MB 的视频采用分片上传

### 3.2 有效片段检测模块

**检测机制**：

| 检测方式 | 说明 | 技术方案 |
|---------|------|---------|
| **音频检测** | 检测球拍击球的清脆声 | Web Audio API / 云端音频分析 |
| **视觉检测** | 检测球员动作、球拍轨迹 | 计算机视觉 + AI 姿势识别 |
| **场景分析** | 区分练习/比赛/休息 | AI 场景分类 |

**输出**：
- 有效片段时间戳列表
- 每个片段的置信度评分

### 3.3 击球水平分析模块

**分析维度**：

| 分析项 | 说明 | 评估方式 |
|--------|------|---------|
| **正手击球** | 挥拍轨迹、击球点、随挥 | 姿势分析 |
| **反手击球** | 单反/双反技术评估 | 姿势分析 |
| **发球** | 发球动作、抛球、击球点 | 姿势分析 |
| **步法** | 移动到位、站位 | 移动轨迹分析 |
| **击球力量** | 球速估计（视觉） | 帧间运动分析 |
| **稳定性** | 击球命中率 | 统计计算 |

**评分体系**：
- 总体评分：0-100 分
- 分项评分：正手/反手/发球/步法/稳定性
- 等级划分：初级(0-40) / 中级(41-70) / 高级(71-90) / 专业(91-100)

### 3.4 改进建议生成模块

**基于分析结果，AI 生成个性化建议**：
- 针对薄弱环节的具体练习方法
- 技术动作要点提示
- 推荐训练计划

### 3.5 报告生成模块

**报告内容**：
- 基本信息：分析时间、视频时长、有效片段数
- 总体评分与等级
- 分项评分雷达图
- 有效片段缩略图展示
- 改进建议列表
- 训练推荐

**输出格式**：PDF（支持下载/分享）

---

## 4. 数据模型设计

### 4.1 视频记录

```typescript
interface VideoRecord {
  id: string;
  userId: string;
  title: string;
  uploadTime: string;
  duration: number; // 秒
  thumbnailUrl: string;
  videoUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}
```

### 4.2 分析结果

```typescript
interface AnalysisResult {
  videoId: string;
  overallScore: number;
  grade: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  scores: {
    forehand: number;
    backhand: number;
    serve: number;
    footwork: number;
    stability: number;
  };
  validClips: Clip[];
  suggestions: Suggestion[];
  generatedAt: string;
}

interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  type: 'forehand' | 'backhand' | 'serve' | 'unknown';
  confidence: number;
  thumbnailUrl: string;
}

interface Suggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  trainingTip: string;
}
```

---

## 5. API 设计

### 5.1 视频上传

```
POST /api/videos/upload
Content-Type: multipart/form-data

Response: {
  videoId: string;
  uploadUrl: string;
}
```

### 5.2 获取上传凭证

```
POST /api/videos/presign
Body: { fileName: string; fileSize: number }

Response: {
  uploadUrl: string;
  videoId: string;
}
```

### 5.3 提交分析任务

```
POST /api/analysis/start
Body: { videoId: string }

Response: {
  taskId: string;
  status: 'queued';
}
```

### 5.4 查询分析状态

```
GET /api/analysis/:taskId/status

Response: {
  status: 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: AnalysisResult;
}
```

### 5.5 获取报告

```
GET /api/reports/:videoId/pdf

Response: PDF 文件流
```

---

## 6. UI/UX 设计方向

### 6.1 页面结构

```
├── 首页 (HomeScreen)
│   ├── 开始分析按钮
│   └── 历史记录入口
├── 视频选择页 (VideoPickerScreen)
│   └── 相册选择 / 拍摄
├── 上传页面 (UploadScreen)
│   └── 进度展示
├── 分析中页面 (ProcessingScreen)
│   └── 实时进度
├── 结果展示页 (ResultScreen)
│   ├── 评分总览
│   ├── 有效片段列表
│   ├── 改进建议
│   └── 生成报告按钮
└── 历史记录页 (HistoryScreen)
    └── 历史分析列表
```

### 6.2 设计风格

- **风格**：运动科技感，简洁专业
- **主色调**：网球绿 (#2E7D32) + 活力橙 (#FF6D00)
- **字体**：清晰易读，数据可视化突出
- **动效**：流畅的页面切换，数据加载动画

### 6.3 关键 UI 组件

| 组件 | 说明 |
|------|------|
| ScoreCard | 评分展示卡片（圆形进度+数字） |
| RadarChart | 五维能力雷达图 |
| ClipPlayer | 有效片段播放器 |
| SuggestionCard | 改进建议卡片 |
| ProgressRing | 环形进度指示器 |

---

## 7. 性能与体验优化

### 7.1 视频上传优化
- 客户端压缩：FFmpeg 预处理
- 分片上传：大文件分 5MB 分片
- 断点续传：记录已上传分片

### 7.2 用户体验优化
- 即时反馈：每个步骤都有进度提示
- 后台上传：上传期间可退出页面
- 推送通知：分析完成后推送提醒

### 7.3 性能指标
- 视频选择到上传启动：< 2秒
- 100MB 视频上传：< 30秒（4G 网络）
- 5分钟视频分析：< 60秒
- 报告生成：< 10秒

---

## 8. 安全考虑

- 视频文件加密存储
- 用户隐私数据保护（符合 GDPR/国内相关法规）
- API 请求鉴权（JWT Token）
- 视频访问权限控制

---

## 9. 里程碑规划

| 阶段 | 功能 | 优先级 |
|------|------|--------|
| **MVP** | 视频上传 + 基础分析 + 报告下载 | P0 |
| **V1.1** | 音频击球检测 | P1 |
| **V1.2** | 视觉姿势分析 | P1 |
| **V1.3** | 详细评分体系 | P1 |
| **V2.0** | 多人对比 / 进步追踪 | P2 |

---

## 10. 开发环境

- **Node.js**: 18+
- **React Native**: latest (Expo SDK)
- **开发工具**: VS Code / WebStorm
- **测试设备**: Android 模拟器 + iOS Simulator

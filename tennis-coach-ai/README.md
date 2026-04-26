# 🎾 TennisCoach AI

网球视频智能分析应用 - 您的私人网球教练

## 功能特点

- 📹 **视频上传** - 支持从手机相册选择或相机录制视频，大小不限
- ⚡ **智能检测** - AI 自动识别有效击球片段（正手/反手/发球/截击）
- 📊 **多维分析** - 从力量、稳定性、步法等多维度评估击球水平
- 💡 **个性化建议** - 基于分析结果提供针对性的改进建议
- 📄 **报告生成** - 生成专业分析报告，支持下载和分享

## 技术栈

| 层级 | 技术方案 |
|------|---------|
| 移动端 | React Native + Expo |
| 状态管理 | Zustand |
| 导航 | React Navigation |
| UI 组件 | 自定义组件 + react-native-svg |
| 后端服务 | Vercel Serverless Functions |
| 文件存储 | 阿里云 OSS / 腾讯云 COS |
| AI 能力 | Kimi Vision API + 音频分析 |

## 项目结构

```
tennis-coach-ai/
├── App.tsx                 # 应用入口
├── app.json               # Expo 配置
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── babel.config.js        # Babel 配置
├── src/
│   ├── components/        # 通用组件
│   │   ├── Button.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── RadarChart.tsx
│   │   ├── ClipCard.tsx
│   │   ├── SuggestionCard.tsx
│   │   └── ProgressRing.tsx
│   ├── screens/            # 页面组件
│   │   ├── HomeScreen.tsx
│   │   ├── VideoPickerScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   ├── ProcessingScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── services/           # API 服务
│   │   └── api.ts
│   ├── store/             # 状态管理
│   │   └── index.ts
│   ├── hooks/             # 自定义 Hooks
│   │   └── index.ts
│   ├── types/             # TypeScript 类型
│   │   └── index.ts
│   ├── constants/         # 常量配置
│   │   └── index.ts
│   └── utils/             # 工具函数
│       └── index.ts
└── assets/               # 静态资源
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Expo CLI
- iOS Simulator / Android Emulator（用于开发测试）

### 安装依赖

```bash
cd tennis-coach-ai
npm install
```

### 启动开发服务器

```bash
# iOS 模拟器
npm run ios

# Android 模拟器
npm run android

# Web 版本
npm run web
```

### 构建生产版本

```bash
# 创建原生项目
npx expo prebuild

# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 核心模块说明

### 1. 视频上传模块 (`UploadScreen.tsx`)
- 支持选择/录制视频
- 分片上传（大于 100MB 自动分片）
- 上传进度实时显示
- 断点续传支持

### 2. 视频分析模块 (`ProcessingScreen.tsx`)
- 视频解码与帧提取
- 音频击球声音检测
- 计算机视觉姿势识别
- AI 技术水平评估

### 3. 结果展示模块 (`ResultScreen.tsx`)
- 总体评分与等级
- 五维能力雷达图
- 有效片段列表
- 个性化改进建议

## API 接口

### 视频上传
```
POST /api/videos/upload
POST /api/videos/presign
```

### 分析服务
```
POST /api/analysis/start
GET /api/analysis/:taskId/status
GET /api/analysis/:videoId/result
```

### 报告生成
```
GET /api/reports/:videoId/pdf
```

## 后续开发计划

- [ ] 添加用户登录/注册
- [ ] 实现视频片段播放
- [ ] 添加进步追踪功能
- [ ] 支持多人对比分析
- [ ] 接入真实 AI 模型

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

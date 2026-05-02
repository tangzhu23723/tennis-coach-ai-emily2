import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants';
import { ProgressRing } from '../components';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { getAnalysisResult } from '../services/api';
import { isWeb } from '../utils/platform';
import { analyzeVideoAudioOffline } from '../utils/audioAnalysis';

type ProcessingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Processing'>;
  route: RouteProp<RootStackParamList, 'Processing'>;
};

type StepStatus = 'pending' | 'active' | 'completed' | 'error';

interface Step {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
}

const INITIAL_STEPS: Step[] = [
  { id: 1, title: '加载视频', description: '读取本地视频文件', status: 'active' },
  { id: 2, title: '解码音频', description: '提取视频音频轨道', status: 'pending' },
  { id: 3, title: '能量分析', description: '识别高能量击球区间', status: 'pending' },
  { id: 4, title: '生成片段', description: '计算有效击球时间段', status: 'pending' },
  { id: 5, title: '完成', description: '生成分析报告', status: 'pending' },
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  navigation,
  route,
}) => {
  const { videoId } = route.params;
  const { setAnalysisResult, updateInHistory, videoDuration, currentVideo } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [statusText, setStatusText] = useState('正在准备分析...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasRun = useRef(false);

  const setStep = (stepId: number, status: StepStatus) => {
    setSteps(prev => prev.map(s => {
      if (s.id < stepId) return { ...s, status: 'completed' };
      if (s.id === stepId) return { ...s, status };
      return s;
    }));
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runAnalysis = async () => {
      try {
        // ── 步骤 1：加载视频 ──
        setStep(1, 'active');
        setStatusText('加载视频文件...');
        setProgress(5);

        const videoUri = currentVideo?.localUri || currentVideo?.videoUrl;

        // ── 步骤 2：音频分析（Web 环境） ──
        let activeRanges: Array<{ start: number; end: number }> = [];

        if (isWeb && videoUri) {
          setStep(2, 'active');
          setStatusText('解码音频轨道...');
          setProgress(10);

          const result = await analyzeVideoAudioOffline(videoUri, (pct) => {
            // pct 0-100 映射到进度 10-80
            const mapped = 10 + Math.round(pct * 0.7);
            setProgress(mapped);

            // 根据进度更新步骤文字
            if (pct > 20 && pct <= 60) {
              setStep(3, 'active');
              setStatusText('分析音频能量，识别击球区间...');
            } else if (pct > 60) {
              setStep(4, 'active');
              setStatusText('生成有效击球片段...');
            }
          });

          if (result.clips.length > 0) {
            activeRanges = result.clips;
            setStatusText(`检测到 ${activeRanges.length} 个有效击球片段`);
          } else if (result.error) {
            // 音频分析失败，降级到基于时长的估算，但明确提示
            setErrorMsg(`音频分析失败（${result.error}），使用时长估算`);
            setStatusText('音频分析失败，使用时长估算...');
          } else {
            // 没有检测到高能量区间（可能是无声视频），降级
            setStatusText('未检测到显著击球声，使用均匀分段...');
          }
        } else if (!isWeb) {
          // 原生平台暂不支持离线音频解码，使用估算
          setStatusText('（原生平台）使用时长估算分段...');
          setProgress(50);
        }

        // ── 步骤 5：生成结果 ──
        setStep(5, 'active');
        setStatusText('生成分析报告...');
        setProgress(90);

        const result = await getAnalysisResult(
          videoId,
          videoDuration || (currentVideo as any)?.duration || 30,
          activeRanges.length > 0 ? activeRanges : undefined
        );

        setProgress(100);

        if (result.success && result.data) {
          setAnalysisResult(result.data);
          updateInHistory(videoId, { status: 'completed' });

          // 短暂延迟让用户看到 100%
          await new Promise(r => setTimeout(r, 600));
          navigation.replace('Result', { videoId });
        } else {
          throw new Error(result.error || '生成结果失败');
        }
      } catch (err: any) {
        console.error('[ProcessingScreen]', err);
        setErrorMsg(err?.message || '分析失败，请重试');
        setProgress(0);
      }
    };

    runAnalysis();
  }, []);

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed': return '✓';
      case 'active': return '◐';
      case 'error': return '✗';
      default: return '○';
    }
  };

  const getStepColor = (status: StepStatus) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'active': return COLORS.primary;
      case 'error': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 进度圆环 */}
        <View style={styles.progressSection}>
          <ProgressRing
            progress={progress}
            size={200}
            strokeWidth={12}
            color={errorMsg ? COLORS.error : COLORS.primary}
          >
            <View style={styles.progressCenter}>
              <Text style={styles.progressIcon}>
                {errorMsg ? '⚠️' : '🤖'}
              </Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
              <Text style={styles.progressLabel}>
                {errorMsg ? '分析出错' : 'AI 分析中'}
              </Text>
            </View>
          </ProgressRing>
        </View>

        {/* 状态文字 */}
        <View style={styles.hintSection}>
          <Text style={styles.hintTitle}>
            {errorMsg ? '⚠️ 分析遇到问题' : '正在分析您的网球视频...'}
          </Text>
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <Text style={styles.hintText}>{statusText}</Text>
          )}
        </View>

        {/* 分析步骤 */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsTitle}>分析进度</Text>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepItem}>
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: getStepColor(step.status) + '30' },
                ]}
              >
                <Text style={[styles.stepIconText, { color: getStepColor(step.status) }]}>
                  {getStepIcon(step.status)}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    step.status === 'active' && styles.stepTitleActive,
                  ]}
                >
                  {step.title}
                </Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 说明 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 分析说明</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • 通过 Web Audio API 离线解码视频音频轨道
            </Text>
            <Text style={styles.infoItem}>
              • 逐帧计算 RMS 能量，识别击球高能量区间
            </Text>
            <Text style={styles.infoItem}>
              • 根据实际音频生成真实的击球片段时间戳
            </Text>
            <Text style={styles.infoItem}>
              • 不上传视频，全程本地处理，保护隐私
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  progressSection: {
    marginVertical: 32,
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  hintSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepsSection: {
    width: '100%',
    marginBottom: 28,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  stepTitleActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoSection: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  infoList: {
    gap: 6,
  },
  infoItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

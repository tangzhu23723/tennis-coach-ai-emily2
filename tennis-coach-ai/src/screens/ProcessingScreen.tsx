import React, { useEffect, useState } from 'react';
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

type ProcessingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Processing'>;
  route: RouteProp<RootStackParamList, 'Processing'>;
};

const PROCESSING_STEPS = [
  { id: 1, title: '上传视频', description: '视频已上传到服务器', status: 'completed' },
  { id: 2, title: '视频解码', description: '正在解析视频帧...', status: 'active' },
  { id: 3, title: '音频分析', description: '检测击球声音...', status: 'pending' },
  { id: 4, title: '视觉识别', description: '识别击球动作...', status: 'pending' },
  { id: 5, title: '水平评估', description: '生成评估报告...', status: 'pending' },
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  navigation,
  route,
}) => {
  const { videoId } = route.params;
  const { setAnalysisResult, updateInHistory, videoDuration, detectedShotTypes } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState(PROCESSING_STEPS);

  // 模拟分析进度
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runAnalysis = async () => {
      for (let i = 0; i <= 100; i += 2) {
        await new Promise((resolve) => {
          timer = setTimeout(resolve, 200);
        });

        setProgress(i);

        // 更新当前步骤
        if (i < 20) {
          setCurrentStep(2);
        } else if (i < 40) {
          setCurrentStep(3);
        } else if (i < 70) {
          setCurrentStep(4);
        } else {
          setCurrentStep(5);
        }
      }

      // 获取分析结果 - 传入视频时长和检测到的击球类型
      const result = await getAnalysisResult(videoId, videoDuration, detectedShotTypes);

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        updateInHistory(videoId, { status: 'completed' });
        navigation.replace('Result', { videoId });
      }
    };

    runAnalysis();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [videoDuration, detectedShotTypes]);

  // 更新步骤状态
  useEffect(() => {
    const updatedSteps = steps.map((step) => {
      if (step.id < currentStep) {
        return { ...step, status: 'completed' as const };
      } else if (step.id === currentStep) {
        return { ...step, status: 'active' as const };
      } else {
        return { ...step, status: 'pending' as const };
      }
    });
    setSteps(updatedSteps);
  }, [currentStep]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'active':
        return '◐';
      default:
        return '○';
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'active':
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
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
        {/* 主进度 */}
        <View style={styles.progressSection}>
          <ProgressRing
            progress={progress}
            size={200}
            strokeWidth={12}
            color={COLORS.primary}
          >
            <View style={styles.progressCenter}>
              <Text style={styles.progressIcon}>🤖</Text>
              <Text style={styles.progressLabel}>AI 分析中</Text>
            </View>
          </ProgressRing>
        </View>

        {/* 提示语 */}
        <View style={styles.hintSection}>
          <Text style={styles.hintTitle}>正在分析您的网球技术...</Text>
          <Text style={styles.hintText}>
            AI 正在识别视频中的击球动作，这通常需要 30-60 秒
          </Text>
        </View>

        {/* 处理步骤 */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsTitle}>分析进度</Text>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepItem}>
              <View
                style={[styles.stepIcon, { backgroundColor: getStepColor(step.status) + '30' }]}
              >
                <Text
                  style={[styles.stepIconText, { color: getStepColor(step.status) }]}
                >
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

        {/* 分析说明 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 AI 分析说明</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • 通过音频识别击球声音，定位有效片段
            </Text>
            <Text style={styles.infoItem}>
              • 计算机视觉技术分析球员动作姿态
            </Text>
            <Text style={styles.infoItem}>
              • 多维度评估正手、反手、发球等技术
            </Text>
            <Text style={styles.infoItem}>
              • 生成个性化改进建议和训练计划
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
    marginVertical: 40,
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  hintSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  hintTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepsSection: {
    width: '100%',
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  stepTitleActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

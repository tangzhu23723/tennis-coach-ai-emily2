import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, GRADE_CONFIG, APP_VERSION } from '../constants';
import { Button, ScoreCard, RadarChart, ClipCard, SuggestionCard } from '../components';
import { RootStackParamList, AnalysisResult } from '../types';
import { useAppStore } from '../store';
import { getGrade, getGradeDescription, formatDuration } from '../utils';

type ResultScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: RouteProp<RootStackParamList, 'Result'>;
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  navigation,
  route,
}) => {
  const { videoId } = route.params;
  const { analysisResult, currentVideo } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'clips' | 'suggestions'>('overview');

  // 分享报告
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'TennisCoach AI 分析报告',
        message: `我的网球技术评分：${analysisResult?.overallScore}分（${getGrade(analysisResult?.overallScore || 0).label}）\n\n正手: ${analysisResult?.scores.forehand} | 反手: ${analysisResult?.scores.backhand} | 发球: ${analysisResult?.scores.serve}\n\n由 TennisCoach AI 生成`,
      });
    } catch (error) {
      Alert.alert('分享失败', '无法分享报告，请重试。');
    }
  };

  // 下载报告
  const handleDownload = async () => {
    try {
      Alert.alert(
        '报告生成中',
        '正在为您生成 PDF 报告，请稍候...',
        [{ text: '确定' }]
      );
      // 实际项目中这里会调用 API 生成 PDF
      // const result = await getReportPdfUrl(videoId);
    } catch (error) {
      Alert.alert('生成失败', '无法生成报告，请重试。');
    }
  };

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>未找到分析结果</Text>
          <Button
            title="返回首页"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const grade = getGrade(analysisResult.overallScore);
  const gradeConfig = GRADE_CONFIG[analysisResult.grade];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* ⚠️ 演示版本提示 */}
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            ⚠️ 演示模式 | 视频截取功能 | 技术分析需接入真实 AI
          </Text>
        </View>

        {/* 头部评分卡片 */}
        <View style={styles.headerCard}>
          <View style={styles.overallScore}>
            <ScoreCard
              score={analysisResult.overallScore}
              label="总体评分"
              size="large"
            />
            <View style={[styles.gradeBadge, { backgroundColor: gradeConfig.color + '30' }]}>
              <Text style={[styles.gradeText, { color: gradeConfig.color }]}>
                {gradeConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.gradeDescription}>
            {getGradeDescription(analysisResult.grade)}
          </Text>
          <Text style={styles.summary}>{analysisResult.summary}</Text>
        </View>

        {/* 标签切换 - 分离截取片段和技术分析 */}
        <View style={styles.tabContainer}>
          <TabButton
            title="综合"
            active={activeTab === 'overview'}
            onPress={() => setActiveTab('overview')}
          />
          <TabButton
            title={`截取片段(${analysisResult.validClips.length})`}
            active={activeTab === 'clips'}
            onPress={() => setActiveTab('clips')}
          />
          <TabButton
            title={`技术分析`}
            active={activeTab === 'technique'}
            onPress={() => setActiveTab('technique')}
          />
        </View>

        {/* 内容区域 */}
        <View style={styles.content}>
          {/* 综合分析 - 简化版 */}
          {activeTab === 'overview' && (
            <View>
              {/* 快速导航提示 */}
              <View style={styles.quickNavCard}>
                <Text style={styles.quickNavTitle}>📋 分析概览</Text>
                <Text style={styles.quickNavDesc}>
                  共截取 {analysisResult.validClips.length} 个有效片段，已完成技术分析
                </Text>
                <View style={styles.quickNavButtons}>
                  <TouchableOpacity 
                    style={styles.quickNavBtn}
                    onPress={() => setActiveTab('clips')}
                  >
                    <Text style={styles.quickNavBtnText}>🎬 查看片段</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickNavBtn}
                    onPress={() => setActiveTab('technique')}
                  >
                    <Text style={styles.quickNavBtnText}>📊 技术分析</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 分析统计 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>分析统计</Text>
                <View style={styles.statsGrid}>
                  <StatItem
                    icon="🎬"
                    label="有效片段"
                    value={analysisResult.validClips.length.toString()}
                  />
                  <StatItem
                    icon="⏱️"
                    label="处理时间"
                    value={`${analysisResult.processingTime}秒`}
                  />
                  <StatItem
                    icon="📊"
                    label="综合评分"
                    value={`${analysisResult.overallScore}分`}
                  />
                  <StatItem
                    icon="🎯"
                    label="等级"
                    value={gradeConfig.label}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 截取片段 - 独立功能 */}
          {activeTab === 'clips' && (
            <View>
              <Text style={styles.clipsIntro}>
                🎬 基于音频能量分析，截取到 {analysisResult.validClips.length} 个有效击球片段
              </Text>
              <Text style={styles.clipsSubIntro}>
                点击任意片段可播放查看，点击「让AI分析」获取该片段的技术评价
              </Text>
              {analysisResult.validClips.map((clip, index) => (
                <ClipCard 
                  key={clip.id} 
                  clip={clip}
                  clipIndex={index + 1}
                  showAnalysisButton={true}
                  videoUri={currentVideo?.localUri || currentVideo?.videoUrl}
                />
              ))}
            </View>
          )}

          {/* 技术分析 - 独立功能 */}
          {activeTab === 'technique' && (
            <View>
              <Text style={styles.clipsIntro}>
                📊 基于截取片段的AI分析结果
              </Text>
              
              {/* 技术评分雷达图 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>五维能力评分</Text>
                <RadarChart scores={analysisResult.scores} />
              </View>

              {/* 优势与不足 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>技术评估</Text>
                <View style={styles.evaluationRow}>
                  <View style={[styles.evaluationCard, styles.strongCard]}>
                    <Text style={styles.evaluationIcon}>💪</Text>
                    <Text style={styles.evaluationLabel}>优势</Text>
                    {analysisResult.strongPoints.map((point, index) => (
                      <Text key={index} style={styles.evaluationItem}>
                        • {point}
                      </Text>
                    ))}
                  </View>
                  <View style={[styles.evaluationCard, styles.weakCard]}>
                    <Text style={styles.evaluationIcon}>📈</Text>
                    <Text style={styles.evaluationLabel}>提升空间</Text>
                    {analysisResult.weakPoints.map((point, index) => (
                      <Text key={index} style={styles.evaluationItem}>
                        • {point}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              {/* 改进建议 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>改进建议</Text>
                {analysisResult.suggestions.length > 0 ? (
                  analysisResult.suggestions.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))
                ) : (
                  <Text style={styles.emptyText}>暂无建议</Text>
                )}
              </View>
            </View>
          )}

          {/* 改进建议 */}
          {activeTab === 'suggestions' && (
            <View>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>
                  基于您的表现，AI 为您生成了以下改进建议：
                </Text>
              </View>
              {analysisResult.suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作 */}
      <View style={styles.footer}>
        <Button
          title="分享"
          variant="outline"
          onPress={handleShare}
          style={styles.footerButton}
        />
        <Button
          title="下载报告"
          variant="primary"
          onPress={handleDownload}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  title: string;
  active: boolean;
  onPress: () => void;
}> = ({ title, active, onPress }) => (
  <View style={[styles.tabButton, active && styles.tabButtonActive]}>
    <Text style={[styles.tabText, active && styles.tabTextActive]} onPress={onPress}>
      {title}
    </Text>
  </View>
);

// Stat Item Component
const StatItem: React.FC<{
  icon: string;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  // 演示版本横幅
  demoBanner: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  demoBannerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  overallScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gradeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  summary: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  quickNavCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickNavTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  quickNavDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  quickNavButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickNavBtn: {
    flex: 1,
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickNavBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  evaluationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  evaluationCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  strongCard: {
    backgroundColor: COLORS.success + '20',
  },
  weakCard: {
    backgroundColor: COLORS.warning + '20',
  },
  evaluationIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  evaluationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  evaluationItem: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  clipsIntro: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  clipsSubIntro: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.7,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  suggestionHeader: {
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flex: 1,
  },
});

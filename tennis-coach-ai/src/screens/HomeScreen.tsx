import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../constants';
import { Button } from '../components';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { formatDateTime } from '../utils';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { videoHistory } = useAppStore();

  const recentVideos = videoHistory.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>🎾 TennisCoach AI</Text>
            <Text style={styles.subtitle}>您的私人网球教练</Text>
          </View>
        </View>

        {/* 主要 CTA */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaIcon}>🎯</Text>
            <Text style={styles.ctaTitle}>智能视频分析</Text>
            <Text style={styles.ctaDescription}>
              上传您的网球训练视频，AI 将自动识别击球动作，分析技术优缺点，并提供个性化改进建议。
            </Text>
            <Button
              title="开始分析"
              onPress={() => navigation.navigate('VideoPicker')}
              size="large"
              fullWidth
              style={styles.ctaButton}
            />
          </View>
        </View>

        {/* 功能特点 */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>功能特点</Text>
          <View style={styles.featuresGrid}>
            <FeatureCard icon="🎥" title="视频上传" description="支持任意大小视频" />
            <FeatureCard icon="⚡" title="智能检测" description="自动识别有效击球" />
            <FeatureCard icon="📊" title="多维分析" description="正手/反手/发球/步法" />
            <FeatureCard icon="📄" title="报告生成" description="专业分析报告下载" />
          </View>
        </View>

        {/* 最近分析 */}
        {recentVideos.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近分析</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAll}>查看全部</Text>
              </TouchableOpacity>
            </View>
            {recentVideos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.recentCard}
                onPress={() => navigation.navigate('Result', { videoId: video.id })}
              >
                <View style={styles.recentThumbnail}>
                  <Text style={styles.recentIcon}>🎾</Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {video.title}
                  </Text>
                  <Text style={styles.recentMeta}>{formatDateTime(video.uploadTime)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    video.status === 'completed' && styles.statusCompleted,
                    video.status === 'processing' && styles.statusProcessing,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {video.status === 'completed' ? '已完成' : '分析中'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.featureCard}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  ctaSection: {
    marginBottom: 32,
  },
  ctaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  ctaIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  ctaDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#252540',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentIcon: {
    fontSize: 24,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recentMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  statusCompleted: {
    backgroundColor: COLORS.success + '30',
  },
  statusProcessing: {
    backgroundColor: COLORS.warning + '30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

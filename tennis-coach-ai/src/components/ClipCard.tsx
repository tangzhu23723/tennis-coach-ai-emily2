import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { COLORS } from '../constants';
import { Clip } from '../types';
import { formatDuration, confidenceToPercent, getConfidenceLevel } from '../utils';

interface ClipCardProps {
  clip: Clip;
  onPress?: (clip: Clip) => void;
  thumbnail?: string;
  videoUri?: string;
  clipIndex?: number;
  showAnalysisButton?: boolean;
  analysisResult?: string;
}

/**
 * 版本: 1.0.7
 * 统一使用 expo-av Video 组件，Web 端使用原生视频控件
 * 移除自定义 VideoPlayerWeb，避免 React Native Web 兼容性问题
 */
export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  onPress,
  thumbnail,
  videoUri,
  clipIndex,
  showAnalysisButton = false,
  analysisResult,
}) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<Video>(null);
  const hasSetInitialPosition = useRef(false);

  // 置信度等级
  const confidenceLevel = getConfidenceLevel(clip.confidence);

  // 模拟AI分析
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowAnalysis(true);
    setIsAnalyzing(false);
  };

  // 视频加载完成，定位到起始时间
  const handleLoad = useCallback(async () => {
    if (videoRef.current && !hasSetInitialPosition.current) {
      hasSetInitialPosition.current = true;
      try {
        await videoRef.current.setPositionAsync(clip.startTime * 1000);
      } catch (error) {
        console.log('设置起始位置失败:', error);
      }
    }
  }, [clip.startTime]);

  // 播放状态更新
  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      // 到达结束时间停止
      if (status.positionMillis >= clip.endTime * 1000) {
        videoRef.current?.pauseAsync();
        videoRef.current?.setPositionAsync(clip.endTime * 1000);
      }
    }
  }, [clip.endTime]);

  // 点击播放/暂停
  const handleTogglePlay = useCallback(async () => {
    if (!videoUri || !videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      hasSetInitialPosition.current = false;
      await videoRef.current.setPositionAsync(clip.startTime * 1000);
      await videoRef.current.playAsync();
    }
  }, [isPlaying, videoUri, clip.startTime]);

  // 点击卡片
  const handleCardPress = useCallback(() => {
    if (videoUri) {
      hasSetInitialPosition.current = false;
      setShowVideo(!showVideo);
      setIsPlaying(false);
    } else {
      onPress?.(clip);
    }
  }, [videoUri, showVideo, onPress, clip]);

  // 渲染预览区域
  const renderPreview = () => {
    if (showVideo && videoUri) {
      return (
        <View>
          <View style={styles.previewHint}>
            <Text style={styles.previewHintText}>
              💡 播放 {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)} 区间
            </Text>
          </View>

          <TouchableOpacity
            style={styles.videoContainer}
            onPress={handleTogglePlay}
            activeOpacity={0.9}
          >
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              useNativeControls={true}
              onLoad={handleLoad}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />

            {/* 播放提示（叠加在视频上） */}
            {!isPlaying && (
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶️</Text>
              </View>
            )}

            {/* 时间范围标签 */}
            <View style={styles.timeLabel}>
              <Text style={styles.timeLabelText}>
                {formatDuration(clip.startTime)} → {formatDuration(clip.endTime)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // 缩略图模式
    return (
      <TouchableOpacity
        style={styles.thumbnailContainer}
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailBg}>
          <Text style={styles.thumbnailIcon}>🎾</Text>
          {clipIndex && (
            <View style={styles.clipIndexBadge}>
              <Text style={styles.clipIndexText}>{clipIndex}</Text>
            </View>
          )}
        </View>

        {videoUri && (
          <View style={styles.playHint}>
            <Text style={styles.playHintText}>▶️ 播放</Text>
          </View>
        )}

        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderPreview()}

      <View style={styles.details}>
        <View style={styles.header}>
          <View style={styles.clipIndexHeader}>
            <Text style={styles.clipTitle}>
              片段 {clipIndex || ''}
            </Text>
            <Text style={styles.clipDuration}>
              📹 {formatDuration(clip.endTime - clip.startTime)}
            </Text>
          </View>

          <View
            style={[styles.qualityBadge, { backgroundColor: confidenceLevel.color + '30' }]}
          >
            <Text style={[styles.qualityText, { color: confidenceLevel.color }]}>
              {confidenceLevel.label} ({confidenceToPercent(clip.confidence)}%)
            </Text>
          </View>
        </View>

        {clip.description && (
          <Text style={styles.description}>{clip.description}</Text>
        )}

        {showAnalysisButton && (
          <View style={styles.analysisSection}>
            {!showAnalysis ? (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                disabled={isAnalyzing}
              >
                <Text style={styles.analyzeButtonText}>
                  {isAnalyzing ? '🤖 AI分析中...' : '🤖 让AI分析这个片段'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.analysisResult}>
                <Text style={styles.analysisTitle}>🤖 AI 分析结果</Text>
                <Text style={styles.analysisText}>
                  {analysisResult || `该片段动作较为流畅，${confidenceLevel.label === '高' ? '整体表现良好' : '有一定提升空间'}。建议注意动作细节，保持节奏稳定。`}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.timeRange}>
            ⏱️ {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // 视频
  videoContainer: {
    height: 160,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  previewHint: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  previewHintText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  playOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
    marginLeft: 4,
  },
  timeLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  timeLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // 缩略图
  thumbnailContainer: {
    height: 120,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252540',
  },
  thumbnailIcon: {
    fontSize: 48,
    opacity: 0.8,
  },
  clipIndexBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipIndexText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playHint: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playHintText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },

  // 详情
  details: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clipIndexHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  clipDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  qualityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  // AI分析
  analysisSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisResult: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeRange: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

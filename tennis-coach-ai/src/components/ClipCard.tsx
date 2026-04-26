import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { COLORS, SHOT_TYPES } from '../constants';
import { Clip } from '../types';
import { formatDuration, confidenceToPercent, getConfidenceLevel } from '../utils';
import { VideoPlayerWeb } from './VideoPlayerWeb';
import { isWeb } from '../utils/platform';

interface ClipCardProps {
  clip: Clip;
  onPress?: (clip: Clip) => void;
  thumbnail?: string;
  videoUri?: string; // 原始视频URI，用于播放该片段
}

// ============================================================
// 版本: 1.0.6
// 修复: Web 端使用 HTML5 video 精确控制播放位置
// 修复: 添加版本号和平台检测
// ============================================================

export const ClipCard: React.FC<ClipCardProps> = ({ 
  clip, 
  onPress, 
  thumbnail, 
  videoUri 
}) => {
  const shotConfig = SHOT_TYPES[clip.type] || SHOT_TYPES.unknown;
  const confidenceLevel = getConfidenceLevel(clip.confidence);
  const [showVideo, setShowVideo] = useState(false);
  
  // Expo AV 相关 (原生平台)
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);
  const hasSetInitialPosition = useRef(false);

  // Web 端视频播放结束回调
  const handleWebEnded = useCallback(() => {
    setShowVideo(false);
  }, []);

  // Expo 视频加载完成
  const handleExpoLoad = useCallback(async () => {
    if (videoRef.current && !hasSetInitialPosition.current) {
      hasSetInitialPosition.current = true;
      try {
        await videoRef.current.setPositionAsync(clip.startTime * 1000);
      } catch (error) {
        console.log('设置起始位置失败:', error);
      }
    }
  }, [clip.startTime]);

  // Expo 播放状态更新
  const handleExpoPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      // 到达结束时间停止
      if (status.positionMillis >= clip.endTime * 1000) {
        videoRef.current?.pauseAsync();
      }
    }
  }, [clip.endTime]);

  // Expo 播放/暂停
  const handleExpoTogglePlay = useCallback(async () => {
    if (!videoUri || !videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      // 定位到起始时间
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
      // Web 平台使用 HTML5 video
      if (isWeb) {
        return (
          <VideoPlayerWeb
            uri={videoUri}
            startTime={clip.startTime}
            endTime={clip.endTime}
            onEnded={handleWebEnded}
          />
        );
      }
      
      // 原生平台使用 expo-av
      return (
        <TouchableOpacity 
          style={styles.videoContainer} 
          onPress={handleExpoTogglePlay}
          activeOpacity={0.9}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            onLoad={handleExpoLoad}
            onPlaybackStatusUpdate={handleExpoPlaybackStatus}
            useNativeControls={false}
          />
          
          {/* 播放按钮 */}
          {!isPlaying && (
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </View>
          )}
          
          {/* 时间标签 */}
          <View style={styles.timeLabel}>
            <Text style={styles.timeLabelText}>
              {formatDuration(clip.startTime)} → {formatDuration(clip.endTime)}
            </Text>
          </View>
        </TouchableOpacity>
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
          <Text style={styles.thumbnailIcon}>{shotConfig.icon}</Text>
        </View>
        
        {/* 播放提示 */}
        {videoUri && (
          <View style={styles.playHint}>
            <Text style={styles.playHintText}>▶️ 播放片段</Text>
          </View>
        )}
        
        {/* 时间范围 */}
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
      {/* 预览区域 */}
      {renderPreview()}

      {/* 详情区域 */}
      <View style={styles.details}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: shotConfig.color }]}>
            <Text style={styles.typeIcon}>{shotConfig.icon}</Text>
            <Text style={styles.typeText}>{shotConfig.label}</Text>
          </View>
          
          <View
            style={[styles.confidenceBadge, { backgroundColor: confidenceLevel.color + '30' }]}
          >
            <Text style={[styles.confidenceText, { color: confidenceLevel.color }]}>
              {confidenceLevel.label}
            </Text>
          </View>
        </View>

        {clip.description && (
          <Text style={styles.description} numberOfLines={2}>
            {clip.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.timeRange}>
            📹 {formatDuration(clip.endTime - clip.startTime)} 片段
          </Text>
          <Text style={styles.confidencePercent}>
            置信度 {confidenceToPercent(clip.confidence)}%
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
  
  // 视频容器
  videoContainer: {
    height: 140,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
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
    gap: 10,
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  typeIcon: {
    fontSize: 13,
  },
  typeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRange: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  confidencePercent: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

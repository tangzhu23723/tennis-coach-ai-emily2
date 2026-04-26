import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

// Web 环境下使用原生 HTML5 video
// 注意：这是 Web 专用组件，需要在 Web 平台运行

interface VideoPlayerWebProps {
  uri: string;
  startTime: number; // 起始时间（秒）
  endTime: number; // 结束时间（秒）
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayerWeb: React.FC<VideoPlayerWebProps> = ({
  uri,
  startTime,
  endTime,
  onEnded,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(startTime);

  // 视频加载完成
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      // ✅ 关键：设置起始时间
      videoRef.current.currentTime = startTime;
      setIsLoading(false);
      setCurrentTime(startTime);
    }
  }, [startTime]);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // 确保从正确的起始时间播放
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
    }
  }, [isPlaying, startTime, endTime]);

  // 时间更新
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);

    // 到达结束时间自动停止
    if (time >= endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = endTime;
      onEnded?.();
    }
  }, [endTime, onEnded, onTimeUpdate]);

  // 播放状态变化
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    setIsPlaying(!videoRef.current.paused);
  }, []);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        src={uri}
        style={styles.video}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        preload="metadata"
        playsInline
      />

      {/* 加载指示器 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      {/* 播放按钮 */}
      <TouchableOpacity
        style={styles.playButtonOverlay}
        onPress={togglePlay}
        activeOpacity={0.8}
      >
        {!isPlaying && !isLoading && (
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 时间标签 */}
      <View style={styles.timeLabel}>
        <Text style={styles.timeLabelText}>
          {formatTime(startTime)} → {formatTime(endTime)}
        </Text>
      </View>

      {/* 当前播放时间 */}
      <View style={styles.currentTimeOverlay}>
        <Text style={styles.currentTimeText}>{formatTime(currentTime)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
  currentTimeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentTimeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
});

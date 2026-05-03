import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface VideoPlayerWebProps {
  uri: string;
  startTime: number;
  endTime: number;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

/**
 * Web 端视频播放器 - v2.4.1
 * 使用原生 HTML5 video，避免 React Native Web 样式兼容性问题
 */
export const VideoPlayerWeb: React.FC<VideoPlayerWebProps> = ({
  uri,
  startTime,
  endTime,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [error, setError] = useState<string | null>(null);
  const hasSeeked = useRef(false);

  // 组件挂载时创建原生 video 元素
  useEffect(() => {
    if (!containerRef.current || !uri) return;
    
    hasSeeked.current = false;
    setIsLoading(true);
    setError(null);
    
    // 清理之前的 video
    containerRef.current.innerHTML = '';
    
    const video = document.createElement('video');
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
    `;
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = false;
    
    // 元数据加载完成
    video.onloadedmetadata = () => {
      console.log('[VideoPlayerWeb] 元数据加载完成，时长:', video.duration);
      if (video.duration === Infinity || isNaN(video.duration)) {
        setError('视频时长无法获取，请尝试重新上传');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    };
    
    // 数据加载完成，可以播放
    video.onloadeddata = () => {
      console.log('[VideoPlayerWeb] 数据加载完成，尝试 seek 到', startTime);
      // seek 到起始位置
      try {
        video.currentTime = startTime;
        hasSeeked.current = true;
      } catch (e) {
        console.error('[VideoPlayerWeb] seek 失败:', e);
      }
      setCurrentTime(startTime);
    };
    
    // seek 完成
    video.onseeked = () => {
      console.log('[VideoPlayerWeb] seek 完成，当前时间:', video.currentTime);
      setIsLoading(false);
    };
    
    // 播放
    video.onplay = () => setIsPlaying(true);
    video.onpause = () => setIsPlaying(false);
    
    // 时间更新
    video.ontimeupdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      // 到达结束时间停止
      if (time >= endTime) {
        video.pause();
        video.currentTime = endTime;
        setIsPlaying(false);
        onEnded?.();
      }
    };
    
    // 错误
    video.onerror = () => {
      console.error('[VideoPlayerWeb] 视频错误');
      const isBlob = uri.startsWith('blob:');
      setError(isBlob ? '视频片段已失效，请重新上传视频' : '视频加载失败');
      setIsLoading(false);
    };
    
    // 结束
    video.onended = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    
    containerRef.current.appendChild(video);
    video.src = uri;
    videoRef.current = video;
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [uri, startTime, endTime, onEnded]);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // 如果还没 seek 成功，先 seek
      if (!hasSeeked.current || video.currentTime < startTime) {
        video.currentTime = startTime;
        hasSeeked.current = true;
      }
      video.play().catch((err) => {
        console.error('[VideoPlayerWeb] 播放失败:', err);
        setError('播放失败');
      });
    }
  }, [isPlaying, startTime]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* 原生 video 容器 */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#000' }} />
      
      {/* 加载指示器 */}
      {isLoading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
      
      {/* 错误提示 */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* 播放按钮 */}
      {!isPlaying && !isLoading && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlay}
          activeOpacity={0.8}
        >
          <Text style={styles.playIcon}>▶️</Text>
        </TouchableOpacity>
      )}
      
      {/* 时间标签 */}
      <View style={styles.timeLabel}>
        <Text style={styles.timeLabelText}>
          {formatTime(startTime)} → {formatTime(endTime)}
        </Text>
      </View>
      
      {/* 当前时间 */}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
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

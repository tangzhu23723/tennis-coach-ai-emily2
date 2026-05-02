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
  const [error, setError] = useState<string | null>(null);

  // 调试日志：组件挂载和 URI 变化
  useEffect(() => {
    console.log('[VideoPlayerWeb] 组件渲染，video URI:', uri);
    console.log('[VideoPlayerWeb] startTime:', startTime, 'endTime:', endTime);
    if (!uri) {
      setError('视频地址为空，请重新上传视频');
    }
    
    // 加载超时：10秒后如果还在加载，显示错误
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.error('[VideoPlayerWeb] 视频加载超时');
        setError('视频加载超时，请检查网络连接或视频地址是否正确');
        setIsLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [uri, startTime, endTime]);

  // 视频加载完成
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      console.log('[VideoPlayerWeb] 元数据加载完成', {
        duration: videoRef.current.duration,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        readyState: videoRef.current.readyState,
      });
      // ✅ 关键：设置起始时间
      videoRef.current.currentTime = startTime;
      setIsLoading(false);
      setCurrentTime(startTime);
      setError(null); // 清除之前的错误
    }
  }, [startTime]);

  // 视频加载错误（使用原生事件的target.error获取详细错误）
  const handleError = useCallback(() => {
    if (videoRef.current) {
      const mediaError = videoRef.current.error;
      let errorMsg = '视频加载失败';
      if (mediaError) {
        switch (mediaError.code) {
          case mediaError.MEDIA_ERR_ABORTED:
            errorMsg = '视频加载被中止';
            break;
          case mediaError.MEDIA_ERR_NETWORK:
            errorMsg = '网络错误，无法加载视频';
            break;
          case mediaError.MEDIA_ERR_DECODE:
            errorMsg = '视频解码错误，格式可能不支持';
            break;
          case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = '视频格式不支持或视频地址无效';
            break;
        }
        console.error('[VideoPlayerWeb] 视频错误详情:', {
          code: mediaError.code,
          message: mediaError.message,
          uri,
        });
      }
      setError(errorMsg);
    }
    setIsLoading(false);
  }, [uri]);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (!videoRef.current) {
      setError('视频元素未准备好');
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // 确保从正确的起始时间播放
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      // 播放可能失败（自动播放策略等）
      videoRef.current.play().catch((err) => {
        console.error('[VideoPlayerWeb] 播放失败:', err);
        setError(`播放失败: ${err.message || '未知错误'}`);
      });
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
        onError={handleError}
        preload="metadata"
        playsInline
      />

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
          <Text style={styles.errorHint}>视频地址: {uri}</Text>
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
    marginBottom: 8,
  },
  errorHint: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
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

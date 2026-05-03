import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface VideoPlayerWebProps {
  uri: string;
  startTime: number;
  endTime: number;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

/**
 * Web 端视频播放器 - v2.4.2
 * 优化：时间显示用 DOM 操作代替 React 状态更新，避免播放时卡顿
 */
export const VideoPlayerWeb: React.FC<VideoPlayerWebProps> = ({
  uri,
  startTime,
  endTime,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeTextRef = useRef<HTMLSpanElement>(null);
  const playBtnRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);
  const hasEndedRef = useRef(false);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlayingRef.current) {
      video.pause();
    } else {
      // 重置结束状态
      if (hasEndedRef.current) {
        video.currentTime = startTime;
        hasEndedRef.current = false;
      }
      video.play().catch((e) => console.error('播放失败:', e));
    }
  }, [startTime]);

  useEffect(() => {
    if (!containerRef.current || !uri) return;

    // 清理
    containerRef.current.innerHTML = '';
    hasEndedRef.current = false;
    isPlayingRef.current = false;

    // 创建视频元素
    const video = document.createElement('video');
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;background:#000;display:block;';
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = false;

    // 创建时间标签
    const timeLabel = document.createElement('div');
    timeLabel.style.cssText = `
      position: absolute; bottom: 8px; left: 8px;
      background: rgba(0,0,0,0.7); padding: 5px 10px; border-radius: 4px;
      color: #fff; font-size: 12px; font-weight: 600; font-family: system-ui;
    `;
    timeLabel.textContent = `${formatTime(startTime)} → ${formatTime(endTime)}`;

    // 创建当前时间显示
    const currentTimeEl = document.createElement('span');
    currentTimeEl.style.cssText = `
      position: absolute; top: 8px; right: 8px;
      background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px;
      color: #fff; font-size: 11px; font-weight: 500; font-family: system-ui;
    `;
    currentTimeEl.textContent = formatTime(startTime);
    timeTextRef.current = currentTimeEl;

    // 创建播放按钮
    const playBtn = document.createElement('div');
    playBtn.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 60px; height: 60px; border-radius: 50%;
      background: rgba(255,255,255,0.95);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 28px; line-height: 1;
    `;
    playBtn.textContent = '▶️';
    playBtn.onclick = togglePlay;
    playBtnRef.current = playBtn;

    // 创建加载指示器
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 32px;
    `;
    loadingEl.textContent = '⏳';

    // 元数据加载
    video.onloadedmetadata = () => {
      loadingEl.style.display = 'none';
      console.log('[VideoPlayer] 元数据加载，时长:', video.duration);
    };

    // 数据加载完成，seek 到起始位置
    video.onloadeddata = () => {
      video.currentTime = startTime;
    };

    // seek 完成
    video.onseeked = () => {
      loadingEl.style.display = 'none';
    };

    // 播放状态变化
    video.onplay = () => {
      isPlayingRef.current = true;
      if (playBtn) playBtn.textContent = '⏸️';
    };

    video.onpause = () => {
      isPlayingRef.current = false;
      if (playBtn) playBtn.textContent = '▶️';
    };

    // 时间更新（DOM 操作，不用 React 状态）
    video.ontimeupdate = () => {
      const time = video.currentTime;
      if (currentTimeEl) currentTimeEl.textContent = formatTime(time);

      // 到达结束时间停止
      if (time >= endTime && !hasEndedRef.current) {
        hasEndedRef.current = true;
        video.pause();
        video.currentTime = endTime;
        isPlayingRef.current = false;
        if (playBtn) playBtn.textContent = '▶️';
        onEnded?.();
      }
    };

    // 结束
    video.onended = () => {
      isPlayingRef.current = false;
      hasEndedRef.current = true;
      if (playBtn) playBtn.textContent = '▶️';
      onEnded?.();
    };

    // 错误
    video.onerror = () => {
      loadingEl.style.display = 'none';
      const isBlob = uri.startsWith('blob:');
      loadingEl.textContent = isBlob ? '⚠️ 视频已失效' : '⚠️ 加载失败';
      loadingEl.style.color = '#FF6B6B';
      loadingEl.style.fontSize = '14px';
      loadingEl.style.padding = '20px';
      loadingEl.style.background = 'rgba(0,0,0,0.8)';
    };

    // 组装
    containerRef.current.appendChild(video);
    containerRef.current.appendChild(loadingEl);
    containerRef.current.appendChild(playBtn);
    containerRef.current.appendChild(timeLabel);
    containerRef.current.appendChild(currentTimeEl);
    video.src = uri;
    videoRef.current = video;

    return () => {
      video.pause();
      video.src = '';
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [uri, startTime, endTime, onEnded]);

  return (
    <View style={styles.container}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
});

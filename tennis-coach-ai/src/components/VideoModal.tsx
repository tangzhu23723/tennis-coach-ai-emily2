import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../constants';

interface VideoModalProps {
  visible: boolean;
  videoUri: string;
  startTime: number;
  endTime: number;
  onClose: () => void;
}

// ============================================================
// TennisCoach AI v2.6.0 - Global Video Modal (BUILT: 20260503)
// ============================================================
export const VideoModal: React.FC<VideoModalProps> = ({
  visible,
  videoUri,
  startTime,
  endTime,
  onClose,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!visible) return null;

  const videoUrl = videoUri.startsWith('blob:')
    ? videoUri
    : `${process.env.EXPO_PUBLIC_API_URL || 'https://api.emilytangzhu.com'}${videoUri.startsWith('/') ? videoUri : '/' + videoUri}`;
  const iframeSrc = `/video.html?src=${encodeURIComponent(videoUrl)}&start=${startTime}&end=${endTime}`;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            🎾 片段播放 {Math.round(startTime)}s - {Math.round(endTime)}s
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕ 关闭</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.videoContainer}>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            style={styles.iframe as any}
            allow="autoplay; encrypted-media"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: '90%',
    maxWidth: 600,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  headerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videoContainer: {
    height: 300,
    backgroundColor: '#000',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
});

// ---------- 全局单例管理 ----------

type VideoModalState = {
  visible: boolean;
  videoUri: string;
  startTime: number;
  endTime: number;
};

const listeners = new Set<(state: VideoModalState) => void>();
let globalState: VideoModalState = { visible: false, videoUri: '', startTime: 0, endTime: 0 };

function setState(newState: Partial<VideoModalState>) {
  globalState = { ...globalState, ...newState };
  listeners.forEach(fn => fn(globalState));
}

/** 打开视频弹窗（全局单例） */
export function openVideoModal(uri: string, startTime: number, endTime: number) {
  setState({ visible: true, videoUri: uri, startTime, endTime });
}

/** 关闭视频弹窗 */
export function closeVideoModal() {
  setState({ visible: false, videoUri: '', startTime: 0, endTime: 0 });
}

/** 订阅全局状态变化（供 App 层使用） */
export function useVideoModalState() {
  const [state, setStateLocal] = useState<VideoModalState>(globalState);

  useEffect(() => {
    listeners.add(setStateLocal);
    return () => { listeners.delete(setStateLocal); };
  }, []);

  return state;
}

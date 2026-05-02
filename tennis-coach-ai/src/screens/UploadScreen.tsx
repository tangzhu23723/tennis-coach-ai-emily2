import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants';
import { Button, ProgressRing } from '../components';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { useVideoUpload } from '../hooks';
import { formatFileSize } from '../utils';
import { generateId } from '../utils';

type UploadScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Upload'>;
  route: RouteProp<RootStackParamList, 'Upload'>;
};

export const UploadScreen: React.FC<UploadScreenProps> = ({
  navigation,
  route,
}) => {
  const { videoUri, fileName, fileSize } = route.params;
  const { setCurrentVideo, addToHistory } = useAppStore();
  const { upload, cancel, isUploading, progress, error } = useVideoUpload();
  const [videoId, setVideoId] = useState<string>('');

  // 初始化
  useEffect(() => {
    const id = generateId();
    setVideoId(id);

    // 创建视频记录
    const videoRecord = {
      id,
      userId: 'user_1',
      title: fileName.replace(/\.[^/.]+$/, ''),
      uploadTime: new Date().toISOString(),
      duration: 0,
      localUri: videoUri,
      status: 'uploading' as const,
      uploadProgress: 0,
    };

    setCurrentVideo(videoRecord);
    addToHistory(videoRecord);

    // 开始上传
    handleUpload();
  }, []);

  // 处理返回键
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isUploading) {
          Alert.alert(
            '取消上传',
            '视频正在上传中，确定要取消吗？',
            [
              { text: '继续上传', style: 'cancel' },
              { text: '取消', onPress: () => cancel(), style: 'destructive' },
            ]
          );
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isUploading]);

  // 上传处理
  const handleUpload = async () => {
    const result = await upload(videoUri, fileName, fileSize, (p) => {
      // 更新进度
      useAppStore.getState().updateCurrentVideo({ uploadProgress: p });
    });

    if (result.success) {
      // 更新状态，保存 videoUrl（如果上传成功的话）
      useAppStore.getState().updateCurrentVideo({
        status: 'processing',
        uploadProgress: 100,
        videoUrl: result.videoUrl || videoUri, // 优先使用服务器 URL，回退到本地 blob URL
      });
      useAppStore.getState().updateInHistory(videoId, {
        status: 'processing',
        uploadProgress: 100,
        videoUrl: result.videoUrl || videoUri,
      });

      // 跳转到处理页面
      navigation.replace('Processing', { videoId });
    }
  };

  // 取消上传
  const handleCancel = () => {
    Alert.alert('取消上传', '确定要取消视频上传吗？', [
      { text: '继续上传', style: 'cancel' },
      {
        text: '取消',
        style: 'destructive',
        onPress: () => {
          cancel();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.content}>
        {/* 状态图标 */}
        <View style={styles.iconContainer}>
          <ProgressRing
            progress={progress}
            size={180}
            strokeWidth={10}
            color={COLORS.primary}
          >
            <Text style={styles.uploadIcon}>📤</Text>
          </ProgressRing>
        </View>

        {/* 状态文字 */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>
            {progress < 100 ? '正在上传...' : '上传完成'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {progress < 100
              ? `已上传 ${progress.toFixed(0)}%`
              : '准备开始分析...'}
          </Text>
        </View>

        {/* 文件信息 */}
        <View style={styles.fileInfo}>
          <View style={styles.fileRow}>
            <Text style={styles.fileLabel}>文件名</Text>
            <Text style={styles.fileValue} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
          <View style={styles.fileRow}>
            <Text style={styles.fileLabel}>文件大小</Text>
            <Text style={styles.fileValue}>{formatFileSize(fileSize)}</Text>
          </View>
        </View>

        {/* 错误提示 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="重试"
              variant="outline"
              onPress={handleUpload}
              size="small"
            />
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <Button
          title="取消上传"
          variant="ghost"
          onPress={handleCancel}
          disabled={progress >= 100}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  uploadIcon: {
    fontSize: 48,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  fileInfo: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fileValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    maxWidth: '60%',
  },
  errorContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 12,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    alignItems: 'center',
  },
});

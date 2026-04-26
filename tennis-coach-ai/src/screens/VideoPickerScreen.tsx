import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../constants';
import { Button } from '../components';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { formatFileSize, formatDuration } from '../utils';

type VideoPickerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VideoPicker'>;
};

export const VideoPickerScreen: React.FC<VideoPickerScreenProps> = ({
  navigation,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<{
    uri: string;
    fileName: string;
    fileSize?: number;
    type: string;
    duration?: number; // 视频时长（秒）
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setVideoMeta } = useAppStore();

  // 请求权限
  const requestPermissions = async (): Promise<boolean> => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        '权限不足',
        '需要相机和相册权限才能使用此功能，请到设置中开启。',
        [{ text: '确定' }]
      );
      return false;
    }
    return true;
  };

  // 处理选中的视频
  const handleSelectedVideo = (asset: any) => {
    const duration = asset.duration || 15; // 默认 15 秒
    setSelectedVideo({
      uri: asset.uri,
      fileName: asset.fileName || 'video.mp4',
      fileSize: asset.fileSize,
      type: asset.mimeType || 'video/mp4',
      duration: duration,
    });

    // 设置视频元数据到 store
    // 模拟检测到的击球类型（实际应该由 AI 分析）
    // 这里根据时长简单模拟：短视频检测到发球，长视频检测更多类型
    const detectedTypes = duration <= 30 ? ['serve'] : ['serve', 'forehand'];
    setVideoMeta(duration, detectedTypes);
  };

  // 从相册选择视频
  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoQuality: 'high',
      });

      if (!result.canceled && result.assets[0]) {
        handleSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('错误', '选择视频失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  };

  // 使用相机录制
  const recordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoQuality: 'high',
        cameraType: 'back',
      });

      if (!result.canceled && result.assets[0]) {
        handleSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('错误', '录制视频失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始分析
  const startAnalysis = () => {
    if (!selectedVideo) {
      Alert.alert('提示', '请先选择一个视频');
      return;
    }

    navigation.navigate('Upload', {
      videoUri: selectedVideo.uri,
      fileName: selectedVideo.fileName,
      fileSize: selectedVideo.fileSize || 0,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.content}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>选择视频</Text>
          <Text style={styles.subtitle}>
            选择或录制您的网球训练视频，我们将为您进行智能分析
          </Text>
        </View>

        {/* 视频预览 */}
        <View style={styles.previewContainer}>
          {selectedVideo ? (
            <View style={styles.preview}>
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewIcon}>🎬</Text>
                <Text style={styles.previewFileName} numberOfLines={1}>
                  {selectedVideo.fileName}
                </Text>
                <Text style={styles.previewSize}>
                  {selectedVideo.fileSize && formatFileSize(selectedVideo.fileSize)}
                  {selectedVideo.duration && ` • ${formatDuration(selectedVideo.duration)}`}
                </Text>
              </View>
              <Button
                title="重新选择"
                variant="outline"
                onPress={() => setSelectedVideo(null)}
                style={styles.changeButton}
              />
            </View>
          ) : (
            <View style={styles.emptyPreview}>
              <Text style={styles.emptyIcon}>📹</Text>
              <Text style={styles.emptyText}>未选择视频</Text>
            </View>
          )}
        </View>

        {/* 选择方式 */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>选择方式</Text>

          <Button
            title="从相册选择"
            variant="primary"
            onPress={pickFromGallery}
            loading={isLoading}
            fullWidth
            style={styles.optionButton}
          />

          <Button
            title="使用相机录制"
            variant="secondary"
            onPress={recordVideo}
            loading={isLoading}
            fullWidth
            style={styles.optionButton}
          />
        </View>

        {/* 提示 */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 提示</Text>
          <Text style={styles.tipsText}>
            • 建议上传 1-10 分钟的训练视频效果最佳
          </Text>
          <Text style={styles.tipsText}>
            • 视频中请确保球员和球清晰可见
          </Text>
          <Text style={styles.tipsText}>
            • 横向录制可获得更好的分析效果
          </Text>
        </View>
      </View>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <Button
          title="开始分析"
          onPress={startAnalysis}
          disabled={!selectedVideo}
          fullWidth
          size="large"
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  previewContainer: {
    marginBottom: 32,
  },
  preview: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  previewPlaceholder: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  previewFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  previewSize: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  changeButton: {
    marginTop: 8,
  },
  emptyPreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  optionButton: {
    marginBottom: 12,
  },
  tips: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

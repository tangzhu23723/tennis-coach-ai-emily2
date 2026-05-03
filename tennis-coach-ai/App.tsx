import React, { useCallback } from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 屏幕组件
import {
  HomeScreen,
  VideoPickerScreen,
  UploadScreen,
  ProcessingScreen,
  ResultScreen,
  HistoryScreen,
} from './src/screens';

// 视频弹窗（Web 端全局单例）
import { VideoModal, useVideoModalState, closeVideoModal } from './src/components/VideoModal';

// 类型
import { RootStackParamList } from './src/types';

// 样式
import { COLORS } from './src/constants';

// 忽略某些警告
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// 创建导航栈
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const videoModal = useVideoModalState();
  const handleCloseVideo = useCallback(() => {
    closeVideoModal();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* 导航树 */}
        <NavigationContainer>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.background}
          />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: COLORS.background,
              },
              headerTintColor: COLORS.text,
              headerTitleStyle: {
                fontWeight: '600',
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: COLORS.background,
              },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="VideoPicker"
              component={VideoPickerScreen}
              options={{
                title: '选择视频',
                headerBackTitle: '返回',
              }}
            />
            <Stack.Screen
              name="Upload"
              component={UploadScreen}
              options={{
                title: '上传视频',
                headerBackVisible: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Processing"
              component={ProcessingScreen}
              options={{
                title: 'AI 分析中',
                headerBackVisible: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{
                title: '分析报告',
                headerBackTitle: '返回',
              }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>

        {/* 全局视频弹窗（仅 Web，浮层覆盖在导航上方） */}
        {Platform.OS === 'web' && (
          <VideoModal
            visible={videoModal.visible}
            videoUri={videoModal.videoUri}
            startTime={videoModal.startTime}
            endTime={videoModal.endTime}
            onClose={handleCloseVideo}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

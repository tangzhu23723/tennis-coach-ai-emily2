import React from 'react';
import { StatusBar, LogBox } from 'react-native';
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../constants';
import { Button } from '../components';
import { RootStackParamList, VideoRecord } from '../types';
import { useAppStore } from '../store';
import { formatDateTime, formatDuration, formatFileSize } from '../utils';

type HistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const { videoHistory, removeFromHistory, clearHistory } = useAppStore();

  const handleClearHistory = () => {
    Alert.alert(
      '清空历史',
      '确定要清空所有历史记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const handleDeleteItem = (id: string, title: string) => {
    Alert.alert(
      '删除记录',
      `确定要删除"${title}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => removeFromHistory(id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: VideoRecord }) => {
    const getStatusConfig = () => {
      switch (item.status) {
        case 'completed':
          return { label: '已完成', color: COLORS.success };
        case 'processing':
          return { label: '分析中', color: COLORS.warning };
        case 'uploading':
          return { label: '上传中', color: COLORS.primary };
        case 'failed':
          return { label: '失败', color: COLORS.error };
        default:
          return { label: '待处理', color: COLORS.textSecondary };
      }
    };

    const statusConfig = getStatusConfig();

    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => {
          if (item.status === 'completed') {
            navigation.navigate('Result', { videoId: item.id });
          } else if (item.status === 'processing') {
            navigation.navigate('Processing', { videoId: item.id });
          }
        }}
        onLongPress={() => handleDeleteItem(item.id, item.title)}
      >
        <View style={styles.itemThumbnail}>
          <Text style={styles.thumbnailIcon}>🎾</Text>
          {item.status === 'completed' && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>72</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemMeta}>
            {formatDateTime(item.uploadTime)}
          </Text>
          <View style={styles.itemTags}>
            {item.duration > 0 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{formatDuration(item.duration)}</Text>
              </View>
            )}
            {item.status === 'completed' && (
              <View style={[styles.tag, styles.completedTag]}>
                <Text style={[styles.tagText, styles.completedTagText]}>
                  已分析
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.itemStatus}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + '30' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>暂无历史记录</Text>
      <Text style={styles.emptyText}>
        您还没有分析过任何视频，开始分析您的第一个训练视频吧！
      </Text>
      <Button
        title="开始分析"
        onPress={() => navigation.navigate('VideoPicker')}
        style={{ marginTop: 24 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>历史记录</Text>
        {videoHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearButton}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 统计信息 */}
      {videoHistory.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{videoHistory.length}</Text>
            <Text style={styles.statLabel}>总分析</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {videoHistory.filter((v) => v.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>已完成</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {videoHistory.filter((v) => v.status === 'processing').length}
            </Text>
            <Text style={styles.statLabel}>分析中</Text>
          </View>
        </View>
      )}

      {/* 列表 */}
      <FlatList
        data={videoHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearButton: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  itemThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#252540',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  thumbnailIcon: {
    fontSize: 28,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  itemTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedTag: {
    backgroundColor: COLORS.success + '30',
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  completedTagText: {
    color: COLORS.success,
  },
  itemStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

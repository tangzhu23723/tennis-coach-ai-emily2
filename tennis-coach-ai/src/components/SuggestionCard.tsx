import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, PRIORITY_CONFIG, SHOT_TYPES } from '../constants';
import { Suggestion } from '../types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onPress?: (suggestion: Suggestion) => void;
  expanded?: boolean;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onPress,
  expanded = false,
}) => {
  const priorityConfig = PRIORITY_CONFIG[suggestion.priority];
  const categoryConfig = SHOT_TYPES[suggestion.category as keyof typeof SHOT_TYPES] || SHOT_TYPES.unknown;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(suggestion)}
      activeOpacity={0.8}
    >
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
          <Text style={styles.categoryText}>{categoryConfig.label}</Text>
        </View>
        <View
          style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '30' }]}
        >
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.label}
          </Text>
        </View>
      </View>

      {/* 标题 */}
      <Text style={styles.title}>{suggestion.title}</Text>

      {/* 描述 */}
      <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
        {suggestion.description}
      </Text>

      {/* 训练提示 */}
      <View style={styles.trainingSection}>
        <View style={styles.trainingHeader}>
          <Text style={styles.trainingIcon}>💡</Text>
          <Text style={styles.trainingLabel}>训练建议</Text>
        </View>
        <Text style={styles.trainingTip} numberOfLines={expanded ? undefined : 3}>
          {suggestion.trainingTip}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  trainingSection: {
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 12,
  },
  trainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  trainingIcon: {
    fontSize: 14,
  },
  trainingLabel: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  trainingTip: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});

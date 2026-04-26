import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../constants';

interface ScoreCardProps {
  score: number;
  label: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  label,
  size = 'medium',
  showLabel = true,
}) => {
  const dimensions = {
    small: { size: 80, strokeWidth: 6, fontSize: 18 },
    medium: { size: 120, strokeWidth: 8, fontSize: 28 },
    large: { size: 160, strokeWidth: 10, fontSize: 36 },
  };

  const { size: svgSize, strokeWidth, fontSize } = dimensions[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  // 根据分数确定颜色
  const getScoreColor = (s: number) => {
    if (s >= 80) return COLORS.success;
    if (s >= 60) return '#8BC34A';
    if (s >= 40) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.container}>
      <Svg width={svgSize} height={svgSize}>
        <G rotation="-90" origin={`${svgSize / 2}, ${svgSize / 2}`}>
          {/* 背景圆环 */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={COLORS.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* 进度圆环 */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={getScoreColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[styles.scoreContainer, { width: svgSize, height: svgSize }]}>
        <Text style={[styles.score, { fontSize }]}>{score}</Text>
      </View>
      {showLabel && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  scoreContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontWeight: '700',
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

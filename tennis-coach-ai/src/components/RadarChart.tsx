import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants';
import { Scores } from '../types';

interface RadarChartProps {
  scores: Scores;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores, size = 280 }) => {
  const center = size / 2;
  const maxRadius = (size / 2) - 40;
  const labels = [
    { key: 'forehand', label: '正手' },
    { key: 'backhand', label: '反手' },
    { key: 'serve', label: '发球' },
    { key: 'footwork', label: '步法' },
    { key: 'stability', label: '稳定性' },
  ];

  const values = labels.map((l) => scores[l.key as keyof Scores] / 100);
  const angleStep = (2 * Math.PI) / labels.length;

  // 计算多边形顶点
  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = maxRadius * value;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // 生成数据多边形点
  const dataPoints = values
    .map((v, i) => getPoint(i, v))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  // 生成背景网格
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* 背景网格 */}
        {gridLevels.map((level, levelIndex) => {
          const points = labels
            .map((_, i) => getPoint(i, level))
            .map((p) => `${p.x},${p.y}`)
            .join(' ');
          return (
            <Polygon
              key={`grid-${levelIndex}`}
              points={points}
              fill="none"
              stroke={COLORS.border}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* 中心到边缘的线 */}
        {labels.map((_, i) => {
          const point = getPoint(i, 1);
          return (
            <Line
              key={`line-${i}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke={COLORS.border}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* 数据多边形 */}
        <Polygon
          points={dataPoints}
          fill={COLORS.primary}
          fillOpacity={0.3}
          stroke={COLORS.primary}
          strokeWidth={2}
        />

        {/* 数据点 */}
        {values.map((v, i) => {
          const point = getPoint(i, v);
          return (
            <Circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r={6}
              fill={COLORS.primary}
              stroke={COLORS.text}
              strokeWidth={2}
            />
          );
        })}

        {/* 标签 */}
        {labels.map((label, i) => {
          const point = getPoint(i, 1.15);
          return (
            <SvgText
              key={`label-${i}`}
              x={point.x}
              y={point.y}
              fontSize={14}
              fontWeight="600"
              fill={COLORS.text}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {label.label}
            </SvgText>
          );
        })}

        {/* 中心点 */}
        <Circle cx={center} cy={center} r={4} fill={COLORS.text} />
      </Svg>

      {/* 分数显示 */}
      <View style={styles.scoreContainer}>
        {labels.map((label, i) => {
          const value = scores[label.key as keyof Scores];
          return (
            <View key={label.key} style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>{label.label}</Text>
              <Text style={styles.scoreValue}>{value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  scoreItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
});

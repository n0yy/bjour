import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { formatRupiahShort } from '@/domain/currency';
import type { CategoryStat } from '@/domain/types';
import { useCategoryPalette, useColors } from '@/hooks/use-colors';

const SIZE = 140;
const STROKE = 20;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Stable per-category color, independent of sort order (a category shouldn't swap colors when its rank shifts). */
export function categoryColor(categoryId: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = (hash * 31 + categoryId.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

interface DonutSegment {
  categoryId: string;
  color: string;
  length: number;
  offset: number;
}

function buildSegments(stats: CategoryStat[], palette: string[]): DonutSegment[] {
  const segments: DonutSegment[] = [];
  let cumulativePercentage = 0;
  for (const stat of stats) {
    segments.push({
      categoryId: stat.categoryId,
      color: categoryColor(stat.categoryId, palette),
      length: (stat.percentage / 100) * CIRCUMFERENCE,
      offset: -((cumulativePercentage / 100) * CIRCUMFERENCE),
    });
    cumulativePercentage += stat.percentage;
  }
  return segments;
}

export function CategoryDonut({ stats, total }: { stats: CategoryStat[]; total: number }) {
  const colors = useColors();
  const palette = useCategoryPalette();
  const segments = buildSegments(stats, palette);

  return (
    <View className="items-center justify-center py-3" style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        {segments.length === 0 ? (
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.fill} strokeWidth={STROKE} fill="none" />
        ) : (
          segments.map((segment) => (
            <Circle
              key={segment.categoryId}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={segment.offset}
              fill="none"
              rotation={-90}
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          ))
        )}
      </Svg>
      <Text className="font-display text-lg font-bold text-ink tabular-nums">{formatRupiahShort(total)}</Text>
      <Text className="text-xs text-muted">total</Text>
    </View>
  );
}

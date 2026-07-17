import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useComicColors } from '@/hooks/use-comic-colors';

export function ProgressRing({
  size,
  progress,
  label,
  sublabel,
}: {
  size: number;
  /** 0-1 */
  progress: number;
  label: string;
  sublabel?: string;
}) {
  const colors = useComicColors();
  const stroke = Math.max(6, Math.round(size * 0.14));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.fill} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.frame}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text className="font-display font-bold text-ink" style={{ fontSize: size * 0.16 }}>
        {label}
      </Text>
      {sublabel && <Text className="text-muted" style={{ fontSize: size * 0.08 }}>{sublabel}</Text>}
    </View>
  );
}

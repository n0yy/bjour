import { Pressable, Text, View } from 'react-native';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <View className={`flex-row overflow-hidden rounded-md border-3 border-line ${className}`}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          className={`flex-1 items-center py-xs ${value === option.value ? 'bg-frame' : 'bg-transparent'}`}>
          <Text className={`text-button font-semibold ${value === option.value ? 'text-card' : 'text-muted'}`}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

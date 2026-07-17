import { Pressable, Text } from 'react-native';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mx-xxs justify-center rounded-pill border-3 px-md py-xs ${
        selected ? 'border-frame bg-frame' : 'border-line bg-fill'
      }`}>
      <Text className={`${selected ? 'font-semibold' : ''} text-body-sm ${selected ? 'text-card' : 'text-ink'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

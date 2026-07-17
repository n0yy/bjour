import { Pressable, Text } from 'react-native';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mx-1 justify-center rounded-full border-3 px-4 py-2 ${
        selected ? 'border-frame bg-frame' : 'border-line bg-fill'
      }`}>
      <Text className={selected ? 'font-bold text-card' : 'text-ink'}>{label}</Text>
    </Pressable>
  );
}

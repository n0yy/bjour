import { Pressable, Text, View } from 'react-native';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export function AmountKeypad({
  onPressKey,
  actionLabel,
  actionDisabled,
  onPressAction,
}: {
  onPressKey: (key: string) => void;
  actionLabel: string;
  actionDisabled: boolean;
  onPressAction: () => void;
}) {
  return (
    <View className="mt-auto flex-row flex-wrap gap-xs p-sm">
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onPressKey(key)}
          className="basis-[30%] grow items-center rounded-md bg-fill py-md">
          <Text className="text-title-md font-semibold text-ink">{key}</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={onPressAction}
        disabled={actionDisabled}
        className={`basis-full items-center rounded-md py-md ${actionDisabled ? 'bg-fill-2' : 'bg-frame'}`}>
        <Text className={`text-title-md font-bold ${actionDisabled ? 'text-muted' : 'text-card'}`}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, Text, View } from 'react-native';

import { parseLocalDate, toLocalDate } from '@/domain/local-date';
import type { LocalDate } from '@/domain/types';

function formatDisplayDate(date: LocalDate): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    parseLocalDate(date),
  );
}

export function DateField({ value, onChange }: { value: LocalDate; onChange: (date: LocalDate) => void }) {
  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseLocalDate(value),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toLocalDate(date));
        },
      });
    }
  }

  return (
    <View className="flex-row items-center gap-xs border-b border-fill px-md py-xs">
      <Text className="w-16 text-caption-uppercase text-muted">Tanggal</Text>
      {Platform.OS === 'android' ? (
        <Pressable onPress={open}>
          <Text className="text-title-sm font-semibold text-ink">{formatDisplayDate(value)}</Text>
        </Pressable>
      ) : (
        <DateTimePicker
          value={parseLocalDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={(_event, date) => {
            if (date) onChange(toLocalDate(date));
          }}
        />
      )}
    </View>
  );
}

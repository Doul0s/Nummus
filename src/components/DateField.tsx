import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { IsoDate, formatDayLabel, fromIsoDate, toIsoDate } from "@/lib/date";

type Props = {
  value: IsoDate;
  onChange: (value: IsoDate) => void;
};

export function DateField({ value, onChange }: Props) {
  const { i18n } = useTranslation();
  const date = fromIsoDate(value);

  const handleChange = (_: unknown, picked?: Date) => {
    if (picked) onChange(toIsoDate(picked));
  };

  if (Platform.OS === "ios") {
    return (
      <View style={styles.ios}>
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          maximumDate={new Date()}
          onChange={handleChange}
        />
      </View>
    );
  }

  return (
    <Pressable
      style={styles.input}
      onPress={() =>
        DateTimePickerAndroid.open({
          value: date,
          mode: "date",
          maximumDate: new Date(),
          onChange: handleChange,
        })
      }
    >
      <Text style={styles.text}>{formatDayLabel(value, i18n.language)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ios: {
    alignSelf: "flex-start",
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.35)",
  },
  text: {
    fontSize: 16,
  },
});
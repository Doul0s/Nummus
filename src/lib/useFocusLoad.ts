import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

export function useFocusLoad<T>(load: () => Promise<T>, refreshOnActive = false) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await load());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    if (!refreshOnActive) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reload();
    });
    return () => subscription.remove();
  }, [refreshOnActive, reload]);

  return { data, failed, reload };
}

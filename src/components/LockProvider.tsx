import * as LocalAuthentication from "expo-local-authentication";
import { useSQLiteContext } from "expo-sqlite";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { AppState, StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { SETTINGS, getSetting, setSetting } from "@/db/settings";
import { parseLockAfter, shouldLock } from "@/lib/lock";
import { layout, spacing, useTheme } from "@/theme";

type Status = "loading" | "locked" | "unlocked";

type LockContextValue = {
  available: boolean;
  enabled: boolean;
  lockAfter: number;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  setLockAfter: (seconds: number) => Promise<void>;
};

const LockContext = createContext<LockContextValue | null>(null);

export function useLock(): LockContextValue {
  const value = useContext(LockContext);
  if (!value) throw new Error("useLock must be used inside LockProvider");
  return value;
}

const hasDeviceSecurity = async () =>
  (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;

export function LockProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("loading");
  const [enabled, setEnabledState] = useState(false);
  const [lockAfter, setLockAfterState] = useState(0);
  const [available, setAvailable] = useState(false);
  const [covered, setCovered] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const authenticating = useRef(false);
  const backgroundedAt = useRef<number | null>(null);

  const enforced = enabled && available;

  const failureMessage = useCallback(
    (error: string): string | null => {
      if (error.includes("cancel")) return null;
      return error === "lockout" ? t("lock.lockout") : t("lock.failed");
    },
    [t]
  );

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (authenticating.current) return false;
    authenticating.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("lock.prompt"),
        cancelLabel: t("common.cancel"),
        disableDeviceFallback: false,
      });
      setAuthMessage(result.success ? null : failureMessage(result.error));
      return result.success;
    } catch {
      setAuthMessage(t("lock.failed"));
      return false;
    } finally {
      authenticating.current = false;
    }
  }, [failureMessage, t]);

  const unlock = useCallback(async () => {
    if (await authenticate()) setStatus("unlocked");
  }, [authenticate]);

  const lockNow = useCallback(() => {
    setStatus("locked");
    return unlock();
  }, [unlock]);

  const lockRef = useRef(lockNow);
  useEffect(() => {
    lockRef.current = lockNow;
  }, [lockNow]);

  const releaseLock = useCallback(() => {
    setStatus((current) => (current === "locked" ? "unlocked" : current));
  }, []);

  useEffect(() => {
    (async () => {
      const [on, after, secure] = await Promise.all([
        getSetting(db, SETTINGS.lockEnabled),
        getSetting(db, SETTINGS.lockAfter),
        hasDeviceSecurity(),
      ]);
      setEnabledState(on === "1");
      setLockAfterState(parseLockAfter(after));
      setAvailable(secure);
      if (on === "1" && secure) await lockRef.current();
      else setStatus("unlocked");
    })();
  }, [db]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        hasDeviceSecurity().then((secure) => {
          setAvailable(secure);
          if (!secure) releaseLock();
        });
        const left = backgroundedAt.current;
        backgroundedAt.current = null;
        if (enforced && left !== null && shouldLock(left, Date.now(), lockAfter)) void lockNow();
        setCovered(false);
        return;
      }
      if (!enforced || authenticating.current) return;
      setCovered(true);
      if (state === "background") {
        backgroundedAt.current = Date.now();
        if (lockAfter === 0) void lockNow();
      }
    });
    return () => subscription.remove();
  }, [enforced, lockAfter, lockNow, releaseLock]);

  const setEnabled = useCallback(
    async (next: boolean): Promise<boolean> => {
      if (next && !(await authenticate())) return false;
      await setSetting(db, SETTINGS.lockEnabled, next ? "1" : "0");
      setEnabledState(next);
      return true;
    },
    [authenticate, db]
  );

  const setLockAfter = useCallback(
    async (seconds: number) => {
      await setSetting(db, SETTINGS.lockAfter, String(seconds));
      setLockAfterState(seconds);
    },
    [db]
  );

  const value = useMemo(
    () => ({ available, enabled, lockAfter, setEnabled, setLockAfter }),
    [available, enabled, lockAfter, setEnabled, setLockAfter]
  );

  const hidden = status !== "unlocked";

  return (
    <LockContext.Provider value={value}>
      <View style={styles.root}>
        <View
          style={styles.root}
          accessibilityElementsHidden={hidden}
          importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
        >
          {children}
        </View>

        {hidden || covered ? (
          <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.bg }]}>
            {status === "loading" ? null : <AppText variant="title">Nummus</AppText>}
            {status === "locked" ? (
              <>
                <AppText tone="muted">{t("lock.locked")}</AppText>
                {authMessage ? (
                  <AppText variant="caption" tone="danger" style={styles.message}>
                    {authMessage}
                  </AppText>
                ) : null}
                <View style={styles.action}>
                  <Button title={t("lock.unlock")} onPress={unlock} />
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    </LockContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: layout.gutter,
    zIndex: 10,
  },
  message: {
    textAlign: "center",
  },
  action: {
    width: "100%",
    maxWidth: 320,
    marginTop: spacing.md,
  },
});

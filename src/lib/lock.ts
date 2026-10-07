export const LOCK_AFTER_OPTIONS = [0, 60, 300];

export function shouldLock(backgroundedAt: number, now: number, lockAfterSeconds: number): boolean {
  const elapsed = now - backgroundedAt;
  return elapsed < 0 || elapsed >= lockAfterSeconds * 1000;
}

export function parseLockAfter(value: string | null): number {
  const seconds = Number(value);
  return LOCK_AFTER_OPTIONS.includes(seconds) ? seconds : 0;
}

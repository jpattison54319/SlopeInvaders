import { useEffect, useState } from 'react';

/**
 * useState whose value is mirrored to localStorage under `key`. Falls back to
 * `initial` (and stays in-memory) when storage is unavailable — e.g. private
 * mode or SSR. Mirrors the defensive pattern used by the audio hook.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore write failures */
    }
  }, [key, value]);

  return [value, setValue];
}

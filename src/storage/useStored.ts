import { useSyncExternalStore, useCallback } from "react";
import { read, write, subscribe } from "./store";

export function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    cb => subscribe(key, cb),
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (v: T | ((p: T) => T)) => write(key, typeof v === "function" ? (v as (p: T) => T)(read(key, fallback)) : v),
    [key], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return [value, set] as const;
}

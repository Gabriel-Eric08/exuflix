import { useSyncExternalStore } from "react";
import styles from "./Toast.module.css";

type Toast = { id: number; text: string };
let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function toast(text: string) {
  current = { id: Date.now(), text };
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, 4000);
  emit();
}

export function ToastHost() {
  const t = useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
  return (
    <div className={styles.host} role="status" aria-live="polite">
      {t && (
        <div key={t.id} className={styles.toast}>
          {t.text}
        </div>
      )}
    </div>
  );
}

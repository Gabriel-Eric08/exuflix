const NS = "exuflix:v1:";
const EVENT = "exuflix:storage";
const cache = new Map<string, unknown>();

export function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    /* storage bloqueado ou JSON corrompido: usa fallback */
  }
  cache.set(key, value);
  return value;
}

export function write<T>(key: string, value: T) {
  cache.set(key, value); // sempre atualiza a memória (funciona mesmo sem storage)
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch (err) {
    if ((err as DOMException)?.name === "QuotaExceededError") pruneAndRetry(key, value);
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

export function update<T>(key: string, fallback: T, fn: (prev: T) => T) {
  write(key, fn(read(key, fallback)));
}

export function remove(key: string) {
  cache.delete(key);
  try {
    localStorage.removeItem(NS + key);
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

export function subscribe(key: string, cb: () => void) {
  const local = (e: Event) => {
    if ((e as CustomEvent).detail === key) cb();
  };
  const cross = (e: StorageEvent) => {
    if (e.key === NS + key || e.key === null) {
      cache.delete(key); // outra aba gravou: invalida cache
      cb();
    }
  };
  window.addEventListener(EVENT, local);
  window.addEventListener("storage", cross);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener("storage", cross);
  };
}

/** Todas as chaves exuflix:v1:* (para exportar/limpar). */
export function allKeys(): string[] {
  try {
    return Object.keys(localStorage).filter(k => k.startsWith(NS)).map(k => k.slice(NS.length));
  } catch {
    return [...cache.keys()];
  }
}

function pruneAndRetry(key: string, value: unknown) {
  // Remove os itens de progresso mais antigos e tenta de novo
  if (key === "progress") {
    const store = value as { items: Record<string, { updatedAt: number }> };
    const entries = Object.entries(store.items).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    store.items = Object.fromEntries(entries.slice(0, Math.floor(entries.length * 0.7)));
    try {
      localStorage.setItem(NS + key, JSON.stringify(store));
    } catch {
      /* desiste em silêncio */
    }
  }
}

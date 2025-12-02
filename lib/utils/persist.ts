// /lib/utils/persist.ts
type Persistable = object | string | number | boolean | null;

const hasWindow = typeof window !== 'undefined';
const ls = hasWindow ? window.localStorage : undefined;

export function save<T extends Persistable>(key: string, value: T) {
  if (!ls) return;
  ls.setItem(key, JSON.stringify(value));
}

export function load<T = any>(key: string, fallback?: T): T | undefined {
  if (!ls) return fallback;
  const raw = ls.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function remove(key: string) {
  if (!ls) return;
  ls.removeItem(key);
}

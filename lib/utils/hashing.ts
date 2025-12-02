// /lib/utils/hashing.ts
// 매우 간단한 해시(djb2 변형). 보안 목적 아님.
export function hashString(s: string): string {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return (h >>> 0).toString(16);
  }
  
  export function hashJSON(obj: unknown): string {
    try {
      return hashString(JSON.stringify(obj));
    } catch {
      return '';
    }
  }
  
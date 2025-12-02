// /lib/utils/id.ts
export const uid = (() => {
    let c = 0;
    return (prefix = 'id'): string => `${prefix}_${Date.now().toString(36)}_${(c++).toString(36)}`;
  })();
  
  export const nanoid = (size = 12) => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < size; i++) id += chars[(Math.random() * chars.length) | 0];
    return id;
  };
  
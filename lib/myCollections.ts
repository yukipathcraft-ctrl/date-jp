// この端末で作った集金。幹事の鍵入りの URL をなくさないよう、ブラウザにだけ残す

export type MyCollection = { id: string; token: string; title: string; total: number; createdAt: number };

const KEY = "nomi:collections";

export function loadMyCollections(): MyCollection[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyCollection[]) : [];
  } catch {
    return [];
  }
}

export function rememberCollection(c: MyCollection) {
  try {
    const list = loadMyCollections().filter((x) => x.id !== c.id);
    localStorage.setItem(KEY, JSON.stringify([c, ...list].slice(0, 30)));
  } catch {}
}

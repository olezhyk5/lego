import { STORAGE_PREFIX, LEGACY_STORAGE_KEYS, LOCALE_STORAGE_KEY } from '../config/constants.js';

/**
 * Сховище екземпляра конфігуратора: рядкові значення за назвою.
 * 'project' — JSON проєкту, 'preset' — JSON ідентифікатора пресета, 'locale' — код мови.
 * get повертає null, якщо значення немає. Обидва методи можуть кидати (сховище недоступне) —
 * той, хто викликає, це перехоплює.
 * @typedef {'project' | 'preset' | 'locale'} StorageName
 * @typedef {{ get: (name: StorageName) => string | null, set: (name: StorageName, value: string) => void }} StorageAdapter
 */

// Префікс ключів: літери, цифри, «-», «_»
export const isStorageKey = key => typeof key === 'string' && /^[\w-]+$/.test(key);

/**
 * Сховище за замовчуванням — localStorage з ключами <prefix>-project, <prefix>-preset і lego-locale
 * (мова одна на сторінку, тож її ключ від префікса не залежить). Префікс за замовчуванням — lego.
 * Проєкт: якщо нового ключа ще немає, читається старий (wardrobe-cfg-v1) — лише з префіксом за замовчуванням.
 * Старий ключ не видаляється: відкат на попередню збірку не втратить дані.
 * @param {{ prefix?: string }} [options]
 * @returns {StorageAdapter}
 */
export function localStorageAdapter({ prefix = STORAGE_PREFIX } = {}) {
  if (!isStorageKey(prefix)) throw new Error(`localStorageAdapter: некоректний префікс ключів «${prefix}»`);
  const keys = { project: `${prefix}-project`, preset: `${prefix}-preset`, locale: LOCALE_STORAGE_KEY };
  const legacy = prefix === STORAGE_PREFIX ? LEGACY_STORAGE_KEYS : [];
  return {
    get(name) {
      const value = localStorage.getItem(keys[name]);
      if (value != null || name !== 'project') return value;
      for (const key of legacy) {
        const legacy = localStorage.getItem(key);
        if (legacy != null) return legacy;
      }
      return null;
    },
    set(name, value) {
      localStorage.setItem(keys[name], value);
    },
  };
}

/**
 * Сховище в пам'яті: нічого не зберігається між завантаженнями сторінки (storage: false в опціях).
 * @returns {StorageAdapter}
 */
export function memoryStorage() {
  /** @type {Partial<Record<StorageName, string>>} */
  const data = {};
  return {
    get: name => data[name] ?? null,
    set(name, value) {
      data[name] = value;
    },
  };
}

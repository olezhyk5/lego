import { STORAGE_KEY, LEGACY_STORAGE_KEYS, PRESET_STORAGE_KEY, LOCALE_STORAGE_KEY } from '../config/constants.js';

/**
 * Сховище екземпляра конфігуратора: рядкові значення за назвою.
 * 'project' — JSON проєкту, 'preset' — JSON ідентифікатора пресета, 'locale' — код мови.
 * get повертає null, якщо значення немає. Обидва методи можуть кидати (сховище недоступне) —
 * той, хто викликає, це перехоплює.
 * @typedef {'project' | 'preset' | 'locale'} StorageName
 * @typedef {{ get: (name: StorageName) => string | null, set: (name: StorageName, value: string) => void }} StorageAdapter
 */

const KEYS = { project: STORAGE_KEY, preset: PRESET_STORAGE_KEY, locale: LOCALE_STORAGE_KEY };

/**
 * Сховище за замовчуванням — localStorage з ключами lego-project, lego-preset, lego-locale.
 * Проєкт: якщо нового ключа ще немає, читається старий (wardrobe-cfg-v1). Старий ключ не видаляється:
 * відкат на попередню збірку не втратить дані.
 * @returns {StorageAdapter}
 */
export function localStorageAdapter() {
  return {
    get(name) {
      const value = localStorage.getItem(KEYS[name]);
      if (value != null || name !== 'project') return value;
      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = localStorage.getItem(key);
        if (legacy != null) return legacy;
      }
      return null;
    },
    set(name, value) {
      localStorage.setItem(KEYS[name], value);
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

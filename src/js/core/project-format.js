// Версія формату JSON проєкту та міграції старих файлів.
// Формат — публічний контракт (файли, localStorage, згодом база й API): несумісна зміна = нова версія
// + міграція сюди + фікстура старого файлу в core/fixtures/ (їх ніколи не редагуємо).

import { hasType } from './registry.js';

/** @typedef {import('./types.js').Project} Project */
/** @typedef {import('./types.js').Msg} Msg */

export const FORMAT_VERSION = 2;

// Міграція n → n + 1. Чисті функції: вхід не мутують.
/** @type {Record<number, (d: any) => any>} */
const MIGRATIONS = {
  // v1: без version і type, була лише шафа
  1: d => ({ ...d, version: 2, type: 'wardrobe' }),
};

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Новий проєкт поточної версії. version і type — першими ключами, щоб файл легко читався.
 * @param {string} type
 * @param {Record<string, any>} data поля типу (напр. дані пресета)
 * @returns {Project}
 */
export function createProject(type, data) {
  const rest = { ...data };
  delete rest.version;
  delete rest.type;
  return { version: FORMAT_VERSION, type, ...rest };
}

/**
 * Приводить сирий JSON до поточної версії формату. Структуру полів типу не перевіряє.
 * @param {unknown} raw
 * @returns {{ ok: true, project: Project, migrated: boolean } | { ok: false, error: Msg }}
 */
export function upgradeProject(raw) {
  if (!isPlainObject(raw)) return { ok: false, error: { key: 'file.notProject' } };
  /** @type {any} */
  let d = raw;
  const from = d.version ?? 1;
  if (!Number.isInteger(from) || from < 1) return { ok: false, error: { key: 'file.badVersion' } };
  if (from > FORMAT_VERSION) return { ok: false, error: { key: 'file.tooNew', params: { version: from } } };
  for (let v = from; v < FORMAT_VERSION; v++) d = MIGRATIONS[v](d);
  if (!hasType(d.type)) return { ok: false, error: { key: 'file.unknownType', params: { type: String(d.type) } } };
  return { ok: true, project: createProject(d.type, d), migrated: from !== FORMAT_VERSION };
}

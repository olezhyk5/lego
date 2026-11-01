import { STORAGE_KEY, LEGACY_STORAGE_KEYS, PRESET_STORAGE_KEY } from '../config/constants.js';
import { upgradeProject } from './project-format.js';
import { validateProject } from './registry.js';
import { DEFAULT_PRESET, presetProject, matchPreset, isPresetId, upgradePresetId } from './presets.js';

/** @typedef {import('./types.js').Project} Project */

/**
 * Сирий JSON (файл, localStorage) → перевірений проєкт поточної версії або помилки.
 * @param {unknown} raw
 * @returns {{ ok: true, project: Project } | { ok: false, errors: import('./types.js').Msg[] }}
 */
export function parseProject(raw) {
  const up = upgradeProject(raw);
  if (!up.ok) return { ok: false, errors: [up.error] };
  return validateProject(up.project);
}

// Проєкт з localStorage або null (зіпсовані дані — у консоль)
function readProject(key) {
  const res = parseProject(JSON.parse(localStorage.getItem(key) ?? 'null'));
  if (res.ok) return res.project;
  console.warn(`localStorage['${key}']: проєкт не пройшов перевірку`, res.errors);
  return null;
}

function load() {
  try {
    if (localStorage.getItem(STORAGE_KEY) != null) return readProject(STORAGE_KEY) ?? presetProject(DEFAULT_PRESET);
    // старий ключ не видаляємо: відкат на попередню збірку не втратить дані
    for (const key of LEGACY_STORAGE_KEYS) {
      const d = readProject(key);
      if (d) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
        return d;
      }
    }
  } catch {
    // localStorage недоступний (приватний режим тощо) або дані зіпсовані — працюємо без них
  }
  return presetProject(DEFAULT_PRESET);
}

// Збережений ідентифікатор пресета; якщо його немає — пресет, з яким збігається проєкт
function loadPreset(state) {
  try {
    const id = upgradePresetId(JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) ?? 'null'));
    if (isPresetId(id)) return id;
  } catch {
    // localStorage недоступний або значення зіпсоване
  }
  return matchPreset(state);
}

// Стан форми поточного типу: sel — індекс вибраної групи (секції тощо),
// collapsed — згорнуті в сайдбарі об'єкти (переживають переміщення, з новим проєктом скидаються)
const freshUi = () => ({ sel: 0, collapsed: new WeakSet() });

const initial = load();

// Єдине джерело стану застосунку. Модулі читають/змінюють store напряму,
// після змін викликають update() з main.js.
export const store = {
  state: initial, // проєкт поточної версії формату (зберігається)
  preset: loadPreset(initial), // останній вибраний пресет (лишається активним і після змін) або null
  ui: freshUi(), // у JSON проєкту не потрапляє
  showDims: true, // показувати розміри в 3D
  transparent: false, // напівпрозорі плити в 3D, щоб бачити наповнення
  reportCollapsed: true, // згорнуті списки плит і елементів під 3D
};

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(store.preset));
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
}

/**
 * @param {Project} data проєкт поточної версії (presetProject або parseProject)
 * @param {string | null} preset ідентифікатор вибраного пресета; для проєкту з файлу — за збігом
 */
export function setProject(data, preset = matchPreset(data)) {
  store.state = data;
  store.preset = preset;
  store.ui = freshUi();
}

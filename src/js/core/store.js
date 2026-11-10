import { upgradeProject } from './project-format.js';
import { validateProject } from './registry.js';
import { DEFAULT_PRESET, presetProject, matchPreset, isPresetId, upgradePresetId } from './presets.js';
import { memoryStorage } from './storage.js';

/** @typedef {import('./types.js').Project} Project */
/** @typedef {import('./storage.js').StorageAdapter} StorageAdapter */

/**
 * Сирий JSON (файл, сховище) → перевірений проєкт поточної версії або помилки.
 * @param {unknown} raw
 * @returns {{ ok: true, project: Project } | { ok: false, errors: import('./types.js').Msg[] }}
 */
export function parseProject(raw) {
  const up = upgradeProject(raw);
  if (!up.ok) return { ok: false, errors: [up.error] };
  return validateProject(up.project);
}

// Збережене значення як JSON; сховище недоступне або дані зіпсовані → undefined
function read(storage, name) {
  try {
    const raw = storage.get(name);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Збережений проєкт або пресет за замовчуванням (зіпсовані дані — у консоль)
function loadProject(storage) {
  const raw = read(storage, 'project');
  if (raw === undefined) return presetProject(DEFAULT_PRESET);
  const res = parseProject(raw);
  if (res.ok) return res.project;
  console.warn('Збережений проєкт не пройшов перевірку', res.errors);
  return presetProject(DEFAULT_PRESET);
}

// Збережений ідентифікатор пресета; якщо його немає — пресет, з яким збігається проєкт
function loadPreset(storage, state) {
  const id = upgradePresetId(read(storage, 'preset'));
  return isPresetId(id) ? id : matchPreset(state);
}

// Стан форми поточного типу: sel — індекс вибраної групи (секції тощо),
// collapsed — згорнуті в сайдбарі об'єкти (переживають переміщення, з новим проєктом скидаються)
const freshUi = () => ({ sel: 0, collapsed: new WeakSet() });

/**
 * Стан одного екземпляра конфігуратора. Модулі екземпляра читають/змінюють його напряму,
 * після змін викликають update() екземпляра.
 * @param {{ storage?: StorageAdapter }} [options] storage — де зберігати проєкт; за замовчуванням — у пам'яті
 */
export function createStore({ storage = memoryStorage() } = {}) {
  const initial = loadProject(storage);

  const store = {
    /** @type {Project} проєкт поточної версії формату (зберігається) */
    state: initial,
    /** @type {string | null} останній вибраний пресет (лишається активним і після змін) або null */
    preset: loadPreset(storage, initial),
    /** @type {{ sel: number, collapsed: WeakSet<object>, [field: string]: any }} у JSON проєкту не потрапляє */
    ui: freshUi(),
    showDims: true, // показувати розміри в 3D
    transparent: false, // напівпрозорі плити в 3D, щоб бачити наповнення
    reportCollapsed: true, // згорнуті списки плит і елементів під 3D
    presetsCollapsed: false, // згорнуті кнопки пресетів

    save() {
      try {
        storage.set('project', JSON.stringify(store.state));
        storage.set('preset', JSON.stringify(store.preset));
      } catch {
        // сховище недоступне (приватний режим тощо) — працюємо без нього
      }
    },

    /**
     * @param {Project} data проєкт поточної версії (presetProject або parseProject)
     * @param {string | null} preset ідентифікатор вибраного пресета; для проєкту з файлу — за збігом
     */
    setProject(data, preset = matchPreset(data)) {
      store.state = data;
      store.preset = preset;
      store.ui = freshUi();
    },
  };
  return store;
}

/** @typedef {ReturnType<typeof createStore>} Store */

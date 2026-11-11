import { upgradeProject } from './project-format.js';
import { validateProject } from './registry.js';
import {
  DEFAULT_PRESET,
  presetIds,
  presetProject,
  presetTypes,
  matchPreset,
  isPresetId,
  upgradePresetId,
} from './presets.js';
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

// Сирий проєкт → перевірений проєкт дозволеного типу або null (причина — у консоль)
function accept(raw, types, what) {
  const res = parseProject(raw);
  if (!res.ok) console.warn(`${what} не пройшов перевірку`, res.errors);
  else if (!types.includes(res.project.type)) console.warn(`${what}: тип «${res.project.type}» тут недоступний`);
  else return res.project;
  return null;
}

/**
 * Початковий проєкт і пресет: збережений проєкт → start.project → start.preset → пресет за замовчуванням
 * (якщо він серед дозволених) → перший дозволений. Береться лише проєкт дозволеного типу.
 */
function loadInitial(storage, presets, start) {
  const types = presetTypes(presets);
  const raw = read(storage, 'project');
  const saved = raw === undefined ? null : accept(raw, types, 'Збережений проєкт');
  if (saved) {
    const id = upgradePresetId(read(storage, 'preset'));
    return { project: saved, preset: isPresetId(id) ? id : matchPreset(saved) };
  }
  const given = start.project === undefined ? null : accept(start.project, types, 'Опція project');
  if (given) return { project: given, preset: matchPreset(given) };
  const id = [start.preset, DEFAULT_PRESET].find(p => presets.includes(p)) ?? presets[0];
  return { project: presetProject(id), preset: id };
}

// Стан форми поточного типу: sel — індекс вибраної групи (секції тощо),
// collapsed — згорнуті в сайдбарі об'єкти (переживають переміщення, з новим проєктом скидаються)
const freshUi = () => ({ sel: 0, collapsed: new WeakSet() });

/**
 * Стан одного екземпляра конфігуратора. Модулі екземпляра читають/змінюють його напряму,
 * після змін викликають update() екземпляра.
 * @param {{ storage?: StorageAdapter, presets?: string[], start?: { project?: unknown, preset?: string } }} [options]
 *   storage — де зберігати проєкт; за замовчуванням — у пам'яті
 *   presets — дозволені пресети (resolvePresets); проєкт іншого типу не відкривається
 *   start — з чого почати, якщо збереженого проєкту немає: project (сирий JSON) або preset (ідентифікатор)
 */
export function createStore({ storage = memoryStorage(), presets = presetIds(), start = {} } = {}) {
  const initial = loadInitial(storage, presets, start);

  const store = {
    /** @type {Project} проєкт поточної версії формату (зберігається) */
    state: initial.project,
    /** @type {string | null} останній вибраний пресет (лишається активним і після змін) або null */
    preset: initial.preset,
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

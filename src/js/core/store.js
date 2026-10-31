import { STORAGE_KEY, PRESET_STORAGE_KEY } from '../config/constants.js';
import { PRESETS, DEFAULT_PRESET } from '../config/presets.js';
import { clone, deepEqual } from '../utils/helpers.js';

export const isValidProject = d => !!d && Array.isArray(d.sections) && d.sections.length > 0;

// Ключ пресета, з яким проєкт збігається повністю, або null, якщо проєкт змінено
export const matchPreset = s => Object.keys(PRESETS).find(k => deepEqual(PRESETS[k].data, s)) ?? null;

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (isValidProject(d)) return d;
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
  return clone(PRESETS[DEFAULT_PRESET].data);
}

// Збережений ключ пресета; якщо його немає — пресет, з яким збігається проєкт
function loadPreset(state) {
  try {
    const k = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY));
    if (Object.hasOwn(PRESETS, k)) return k;
  } catch {
    // localStorage недоступний або значення зіпсоване
  }
  return matchPreset(state);
}

const initial = load();

// Єдине джерело стану застосунку. Модулі читають/змінюють store напряму,
// після змін викликають update() з main.js.
export const store = {
  state: initial, // проєкт: габарити + секції (зберігається)
  preset: loadPreset(initial), // останній вибраний пресет (лишається активним і після змін) або null
  sel: 0, // індекс вибраної секції
  showDims: true, // показувати розміри в 3D
  transparent: false, // напівпрозорі плити в 3D, щоб бачити наповнення
  reportCollapsed: true, // згорнуті списки плит і елементів під 3D
  // згорнуті в сайдбарі секції — самі об'єкти секцій, тож стан переживає переміщення,
  // а з новим проєктом скидається; у JSON проєкту не потрапляє
  collapsed: new WeakSet(),
};

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(store.preset));
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
}

// preset — ключ вибраного пресета; для проєкту з файлу визначається за збігом
export function setProject(data, preset = matchPreset(data)) {
  store.state = data;
  store.preset = preset;
  store.sel = 0;
}

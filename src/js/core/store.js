import { STORAGE_KEY } from '../config/constants.js';
import { PRESETS, DEFAULT_PRESET } from '../config/presets.js';
import { clone } from '../utils/helpers.js';

export const isValidProject = d => !!d && Array.isArray(d.sections) && d.sections.length > 0;

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (isValidProject(d)) return d;
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
  return clone(PRESETS[DEFAULT_PRESET].data);
}

// Єдине джерело стану застосунку. Модулі читають/змінюють store напряму,
// після змін викликають update() з main.js.
export const store = {
  state: load(), // проєкт: габарити + секції (зберігається)
  sel: 0, // індекс вибраної секції
  showDims: true, // показувати розміри в 3D
};

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
}

export function setProject(data) {
  store.state = data;
  store.sel = 0;
}

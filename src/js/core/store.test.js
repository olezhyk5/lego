import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEY, LEGACY_STORAGE_KEYS, PRESET_STORAGE_KEY } from '../config/constants.js';
import { preset, presetProject } from './test-fixtures.js';

// store читає localStorage під час імпорту, тому кожен тест імпортує модуль заново
function mockStorage(initial = {}) {
  const data = { ...initial };
  vi.stubGlobal('localStorage', {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  });
  return data;
}

const loadStore = async () => {
  vi.resetModules();
  return import('./store.js');
};

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('parseProject', () => {
  it('файл v1 → перевірений проєкт поточної версії', async () => {
    mockStorage();
    const { parseProject } = await loadStore();
    expect(parseProject(preset('komod'))).toEqual({ ok: true, project: presetProject('komod') });
  });

  it('помилки формату й перевірки повертаються як {key, params}', async () => {
    mockStorage();
    const { parseProject } = await loadStore();
    expect(parseProject(null)).toEqual({ ok: false, errors: [{ key: 'file.notProject' }] });
    const res = parseProject({ ...preset('komod'), sections: [] });
    expect(res.ok).toBe(false);
    expect(!res.ok && res.errors.map(e => e.key)).toEqual(['validate.arrayLength']);
  });
});

describe('завантаження стану', () => {
  it('без збереженого проєкту — пресет за замовчуванням', async () => {
    mockStorage();
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
    expect(store.ui.sel).toBe(0);
  });

  it('відновлює збережений проєкт', async () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(presetProject('komod')) });
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('komod'));
  });

  it.each([
    ['зіпсований JSON', '{oops'],
    ['проєкт без секцій', JSON.stringify({ W: 1, sections: [] })],
  ])('%s → пресет за замовчуванням', async (_, raw) => {
    mockStorage({ [STORAGE_KEY]: raw });
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
  });

  it('працює без localStorage', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { store, save } = await loadStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
    expect(() => save()).not.toThrow();
  });
});

describe('save / setProject', () => {
  it('setProject скидає стан форми, save пише в localStorage', async () => {
    const data = mockStorage();
    const { store, save, setProject } = await loadStore();
    store.ui.sel = 2;
    setProject(presetProject('penal'));
    expect(store.ui.sel).toBe(0);
    save();
    expect(JSON.parse(data[STORAGE_KEY])).toEqual(presetProject('penal'));
  });
});

describe('store.preset', () => {
  it('без збережених даних — пресет за замовчуванням', async () => {
    mockStorage();
    const { store } = await loadStore();
    expect(store.preset).toBe('wardrobe.wardrobe');
  });

  it('відновлює збережений пресет, навіть якщо проєкт потім змінювали', async () => {
    mockStorage({
      [STORAGE_KEY]: JSON.stringify({ ...presetProject('komod'), W: 999 }),
      [PRESET_STORAGE_KEY]: JSON.stringify('wardrobe.komod'),
    });
    const { store } = await loadStore();
    expect(store.preset).toBe('wardrobe.komod');
  });

  it('старе значення без типу (до реєстру типів) → wardrobe.<ключ>', async () => {
    mockStorage({
      [STORAGE_KEY]: JSON.stringify({ ...presetProject('komod'), W: 999 }),
      [PRESET_STORAGE_KEY]: JSON.stringify('komod'),
    });
    const { store } = await loadStore();
    expect(store.preset).toBe('wardrobe.komod');
  });

  it.each([
    ['невідомий ключ', JSON.stringify('nope')],
    ['невідомий тип', JSON.stringify('sofa.komod')],
    ['зіпсований JSON', '{oops'],
  ])('%s → за збігом із проєктом', async (_, raw) => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(presetProject('penal')), [PRESET_STORAGE_KEY]: raw });
    const { store } = await loadStore();
    expect(store.preset).toBe('wardrobe.penal');
  });

  it('змінений проєкт без збереженого пресета → null', async () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify({ ...presetProject('penal'), W: 999 }) });
    const { store } = await loadStore();
    expect(store.preset).toBe(null);
  });

  it('setProject: явний ключ або збіг для проєкту з файлу; save зберігає ключ', async () => {
    const data = mockStorage();
    const { store, save, setProject } = await loadStore();
    setProject({ ...presetProject('komod'), W: 999 }, 'wardrobe.komod');
    expect(store.preset).toBe('wardrobe.komod');
    setProject({ ...presetProject('komod'), W: 999 });
    expect(store.preset).toBe(null);
    setProject(presetProject('penal'));
    expect(store.preset).toBe('wardrobe.penal');
    save();
    expect(JSON.parse(data[PRESET_STORAGE_KEY])).toBe('wardrobe.penal');
  });
});

describe('міграція з localStorage', () => {
  const LEGACY = LEGACY_STORAGE_KEYS[0];

  it('лише старий ключ (v1) → проєкт мігровано й записано в новий ключ, старий лишається', async () => {
    const data = mockStorage({ [LEGACY]: JSON.stringify(preset('komod')) });
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('komod'));
    expect(JSON.parse(data[STORAGE_KEY])).toEqual(presetProject('komod'));
    expect(JSON.parse(data[LEGACY])).toEqual(preset('komod'));
    expect(store.preset).toBe('wardrobe.komod');
  });

  it('є обидва ключі → береться новий', async () => {
    mockStorage({ [LEGACY]: JSON.stringify(preset('komod')), [STORAGE_KEY]: JSON.stringify(presetProject('penal')) });
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('penal'));
  });

  it('у новому ключі файл новішої версії → пресет за замовчуванням', async () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify({ ...presetProject('penal'), version: 99 }) });
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
  });

  it('у новому ключі старий формат (без version) теж мігрується', async () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(preset('tumba')) });
    const { store } = await loadStore();
    expect(store.state).toEqual(presetProject('tumba'));
  });
});

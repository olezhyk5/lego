import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEY, PRESET_STORAGE_KEY } from '../config/constants.js';
import { preset } from './test-fixtures.js';

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

describe('isValidProject', () => {
  it('перевіряє наявність секцій', async () => {
    mockStorage();
    const { isValidProject } = await loadStore();
    expect(isValidProject(preset('komod'))).toBe(true);
    expect(isValidProject({ sections: [] })).toBe(false);
    expect(isValidProject({})).toBe(false);
    expect(isValidProject(null)).toBe(false);
  });
});

describe('завантаження стану', () => {
  it('без збереженого проєкту — пресет за замовчуванням', async () => {
    mockStorage();
    const { store } = await loadStore();
    expect(store.state).toEqual(preset('wardrobe'));
    expect(store.sel).toBe(0);
  });

  it('відновлює збережений проєкт', async () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(preset('komod')) });
    const { store } = await loadStore();
    expect(store.state).toEqual(preset('komod'));
  });

  it.each([
    ['зіпсований JSON', '{oops'],
    ['проєкт без секцій', JSON.stringify({ W: 1, sections: [] })],
  ])('%s → пресет за замовчуванням', async (_, raw) => {
    mockStorage({ [STORAGE_KEY]: raw });
    const { store } = await loadStore();
    expect(store.state).toEqual(preset('wardrobe'));
  });

  it('працює без localStorage', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { store, save } = await loadStore();
    expect(store.state).toEqual(preset('wardrobe'));
    expect(() => save()).not.toThrow();
  });
});

describe('save / setProject', () => {
  it('setProject скидає вибір секції, save пише в localStorage', async () => {
    const data = mockStorage();
    const { store, save, setProject } = await loadStore();
    store.sel = 2;
    setProject(preset('penal'));
    expect(store.sel).toBe(0);
    save();
    expect(JSON.parse(data[STORAGE_KEY])).toEqual(preset('penal'));
  });
});

describe('matchPreset', () => {
  it('знаходить пресет, з яким проєкт збігається', async () => {
    mockStorage();
    const { matchPreset } = await loadStore();
    expect(matchPreset(preset('komod'))).toBe('komod');
    expect(matchPreset(preset('wardrobe'))).toBe('wardrobe');
  });

  it('порядок ключів не важливий', async () => {
    mockStorage();
    const { matchPreset } = await loadStore();
    const { sections, ...rest } = preset('komod');
    expect(matchPreset({ sections, ...rest })).toBe('komod');
  });

  it('змінений проєкт не збігається з жодним пресетом', async () => {
    mockStorage();
    const { matchPreset } = await loadStore();
    expect(matchPreset({ ...preset('komod'), W: preset('komod').W + 1 })).toBe(null);
    expect(matchPreset({ ...preset('komod'), top: { mount: 'over', double: false } })).toBe(null);
  });
});

describe('store.preset', () => {
  it('без збережених даних — пресет за замовчуванням', async () => {
    mockStorage();
    const { store } = await loadStore();
    expect(store.preset).toBe('wardrobe');
  });

  it('відновлює збережений пресет, навіть якщо проєкт потім змінювали', async () => {
    mockStorage({
      [STORAGE_KEY]: JSON.stringify({ ...preset('komod'), W: 999 }),
      [PRESET_STORAGE_KEY]: JSON.stringify('komod'),
    });
    const { store } = await loadStore();
    expect(store.preset).toBe('komod');
  });

  it.each([
    ['невідомий ключ', JSON.stringify('nope')],
    ['зіпсований JSON', '{oops'],
  ])('%s → за збігом із проєктом', async (_, raw) => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(preset('penal')), [PRESET_STORAGE_KEY]: raw });
    const { store } = await loadStore();
    expect(store.preset).toBe('penal');
  });

  it('змінений проєкт без збереженого пресета → null', async () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify({ ...preset('penal'), W: 999 }) });
    const { store } = await loadStore();
    expect(store.preset).toBe(null);
  });

  it('setProject: явний ключ або збіг для проєкту з файлу; save зберігає ключ', async () => {
    const data = mockStorage();
    const { store, save, setProject } = await loadStore();
    setProject({ ...preset('komod'), W: 999 }, 'komod');
    expect(store.preset).toBe('komod');
    setProject({ ...preset('komod'), W: 999 });
    expect(store.preset).toBe(null);
    setProject(preset('penal'));
    expect(store.preset).toBe('penal');
    save();
    expect(JSON.parse(data[PRESET_STORAGE_KEY])).toBe('penal');
  });
});

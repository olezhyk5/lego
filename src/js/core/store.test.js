import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEY } from '../config/constants.js';
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

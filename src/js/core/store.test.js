import { describe, it, expect, afterEach, vi } from 'vitest';
import { STORAGE_KEY, LEGACY_STORAGE_KEYS, PRESET_STORAGE_KEY } from '../config/constants.js';
import { preset, presetProject } from './test-fixtures.js';
import { createStore, parseProject } from './store.js';
import { localStorageAdapter, memoryStorage } from './storage.js';

// Підмінений localStorage: сирі рядки за ключами
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

// Стан із localStorage-сховищем, як у createConfigurator за замовчуванням
const loadStore = () => createStore({ storage: localStorageAdapter() });

afterEach(() => vi.unstubAllGlobals());

describe('parseProject', () => {
  it('файл v1 → перевірений проєкт поточної версії', () => {
    expect(parseProject(preset('komod'))).toEqual({ ok: true, project: presetProject('komod') });
  });

  it('помилки формату й перевірки повертаються як {key, params}', () => {
    expect(parseProject(null)).toEqual({ ok: false, errors: [{ key: 'file.notProject' }] });
    const res = parseProject({ ...preset('komod'), sections: [] });
    expect(res.ok).toBe(false);
    expect(!res.ok && res.errors.map(e => e.key)).toEqual(['validate.arrayLength']);
  });
});

describe('завантаження стану', () => {
  it('без збереженого проєкту — пресет за замовчуванням', () => {
    mockStorage();
    const store = loadStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
    expect(store.ui.sel).toBe(0);
  });

  it('відновлює збережений проєкт', () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(presetProject('komod')) });
    expect(loadStore().state).toEqual(presetProject('komod'));
  });

  it.each([
    ['зіпсований JSON', '{oops'],
    ['проєкт без секцій', JSON.stringify({ W: 1, sections: [] })],
  ])('%s → пресет за замовчуванням', (_, raw) => {
    mockStorage({ [STORAGE_KEY]: raw });
    expect(loadStore().state).toEqual(presetProject('wardrobe'));
  });

  it('працює без localStorage', () => {
    vi.stubGlobal('localStorage', undefined);
    const store = loadStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
    expect(() => store.save()).not.toThrow();
  });

  it('без сховища в опціях — у пам’яті, localStorage не чіпається', () => {
    const data = mockStorage({ [STORAGE_KEY]: JSON.stringify(presetProject('komod')) });
    const store = createStore();
    expect(store.state).toEqual(presetProject('wardrobe'));
    store.save();
    expect(JSON.parse(data[STORAGE_KEY])).toEqual(presetProject('komod'));
  });

  it('свій адаптер: проєкт і пресет читаються з нього', () => {
    const storage = memoryStorage();
    storage.set('project', JSON.stringify({ ...presetProject('penal'), W: 999 }));
    storage.set('preset', JSON.stringify('wardrobe.penal'));
    const store = createStore({ storage });
    expect(store.state.W).toBe(999);
    expect(store.preset).toBe('wardrobe.penal');
  });

  it('адаптер кидає помилку — пресет за замовчуванням, save не падає', () => {
    const fail = () => {
      throw new Error('offline');
    };
    const store = createStore({ storage: { get: fail, set: fail } });
    expect(store.state).toEqual(presetProject('wardrobe'));
    expect(() => store.save()).not.toThrow();
  });

  it('два стани незалежні', () => {
    const a = createStore();
    const b = createStore();
    a.state.W = 1234;
    a.ui.sel = 2;
    expect(b.state.W).toBe(1800); // пресет за замовчуванням — шафа 1800 мм
    expect(b.ui.sel).toBe(0);
  });
});

describe('save / setProject', () => {
  it('setProject скидає стан форми, save пише в localStorage', () => {
    const data = mockStorage();
    const store = loadStore();
    store.ui.sel = 2;
    store.setProject(presetProject('penal'));
    expect(store.ui.sel).toBe(0);
    store.save();
    expect(JSON.parse(data[STORAGE_KEY])).toEqual(presetProject('penal'));
  });
});

describe('store.preset', () => {
  it('без збережених даних — пресет за замовчуванням', () => {
    mockStorage();
    expect(loadStore().preset).toBe('wardrobe.wardrobe');
  });

  it('відновлює збережений пресет, навіть якщо проєкт потім змінювали', () => {
    mockStorage({
      [STORAGE_KEY]: JSON.stringify({ ...presetProject('komod'), W: 999 }),
      [PRESET_STORAGE_KEY]: JSON.stringify('wardrobe.komod'),
    });
    expect(loadStore().preset).toBe('wardrobe.komod');
  });

  it('старе значення без типу (до реєстру типів) → wardrobe.<ключ>', () => {
    mockStorage({
      [STORAGE_KEY]: JSON.stringify({ ...presetProject('komod'), W: 999 }),
      [PRESET_STORAGE_KEY]: JSON.stringify('komod'),
    });
    expect(loadStore().preset).toBe('wardrobe.komod');
  });

  it.each([
    ['невідомий ключ', JSON.stringify('nope')],
    ['невідомий тип', JSON.stringify('sofa.komod')],
    ['зіпсований JSON', '{oops'],
  ])('%s → за збігом із проєктом', (_, raw) => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(presetProject('penal')), [PRESET_STORAGE_KEY]: raw });
    expect(loadStore().preset).toBe('wardrobe.penal');
  });

  it('змінений проєкт без збереженого пресета → null', () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify({ ...presetProject('penal'), W: 999 }) });
    expect(loadStore().preset).toBe(null);
  });

  it('setProject: явний ключ або збіг для проєкту з файлу; save зберігає ключ', () => {
    const data = mockStorage();
    const store = loadStore();
    store.setProject({ ...presetProject('komod'), W: 999 }, 'wardrobe.komod');
    expect(store.preset).toBe('wardrobe.komod');
    store.setProject({ ...presetProject('komod'), W: 999 });
    expect(store.preset).toBe(null);
    store.setProject(presetProject('penal'));
    expect(store.preset).toBe('wardrobe.penal');
    store.save();
    expect(JSON.parse(data[PRESET_STORAGE_KEY])).toBe('wardrobe.penal');
  });
});

describe('міграція з localStorage', () => {
  const LEGACY = LEGACY_STORAGE_KEYS[0];

  it('лише старий ключ (v1) → проєкт мігровано; save пише в новий ключ, старий лишається', () => {
    const data = mockStorage({ [LEGACY]: JSON.stringify(preset('komod')) });
    const store = loadStore();
    expect(store.state).toEqual(presetProject('komod'));
    expect(store.preset).toBe('wardrobe.komod');
    store.save();
    expect(JSON.parse(data[STORAGE_KEY])).toEqual(presetProject('komod'));
    expect(JSON.parse(data[LEGACY])).toEqual(preset('komod'));
  });

  it('є обидва ключі → береться новий', () => {
    mockStorage({ [LEGACY]: JSON.stringify(preset('komod')), [STORAGE_KEY]: JSON.stringify(presetProject('penal')) });
    expect(loadStore().state).toEqual(presetProject('penal'));
  });

  it('у новому ключі файл новішої версії → пресет за замовчуванням', () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify({ ...presetProject('penal'), version: 99 }) });
    expect(loadStore().state).toEqual(presetProject('wardrobe'));
  });

  it('у новому ключі старий формат (без version) теж мігрується', () => {
    mockStorage({ [STORAGE_KEY]: JSON.stringify(preset('tumba')) });
    expect(loadStore().state).toEqual(presetProject('tumba'));
  });
});

describe('localStorageAdapter', () => {
  it('назви → ключі lego-project / lego-preset / lego-locale; мова — без JSON', () => {
    const data = mockStorage();
    const s = localStorageAdapter();
    s.set('project', '{}');
    s.set('preset', '"wardrobe.komod"');
    s.set('locale', 'en');
    expect(data).toEqual({ 'lego-project': '{}', 'lego-preset': '"wardrobe.komod"', 'lego-locale': 'en' });
    expect(s.get('locale')).toBe('en');
  });

  it('старий ключ читається лише для проєкту й лише без нового', () => {
    mockStorage({ [LEGACY_STORAGE_KEYS[0]]: 'old' });
    const s = localStorageAdapter();
    expect(s.get('project')).toBe('old');
    expect(s.get('preset')).toBe(null);
  });
});

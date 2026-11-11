import { describe, it, expect } from 'vitest';
import {
  presetIds,
  presetProject,
  matchPreset,
  isPresetId,
  presetType,
  upgradePresetId,
  resolvePresets,
  presetTypes,
  DEFAULT_PRESET,
} from './presets.js';
import { presetProject as wardrobePreset } from './test-fixtures.js';
import { PRESETS } from './types/wardrobe/presets.js';

describe('пресети', () => {
  it('ідентифікатори — <тип>.<ключ>', () => {
    expect(presetIds('wardrobe')).toEqual(Object.keys(PRESETS).map(k => `wardrobe.${k}`));
    expect(presetIds()).toEqual(expect.arrayContaining(presetIds('wardrobe')));
    expect(DEFAULT_PRESET).toBe('wardrobe.wardrobe');
  });

  it('isPresetId / presetType', () => {
    expect(isPresetId('wardrobe.komod')).toBe(true);
    expect(isPresetId('wardrobe.nope')).toBe(false);
    expect(isPresetId('sofa.komod')).toBe(false);
    expect(isPresetId('komod')).toBe(false);
    expect(isPresetId(null)).toBe(false);
    expect(presetType('wardrobe.komod')).toBe('wardrobe');
  });

  it('presetProject — проєкт поточної версії, кожен раз новий об’єкт', () => {
    expect(presetProject('wardrobe.komod')).toEqual(wardrobePreset('komod'));
    expect(presetProject('wardrobe.komod')).not.toBe(presetProject('wardrobe.komod'));
  });

  it('upgradePresetId: старі значення без типу → шафа', () => {
    expect(upgradePresetId('komod')).toBe('wardrobe.komod');
    expect(upgradePresetId('wardrobe.komod')).toBe('wardrobe.komod');
    expect(upgradePresetId(null)).toBe(null);
  });
});

describe('matchPreset', () => {
  it('знаходить пресет, з яким проєкт збігається', () => {
    expect(matchPreset(wardrobePreset('komod'))).toBe('wardrobe.komod');
    expect(matchPreset(wardrobePreset('wardrobe'))).toBe('wardrobe.wardrobe');
  });

  it('порядок ключів не важливий', () => {
    const { sections, ...rest } = wardrobePreset('komod');
    expect(matchPreset({ sections, ...rest })).toBe('wardrobe.komod');
  });

  it('змінений проєкт або невідомий тип не збігається з жодним пресетом', () => {
    const komod = wardrobePreset('komod');
    expect(matchPreset({ ...komod, W: komod.W + 1 })).toBe(null);
    expect(matchPreset({ ...komod, top: { mount: 'over', double: false } })).toBe(null);
    expect(matchPreset({ ...komod, type: 'sofa' })).toBe(null);
  });
});

describe('resolvePresets — опція presets', () => {
  it('без списку — усі пресети', () => expect(resolvePresets()).toEqual(presetIds()));

  it('тип — усі його пресети; пресет — він сам; порядок — як у реєстрі, без повторів', () => {
    expect(resolvePresets(['kitchen'])).toEqual(presetIds('kitchen'));
    expect(resolvePresets(['wardrobe.tumba', 'wardrobe.komod', 'wardrobe.komod'])).toEqual([
      'wardrobe.komod',
      'wardrobe.tumba',
    ]);
    expect(resolvePresets(['kitchen.base60', 'wardrobe'])).toEqual([...presetIds('wardrobe'), 'kitchen.base60']);
  });

  it.each([
    ['невідомий тип', ['sofa']],
    ['невідомий пресет', ['wardrobe.nope']],
    ['порожній список', []],
    ['не масив', 'kitchen'],
  ])('%s — помилка', (_, list) => expect(() => resolvePresets(/** @type {any} */ (list))).toThrow());

  it('presetTypes — типи пресетів без повторів', () => {
    expect(presetTypes(['wardrobe.komod', 'kitchen.base60', 'wardrobe.tumba'])).toEqual(['wardrobe', 'kitchen']);
  });
});

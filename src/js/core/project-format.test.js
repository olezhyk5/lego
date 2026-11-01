import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { FORMAT_VERSION, createProject, upgradeProject } from './project-format.js';
import { preset } from './test-fixtures.js';
import { PRESETS } from './types/wardrobe/presets.js';

const fixture = name => JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8'));

describe('createProject', () => {
  it('додає version і type першими ключами', () => {
    const p = createProject('wardrobe', preset('komod'));
    expect(Object.keys(p).slice(0, 2)).toEqual(['version', 'type']);
    expect(p).toEqual({ version: FORMAT_VERSION, type: 'wardrobe', ...preset('komod') });
  });

  it('старі version/type у даних замінюються', () => {
    expect(createProject('wardrobe', { version: 1, type: 'x', W: 1 })).toEqual({
      version: FORMAT_VERSION,
      type: 'wardrobe',
      W: 1,
    });
  });
});

describe('upgradeProject', () => {
  it.each(Object.keys(PRESETS))('v1 (%s без version) → v2 шафа, решта полів без змін', key => {
    const res = upgradeProject(preset(key));
    expect(res).toEqual({ ok: true, migrated: true, project: { version: 2, type: 'wardrobe', ...preset(key) } });
  });

  it('v2 → без змін, migrated: false', () => {
    const p = createProject('wardrobe', preset('penal'));
    expect(upgradeProject(p)).toEqual({ ok: true, migrated: false, project: p });
  });

  it('вхідний об’єкт не мутується', () => {
    const raw = preset('komod');
    upgradeProject(raw);
    expect(raw).toEqual(preset('komod'));
  });

  it('новіша версія → file.tooNew', () => {
    expect(upgradeProject({ ...preset('komod'), version: 3 })).toEqual({
      ok: false,
      error: { key: 'file.tooNew', params: { version: 3 } },
    });
  });

  it.each([['2'], [0], [-1], [1.5]])('version = %j → file.badVersion', version => {
    expect(upgradeProject({ ...preset('komod'), version })).toEqual({ ok: false, error: { key: 'file.badVersion' } });
  });

  it.each([[null], [[]], ['abc'], [42]])('%j → file.notProject', raw => {
    expect(upgradeProject(raw)).toEqual({ ok: false, error: { key: 'file.notProject' } });
  });

  it('невідомий тип → file.unknownType', () => {
    expect(upgradeProject({ version: 2, type: 'sofa', W: 1 })).toEqual({
      ok: false,
      error: { key: 'file.unknownType', params: { type: 'sofa' } },
    });
  });
});

// Справжні файли старих версій. Їх НЕ редагуємо: кожна нова версія формату додає свою фікстуру.
describe('фікстури старих файлів', () => {
  it('v1-wardrobe.json (кришка над боковинами, виступи) відкривається як v2', () => {
    const raw = fixture('v1-wardrobe.json');
    const res = upgradeProject(raw);
    expect(res.ok).toBe(true);
    expect(res.ok && res.project).toEqual({ version: 2, type: 'wardrobe', ...raw });
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupDom, click } from './test-dom.js';
import { initSidebar, markPreset } from './sidebar.js';
import { initModal } from './modal.js';
import { store, setProject } from '../core/store.js';
import { presetProject } from '../core/presets.js';
import { $, $$ } from '../utils/dom.js';

let loadProject;
beforeEach(() => {
  setupDom();
  initModal();
  setProject(presetProject('wardrobe.wardrobe'), 'wardrobe.wardrobe');
  loadProject = vi.fn();
  initSidebar({ loadProject });
});

describe('пресети', () => {
  it('групи за типами меблів з кнопками всіх пресетів', () => {
    expect($$('#presets h3')).toHaveLength(2); // заголовок групи на кожен тип
    expect($$('[data-preset]').map(b => b.dataset.preset)).toEqual(
      expect.arrayContaining(['wardrobe.komod', 'kitchen.line240']),
    );
  });

  it('markPreset підсвічує вибраний', () => {
    store.preset = 'wardrobe.komod';
    markPreset();
    expect($('[data-preset="wardrobe.komod"]').getAttribute('aria-pressed')).toBe('true');
    expect($$('[aria-pressed="true"]')).toHaveLength(1);
  });

  it('клік → loadProject з проєктом пресета', () => {
    click($('[data-preset="wardrobe.komod"]'));
    expect(loadProject).toHaveBeenCalledWith(presetProject('wardrobe.komod'), 'wardrobe.komod');
  });

  it('інший тип при незміненому проєкті — без підтвердження', () => {
    click($('[data-preset="kitchen.line180"]'));
    expect(loadProject).toHaveBeenCalledOnce();
    expect($('#modal').open).toBeFalsy();
  });
});

describe('зміна типу при зміненому проєкті', () => {
  beforeEach(() => {
    store.state.W = 1234;
    click($('[data-preset="kitchen.line180"]'));
  });

  it('спершу модалка, проєкт ще не завантажено', () => {
    expect($('#modal').open).toBe(true);
    expect(loadProject).not.toHaveBeenCalled();
  });

  it('«Продовжити» — завантажує', () => {
    $('#modalForm').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(loadProject).toHaveBeenCalledWith(presetProject('kitchen.line180'), 'kitchen.line180');
    expect($('#modal').open).toBe(false);
  });

  it('«Скасувати» — ні', () => {
    click($('#modal button[type="button"][data-modal-close]'));
    expect(loadProject).not.toHaveBeenCalled();
    expect($('#modal').open).toBe(false);
  });
});

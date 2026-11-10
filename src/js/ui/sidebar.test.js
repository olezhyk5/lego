// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { setupDom, createTestApp, ref, click } from './test-dom.js';
import { createSidebar } from './sidebar.js';
import { presetProject } from '../core/presets.js';
import { $, $$ } from '../utils/dom.js';

let store, loadProject, markPreset;
beforeEach(() => {
  setupDom();
  const app = createTestApp();
  store = app.store;
  loadProject = app.loadProject;
  store.setProject(presetProject('wardrobe.wardrobe'), 'wardrobe.wardrobe');
  ({ markPreset } = createSidebar(app));
});

describe('пресети', () => {
  it('групи за типами меблів з кнопками всіх пресетів', () => {
    expect($$('[data-ref="presets"] h3')).toHaveLength(2); // заголовок групи на кожен тип
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
    expect(ref('modal').open).toBeFalsy();
  });
});

describe('зміна типу при зміненому проєкті', () => {
  beforeEach(() => {
    store.state.W = 1234;
    click($('[data-preset="kitchen.line180"]'));
  });

  it('спершу модалка, проєкт ще не завантажено', () => {
    expect(ref('modal').open).toBe(true);
    expect(loadProject).not.toHaveBeenCalled();
  });

  it('«Продовжити» — завантажує', () => {
    ref('modalForm').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(loadProject).toHaveBeenCalledWith(presetProject('kitchen.line180'), 'kitchen.line180');
    expect(ref('modal').open).toBe(false);
  });

  it('«Скасувати» — ні', () => {
    click($('[data-ref="modal"] button[type="button"][data-modal-close]'));
    expect(loadProject).not.toHaveBeenCalled();
    expect(ref('modal').open).toBe(false);
  });

  it('заголовок згортає й розгортає кнопки', () => {
    click(ref('presetsToggle'));
    expect(ref('presets').hidden).toBe(true);
    expect(ref('presetsToggle').title).toBe('Розгорнути пресети');
    click(ref('presetsToggle'));
    expect(ref('presets').hidden).toBe(false);
    expect(ref('presetsToggle').getAttribute('aria-expanded')).toBe('true');
  });
});

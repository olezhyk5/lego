import { store } from '../core/store.js';
import { presetProject, presetType, matchPreset } from '../core/presets.js';
import { t } from '../i18n/index.js';
import { openModal } from './modal.js';
import { $, $$ } from '../utils/dom.js';
import { presetButtons } from './templates.js';

// Оболонка сайдбару: пресети всіх типів. Форму поточного типу малює ui/forms.js (через main.js).

// Підсвічує останній вибраний пресет
export function markPreset() {
  const active = store.preset;
  $$('[data-preset]').forEach(b => {
    const on = b.dataset.preset === active;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

// Кнопки пресетів (і після зміни мови)
export function renderPresets() {
  $('#presets').innerHTML = presetButtons();
  markPreset();
}

export function initSidebar({ loadProject }) {
  renderPresets();
  $('#presets').addEventListener('click', e => {
    const b = e.target.closest('[data-preset]');
    if (!b) return;
    const id = b.dataset.preset;
    const load = () => loadProject(presetProject(id), id);
    // інший тип меблів, а поточний проєкт змінено (не збігається з пресетом) — спершу підтвердження
    if (presetType(id) === store.state.type || matchPreset(store.state)) return load();
    openModal({
      title: t('sidebar.switchTypeTitle'),
      body: `<p>${t('sidebar.switchTypeText')}</p>`,
      saveLabel: 'modal.continue',
      onSave: load,
    });
  });
}

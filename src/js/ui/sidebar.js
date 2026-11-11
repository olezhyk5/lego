import { presetProject, presetType, matchPreset } from '../core/presets.js';
import { t } from '../i18n/index.js';
import { presetButtons } from './templates.js';

// Оболонка сайдбару: пресети, доступні екземпляру (опція presets). Форму поточного типу малює ui/forms.js (через екземпляр).
// Без пресетів у розмітці (опція ui.presets = false) усе тут — порожні дії.

/** @param {import('./app.js').App} app */
export function createSidebar(app) {
  const { store, ref, $$ } = app;
  const box = ref('presets');
  const toggle = ref('presetsToggle');

  // Підсвічує останній вибраний пресет
  function markPreset() {
    const active = store.preset;
    $$('[data-preset]').forEach(b => {
      const on = b.dataset.preset === active;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // Згорнуто / розгорнуто: стан лише на час сесії, як у специфікації
  function syncToggle() {
    const collapsed = store.presetsCollapsed;
    box.hidden = collapsed;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = t(collapsed ? 'sidebar.presetsExpand' : 'sidebar.presetsCollapse');
  }

  // Кнопки пресетів (і після зміни мови)
  function renderPresets() {
    if (!box) return;
    box.innerHTML = presetButtons(app.presets);
    markPreset();
    syncToggle();
  }

  if (box) {
    toggle.addEventListener('click', () => {
      store.presetsCollapsed = !store.presetsCollapsed;
      syncToggle();
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-preset]');
      if (!b) return;
      const id = b.dataset.preset;
      const load = () => app.loadProject(presetProject(id), id);
      // інший тип меблів, а поточний проєкт змінено (не збігається з пресетом) — спершу підтвердження
      if (presetType(id) === store.state.type || matchPreset(store.state)) return load();
      app.openModal({
        title: t('sidebar.switchTypeTitle'),
        body: `<p>${t('sidebar.switchTypeText')}</p>`,
        saveLabel: 'modal.continue',
        onSave: load,
      });
    });
    renderPresets();
  }

  return { markPreset, renderPresets };
}

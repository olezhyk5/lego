import { doorSettingsForm } from './templates.js';
import { t } from '../../../i18n/index.js';

// Попап «Налаштування дверей»: тип дверей (без / розсувні / розпашні).
// Вибір — чернетка: у проєкт потрапляє лише після «Зберегти». Розсувні втоплюють наповнення (core/types/wardrobe).
/** @param {import('../../app.js').App} app */
export function initDoorSettings({ store, ref, update, openModal }) {
  ref('doorSettings').addEventListener('click', () => {
    openModal({
      title: t('sidebar.doorSettings'),
      body: doorSettingsForm(store.state.doors),
      onSave: body => {
        store.state.doors = body.querySelector('[data-field="doors"]:checked').value;
        // структура сайдбару не змінюється; update зберігає проєкт
        update(false);
      },
    });
  });
}

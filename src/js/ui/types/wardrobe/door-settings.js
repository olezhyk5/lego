import { $ } from '../../../utils/dom.js';
import { openModal } from '../../modal.js';
import { t } from '../../../i18n/index.js';

// Попап «Налаштування дверей». Поки порожній: полів і змін у проєкті ще немає.
export function initDoorSettings() {
  $('#doorSettings').addEventListener('click', () => {
    openModal({ title: t('sidebar.doorSettings'), body: '' });
  });
}

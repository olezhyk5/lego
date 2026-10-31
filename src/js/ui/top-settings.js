import { store } from '../core/store.js';
import { carcass } from '../core/layout.js';
import { $, $$ } from '../utils/dom.js';
import { openModal } from './modal.js';
import { topSettingsForm } from './templates.js';
import { t } from '../i18n/index.js';

// Попап «Налаштування кришки». Поля попапу — чернетка: у проєкт потрапляють лише після «Зберегти».
export function initTopSettings({ update }) {
  $('#topSettings').addEventListener('click', () => {
    openModal({
      title: t('sidebar.topSettings'),
      body: topSettingsForm(carcass(store.state)),
      onOpen: body => {
        // виступи — лише для «Над боковинами»
        body.addEventListener('change', e => {
          if (e.target.matches('[data-field="topMount"]'))
            $('[data-overhang]', body).hidden = e.target.value !== 'over';
        });
      },
      onSave: body => {
        const mount = $('[data-field="topMount"]:checked', body).value;
        const top = { mount, double: $('[data-field="topDouble"]', body).checked };
        if (mount === 'over') {
          // порожнє / від'ємне поле → 0
          top.overhang = Object.fromEntries(
            $$('[data-field="topOverhang"]', body).map(el => [
              el.dataset.side,
              Math.max(0, Math.round(+el.value || 0)),
            ]),
          );
        }
        store.state.top = top;
        // структура сайдбару не змінюється — лише модель і специфікація
        update(false);
      },
    });
  });
}

import { typeIds } from '../core/registry.js';
import { presetIds } from '../core/presets.js';
import { t } from '../i18n/index.js';
import { round } from '../utils/helpers.js';

// Загальні HTML-шаблони. Класи — для стилів, data-атрибути — для JS, тексти — лише через t().
// Шаблони форми конкретного типу — у ui/types/<тип>/templates.js.

const presetButton = id => `<button class="btn" data-preset="${id}">${t('preset.' + id)}</button>`;

// Пресети всіх типів; якщо типів кілька — групами з назвою типу
export function presetButtons() {
  const types = typeIds();
  if (types.length === 1) return presetIds().map(presetButton).join('');
  return types
    .map(
      type => `<div class="presets__group">
        <h3 class="presets__title">${t('type.' + type)}</h3>
        <div class="presets__list">${presetIds(type).map(presetButton).join('')}</div>
      </div>`,
    )
    .join('');
}

// Іконка «копіювати»: символ ⧉ у системних шрифтах помітно дрібніший за стрілки, тож SVG під розмір тексту
export const COPY_ICON = `<svg class="btn__svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/>
</svg>`;

// Іконка налаштувань (шестерня) для кнопок, що відкривають попап
export const GEAR_ICON = `<svg class="option-btn__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</svg>`;

// disabled — дія зараз неможлива (напр. зсунути крайню секцію)
export const iconBtn = (act, titleKey, icon, disabled = false) =>
  `<button class="btn btn--icon" data-act="${act}" title="${t(titleKey)}" aria-label="${t(titleKey)}"${disabled ? ' disabled' : ''}>${icon}</button>`;

export const calcMm = v => t('common.calcMm', { value: round(v) });

// Поле габариту з id (статичний хук): {id, labelKey, min, max}
export const dimField = ({ id, labelKey, min, max }) => `<label class="field"
    ><span>${t(labelKey)}</span>
    <input class="input" id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="10"
  /></label>`;

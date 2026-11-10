import { t } from '../../i18n/index.js';

// Розмітка екземпляра конфігуратора всередині root: панель інструментів, сайдбар, 3D, звіт, попап, тост.
// Хуки — data-ref (JS шукає їх лише всередині root), id — тільки для ARIA, з префіксом екземпляра,
// щоб кілька копій на сторінці не конфліктували. Тексти — через t() і data-i18n* (relocalize перекладає знову).

/**
 * Які частини інтерфейсу показувати (опція ui у createConfigurator); за замовчуванням — усі.
 * @typedef {{ presets: boolean, export: boolean, files: boolean, locale: boolean }} UiParts
 */

const text = (key, tag = 'span', attrs = '') => `<${tag}${attrs} data-i18n="${key}">${t(key)}</${tag}>`;
const btn = (ref, key, cls = 'btn') => text(key, 'button', ` type="button" class="${cls}" data-ref="${ref}"`);
const labelled = key =>
  `data-i18n-title="${key}" data-i18n-aria-label="${key}" title="${t(key)}" aria-label="${t(key)}"`;

const exportButtons = () =>
  btn('png', 'toolbar.png') + btn('copy', 'toolbar.copy') + btn('csv', 'toolbar.csv', 'btn btn--primary');

const fileButtons = () =>
  btn('saveJson', 'toolbar.save') +
  btn('loadJson', 'toolbar.open') +
  '<input type="file" data-ref="fileIn" accept=".json,application/json" hidden />';

const presetsCard = uid => `<section class="card presets">
    <h2 class="card__title">
      <button type="button" class="presets__toggle" data-ref="presetsToggle" aria-expanded="true" aria-controls="${uid}-presets">
        <span class="presets__chevron" aria-hidden="true"></span>
        ${text('sidebar.presets')}
      </button>
    </h2>
    <div class="presets__body" id="${uid}-presets" data-ref="presets"></div>
  </section>`;

/**
 * @param {string} uid префікс id цього екземпляра
 * @param {UiParts} ui
 */
export const shellMarkup = (uid, ui) => `<header class="topbar">
    ${text('app.title', 'h1', ' class="topbar__title"')}
    <div class="topbar__actions">
      <label class="topbar__toggle"><input type="checkbox" data-ref="showDims" checked /> ${text('toolbar.dims')}</label>
      <label class="topbar__toggle"><input type="checkbox" data-ref="transparent" /> ${text('toolbar.transparent')}</label>
      ${btn('resetView', 'toolbar.resetView')}
      ${ui.export ? exportButtons() : ''}
      ${ui.files ? fileButtons() : ''}
      ${ui.locale ? `<select class="select" data-ref="locale" ${labelled('toolbar.locale')}></select>` : ''}
    </div>
  </header>
  <div class="app">
    <aside class="app__sidebar">
      <div class="app__setup">
        ${ui.presets ? presetsCard(uid) : ''}
        <div data-ref="formSetup"></div>
      </div>
      <div class="app__sections" data-ref="formMain"></div>
    </aside>
    <main class="app__main">
      <div class="viewer app__viewer" data-ref="view">
        ${text('viewer.noWebgl', 'div', ' class="viewer__fallback" data-ref="nogl"')}
      </div>
      <div class="report app__report">
        <div data-ref="msgs"></div>
        <button type="button" class="report__toggle" data-ref="reportToggle" aria-expanded="false" aria-controls="${uid}-report">
          <span class="report__chevron" aria-hidden="true"></span>
          ${text('report.toggle')}
        </button>
        <div class="report__cols" id="${uid}-report" data-ref="reportCols" hidden>
          <div>
            ${text('report.panels', 'h3', ' class="report__title"')}
            <div class="report__scroll"><table class="table" data-ref="tP"></table></div>
            <div class="report__scroll"><table class="table" data-ref="tS"></table></div>
            ${text('report.sheetsHint', 'p', ' class="hint"')}
          </div>
          <div>
            ${text('report.items', 'h3', ' class="report__title"')}
            <div class="report__scroll"><table class="table" data-ref="tI"></table></div>
            <h3 class="report__title" data-ref="descTitle"></h3>
            <ul class="report__list" data-ref="desc"></ul>
          </div>
        </div>
      </div>
    </main>
  </div>
  <dialog class="modal" data-ref="modal" aria-labelledby="${uid}-modal-title">
    <div class="modal__overlay" data-modal-close></div>
    <form class="modal__panel" data-ref="modalForm" novalidate>
      <div class="modal__head">
        <h2 class="modal__title" id="${uid}-modal-title" data-ref="modalTitle"></h2>
        <button type="button" class="btn btn--icon modal__close" data-modal-close ${labelled('modal.close')}>✕</button>
      </div>
      <div class="modal__body" data-ref="modalBody"></div>
      <div class="modal__foot">
        ${text('modal.cancel', 'button', ' type="button" class="btn" data-modal-close')}
        ${text('modal.save', 'button', ' type="submit" class="btn btn--primary" data-ref="modalSubmit"')}
      </div>
    </form>
  </dialog>
  <div class="toast" data-ref="toast" role="status" aria-live="polite"></div>`;

// Точка входу → assets/js/main.js
import { store, save } from './core/store.js';
import { computeLayout } from './core/layout.js';
import { createViewer } from './viewer/viewer.js';
import { initSidebar, renderSections, refreshCalc, syncDims, markPreset } from './ui/sidebar.js';
import { initToolbar } from './ui/toolbar.js';
import { renderReport, initReport } from './ui/report.js';
import { initModal } from './ui/modal.js';
import { initTopSettings } from './ui/top-settings.js';
import { $ } from './utils/dom.js';
import { translateDom } from './i18n/index.js';

translateDom();

const viewer = createViewer($('#view'));
if (!viewer) $('#nogl').classList.add('is-visible');

let rebuildPending = false;
function scheduleRebuild() {
  if (!viewer || rebuildPending) return;
  rebuildPending = true;
  requestAnimationFrame(() => {
    rebuildPending = false;
    viewer.rebuild(store.state, computeLayout(store.state), store);
  });
}

// Головний цикл оновлення. full=true — перемалювати сайдбар повністю
// (змінилась структура), false — лише розраховані значення.
function update(full) {
  const L = computeLayout(store.state);
  if (store.sel >= store.state.sections.length) store.sel = store.state.sections.length - 1;
  if (full) renderSections(L);
  else refreshCalc(L);
  scheduleRebuild();
  renderReport(store.state, L);
  markPreset();
  save();
}

function fit() {
  if (viewer) viewer.fit(store.state);
}

const app = { update, fit, viewer };
initSidebar(app);
initToolbar(app);
initModal();
initReport();
initTopSettings(app);

syncDims();
update(true);
fit();

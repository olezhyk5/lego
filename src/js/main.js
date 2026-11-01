// Точка входу → assets/js/main.js
import { store, save, setProject } from './core/store.js';
import { projectReport } from './core/export.js';
import { getType } from './core/registry.js';
import { createViewer } from './viewer/viewer.js';
import { initSidebar, markPreset } from './ui/sidebar.js';
import { getForm } from './ui/forms.js';
import { initToolbar } from './ui/toolbar.js';
import { renderReport, initReport } from './ui/report.js';
import { initModal } from './ui/modal.js';
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
    const s = store.state;
    const type = getType(s.type);
    const L = type.layout(s);
    viewer.rebuild(
      { geometry: type.geometry(s, L), annotations: type.annotations(s, L, store.ui), bounds: L.bounds },
      store,
    );
  });
}

// Форма поточного типу меблів; перемальовується, коли змінюється тип проєкту
let form = null;
let formType = null;
function ensureForm() {
  if (formType === store.state.type) return false;
  formType = store.state.type;
  form = getForm(formType);
  form.mount({ setup: $('#formSetup'), main: $('#formMain') }, app);
  form.sync();
  return true;
}

// Головний цикл оновлення. full=true — перемалювати форму повністю
// (змінилась структура), false — лише розраховані значення.
function update(full) {
  const R = projectReport(store.state);
  if (ensureForm() || full) form.render(R.L);
  else form.refresh(R.L);
  scheduleRebuild();
  renderReport(R);
  markPreset();
  save();
}

function fit() {
  if (viewer) viewer.fit(getType(store.state.type).layout(store.state).bounds);
}

// Новий проєкт (пресет, файл): стан форми скидається, поля переписуються
function loadProject(project, preset) {
  setProject(project, preset);
  if (!ensureForm()) form.sync();
  update(true);
  fit();
}

const app = { update, fit, loadProject, viewer };
initSidebar(app);
initToolbar(app);
initModal();
initReport();

update(true);
fit();

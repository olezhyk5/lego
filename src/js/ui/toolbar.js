import { parseProject } from '../core/store.js';
import { exportRows, toCsv, toTsv, fileBase } from '../core/export.js';
import { download, readText, copyText } from '../utils/file.js';
import { t, LOCALES, getLocale } from '../i18n/index.js';

// Кнопки верхньої панелі: вид, експорт, збереження/відкриття проєкту, мова.
// Кнопок, вимкнених опцією ui, у розмітці немає — їх обробники не вішаються.

// Список мов: назва кожної мови — її ж мовою (locale.<код>), тож список не перекладається
function renderLocales(select) {
  select.innerHTML = LOCALES.map(code => `<option value="${code}">${t('locale.' + code)}</option>`).join('');
  select.value = getLocale();
}

/** @param {import('./app.js').App} app */
export function createToolbar(app) {
  const { store, ref, viewer, toast } = app;
  const on = (name, event, handler) => ref(name)?.addEventListener(event, handler);

  const loc = ref('locale');
  if (loc) {
    renderLocales(loc);
    loc.addEventListener('change', () => app.changeLocale(loc.value));
  }

  on('showDims', 'change', e => {
    store.showDims = e.target.checked;
    if (viewer) viewer.setDimsVisible(store.showDims);
  });
  on('transparent', 'change', e => {
    store.transparent = e.target.checked;
    if (viewer) viewer.setTransparent(store.transparent);
  });
  on('resetView', 'click', app.fit);

  on('csv', 'click', () => {
    download(toCsv(exportRows(store.state)), `${fileBase(store.state)}.csv`, 'text/csv;charset=utf-8');
  });

  on('copy', 'click', () => {
    copyText(toTsv(exportRows(store.state))).then(
      () => toast(t('toast.copied')),
      () => toast(t('toast.copyFailed')),
    );
  });

  on('png', 'click', () => {
    if (!viewer) return;
    viewer.toBlob(b => download(b, `${fileBase(store.state)}.png`));
  });

  on('saveJson', 'click', () => {
    download(JSON.stringify(store.state, null, 2), `${fileBase(store.state)}.json`, 'application/json');
  });
  on('loadJson', 'click', () => ref('fileIn').click());
  on('fileIn', 'change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';
    let raw;
    try {
      raw = JSON.parse(await readText(f));
    } catch {
      toast(t('toast.badFile'));
      return;
    }
    const res = parseProject(raw);
    if (!res.ok) {
      console.warn(`${f.name}: проєкт не пройшов перевірку`, res.errors);
      const [error] = res.errors;
      const more = res.errors.length - 1;
      return toast(more ? t('toast.badFileMore', { error, more }) : t('toast.badFileDetails', { error }));
    }
    app.loadProject(res.project);
    toast(t('toast.opened'));
  });

  return {
    // Після зміни мови (в цьому чи іншому екземплярі): вибране значення списку
    syncLocale() {
      if (loc) loc.value = getLocale();
    },
  };
}

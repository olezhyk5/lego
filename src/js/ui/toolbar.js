import { store, setProject, isValidProject } from '../core/store.js';
import { exportRows, toCsv, toTsv, fileBase } from '../core/export.js';
import { download, readText, copyText } from '../utils/file.js';
import { $ } from '../utils/dom.js';
import { syncDims } from './sidebar.js';
import { toast } from './toast.js';
import { t } from '../i18n/index.js';

// Кнопки верхньої панелі: вид, експорт, збереження/відкриття проєкту.
export function initToolbar({ update, fit, viewer }) {
  $('#showDims').addEventListener('change', e => {
    store.showDims = e.target.checked;
    if (viewer) viewer.setDimsVisible(store.showDims);
  });
  $('#resetView').addEventListener('click', fit);

  $('#csv').addEventListener('click', () => {
    download(toCsv(exportRows(store.state)), `${fileBase(store.state)}.csv`, 'text/csv;charset=utf-8');
  });

  $('#copy').addEventListener('click', () => {
    copyText(toTsv(exportRows(store.state))).then(
      () => toast(t('toast.copied')),
      () => toast(t('toast.copyFailed')),
    );
  });

  $('#png').addEventListener('click', () => {
    if (!viewer) return;
    viewer.toBlob(b => download(b, `${fileBase(store.state)}.png`));
  });

  $('#saveJson').addEventListener('click', () => {
    download(JSON.stringify(store.state, null, 2), `${fileBase(store.state)}.json`, 'application/json');
  });
  $('#loadJson').addEventListener('click', () => $('#fileIn').click());
  $('#fileIn').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';
    try {
      const d = JSON.parse(await readText(f));
      if (!isValidProject(d)) throw new Error('invalid');
      setProject(d);
      syncDims();
      update(true);
      fit();
      toast(t('toast.opened'));
    } catch (err) {
      toast(t('toast.badFile'));
    }
  });
}

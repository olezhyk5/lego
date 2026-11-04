import { DEFAULT_CORNER, CORNER_COUNT, MAX_WALLS } from '../../../core/types/kitchen/constants.js';
import { store } from '../../../core/store.js';
import { clone } from '../../../utils/helpers.js';
import { $ } from '../../../utils/dom.js';
import { wallIndex, tierOf, runOf, selectRow } from './row.js';

// Обробники стін, рядів і картки кута.

const NEW_MODULE = { width: 600, type: 'doors', count: 1 };
const CORNER_FIELDS = { cWidth: 'width', cFiller: 'filler', cA: 'a', cB: 'b' };

function bindCorner({ update, fit }) {
  const corner = $('#corner');
  corner.addEventListener('click', e => {
    if (!e.target.closest('[data-act="wallDel"]')) return;
    const walls = store.state.walls;
    const k = wallIndex();
    walls.splice(k - 1, 1);
    if (!walls.length) delete store.state.walls;
    selectRow(k - 1, tierOf());
    update(true);
    fit();
  });
  corner.addEventListener('input', e => {
    const c = runOf().corner;
    const f = e.target.dataset.field;
    const v = parseInt(e.target.value);
    const key = CORNER_FIELDS[f];
    if (key) c[key] = v >= (f === 'cFiller' ? 0 : 1) ? v : DEFAULT_CORNER[c.type][key];
    if (f === 'cCount') c.count = Math.max(CORNER_COUNT[0], Math.min(CORNER_COUNT[1], isNaN(v) ? 0 : v));
    if (key || f === 'cCount') update(false);
  });
  corner.addEventListener('change', e => {
    const f = e.target.dataset.field;
    if (!f) return;
    if (f === 'cType') {
      runOf().corner = clone(DEFAULT_CORNER[e.target.value]);
      update(true);
    }
    fit();
  });
}

export function bindWalls(app) {
  const { update, fit } = app;
  $('#walls').addEventListener('click', e => {
    if (e.target.closest('#addWall')) {
      const walls = store.state.walls || (store.state.walls = []);
      if (walls.length + 1 >= MAX_WALLS) return;
      walls.push({ corner: clone(DEFAULT_CORNER.blind), modules: [clone(NEW_MODULE)] });
      selectRow(walls.length, tierOf());
      update(true);
      fit();
      return;
    }
    const b = e.target.closest('[data-wall]');
    if (!b) return;
    selectRow(+b.dataset.wall, tierOf());
    update(true);
  });

  $('#tiers').addEventListener('click', e => {
    const b = e.target.closest('[data-tier]');
    if (!b) return;
    selectRow(wallIndex(), b.dataset.tier);
    update(true);
  });

  bindCorner(app);
}

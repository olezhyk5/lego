import { DEFAULT_CORNER, CORNER_COUNT, MAX_WALLS } from '../../../core/types/kitchen/constants.js';
import { clone } from '../../../utils/helpers.js';
import { wallIndex, tierOf, runOf, selectRow } from './row.js';

// Обробники стін, рядів і картки кута.

const NEW_MODULE = { width: 600, type: 'doors', count: 1 };
const CORNER_FIELDS = { cWidth: 'width', cFiller: 'filler', cA: 'a', cB: 'b' };

function bindCorner({ store, ref, update, fit }) {
  const corner = ref('corner');
  corner.addEventListener('click', e => {
    if (!e.target.closest('[data-act="wallDel"]')) return;
    const walls = store.state.walls;
    const k = wallIndex(store);
    walls.splice(k - 1, 1);
    if (!walls.length) delete store.state.walls;
    selectRow(store, k - 1, tierOf(store));
    update(true);
    fit();
  });
  corner.addEventListener('input', e => {
    const c = runOf(store).corner;
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
      runOf(store).corner = clone(DEFAULT_CORNER[e.target.value]);
      update(true);
    }
    fit();
  });
}

/** @param {import('../../app.js').App} app */
export function bindWalls(app) {
  const { store, ref, update, fit } = app;
  ref('walls').addEventListener('click', e => {
    if (e.target.closest('[data-ref="addWall"]')) {
      const walls = store.state.walls || (store.state.walls = []);
      if (walls.length + 1 >= MAX_WALLS) return;
      walls.push({ corner: clone(DEFAULT_CORNER.blind), modules: [clone(NEW_MODULE)] });
      selectRow(store, walls.length, tierOf(store));
      update(true);
      fit();
      return;
    }
    const b = e.target.closest('[data-wall]');
    if (!b) return;
    selectRow(store, +b.dataset.wall, tierOf(store));
    update(true);
  });

  ref('tiers').addEventListener('click', e => {
    const b = e.target.closest('[data-tier]');
    if (!b) return;
    selectRow(store, wallIndex(store), b.dataset.tier);
    update(true);
  });

  bindCorner(app);
}

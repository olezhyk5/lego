// Поточна стіна й ряд: стан форми (store.ui), у проєкт не потрапляє. store — стан екземпляра.
/** @typedef {import('../../../core/store.js').Store} Store */

/** @param {Store} store */
export const wallIndex = store => Math.min(store.ui.wall || 0, store.state.walls?.length || 0);
/** @param {Store} store */
export const tierOf = store => store.ui.tier || 'base';
/** @param {Store} store */
export const runOf = store => (wallIndex(store) === 0 ? store.state : store.state.walls[wallIndex(store) - 1]);
/** @param {Store} store */
export const isUpper = store => tierOf(store) === 'upper';
/** @param {Store} store */
export const rowOf = store => (isUpper(store) ? runOf(store).uppers || [] : runOf(store).modules);
// Нижній ряд першої стіни не може бути порожнім
/** @param {Store} store */
export const minCount = store => (!isUpper(store) && wallIndex(store) === 0 ? 1 : 0);

/** @param {Store} store */
export const selectRow = (store, wall, tier) => Object.assign(store.ui, { wall, tier, sel: 0 });

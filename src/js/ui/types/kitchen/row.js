import { store } from '../../../core/store.js';

// Поточна стіна й ряд: стан форми, у проєкт не потрапляє
export const wallIndex = () => Math.min(store.ui.wall || 0, store.state.walls?.length || 0);
export const tierOf = () => store.ui.tier || 'base';
export const runOf = () => (wallIndex() === 0 ? store.state : store.state.walls[wallIndex() - 1]);
export const isUpper = () => tierOf() === 'upper';
export const rowOf = () => (isUpper() ? runOf().uppers || [] : runOf().modules);
// Нижній ряд першої стіни не може бути порожнім
export const minCount = () => (!isUpper() && wallIndex() === 0 ? 1 : 0);

export const selectRow = (wall, tier) => Object.assign(store.ui, { wall, tier, sel: 0 });

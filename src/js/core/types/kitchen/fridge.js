import { T, GAP } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { legColumns } from './base-module.js';
import { ANTRESOL_MIN, DEFAULT_FRIDGE, FREEZER_H } from './constants.js';

const HANDLE_LOW = 60; // ручка над низом фасаду

/**
 * Модуль під вбудований холодильник: ширина й глибина — за нішею, без задньої стінки.
 * Висота — до лінії верху кухні; над нішею антресоль, якщо лишається щонайменше ANTRESOL_MIN.
 * Ніша вища за лінію верху — корпус виступає вище за неї (попередження).
 * @param {any} s проєкт
 * @param {any} m модуль
 * @param {{ x: number, no: number, y0: number, top: number, errs: any[], warns: any[] }} ctx
 */
export function layoutFridge(s, m, { x, no, y0, top, errs, warns }) {
  const name = msg('module.name', { n: no });
  const nicheW = +m.width || 0;
  const nicheH = +m.nicheH || DEFAULT_FRIDGE.nicheH;
  const depth = +m.nicheD || DEFAULT_FRIDGE.nicheD;
  if (nicheW < 150) errs.push(msg('check.moduleNarrow', { name, w: round(nicheW) }));
  const w = nicheW + 2 * T;
  const need = 2 * T + nicheH;
  const h = Math.max(top - y0, need);
  if (y0 + need > top) warns.push(msg('check.fridgeAboveTop', { name, h: round(y0 + need), top: round(top) }));
  const antresolH = h - need - T; // між полицею над нішею й кришкою
  const hasAntresol = antresolH >= ANTRESOL_MIN;
  const yShelf = y0 + T + nicheH;
  const fx = x + GAP;
  const fw = w - 2 * GAP;
  const freezerY = y0 + GAP;
  const fridgeY = freezerY + FREEZER_H + GAP;
  const areaTop = hasAntresol ? yShelf + T / 2 - GAP / 2 : y0 + h - GAP;
  const fronts = [
    { key: 'part.freezerFront', x: fx, y: freezerY, w: fw, h: FREEZER_H },
    { key: 'part.fridgeFront', x: fx, y: fridgeY, w: fw, h: areaTop - fridgeY, handleY: fridgeY + HANDLE_LOW },
  ];
  if (hasAntresol) {
    const y = yShelf + T / 2 + GAP / 2;
    fronts.push({ key: 'part.door', x: fx, y, w: fw, h: y0 + h - GAP - y, handleY: y + HANDLE_LOW / 2 });
  }
  return {
    i: no - 1,
    x,
    w,
    type: 'fridge',
    cnt: 0,
    fronts,
    shelves: [],
    legs: s.legs > 0 ? legColumns(x, w) : [],
    niche: { x: x + T, w: nicheW, h: nicheH, d: depth },
    endSides: [],
    depth,
    y0,
    h,
    yShelf: hasAntresol ? yShelf : null,
    antresolH: hasAntresol ? antresolH : 0,
  };
}

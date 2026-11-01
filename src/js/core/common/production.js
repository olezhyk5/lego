import { MATERIALS } from '../../config/materials.js';
import { msg } from './msg.js';

// Виробничі перевірки специфікації, спільні для всіх типів меблів (без тексту — лише {key, params}).

// Робоча площа листа матеріалу: розмір мінус обрізка країв
export function usableSheet(mat) {
  const { sheet, trim = 0 } = MATERIALS[mat];
  return { a: sheet.a - 2 * trim, b: sheet.b - 2 * trim };
}

// Чи вміщується плита a × b у лист матеріалу (поворот на 90° дозволено)
export function fitsSheet({ a, b, mat }) {
  const S = usableSheet(mat);
  return (a <= S.a && b <= S.b) || (a <= S.b && b <= S.a);
}

/**
 * Попередження про плити, більші за робочу площу листа: одне на рядок специфікації.
 * @param {import('../types.js').Panel[]} panels
 * @returns {import('../types.js').Msg[]}
 */
export function sheetFitWarnings(panels) {
  return panels
    .filter(p => MATERIALS[p.mat].sheetCheck !== false && !fitsSheet(p))
    .map(p => {
      const S = usableSheet(p.mat);
      return msg('check.panelTooBig', {
        part: msg(p.key),
        a: p.a,
        b: p.b,
        mat: msg(`material.${p.mat}`),
        sa: S.a,
        sb: S.b,
      });
    });
}

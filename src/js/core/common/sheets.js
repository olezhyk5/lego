import { MATERIALS } from '../../config/materials.js';

// Підсумок по матеріалах: [{mat, area, sheet: {a, b}, sheets}].
// area — сумарна площа деталей, м² (до сотих); sheets — скільки листів покриває цю площу.
// Це нижня межа: розкрій (обрізки, напрям різу, деталі, що не влазять у лист) не враховано.
/** @param {import('../types.js').Panel[]} panels */
export function sheetTotals(panels) {
  return Object.entries(MATERIALS)
    .map(([mat, { sheet }]) => {
      const mm2 = panels.filter(p => p.mat === mat).reduce((sum, p) => sum + p.a * p.b * p.q, 0);
      return {
        mat,
        area: Math.round(mm2 / 1e4) / 100,
        sheet: { ...sheet },
        sheets: Math.ceil(mm2 / (sheet.a * sheet.b)),
      };
    })
    .filter(r => r.sheets > 0);
}

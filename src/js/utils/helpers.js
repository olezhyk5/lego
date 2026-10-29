export const clone = o => JSON.parse(JSON.stringify(o));
export const isAuto = v => v == null || v === '' || v === 'auto';
export const round = v => Math.round(v);

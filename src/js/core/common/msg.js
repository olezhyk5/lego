// Повідомлення — {key, params} без тексту: перекладає ui/ через tm().
// Параметр-повідомлення (напр. name) перекладається рекурсивно.
/** @returns {import('../types.js').Msg} */
export const msg = (key, params) => (params === undefined ? { key } : { key, params });

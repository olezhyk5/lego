// Шафа (type: 'wardrobe'). Назви типів зон — у словнику: zoneType.<тип>
export const ZONE_TYPES = ['empty', 'shelves', 'rod', 'drawers'];

// Тип дверей шафи; немає поля → none. Назви — у словнику: doorType.<тип>.
// Розсувні втоплюють наповнення (SLIDING_RECESS); розпашні поки лише зберігаються.
export const DOOR_TYPES = ['none', 'sliding', 'hinged'];

// Розсувні двері: перегородки, полиці, штанги й шухляди відступають від переднього краю корпусу, мм
export const SLIDING_RECESS = 100;

// типи зон, у яких є поле «кількість»
export const COUNTABLE_ZONES = ['shelves', 'drawers'];

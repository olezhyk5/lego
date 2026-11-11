// Шафа (type: 'wardrobe'). Назви типів зон — у словнику: zoneType.<тип>
export const ZONE_TYPES = ['empty', 'shelves', 'rod', 'drawers'];

// Тип дверей шафи; немає поля → none. Назви — у словнику: doorType.<тип>.
// Поки лише зберігається в проєкті: на розрахунок і модель не впливає.
export const DOOR_TYPES = ['none', 'sliding', 'hinged'];

// типи зон, у яких є поле «кількість»
export const COUNTABLE_ZONES = ['shelves', 'drawers'];

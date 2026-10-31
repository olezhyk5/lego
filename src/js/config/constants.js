export const T = 16; // умовна товщина плити, мм
export const GAP = 3; // зазор між фасадами ящиків, мм
export const STORAGE_KEY = 'wardrobe-cfg-v1';
// останній вибраний пресет — окремо від проєкту, у JSON не потрапляє
export const PRESET_STORAGE_KEY = 'lego-preset';

// назви типів — у словнику: zoneType.<тип>
export const ZONE_TYPES = ['empty', 'shelves', 'rod', 'drawers'];

// типи зон, у яких є поле «кількість»
export const COUNTABLE_ZONES = ['shelves', 'drawers'];

// Кришка в проєкті: top: { mount, double, overhang? }. Немає поля (старі файли) → між боковинами, одинарна.
// mount — між боковинами (боковини на всю висоту) або над ними (кришка на всю ширину);
// назви — у словнику: topMount.<тип>. double — потовщена кришка з двох плит (2 × T)
export const TOP_MOUNTS = ['between', 'over'];
export const DEFAULT_TOP_MOUNT = 'between';

// Виступи кришки за корпус, мм: top.overhang: { back, front, left, right }. Лише для mount = 'over';
// немає поля → 0. Назви — у словнику: topOverhang.<бік>
export const TOP_OVERHANG_SIDES = ['back', 'front', 'left', 'right'];

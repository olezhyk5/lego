// Кухня (type: 'kitchen'): ряд нижніх модулів зліва направо на ніжках, спільні стільниця й цокольна планка.
// Назви типів модулів — у словнику: moduleType.<тип>
export const MODULE_TYPES = ['doors', 'drawers', 'sink', 'dishwasher', 'open', 'tall', 'fridge'];
// Високі модулі стоять у нижньому ряду: розривають стільницю, верхній ряд їх оминає
export const TALL_TYPES = ['tall', 'fridge'];

// Посудомийка — ніша під стільницею без корпусу й ніжок: техніка стоїть на підлозі, цоколь проходить суцільно,
// фасад кріпиться на дверку техніки (відкривається вниз, тому без петель). Ширина ніші — лише стандартна, мм.
// Скраю ряду — додаткова боковина (див. layout.js), вона не входить у ширину ніші.
export const DISHWASHER_WIDTHS = [450, 600];

// Межі кількості: двері, шухляди, полиці відкритого модуля.
// Під мийку (двері за шириною) і посудомийку (один фасад) — без кількості.
export const MODULE_COUNT = { doors: [1, 2], drawers: [1, 6], open: [0, 6] };
export const DEFAULT_COUNT = { doors: 1, drawers: 3, open: 2 };

// Виступи стільниці за модулі, мм (ззаду — стіна). Назви — у словнику: worktopSide.<бік>
export const WORKTOP_SIDES = ['front', 'left', 'right'];
export const DEFAULT_WORKTOP = { front: 30, left: 0, right: 0 };

export const RAIL_W = 100; // ширина царги (планки замість кришки під стільницею), мм
export const SINK_TWO_DOORS_FROM = 600; // модуль під мийку від цієї ширини — з двома дверима, мм
export const PLINTH_SETBACK = 50; // цокольна планка відступає від фасадів, мм
export const DOOR_MAX_W = 600; // двері ширші — незручні, у високому модулі їх двоє

// Верхні модулі: спільні висота, глибина й відступ від стільниці. Назви типів — moduleType.<тип>
export const UPPER_TYPES = ['doors', 'open', 'gap']; // gap — порожній проміжок (напр. під витяжку)
export const UPPER_COUNT = { doors: [1, 2], open: [0, 6] };
export const UPPER_FIELDS = ['H', 'D', 'gap'];
export const DEFAULT_UPPER = { H: 720, D: 320, gap: 550 };

// Пенал: зони зверху вниз, як у секції шафи. Назви — tallZoneType.<тип>
export const TALL_ZONE_TYPES = ['shelves', 'drawers', 'oven', 'microwave', 'empty'];
export const TALL_ZONE_COUNT = { shelves: [1, 10], drawers: [1, 6] };
export const DEFAULT_ZONE_COUNT = { shelves: 3, drawers: 2 };
// Мінімальна ніша під вбудовану техніку, мм; типова висота зони — h. Погодити з технологом.
export const APPLIANCE_NICHE = { oven: { w: 560, h: 600, d: 550 }, microwave: { w: 560, h: 400, d: 320 } };

// Вбудований холодильник без задньої стінки: дві дверки техніки (морозилка знизу) і антресоль, якщо вистачає висоти
export const DEFAULT_FRIDGE = { width: 600, nicheH: 1800, nicheD: 550 };
export const FREEZER_H = 650; // висота фасаду морозилки, мм (погодити з технологом)
export const ANTRESOL_MIN = 150; // найменша висота антресолі всередині, мм

// Кутові модулі: стик стіни з попередньою. Глухий лежить уздовж попередньої стіни, Г-подібний займає обидві.
export const CORNER_TYPES = ['blind', 'lShape'];
export const CORNER_COUNT = [0, 3]; // полиці
export const DEFAULT_CORNER = {
  blind: { type: 'blind', width: 1100, filler: 70, count: 0 }, // полиця на всю ширину прогинається
  lShape: { type: 'lShape', a: 900, b: 900, count: 1 },
};
export const MAX_WALLS = 3; // Пряма, Г- і П-подібна кухня

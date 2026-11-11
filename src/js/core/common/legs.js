import { round } from '../../utils/helpers.js';
import { msg } from './msg.js';

// Регульовані ніжки (спільні для типів), мм. У плані ніжка LEG × LEG, відступ LEG_INSET від задньої стінки.
export const LEG = 40;
export const LEG_INSET = 40;
export const LEG_MAX_SPAN = 700; // найбільший крок між рядами ніжок (між осями)
export const LEGS_MIN_H = 80; // нижче — не вміщується кріплення цоколя й незручно прибирати під корпусом
export const LEGS_DEFAULT_H = 100; // висота, яку ставить UI, коли вмикають ніжки при занизькій основі
const FRONT_GAP = 10; // передня ніжка — за цокольною планкою

/**
 * Ряди ніжок по ширині: обов'язкові ряди (під боковинами, перегородками) + проміжні,
 * щоб крок між сусідніми рядами не перевищував maxSpan. У кожному ряду дві ніжки: спереду й ззаду.
 * @param {number[]} required ліві краї ніжок обов'язкових рядів, за зростанням
 * @returns {number[]} ліві краї ніжок усіх рядів
 */
export function legRows(required, maxSpan = LEG_MAX_SPAN) {
  return required.flatMap((x, k) => {
    if (k === required.length - 1) return [x];
    const span = required[k + 1] - x;
    const n = Math.max(1, Math.ceil(span / maxSpan));
    return Array.from({ length: n }, (_, j) => x + (span * j) / n);
  });
}

// Кількість ніжок у специфікації: по дві в ряду
export const legCount = rows => 2 * rows.length;

// Попередження про занизькі ніжки (h > 0 — ніжки є)
export const legsLowWarning = h =>
  h > 0 && h < LEGS_MIN_H ? msg('check.legsLow', { h: round(h), min: LEGS_MIN_H }) : null;

// Вигляд ніжки (лише модель), мм: монтажна пластина під дном, корпус (ширший угорі), регулювальний гвинт, п'ята
const PLATE_H = 4;
const FOOT_H = 12;
const FOOT_R = 17;
const BODY_TOP_R = 16;
const BODY_R = 12;
const STEM_R = 5;
const BODY_SHARE = 0.6; // частка корпусу у висоті між пластиною й п'ятою; решта — гвинт
const BODY_TOP_SHARE = 0.3; // частка ширшої верхньої частини корпусу

/**
 * Одна ніжка в геометрію: пластина — бокс у плані LEG × LEG (x, z — його кут), решта — вертикальні циліндри по осі.
 * Низькі ніжки стискаються пропорційно.
 * @param {import('./geometry-builder.js').GeometryBuilder} G
 * @param {number} h висота ніжки, мм
 */
export function addLeg(G, x, z, h) {
  const plate = Math.min(PLATE_H, h * 0.1);
  const foot = Math.min(FOOT_H, h * 0.15);
  const rest = h - plate - foot;
  const body = rest * BODY_SHARE;
  const bodyTop = body * BODY_TOP_SHARE;
  const stem = rest - body;
  const [cx, cz] = [x + LEG / 2, z + LEG / 2];
  G.hardware('part.leg', 'handle', x, h - plate, z, LEG, plate, LEG);
  G.rod('part.leg', 'handle', cx, h - plate - bodyTop, cz, bodyTop, BODY_TOP_R, 'y');
  G.rod('part.leg', 'handle', cx, foot + stem, cz, body - bodyTop, BODY_R, 'y');
  G.rod('part.leg', 'rod', cx, foot, cz, stem, STEM_R, 'y');
  G.rod('part.leg', 'handle', cx, 0, cz, foot, FOOT_R, 'y');
}

/**
 * Ніжки в геометрію: у кожному ряду задня й передня (за цокольною планкою, що стоїть на plinthZ).
 * @param {import('./geometry-builder.js').GeometryBuilder} G
 * @param {number[]} rows ліві краї ніжок
 */
export function addLegGeometry(G, rows, h, plinthZ) {
  rows.forEach(x => [LEG_INSET, plinthZ - LEG - FRONT_GAP].forEach(z => addLeg(G, x, z, h)));
}

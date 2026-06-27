import type { CoverGeometry, CoverPatternInput, CoverPiece } from '../../../types/cover';

const LAYOUT_MARGIN = 10;
const PIECE_GAP = 15;

export function createCoverGeometry(input: CoverPatternInput): CoverGeometry {
  const issues: CoverGeometry['validation']['issues'] = [];

  if (input.docWidthMm <= 0 || input.docHeightMm <= 0) {
    issues.push({ id: 'cover-positive-size', message: 'Размеры документа должны быть положительными.' });
  }
  if (input.spineWidthMm < 0) {
    issues.push({ id: 'cover-spine-positive', message: 'Ширина корешка не может быть отрицательной.' });
  }
  if (input.seamAllowanceMm < 2) {
    issues.push({ id: 'cover-seam-min', message: 'Припуск шва должен быть не менее 2 мм.' });
  }

  const sa = input.seamAllowanceMm;
  const r = input.cornerRadiusMm;

  // Outer cover: two panels + spine, opened flat
  const outerWidth = input.docWidthMm * 2 + input.spineWidthMm + sa * 2;
  const outerHeight = input.docHeightMm + sa * 2;
  const leftFoldX = LAYOUT_MARGIN + input.docWidthMm + sa;
  const rightFoldX = leftFoldX + input.spineWidthMm;

  const outerCover: CoverPiece = {
    id: 'outer-cover',
    name: 'Внешняя обложка',
    x: LAYOUT_MARGIN,
    y: LAYOUT_MARGIN + 20,
    width: outerWidth,
    height: outerHeight,
    radius: r,
    label: `Внешняя обложка × 1`,
    foldLines: [
      { x: leftFoldX },
      { x: rightFoldX },
    ],
  };

  const pieces: CoverPiece[] = [outerCover];
  let currentY = outerCover.y + outerHeight + PIECE_GAP;

  // Inner lining panels (if selected)
  if (input.hasInnerLining) {
    const liningWidth = input.docWidthMm - 4;
    const liningHeight = input.docHeightMm - 4;

    const leftLining: CoverPiece = {
      id: 'inner-lining-left',
      name: 'Подкладка левая',
      x: LAYOUT_MARGIN,
      y: currentY,
      width: liningWidth,
      height: liningHeight,
      radius: Math.max(0, r - 2),
      label: 'Подкладка левая × 1',
      foldLines: [],
    };

    const rightLining: CoverPiece = {
      id: 'inner-lining-right',
      name: 'Подкладка правая',
      x: LAYOUT_MARGIN + liningWidth + PIECE_GAP,
      y: currentY,
      width: liningWidth,
      height: liningHeight,
      radius: Math.max(0, r - 2),
      label: 'Подкладка правая × 1',
      foldLines: [],
    };

    pieces.push(leftLining, rightLining);
    currentY += liningHeight + PIECE_GAP;
  }

  // Card slot pockets (if selected)
  if (input.hasCardSlots && input.cardSlotCount > 0) {
    const cardW = 89;
    const cardH = 58;
    const pocketW = cardW + sa * 2;
    const pocketH = cardH * 0.6 + sa;

    for (let i = 0; i < Math.min(input.cardSlotCount, 4); i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      pieces.push({
        id: `card-slot-${i + 1}`,
        name: `Карман для карты ${i + 1}`,
        x: LAYOUT_MARGIN + col * (pocketW + PIECE_GAP),
        y: currentY + row * (pocketH + PIECE_GAP),
        width: pocketW,
        height: pocketH,
        radius: 3,
        label: `Карман × ${input.cardSlotCount} шт.`,
        foldLines: [],
      });
    }
  }

  const assemblyNotes: string[] = [
    'Разметьте и вырежьте детали точно по линии кроя.',
    'Проклейте края обложки перед сшиванием.',
    `Линии сгиба — граница корешка (${input.spineWidthMm} мм): аккуратно прогните кожу по этим линиям.`,
    'Подкладку наклейте на внутреннюю сторону каждой панели, отступив 2-3 мм от края.',
  ];

  if (input.hasCardSlots) {
    assemblyNotes.push('Карманы пристрочите к подкладке перед вклейкой: левый край, низ, правый край.');
  }

  return {
    unit: 'mm',
    status: 'prototype-required',
    pieces,
    totalWidth: outerWidth,
    totalHeight: outerHeight,
    validation: {
      isValid: issues.length === 0,
      issues,
    },
    assemblyNotes,
  };
}

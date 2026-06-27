import { jsPDF } from 'jspdf';
import type { BeltGeometry, BeltPatternInput } from '../../types/belt';

const CYRILLIC_FONT_NAME = 'ArialUnicode';
const CYRILLIC_FONT_FILE = 'ArialUnicode.ttf';

// A4 landscape in mm
const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;

function registerFont(doc: jsPDF, fontBase64?: string) {
  if (!fontBase64) return;
  doc.addFileToVFS(CYRILLIC_FONT_FILE, fontBase64);
  doc.addFont(CYRILLIC_FONT_FILE, CYRILLIC_FONT_NAME, 'normal');
  doc.addFont(CYRILLIC_FONT_FILE, CYRILLIC_FONT_NAME, 'bold');
  (doc as unknown as { __hasCyrillicFont: boolean }).__hasCyrillicFont = true;
  doc.setFont(CYRILLIC_FONT_NAME, 'normal');
}

function setFont(doc: jsPDF, style: 'normal' | 'bold' = 'normal') {
  const has = (doc as unknown as { __hasCyrillicFont?: boolean }).__hasCyrillicFont;
  doc.setFont(has ? CYRILLIC_FONT_NAME : 'helvetica', style);
}

function drawRuler(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(20, 24, 22);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + 100, y);
  for (let tick = 0; tick <= 100; tick += 10) {
    const tx = x + tick;
    doc.line(tx, y - 1.5, tx, y + 1.5);
    setFont(doc);
    doc.setFontSize(4.5);
    doc.text(String(tick / 10), tx, y + 4.5, { align: 'center' });
  }
  setFont(doc, 'bold');
  doc.setFontSize(6);
  doc.text('контрольная линейка 10 см', x + 50, y - 3, { align: 'center' });
}

function drawDim(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, label: string) {
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(85, 94, 88);
  doc.setLineWidth(0.18);
  doc.line(x1, y1, x2, y2);
  doc.line(x1, y1 - 1.2, x1, y1 + 1.2);
  doc.line(x2, y2 - 1.2, x2, y2 + 1.2);
  setFont(doc);
  doc.setFontSize(5);
  doc.text(label, (x1 + x2) / 2, y1 - 2, { align: 'center' });
}

function addTitlePage(doc: jsPDF, params: BeltPatternInput, geometry: BeltGeometry, date: string) {
  const { strap, adjustmentHoles, keeper } = geometry;
  const centerIdx = Math.floor(adjustmentHoles.length / 2);

  // Header bar
  doc.setFillColor(31, 37, 34);
  doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 14, 'F');
  setFont(doc, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('РЕМЕНЬ — ПРОИЗВОДСТВЕННАЯ ДОКУМЕНТАЦИЯ', MARGIN + 5, MARGIN + 9);
  doc.setFontSize(6);
  setFont(doc);
  doc.text(`PatternOS · ${date}`, PAGE_W - MARGIN - 4, MARGIN + 9, { align: 'right' });

  doc.setTextColor(31, 37, 34);

  // Left column: parameters
  const col1X = MARGIN;
  let y = MARGIN + 22;
  const lineH = 6;

  setFont(doc, 'bold');
  doc.setFontSize(7.5);
  doc.text('ПАРАМЕТРЫ ИЗДЕЛИЯ', col1X, y);
  y += lineH * 0.6;
  doc.setDrawColor(200, 190, 178);
  doc.setLineWidth(0.3);
  doc.line(col1X, y, col1X + 85, y);
  y += lineH * 0.7;

  const specs: [string, string][] = [
    ['Ширина ремня', `${params.strapWidthMm} мм`],
    ['Толщина кожи', `${params.leatherThicknessMm} мм`],
    ['Обхват (рабочая длина)', `${params.wearableCircumferenceMm} мм`],
    ['Длина хвостовика', `${params.tailLengthMm} мм`],
    ['', ''],
    ['ПРЯЖКА', ''],
    ['Вн. ширина пряжки', `${params.buckleInsideWidthMm} мм`],
    ['Стержень → язычок', `${params.buckleBarToTongueMm} мм`],
    ['Припуск сгиба', `${params.buckleFoldAllowanceMm} мм`],
    ['', ''],
    ['ОТВЕРСТИЯ', ''],
    ['Количество', `${params.holeCount} шт.`],
    ['Шаг', `${params.holePitchMm} мм`],
    ['Диаметр', `${params.tongueHoleDiameterMm} мм`],
    ['', ''],
    ['РАСЧЁТНАЯ ГЕОМЕТРИЯ', ''],
    ['Длина полосы (крой)', `${Math.round(strap.lengthMm)} мм`],
    ['Линия сгиба от края', `${Math.round(strap.foldLineX)} мм`],
    ['Центральное отверстие', `${Math.round(strap.centerHoleX)} мм от края`],
    ['Прорезь язычка', `${Math.round(strap.tongueSlotCenterX)} мм от края`],
    ['', ''],
    ['ШЛЁВКА (крой)', ''],
    ['Длина', `${Math.round(keeper.cutLengthMm)} мм`],
    ['Ширина', `${keeper.widthMm} мм`],
  ];

  for (const [label, value] of specs) {
    if (!label && !value) { y += lineH * 0.5; continue; }
    if (!value) {
      setFont(doc, 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(60, 111, 90);
      doc.text(label, col1X, y);
      doc.setTextColor(31, 37, 34);
      y += lineH * 0.5;
      doc.setDrawColor(200, 190, 178);
      doc.setLineWidth(0.2);
      doc.line(col1X, y, col1X + 85, y);
      y += lineH * 0.4;
      continue;
    }
    setFont(doc);
    doc.setFontSize(6.5);
    doc.text(label, col1X, y);
    setFont(doc, 'bold');
    doc.text(value, col1X + 60, y);
    setFont(doc);
    y += lineH * 0.9;
  }

  // Right column: hole positions
  const col2X = MARGIN + 100;
  let y2 = MARGIN + 22;
  setFont(doc, 'bold');
  doc.setFontSize(7.5);
  doc.text('ПОЗИЦИИ ОТВЕРСТИЙ', col2X, y2);
  y2 += lineH * 0.6;
  doc.setDrawColor(200, 190, 178);
  doc.setLineWidth(0.3);
  doc.line(col2X, y2, col2X + 70, y2);
  y2 += lineH * 0.7;

  adjustmentHoles.forEach((hole, i) => {
    const isCenter = i === centerIdx;
    setFont(doc, isCenter ? 'bold' : 'normal');
    doc.setFontSize(6.5);
    if (isCenter) doc.setTextColor(177, 75, 53);
    doc.text(`Отв. ${i + 1}: ${Math.round(hole.x)} мм от края${isCenter ? '  ← центральное' : ''}`, col2X, y2);
    doc.setTextColor(31, 37, 34);
    y2 += lineH * 0.9;
  });

  // Scaled diagram
  const diagramY = MARGIN + 22;
  const diagramX = MARGIN + 178;
  const diagramW = PAGE_W - MARGIN - diagramX - 2;
  const diagramH = PAGE_H - diagramY - MARGIN - 30;

  doc.setFillColor(251, 247, 239);
  doc.setDrawColor(200, 190, 178);
  doc.setLineWidth(0.3);
  doc.rect(diagramX, diagramY, diagramW, diagramH);

  setFont(doc, 'bold');
  doc.setFontSize(6);
  doc.text('Схема (масштабная)', diagramX + diagramW / 2, diagramY + 5, { align: 'center' });

  const scale = (diagramW - 10) / strap.lengthMm;
  const strapH = Math.max(5, Math.min(12, params.strapWidthMm * scale));
  const strapX = diagramX + 5;
  const strapY = diagramY + diagramH / 2 - strapH / 2;

  // Buckle zone
  doc.setFillColor(237, 224, 208);
  doc.rect(strapX, strapY, strap.foldLineX * scale, strapH, 'F');

  // Main strap
  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(31, 37, 34);
  doc.setLineWidth(0.5);
  doc.rect(strapX, strapY, strap.lengthMm * scale, strapH);

  // Fold line
  const foldX = strapX + strap.foldLineX * scale;
  doc.setLineDashPattern([1.5, 1], 0);
  doc.setDrawColor(177, 75, 53);
  doc.setLineWidth(0.6);
  doc.line(foldX, strapY - 2, foldX, strapY + strapH + 2);
  doc.setLineDashPattern([], 0);

  // Tongue slot
  const tongueX = strapX + strap.tongueSlotCenterX * scale;
  doc.setFillColor(31, 37, 34);
  const slotW = Math.max(1.5, params.tongueHoleDiameterMm * scale);
  const slotH = strapH * 0.4;
  doc.rect(tongueX - slotW / 2, strapY + strapH * 0.3, slotW, slotH, 'F');

  // Holes
  adjustmentHoles.forEach((hole, i) => {
    const hx = strapX + hole.x * scale;
    const hy = strapY + strapH / 2;
    const hr = Math.max(1, (params.tongueHoleDiameterMm / 2) * scale);
    const isCenter = i === centerIdx;
    doc.setFillColor(255, 253, 248);
    doc.setDrawColor(isCenter ? 177 : 60, isCenter ? 75 : 111, isCenter ? 53 : 90);
    doc.setLineWidth(isCenter ? 0.5 : 0.3);
    doc.circle(hx, hy, hr, 'FD');
  });

  // Dimension: total length
  const dimY = strapY + strapH + 5;
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(85, 94, 88);
  doc.setLineWidth(0.18);
  doc.line(strapX, dimY, strapX + strap.lengthMm * scale, dimY);
  doc.line(strapX, dimY - 1, strapX, dimY + 1);
  doc.line(strapX + strap.lengthMm * scale, dimY - 1, strapX + strap.lengthMm * scale, dimY + 1);
  setFont(doc);
  doc.setFontSize(4.5);
  doc.text(`${Math.round(strap.lengthMm)} мм`, strapX + (strap.lengthMm * scale) / 2, dimY + 3, { align: 'center' });

  // Status notice
  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(200, 190, 178);
  doc.rect(MARGIN, PAGE_H - MARGIN - 16, PAGE_W - MARGIN * 2, 16);
  setFont(doc, 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(177, 75, 53);
  doc.text('СТАТУС: ПРОТОТИП ОБЯЗАТЕЛЕН', MARGIN + 5, PAGE_H - MARGIN - 9);
  doc.setTextColor(31, 37, 34);
  setFont(doc);
  doc.setFontSize(6);
  doc.text(
    'Перед изготовлением партии проверьте все размеры на физическом образце с вашей конкретной пряжкой и шлёвкой. Правила: BL-001 BL-002 BL-003 BL-004 BL-005',
    MARGIN + 5,
    PAGE_H - MARGIN - 3,
  );
}

function addStrapPage(
  doc: jsPDF,
  params: BeltPatternInput,
  geometry: BeltGeometry,
  pageNum: number,
  totalStrapPages: number,
  sectionStartMm: number,
  date: string,
) {
  const { strap, adjustmentHoles } = geometry;
  const centerIdx = Math.floor(adjustmentHoles.length / 2);

  const printW = PAGE_W - MARGIN * 2;
  const sectionEndMm = Math.min(sectionStartMm + printW, strap.lengthMm);
  const sectionLen = sectionEndMm - sectionStartMm;

  // Header
  doc.setFillColor(31, 37, 34);
  doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 10, 'F');
  setFont(doc, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`РЕМЕНЬ · ПОЛОСА 1:1 · Лист ${pageNum} из ${totalStrapPages}`, MARGIN + 4, MARGIN + 7);
  doc.setFontSize(6);
  setFont(doc);
  doc.text(`Секция ${Math.round(sectionStartMm)}–${Math.round(sectionEndMm)} мм`, PAGE_W - MARGIN - 4, MARGIN + 7, { align: 'right' });

  doc.setTextColor(31, 37, 34);

  // Page continuation marks (to align when gluing pages)
  if (sectionStartMm > 0) {
    doc.setDrawColor(177, 75, 53);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, MARGIN + 10, MARGIN, PAGE_H - MARGIN);
    setFont(doc);
    doc.setFontSize(5);
    doc.setTextColor(177, 75, 53);
    doc.text('← совместить', MARGIN + 1, MARGIN + 16);
    doc.setTextColor(31, 37, 34);
  }
  if (sectionEndMm < strap.lengthMm) {
    doc.setDrawColor(177, 75, 53);
    doc.setLineWidth(0.5);
    doc.line(PAGE_W - MARGIN, MARGIN + 10, PAGE_W - MARGIN, PAGE_H - MARGIN);
    setFont(doc);
    doc.setFontSize(5);
    doc.setTextColor(177, 75, 53);
    doc.text('совместить →', PAGE_W - MARGIN - 18, MARGIN + 16);
    doc.setTextColor(31, 37, 34);
  }

  // Strap body
  const strapY = MARGIN + 18;
  const strapH = Math.min(params.strapWidthMm, PAGE_H - strapY - MARGIN - 30);

  // Buckle zone fill (only if visible in this section)
  if (sectionStartMm < strap.foldLineX) {
    const buckleEndLocal = Math.min(strap.foldLineX, sectionEndMm) - sectionStartMm;
    doc.setFillColor(237, 224, 208);
    doc.rect(MARGIN, strapY, buckleEndLocal, strapH, 'F');
  }

  // Strap rectangle (section)
  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(31, 37, 34);
  doc.setLineWidth(0.7);
  doc.rect(MARGIN, strapY, sectionLen, strapH);

  // Fold line (if in this section)
  const foldLocalX = strap.foldLineX - sectionStartMm;
  if (foldLocalX >= 0 && foldLocalX <= sectionLen) {
    doc.setLineDashPattern([3, 2], 0);
    doc.setDrawColor(177, 75, 53);
    doc.setLineWidth(0.8);
    doc.line(MARGIN + foldLocalX, strapY - 4, MARGIN + foldLocalX, strapY + strapH + 4);
    doc.setLineDashPattern([], 0);
    setFont(doc, 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(177, 75, 53);
    doc.text('линия сгиба', MARGIN + foldLocalX, strapY - 6, { align: 'center' });
    doc.setTextColor(31, 37, 34);
  }

  // Tongue slot (if in section)
  const tongueLocalX = strap.tongueSlotCenterX - sectionStartMm;
  if (tongueLocalX >= 2 && tongueLocalX <= sectionLen - 2) {
    doc.setFillColor(31, 37, 34);
    const slotW = params.tongueHoleDiameterMm;
    doc.rect(MARGIN + tongueLocalX - slotW / 2, strapY + strapH * 0.3, slotW, strapH * 0.4, 'F');
    setFont(doc);
    doc.setFontSize(4.5);
    doc.text('прорезь', MARGIN + tongueLocalX, strapY + strapH + 5, { align: 'center' });
  }

  // Adjustment holes (if in section)
  adjustmentHoles.forEach((hole, i) => {
    const localX = hole.x - sectionStartMm;
    if (localX < -2 || localX > sectionLen + 2) return;
    const hx = MARGIN + localX;
    const hy = strapY + strapH / 2;
    const r = params.tongueHoleDiameterMm / 2;
    const isCenter = i === centerIdx;

    doc.setFillColor(255, 253, 248);
    doc.setDrawColor(isCenter ? 177 : 60, isCenter ? 75 : 111, isCenter ? 53 : 90);
    doc.setLineWidth(isCenter ? 0.6 : 0.4);
    doc.circle(hx, hy, r, 'FD');

    doc.setFontSize(4.5);
    setFont(doc, isCenter ? 'bold' : 'normal');
    doc.setTextColor(isCenter ? 177 : 85, isCenter ? 75 : 94, isCenter ? 53 : 88);
    doc.text(isCenter ? `${Math.round(hole.x)} мм ← центр` : `${Math.round(hole.x)} мм`, hx, strapY + strapH + 5, { align: 'center' });
    doc.setTextColor(31, 37, 34);
  });

  // Stitch guide lines (dashed, along edges)
  const stitchInset = params.strapWidthMm * 0.1;
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(60, 111, 90);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, strapY + stitchInset, MARGIN + sectionLen, strapY + stitchInset);
  doc.line(MARGIN, strapY + strapH - stitchInset, MARGIN + sectionLen, strapY + strapH - stitchInset);
  doc.setLineDashPattern([], 0);

  // Width dimension
  const dimX = MARGIN + sectionLen + 3;
  const dimTopY = strapY;
  const dimBotY = strapY + strapH;
  doc.setDrawColor(85, 94, 88);
  doc.setLineWidth(0.18);
  doc.line(dimX, dimTopY, dimX, dimBotY);
  doc.line(dimX - 1, dimTopY, dimX + 1, dimTopY);
  doc.line(dimX - 1, dimBotY, dimX + 1, dimBotY);
  setFont(doc);
  doc.setFontSize(5);
  doc.text(`${params.strapWidthMm} мм`, dimX + 1.5, (dimTopY + dimBotY) / 2, { angle: 90, align: 'center' });

  // Horizontal dimension: section length
  drawDim(doc, MARGIN, strapY + strapH + 12, MARGIN + sectionLen, strapY + strapH + 12, `${Math.round(sectionLen)} мм (этот лист)`);

  // Ruler
  drawRuler(doc, MARGIN, PAGE_H - MARGIN - 6);

  // Footer
  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(200, 190, 178);
  doc.rect(MARGIN, PAGE_H - MARGIN - 20, PAGE_W - MARGIN * 2, 10);
  setFont(doc);
  doc.setFontSize(5.5);
  doc.text(
    `Ремень · Полоса 1:1 · ${Math.round(strap.lengthMm)} × ${params.strapWidthMm} мм · Масштаб 100% · Проверьте линейку 10 см перед раскроем`,
    (PAGE_W) / 2, PAGE_H - MARGIN - 14, { align: 'center' },
  );
}

function addKeeperPage(doc: jsPDF, params: BeltPatternInput, geometry: BeltGeometry, pageNum: number, totalPages: number, date: string) {
  const { keeper } = geometry;

  doc.setFillColor(31, 37, 34);
  doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 10, 'F');
  setFont(doc, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`РЕМЕНЬ · ШЛЁВКА 1:1 · Лист ${pageNum} из ${totalPages}`, MARGIN + 4, MARGIN + 7);
  doc.setTextColor(31, 37, 34);

  const keeperY = MARGIN + 25;
  const keeperW = keeper.cutLengthMm;
  const keeperH = keeper.widthMm;

  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(31, 37, 34);
  doc.setLineWidth(0.7);
  doc.rect(MARGIN, keeperY, keeperW, keeperH);

  // Overlap zones shaded
  const overlapMm = params.keeperOverlapMm;
  doc.setFillColor(237, 224, 208);
  doc.rect(MARGIN, keeperY, overlapMm, keeperH, 'F');
  doc.rect(MARGIN + keeperW - overlapMm, keeperY, overlapMm, keeperH, 'F');

  // Stitch guides
  const si = keeperH * 0.12;
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(60, 111, 90);
  doc.setLineWidth(0.3);
  doc.line(MARGIN + overlapMm, keeperY + si, MARGIN + keeperW - overlapMm, keeperY + si);
  doc.line(MARGIN + overlapMm, keeperY + keeperH - si, MARGIN + keeperW - overlapMm, keeperY + keeperH - si);
  doc.setLineDashPattern([], 0);

  // Label
  setFont(doc, 'bold');
  doc.setFontSize(7);
  doc.text('ШЛЁВКА × 1', MARGIN + keeperW / 2, keeperY + keeperH / 2 - 2, { align: 'center' });
  setFont(doc);
  doc.setFontSize(5.5);
  doc.text(`${Math.round(keeperW)} × ${keeperH} мм`, MARGIN + keeperW / 2, keeperY + keeperH / 2 + 4, { align: 'center' });

  // Annotations for overlap zones
  doc.setFontSize(4.5);
  doc.setTextColor(100, 80, 60);
  doc.text('перехлёст', MARGIN + overlapMm / 2, keeperY + keeperH + 6, { align: 'center' });
  doc.text('перехлёст', MARGIN + keeperW - overlapMm / 2, keeperY + keeperH + 6, { align: 'center' });
  doc.setTextColor(31, 37, 34);

  // Dimensions
  drawDim(doc, MARGIN, keeperY + keeperH + 14, MARGIN + keeperW, keeperY + keeperH + 14, `${Math.round(keeperW)} мм`);

  const dX = MARGIN + keeperW + 4;
  doc.setDrawColor(85, 94, 88);
  doc.setLineWidth(0.18);
  doc.line(dX, keeperY, dX, keeperY + keeperH);
  doc.line(dX - 1, keeperY, dX + 1, keeperY);
  doc.line(dX - 1, keeperY + keeperH, dX + 1, keeperY + keeperH);
  setFont(doc);
  doc.setFontSize(5);
  doc.text(`${keeperH} мм`, dX + 2, keeperY + keeperH / 2, { angle: 90, align: 'center' });

  drawRuler(doc, MARGIN, PAGE_H - MARGIN - 6);
}

async function loadFont(): Promise<string | undefined> {
  try {
    const res = await fetch('/fonts/ArialUnicode.ttf');
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  } catch {
    return undefined;
  }
}

export async function createBeltPdfBlobAsync(params: BeltPatternInput, geometry: BeltGeometry): Promise<Blob> {
  const fontBase64 = await loadFont();
  const date = new Date().toLocaleDateString('ru-RU');

  const printW = PAGE_W - MARGIN * 2;
  const strapPages = Math.ceil(geometry.strap.lengthMm / printW);
  const totalPages = 1 + strapPages + 1; // title + strap tiles + keeper

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  registerFont(doc, fontBase64);

  // Page 1: title + specs + diagram
  addTitlePage(doc, params, geometry, date);

  // Pages 2…N: full-scale strap tiles
  for (let i = 0; i < strapPages; i++) {
    doc.addPage();
    addStrapPage(doc, params, geometry, i + 2, totalPages, i * printW, date);
  }

  // Last page: keeper
  doc.addPage();
  addKeeperPage(doc, params, geometry, totalPages, totalPages, date);

  return doc.output('blob');
}

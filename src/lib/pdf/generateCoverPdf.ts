import { jsPDF } from 'jspdf';
import type { CoverGeometry, CoverPatternInput, CoverPiece } from '../../types/cover';

const CYRILLIC_FONT_NAME = 'ArialUnicode';
const CYRILLIC_FONT_FILE = 'ArialUnicode.ttf';

// A4 landscape, millimetres.
const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;
const HEADER_H = 14;
const FOOTER_H = 14;

const productTypeLabel: Record<string, string> = {
  passport: 'Обложка для паспорта',
  'a5-notebook': 'Обложка для блокнота A5',
  'a4-document': 'Папка для документов A4',
  custom: 'Обложка (нестандартный размер)',
};

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
  doc.setLineDashPattern([], 0);
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

/** Draw a rounded-rect piece with its fold lines, given a coordinate offset. */
function drawPieceAt(doc: jsPDF, piece: CoverPiece, originX: number, originY: number, fillBuckleZone = false) {
  const px = originX;
  const py = originY;

  // Piece body
  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(31, 37, 34);
  doc.setLineWidth(0.7);
  doc.roundedRect(px, py, piece.width, piece.height, piece.radius, piece.radius, 'FD');

  void fillBuckleZone;

  // Fold lines (spine boundaries)
  for (const fl of piece.foldLines) {
    doc.setLineDashPattern([3, 2], 0);
    doc.setDrawColor(177, 75, 53);
    doc.setLineWidth(0.7);
    doc.line(px + fl.x - piece.x, py + 2, px + fl.x - piece.x, py + piece.height - 2);
    doc.setLineDashPattern([], 0);
  }
}

function addTitlePage(doc: jsPDF, params: CoverPatternInput, geometry: CoverGeometry, date: string) {
  // Header bar
  doc.setFillColor(23, 21, 15);
  doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 14, 'F');
  setFont(doc, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${(productTypeLabel[params.productType] ?? 'ОБЛОЖКА').toUpperCase()} — ДОКУМЕНТАЦИЯ`, MARGIN + 5, MARGIN + 9);
  setFont(doc);
  doc.setFontSize(6);
  doc.text(date, PAGE_W - MARGIN - 4, MARGIN + 9, { align: 'right' });

  doc.setTextColor(31, 37, 34);

  // Left column: specs
  const colX = MARGIN;
  let y = MARGIN + 22;
  const lh = 5.6;

  const sectionHeader = (label: string) => {
    setFont(doc, 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(168, 108, 66);
    doc.text(label, colX, y);
    doc.setTextColor(31, 37, 34);
    y += lh * 0.55;
    doc.setDrawColor(210, 200, 188);
    doc.setLineWidth(0.2);
    doc.line(colX, y, colX + 90, y);
    y += lh * 0.5;
  };
  const row = (label: string, value: string) => {
    setFont(doc);
    doc.setFontSize(6.5);
    doc.text(label, colX, y);
    setFont(doc, 'bold');
    doc.text(value, colX + 62, y);
    setFont(doc);
    y += lh;
  };

  sectionHeader('ПАРАМЕТРЫ ИЗДЕЛИЯ');
  row('Тип', productTypeLabel[params.productType] ?? params.productType);
  row('Размер документа', `${params.docWidthMm} × ${params.docHeightMm} мм`);
  row('Ширина корешка', `${params.spineWidthMm} мм`);
  row('Припуск шва', `${params.seamAllowanceMm} мм`);
  row('Радиус угла', `${params.cornerRadiusMm} мм`);
  row('Толщина кожи', `${params.leatherThicknessMm} мм`);
  y += lh * 0.4;

  sectionHeader('ДЕТАЛИ КРОЯ');
  for (const piece of geometry.pieces) {
    row(piece.name, `${Math.round(piece.width)} × ${Math.round(piece.height)} мм`);
  }

  // Right column: assembly notes
  const col2X = MARGIN + 105;
  let y2 = MARGIN + 22;
  setFont(doc, 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(168, 108, 66);
  doc.text('ИНСТРУКЦИЯ ПО СБОРКЕ', col2X, y2);
  doc.setTextColor(31, 37, 34);
  y2 += lh * 0.55;
  doc.setDrawColor(210, 200, 188);
  doc.setLineWidth(0.2);
  doc.line(col2X, y2, col2X + 75, y2);
  y2 += lh * 0.7;

  setFont(doc);
  doc.setFontSize(6.5);
  geometry.assemblyNotes.forEach((note, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}. ${note}`, 75);
    doc.text(wrapped, col2X, y2);
    y2 += wrapped.length * 4.4 + 1.5;
  });

  // Scaled diagram of outer cover
  const diagX = MARGIN + 190;
  const diagY = MARGIN + 22;
  const diagW = PAGE_W - MARGIN - diagX;
  const diagH = 80;
  doc.setFillColor(251, 247, 239);
  doc.setDrawColor(210, 200, 188);
  doc.setLineWidth(0.3);
  doc.rect(diagX, diagY, diagW, diagH);
  setFont(doc, 'bold');
  doc.setFontSize(6);
  doc.text('Внешняя обложка (схема)', diagX + diagW / 2, diagY + 5, { align: 'center' });

  const outer = geometry.pieces[0];
  if (outer) {
    const scale = Math.min((diagW - 12) / outer.width, (diagH - 16) / outer.height);
    const ox = diagX + (diagW - outer.width * scale) / 2;
    const oy = diagY + 10 + (diagH - 12 - outer.height * scale) / 2;
    doc.setFillColor(245, 233, 220);
    doc.setDrawColor(31, 37, 34);
    doc.setLineWidth(0.5);
    doc.roundedRect(ox, oy, outer.width * scale, outer.height * scale, outer.radius * scale, outer.radius * scale, 'FD');
    for (const fl of outer.foldLines) {
      doc.setLineDashPattern([1.5, 1], 0);
      doc.setDrawColor(177, 75, 53);
      doc.setLineWidth(0.5);
      const fx = ox + (fl.x - outer.x) * scale;
      doc.line(fx, oy, fx, oy + outer.height * scale);
      doc.setLineDashPattern([], 0);
    }
  }

  // Status notice
  doc.setFillColor(245, 233, 220);
  doc.setDrawColor(210, 200, 188);
  doc.rect(MARGIN, PAGE_H - MARGIN - 14, PAGE_W - MARGIN * 2, 14);
  setFont(doc, 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(177, 75, 53);
  doc.text('СТАТУС: ПРОТОТИП ОБЯЗАТЕЛЕН', MARGIN + 5, PAGE_H - MARGIN - 8);
  doc.setTextColor(31, 37, 34);
  setFont(doc);
  doc.setFontSize(6);
  doc.text(
    'Проверьте все размеры на бумажном макете перед раскроем кожи. Печать 100%, без масштабирования. Сверьте контрольную линейку 10 см.',
    MARGIN + 5,
    PAGE_H - MARGIN - 3,
  );
}

/** Lay out one piece at 1:1, tiling across multiple A4 sheets when it does not fit. */
function addPiecePages(
  doc: jsPDF,
  piece: CoverPiece,
  pieceIndex: number,
  totalPieces: number,
  pageRef: { n: number },
  totalPages: number,
) {
  const contentTop = MARGIN + HEADER_H;
  const contentW = PAGE_W - MARGIN * 2;
  const contentH = PAGE_H - contentTop - MARGIN - FOOTER_H;

  const cols = Math.max(1, Math.ceil(piece.width / contentW));
  const rows = Math.max(1, Math.ceil(piece.height / contentH));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      doc.addPage();
      pageRef.n += 1;

      const tileLabel = cols * rows > 1 ? ` · фрагмент ${r * cols + c + 1}/${cols * rows}` : '';

      // Header
      doc.setFillColor(23, 21, 15);
      doc.rect(MARGIN, MARGIN, PAGE_W - MARGIN * 2, 10, 'F');
      setFont(doc, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`${piece.name} · 1:1${tileLabel}`, MARGIN + 4, MARGIN + 7);
      setFont(doc);
      doc.setFontSize(6);
      doc.text(
        `Деталь ${pieceIndex + 1}/${totalPieces} · лист ${pageRef.n}/${totalPages}`,
        PAGE_W - MARGIN - 4,
        MARGIN + 7,
        { align: 'right' },
      );
      doc.setTextColor(31, 37, 34);

      // Clip to content region so the tile shows only its slice.
      doc.saveGraphicsState();
      doc.rect(MARGIN, contentTop, contentW, contentH);
      doc.clip();
      doc.discardPath();

      // Piece origin so that (piece.x + c*contentW, piece.y + r*contentH) maps to (MARGIN, contentTop).
      const originX = MARGIN - c * contentW;
      const originY = contentTop - r * contentH;
      drawPieceAt(doc, piece, originX, originY);

      doc.restoreGraphicsState();

      // Alignment marks where the piece continues onto neighbouring sheets.
      doc.setDrawColor(177, 75, 53);
      doc.setLineWidth(0.5);
      setFont(doc);
      doc.setFontSize(5);
      doc.setTextColor(177, 75, 53);
      if (c < cols - 1) {
        doc.line(MARGIN + contentW, contentTop, MARGIN + contentW, contentTop + contentH);
        doc.text('совместить →', MARGIN + contentW - 18, contentTop + 5);
      }
      if (c > 0) {
        doc.line(MARGIN, contentTop, MARGIN, contentTop + contentH);
        doc.text('← совместить', MARGIN + 1, contentTop + 5);
      }
      if (r < rows - 1) {
        doc.line(MARGIN, contentTop + contentH, MARGIN + contentW, contentTop + contentH);
      }
      if (r > 0) {
        doc.line(MARGIN, contentTop, MARGIN + contentW, contentTop);
      }
      doc.setTextColor(31, 37, 34);

      // Footer + ruler
      drawRuler(doc, MARGIN, PAGE_H - MARGIN - 6);
      setFont(doc);
      doc.setFontSize(5.5);
      doc.text(
        `${piece.name} · полный размер ${Math.round(piece.width)} × ${Math.round(piece.height)} мм · масштаб 100%`,
        PAGE_W / 2,
        PAGE_H - MARGIN - 16,
        { align: 'center' },
      );
    }
  }
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

function countPages(geometry: CoverGeometry): number {
  const contentTop = MARGIN + HEADER_H;
  const contentW = PAGE_W - MARGIN * 2;
  const contentH = PAGE_H - contentTop - MARGIN - FOOTER_H;
  let pages = 1; // title
  for (const piece of geometry.pieces) {
    const cols = Math.max(1, Math.ceil(piece.width / contentW));
    const rows = Math.max(1, Math.ceil(piece.height / contentH));
    pages += cols * rows;
  }
  return pages;
}

export function countCoverPdfPages(geometry: CoverGeometry): number {
  return countPages(geometry);
}

export async function createCoverPdfBlobAsync(params: CoverPatternInput, geometry: CoverGeometry): Promise<Blob> {
  const fontBase64 = await loadFont();
  const date = new Date().toLocaleDateString('ru-RU');
  const totalPages = countPages(geometry);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  registerFont(doc, fontBase64);

  addTitlePage(doc, params, geometry, date);

  const pageRef = { n: 1 };
  geometry.pieces.forEach((piece, index) => {
    addPiecePages(doc, piece, index, geometry.pieces.length, pageRef, totalPages);
  });

  return doc.output('blob');
}

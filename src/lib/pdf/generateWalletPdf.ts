import { jsPDF } from 'jspdf';
import { simpleWalletDefaults, walletTemplates } from '../../data/templates/walletTemplates';
import { createLayoutPlan, type LayoutOptions } from '../layout/pageLayout';
import { createSimpleWalletPattern } from '../patterns/wallet';
import type {
  LayoutPage,
  LayoutPlacement,
  PatternAnnotation,
  PatternGeometry,
  PatternLine,
  PatternMark,
  PatternPiece,
  WalletTemplateId,
} from '../../types/pattern';

type PdfOptions = {
  generatedAt?: Date;
  layout?: LayoutOptions;
  fontBase64?: string;
};

const CYRILLIC_FONT_NAME = 'ArialUnicode';
const CYRILLIC_FONT_FILE = 'ArialUnicode.ttf';

export type WalletPdfManifest = {
  page: {
    width: number;
    height: number;
    orientation: 'landscape';
    format: string;
    pageCount: number;
    productionSheetCount: number;
  };
  templateName: string;
  templateId: WalletTemplateId;
  generatedAt: string;
  pieceCount: number;
  mainBody: {
    width: number;
    height: number;
  };
  pocketCount: number;
  foldLineCount: number;
  rulerLengthMm: number;
  sourceSummary: string;
  cardFit: {
    targetRevealMm: number;
    realizedRevealMm: number;
    sideSlackMm: number;
    pocketWindowWidthMm: number;
  };
  stitchPairs: {
    count: number;
    totalHoles: number;
    allMatched: boolean;
  };
  attachments: {
    count: number;
  };
  appliedRules: {
    ruleId: string;
    confidence: string;
    sourceRefs: string[];
  }[];
  validation: {
    isValid: boolean;
    issueCount: number;
  };
};

function getTemplateName(templateId: WalletTemplateId) {
  return walletTemplates.find((template) => template.id === templateId)?.name ?? templateId;
}

function getPdfSafeTemplateName(templateId: WalletTemplateId) {
  const names: Record<WalletTemplateId, string> = {
    'minimal-wallet': 'Первый кошелек',
    'classic-bifold': 'Классический складной',
    'card-wallet': 'Кошелек для карт',
    'long-wallet': 'Длинный кошелек',
  };
  return names[templateId];
}

function registerPdfFont(doc: jsPDF, fontBase64?: string) {
  if (!fontBase64) return;
  doc.addFileToVFS(CYRILLIC_FONT_FILE, fontBase64);
  doc.addFont(CYRILLIC_FONT_FILE, CYRILLIC_FONT_NAME, 'normal');
  doc.addFont(CYRILLIC_FONT_FILE, CYRILLIC_FONT_NAME, 'bold');
  (doc as unknown as { __hasCyrillicFont: boolean }).__hasCyrillicFont = true;
  doc.setFont(CYRILLIC_FONT_NAME, 'normal');
}

function setPdfFont(doc: jsPDF, style: 'normal' | 'bold' = 'normal') {
  const hasCyrillicFont = (doc as unknown as { __hasCyrillicFont?: boolean }).__hasCyrillicFont;
  doc.setFont(hasCyrillicFont ? CYRILLIC_FONT_NAME : 'helvetica', style);
}

function resolveLayoutOptions(geometry: PatternGeometry, options: PdfOptions): LayoutOptions {
  return {
    format: options.layout?.format ?? geometry.params.pageFormat,
    marginMm: options.layout?.marginMm,
    strategy: options.layout?.strategy ?? 'piece-per-page',
  };
}

function roundedRectPath(doc: jsPDF, piece: PatternPiece, placement: LayoutPlacement) {
  doc.roundedRect(placement.x, placement.y, placement.width, placement.height, piece.radius, piece.radius);
}

function mmLabel(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} мм`;
}

export function buildWalletPdfManifest(geometry: PatternGeometry, options: PdfOptions = {}): WalletPdfManifest {
  const mainBody = geometry.pieces.find((piece) => piece.id === 'main-body');
  if (!mainBody) {
    throw new Error('Main body piece is required to generate wallet PDF.');
  }

  const generatedAt = options.generatedAt ?? new Date();
  const layout = createLayoutPlan(geometry, resolveLayoutOptions(geometry, options));

  return {
    page: {
      width: layout.width,
      height: layout.height,
      orientation: 'landscape',
      format: layout.format,
      pageCount: layout.pages.length + 1,
      productionSheetCount: layout.pages.length,
    },
    templateName: getTemplateName(geometry.params.templateId),
    templateId: geometry.params.templateId,
    generatedAt: generatedAt.toISOString(),
    pieceCount: geometry.pieces.length,
    mainBody: {
      width: mainBody.width,
      height: mainBody.height,
    },
    pocketCount: geometry.params.pocketCount,
    foldLineCount: geometry.lines.filter((line) => line.kind === 'fold').length,
    rulerLengthMm: geometry.ruler.x2 - geometry.ruler.x1,
    sourceSummary: `ширина ${geometry.params.widthMm} мм / высота ${geometry.params.heightMm} мм / карманов ${geometry.params.pocketCount} / припуск ${geometry.params.seamAllowanceMm} мм / радиус ${geometry.params.cornerRadiusMm} мм / кожа ${geometry.params.leatherThicknessMm} мм / масштаб ${geometry.params.printScale}% / формат ${geometry.params.pageFormat}`,
    cardFit: {
      targetRevealMm: geometry.cardFit.targetCardRevealMm,
      realizedRevealMm: geometry.cardFit.realizedRevealMm,
      sideSlackMm: geometry.cardFit.realizedSideSlackMm,
      pocketWindowWidthMm: geometry.cardFit.pocketWindowWidthMm,
    },
    stitchPairs: {
      count: geometry.stitchPairs.length,
      totalHoles: geometry.stitchPairs.reduce((sum, pair) => sum + pair.holeCount, 0),
      allMatched: geometry.stitchPairs.every((pair) => pair.matched),
    },
    attachments: {
      count: geometry.attachments.length,
    },
    appliedRules: geometry.ruleTrace.map((rule) => ({
      ruleId: rule.ruleId,
      confidence: rule.confidence,
      sourceRefs: rule.sourceRefs,
    })),
    validation: {
      isValid: geometry.validation.isValid && layout.validation.isValid,
      issueCount: geometry.validation.issues.length + layout.validation.issues.length,
    },
  };
}

function translateLine(line: PatternLine, placement: LayoutPlacement) {
  const dx = placement.x - placement.sourceX;
  const dy = placement.y - placement.sourceY;
  return {
    ...line,
    x1: line.x1 + dx,
    y1: line.y1 + dy,
    x2: line.x2 + dx,
    y2: line.y2 + dy,
  };
}

function translatePoint<T extends { x: number; y: number }>(item: T, placement: LayoutPlacement): T {
  const dx = placement.x - placement.sourceX;
  const dy = placement.y - placement.sourceY;
  return {
    ...item,
    x: item.x + dx,
    y: item.y + dy,
  };
}

function itemBelongsToPlacement(item: { x: number; y: number }, placement: LayoutPlacement) {
  return (
    item.x >= placement.sourceX &&
    item.x <= placement.sourceX + placement.width &&
    item.y >= placement.sourceY &&
    item.y <= placement.sourceY + placement.height
  );
}

function lineBelongsToPlacement(line: PatternLine, placement: LayoutPlacement) {
  const withinX1 = line.x1 >= placement.sourceX && line.x1 <= placement.sourceX + placement.width;
  const withinX2 = line.x2 >= placement.sourceX && line.x2 <= placement.sourceX + placement.width;
  const withinY1 = line.y1 >= placement.sourceY && line.y1 <= placement.sourceY + placement.height;
  const withinY2 = line.y2 >= placement.sourceY && line.y2 <= placement.sourceY + placement.height;
  return withinX1 && withinX2 && withinY1 && withinY2;
}

function drawRulerAt(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(20, 24, 22);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + 100, y);
  for (let tick = 0; tick <= 100; tick += 10) {
    const tickX = x + tick;
    doc.line(tickX, y - 2, tickX, y + 2);
    doc.setFontSize(5);
    doc.text(String(tick / 10), tickX, y + 5, { align: 'center' });
  }
  doc.setFontSize(7);
  doc.text('контрольная линейка 10 см', x + 50, y - 4, { align: 'center' });
}

function drawRuler(doc: jsPDF, page: LayoutPage) {
  drawRulerAt(doc, page.ruler.x1, page.ruler.y1);
}

function drawDimensionLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, label: string, orientation: 'horizontal' | 'vertical') {
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(85, 94, 88);
  doc.setLineWidth(0.18);
  doc.line(x1, y1, x2, y2);

  if (orientation === 'horizontal') {
    doc.line(x1, y1 - 1.4, x1, y1 + 1.4);
    doc.line(x2, y2 - 1.4, x2, y2 + 1.4);
    setPdfFont(doc, 'normal');
    doc.setFontSize(5.5);
    doc.text(label, (x1 + x2) / 2, y1 - 1.8, { align: 'center' });
    return;
  }

  doc.line(x1 - 1.4, y1, x1 + 1.4, y1);
  doc.line(x2 - 1.4, y2, x2 + 1.4, y2);
  setPdfFont(doc, 'normal');
  doc.setFontSize(5.5);
  doc.text(label, x1 + 2.2, (y1 + y2) / 2, { angle: 90, align: 'center' });
}

function drawPlacementDimensions(doc: jsPDF, placement: LayoutPlacement, page: LayoutPage) {
  const topY = Math.max(page.margin + 22, placement.y - 3.4);
  const rightX = Math.min(page.width - page.margin - 4, placement.x + placement.width + 3.8);

  drawDimensionLine(doc, placement.x, topY, placement.x + placement.width, topY, mmLabel(placement.width), 'horizontal');
  drawDimensionLine(doc, rightX, placement.y, rightX, placement.y + placement.height, mmLabel(placement.height), 'vertical');
}

function drawMark(doc: jsPDF, mark: PatternMark) {
  if (mark.kind === 'stitch-hole') {
    doc.setDrawColor(60, 110, 90);
    doc.setFillColor(255, 255, 255);
    doc.circle(mark.x, mark.y, mark.radius, 'S');
    return;
  }

  doc.setDrawColor(20, 24, 22);
  doc.setLineWidth(0.22);
  doc.line(mark.x - 2, mark.y, mark.x + 2, mark.y);
  doc.line(mark.x, mark.y - 2, mark.x, mark.y + 2);
}

function drawAnnotation(doc: jsPDF, annotation: PatternAnnotation) {
  setPdfFont(doc, annotation.kind === 'instruction' ? 'bold' : 'normal');
  doc.setFontSize(annotation.kind === 'opening' ? 5.5 : 5);

  if (annotation.kind === 'opening') {
    doc.setTextColor(177, 75, 53);
    doc.text(annotation.label, annotation.x, annotation.y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    return;
  }

  if (annotation.kind === 'grain') {
    doc.setDrawColor(85, 94, 88);
    doc.setLineWidth(0.22);
    doc.line(annotation.x, annotation.y - 12, annotation.x, annotation.y + 12);
    doc.line(annotation.x, annotation.y - 12, annotation.x - 2.2, annotation.y - 8);
    doc.line(annotation.x, annotation.y - 12, annotation.x + 2.2, annotation.y - 8);
    doc.text(annotation.label, annotation.x + 3, annotation.y + 1.5, { angle: 90 });
    return;
  }

  if (annotation.kind === 'glue') {
    doc.setTextColor(95, 99, 94);
    doc.text(annotation.label, annotation.x, annotation.y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    return;
  }

  doc.text(annotation.label, annotation.x, annotation.y);
}

function drawRegistrationMarks(doc: jsPDF, placement: LayoutPlacement) {
  if (placement.kind !== 'tile') return;
  const marks = [
    [placement.x, placement.y],
    [placement.x + placement.width, placement.y],
    [placement.x, placement.y + placement.height],
    [placement.x + placement.width, placement.y + placement.height],
  ];
  doc.setDrawColor(20, 24, 22);
  doc.setLineWidth(0.25);
  marks.forEach(([x, y]) => {
    doc.line(x - 4, y, x + 4, y);
    doc.line(x, y - 4, x, y + 4);
    doc.circle(x, y, 2);
  });
}

function drawLegend(doc: jsPDF, page: LayoutPage) {
  const x = page.width - page.margin - 68;
  const y = 9;
  setPdfFont(doc, 'normal');
  doc.setFontSize(6);

  doc.setLineDashPattern([], 0);
  doc.setDrawColor(20, 24, 22);
  doc.setLineWidth(0.35);
  doc.line(x, y, x + 8, y);
  doc.text('рез', x + 10, y + 1.5);

  doc.setLineDashPattern([1, 1.5], 0);
  doc.setDrawColor(60, 110, 90);
  doc.setLineWidth(0.25);
  doc.line(x + 24, y, x + 32, y);
  doc.text('шов', x + 34, y + 1.5);

  doc.setLineDashPattern([3, 2], 0);
  doc.setDrawColor(177, 75, 53);
  doc.setLineWidth(0.35);
  doc.line(x + 48, y, x + 56, y);
  doc.text('сгиб', x + 58, y + 1.5);
  doc.setLineDashPattern([], 0);
}

function drawPageHeader(doc: jsPDF, page: LayoutPage, manifest: WalletPdfManifest, pdfTemplateName: string) {
  setPdfFont(doc, 'bold');
  doc.setFontSize(14);
  doc.text(`${pdfTemplateName}: выкройка`, page.margin, 9);
  setPdfFont(doc, 'normal');
  doc.setFontSize(7.5);
  doc.text(`Рабочий лист ${page.pageNumber + 1} из ${page.totalPages + 1} / ${page.format} / масштаб 1:1`, page.margin, 15);
  doc.text(`Деталь: ${page.title}`, page.margin, 20);
  doc.text(`Параметры: ${manifest.sourceSummary}`, page.margin, 25);
  drawLegend(doc, page);
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.2);
  doc.rect(page.margin, page.margin, page.width - page.margin * 2, page.height - page.margin * 2);
}

function placementTitle(piece: PatternPiece, placement: LayoutPlacement) {
  if (placement.kind !== 'piece') return piece.label;
  const name = placement.productionName ?? piece.productionName ?? piece.label;
  const quantity = placement.quantity ?? 1;
  return `${name} - ${quantity} дет.`;
}

function drawPageFooter(doc: jsPDF, page: LayoutPage, manifest: WalletPdfManifest) {
  setPdfFont(doc, 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(95, 99, 94);
  doc.text('Печатайте в масштабе 100%. Перед раскроем проверьте контрольную линейку 100 мм. Инженерные правила сохранены в отладочном манифесте.', page.margin, page.height - 2.8);
  doc.setTextColor(0, 0, 0);
}

function drawPdfBorder(doc: jsPDF, width: number, height: number, margin: number) {
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.2);
  doc.rect(margin, margin, width - margin * 2, height - margin * 2);
}

function drawCoverPage(doc: jsPDF, layout: ReturnType<typeof createLayoutPlan>, manifest: WalletPdfManifest, geometry: PatternGeometry, pdfTemplateName: string) {
  const margin = 10;
  drawPdfBorder(doc, layout.width, layout.height, margin);

  setPdfFont(doc, 'bold');
  doc.setFontSize(18);
  doc.text(`${pdfTemplateName}: производственная выкройка`, layout.width / 2, 18, { align: 'center' });
  setPdfFont(doc, 'normal');
  doc.setFontSize(9);
  doc.text(`Формат: ${layout.format} / масштаб 1:1 / рабочих листов деталей: ${layout.pages.length}`, layout.width / 2, 27, { align: 'center' });
  doc.text(`Параметры: ${manifest.sourceSummary}`, layout.width / 2, 34, { align: 'center' });

  setPdfFont(doc, 'bold');
  doc.setFontSize(11);
  doc.text('Состав выкройки', margin + 6, 54);
  setPdfFont(doc, 'normal');
  doc.setFontSize(8);
  layout.pages.forEach((page, index) => {
    doc.text(`${index + 1}. ${page.title}`, margin + 8, 66 + index * 8);
  });

  const notesX = margin + 4;
  const notesY = 112;
  setPdfFont(doc, 'bold');
  doc.setFontSize(9);
  doc.text('Проверка перед раскроем', notesX, notesY);
  setPdfFont(doc, 'normal');
  doc.setFontSize(7);
  const notes = [
    'Печатайте в масштабе 100%, без подгонки под страницу.',
    'После печати измерьте контрольную линейку 10 см.',
    'Сплошная линия - рез, зеленый пунктир - шов, красный пунктир - сгиб.',
    'Количество деталей указано прямо на выкройке.',
  ];
  notes.forEach((note, index) => doc.text(`${index + 1}. ${note}`, notesX, notesY + 8 + index * 5.5));

  const assemblyX = layout.width / 2 + 16;
  setPdfFont(doc, 'bold');
  doc.setFontSize(9);
  doc.text('Сборка', assemblyX, notesY);
  setPdfFont(doc, 'normal');
  doc.setFontSize(6.5);
  geometry.assemblySteps.slice(0, 4).forEach((step, index) => {
    const text = doc.splitTextToSize(`${step.order}. ${step.text}`, 112);
    doc.text(text, assemblyX, notesY + 8 + index * 8);
  });

  // Card-fit block: target vs realized, so the maker can trust the pocket.
  const fitX = assemblyX;
  const fitY = notesY + 48;
  const fit = geometry.cardFit;
  setPdfFont(doc, 'bold');
  doc.setFontSize(9);
  doc.text('Посадка карты (ID-1)', fitX, fitY);
  setPdfFont(doc, 'normal');
  doc.setFontSize(6.5);
  const fitLines = [
    `Окно карты: ${fit.pocketWindowWidthMm.toFixed(1)} мм (карта 85.6 мм + зазор ${(fit.cardClearanceXMm * 2).toFixed(1)} мм)`,
    `Боковой люфт: ${fit.realizedSideSlackMm.toFixed(1)} мм`,
    `Вылет карты: ${fit.realizedRevealMm.toFixed(1)} мм (цель ${fit.targetCardRevealMm.toFixed(0)}, диапазон ${fit.minCardRevealMm.toFixed(0)}-${fit.maxCardRevealMm.toFixed(0)})`,
  ];
  fitLines.forEach((line, index) => doc.text(line, fitX, fitY + 7 + index * 5));

  // Stitch-pair + validation status.
  const allMatched = geometry.stitchPairs.every((pair) => pair.matched);
  const totalHoles = geometry.stitchPairs.reduce((sum, pair) => sum + pair.holeCount, 0);
  const statusY = fitY + 28;
  setPdfFont(doc, 'bold');
  doc.setFontSize(9);
  doc.text('Парные швы и контроль', fitX, statusY);
  setPdfFont(doc, 'normal');
  doc.setFontSize(6.5);
  doc.text(
    `Парных швов: ${geometry.stitchPairs.length} / отверстий на парах: ${totalHoles} / совпадение: ${allMatched ? 'да' : 'нет'}`,
    fitX,
    statusY + 7,
  );
  const errors = geometry.validation.issues.filter((i) => i.severity === 'error');
  if (geometry.validation.isValid) {
    doc.setTextColor(40, 110, 70);
    doc.text('Статус валидации: пройдена (0 ошибок геометрии).', fitX, statusY + 12);
  } else {
    doc.setTextColor(177, 75, 53);
    doc.text(`Статус валидации: ${errors.length} ошибк(а/и) — не для производства.`, fitX, statusY + 12);
  }
  doc.setTextColor(0, 0, 0);

  drawLegend(doc, { width: layout.width, height: layout.height, margin, pageNumber: 1, totalPages: manifest.page.pageCount, format: layout.format, title: '', placements: [], ruler: geometry.ruler });
  drawRulerAt(doc, margin + 4, layout.height - margin - 14);
}

export function generateWalletPdf(geometry: PatternGeometry, options: PdfOptions = {}) {
  const manifest = buildWalletPdfManifest(geometry, options);
  const layout = createLayoutPlan(geometry, resolveLayoutOptions(geometry, options));
  const pdfTemplateName = getPdfSafeTemplateName(manifest.templateId);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [layout.width, layout.height],
    compress: false,
  });
  registerPdfFont(doc, options.fontBase64);

  doc.setProperties({
    title: `${pdfTemplateName}: выкройка`,
    subject: 'Выкройка кожаного изделия 1:1, построенная по точной миллиметровой геометрии',
    creator: 'Платформа параметрических выкроек',
    keywords: `кожа, выкройка, ${manifest.templateId}, 1:1, ${layout.format}`,
  });

  drawCoverPage(doc, layout, manifest, geometry, pdfTemplateName);

  layout.pages.forEach((page) => {
    {
      doc.addPage([layout.width, layout.height], 'landscape');
    }

    drawPageHeader(doc, page, manifest, pdfTemplateName);

    page.placements.forEach((placement) => {
      const piece = geometry.pieces.find((item) => item.id === placement.pieceId);
      if (!piece) return;

      doc.setDrawColor(20, 24, 22);
      doc.setLineWidth(0.35);
      roundedRectPath(doc, piece, placement);
      drawRegistrationMarks(doc, placement);
      drawPlacementDimensions(doc, placement, page);
      setPdfFont(doc, 'bold');
      doc.setFontSize(8);
      doc.text(placementTitle(piece, placement), placement.x + placement.width / 2, placement.y + placement.height / 2 - 2, { align: 'center' });
      setPdfFont(doc, 'normal');
      doc.setFontSize(6);
      doc.text(`${piece.width} x ${piece.height} мм`, placement.x + placement.width / 2, placement.y + placement.height / 2 + 4, {
        align: 'center',
      });
      if (placement.kind === 'tile') {
        doc.text(
          `фрагмент ${placement.tileColumn}/${placement.tileColumns}, ${placement.tileRow}/${placement.tileRows}`,
          placement.x + placement.width / 2,
          placement.y + placement.height / 2 + 10,
          { align: 'center' },
        );
      }

      geometry.lines
        .filter((line) => lineBelongsToPlacement(line, placement))
        .map((line) => translateLine(line, placement))
        .forEach((line) => {
          if (line.kind === 'fold') {
            doc.setLineDashPattern([3, 2], 0);
            doc.setDrawColor(177, 75, 53);
            doc.setLineWidth(0.35);
          } else if (line.kind === 'stitch') {
            doc.setLineDashPattern([1, 1.5], 0);
            doc.setDrawColor(60, 110, 90);
            doc.setLineWidth(0.25);
          } else {
            doc.setLineDashPattern([], 0);
            doc.setDrawColor(20, 24, 22);
            doc.setLineWidth(0.35);
          }
          doc.line(line.x1, line.y1, line.x2, line.y2);
        });
      doc.setLineDashPattern([], 0);

      geometry.marks
        .filter((mark) => mark.pieceId === piece.id && itemBelongsToPlacement(mark, placement))
        .map((mark) => translatePoint(mark, placement))
        .forEach((mark) => drawMark(doc, mark));

      geometry.annotations
        .filter((annotation) => annotation.pieceId === piece.id && itemBelongsToPlacement(annotation, placement))
        .map((annotation) => translatePoint(annotation, placement))
        .forEach((annotation) => drawAnnotation(doc, annotation));
    });

    drawRuler(doc, page);
    drawPageFooter(doc, page, manifest);
  });

  return doc;
}

export function createWalletPdfBlob(geometry: PatternGeometry, options?: PdfOptions) {
  return generateWalletPdf(geometry, options).output('blob');
}

let cyrillicFontPromise: Promise<string | undefined> | null = null;

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return btoa(binary);
}

async function loadCyrillicFontBase64() {
  if (typeof window === 'undefined') return undefined;
  cyrillicFontPromise ??= fetch('/fonts/ArialUnicode.ttf')
    .then((response) => {
      if (!response.ok) throw new Error('Не удалось загрузить шрифт для русского PDF.');
      return response.arrayBuffer();
    })
    .then((buffer) => bytesToBase64(new Uint8Array(buffer)))
    .catch(() => undefined);
  return cyrillicFontPromise;
}

export async function createWalletPdfBlobAsync(geometry: PatternGeometry, options?: PdfOptions) {
  const fontBase64 = options?.fontBase64 ?? (await loadCyrillicFontBase64());
  return createWalletPdfBlob(geometry, { ...options, fontBase64 });
}

function createObjectUrl(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

export function openWalletPdf(geometry: PatternGeometry, options?: PdfOptions) {
  const url = createObjectUrl(createWalletPdfBlob(geometry, options));
  const opened = window.open(url, '_blank', 'noopener,noreferrer');

  if (!opened) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export function downloadWalletPdf(geometry: PatternGeometry, options?: PdfOptions) {
  const blob = createWalletPdfBlob(geometry, options);
  const url = createObjectUrl(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${geometry.params.templateId}-pattern.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function openDefaultWalletPdf() {
  openWalletPdf(createSimpleWalletPattern(simpleWalletDefaults));
}

export function downloadDefaultWalletPdf() {
  downloadWalletPdf(createSimpleWalletPattern(simpleWalletDefaults));
}

import type {
  LayoutPage,
  LayoutPlan,
  LayoutPlacement,
  LayoutStrategy,
  PageFormatSelection,
  PageFormatId,
  PatternGeometry,
  PatternPiece,
  PatternValidationIssue,
} from '../../types/pattern';

type PageFormat = {
  id: PageFormatId;
  width: number;
  height: number;
};

export type LayoutOptions = {
  format?: PageFormatSelection;
  marginMm?: number;
  strategy?: LayoutStrategy;
};

const PAGE_FORMATS: PageFormat[] = [
  { id: 'A4', width: 297, height: 210 },
  { id: 'A3', width: 420, height: 297 },
  { id: 'A2', width: 594, height: 420 },
  { id: 'A1', width: 841, height: 594 },
  { id: 'A0', width: 1189, height: 841 },
];

const DEFAULT_MARGIN_MM = 10;
const HEADER_HEIGHT_MM = 24;
const FOOTER_HEIGHT_MM = 10;
const PIECE_GAP_MM = 10;
const CONTROL_RULER_MM = 100;

function issue(id: string, severity: PatternValidationIssue['severity'], message: string): PatternValidationIssue {
  return { id, severity, message, ruleIds: ['R-002', 'R-003', 'R-022'] };
}

function getFormat(id: PageFormatId) {
  const format = PAGE_FORMATS.find((item) => item.id === id);
  if (!format) {
    throw new Error(`Unknown page format: ${id}`);
  }
  return format;
}

function usableArea(format: PageFormat, margin: number) {
  return {
    x: margin,
    y: margin + HEADER_HEIGHT_MM,
    width: format.width - margin * 2,
    height: format.height - margin * 2 - HEADER_HEIGHT_MM - FOOTER_HEIGHT_MM,
  };
}

function canPieceFit(piece: PatternPiece, format: PageFormat, margin: number) {
  const area = usableArea(format, margin);
  return piece.width <= area.width && piece.height <= area.height;
}

function packPiecesOnSinglePage(pieces: PatternPiece[], format: PageFormat, margin: number): LayoutPlacement[] | null {
  const area = usableArea(format, margin);
  const placements: LayoutPlacement[] = [];
  let cursorX = area.x;
  let cursorY = area.y;
  let rowHeight = 0;

  for (const piece of pieces) {
    if (!canPieceFit(piece, format, margin)) {
      return null;
    }

    if (cursorX + piece.width > area.x + area.width) {
      cursorX = area.x;
      cursorY += rowHeight + PIECE_GAP_MM;
      rowHeight = 0;
    }

    if (cursorY + piece.height > area.y + area.height) {
      return null;
    }

    placements.push({
      kind: 'piece',
      pieceId: piece.id,
      sourceX: piece.x,
      sourceY: piece.y,
      x: cursorX,
      y: cursorY,
      width: piece.width,
      height: piece.height,
    });

    cursorX += piece.width + PIECE_GAP_MM;
    rowHeight = Math.max(rowHeight, piece.height);
  }

  return placements;
}

function chooseAutoFormat(geometry: PatternGeometry, margin: number) {
  for (const format of PAGE_FORMATS) {
    const singlePage = packPiecesOnSinglePage(geometry.pieces, format, margin);
    if (singlePage) {
      return { format, singlePage };
    }
  }

  for (const format of PAGE_FORMATS) {
    if (geometry.pieces.every((piece) => canPieceFit(piece, format, margin))) {
      return { format, singlePage: null };
    }
  }

  return { format: PAGE_FORMATS[PAGE_FORMATS.length - 1], singlePage: null };
}

function choosePiecePageFormat(geometry: PatternGeometry, margin: number) {
  for (const format of PAGE_FORMATS) {
    if (geometry.pieces.every((piece) => canPieceFit(piece, format, margin))) {
      return format;
    }
  }

  return PAGE_FORMATS[PAGE_FORMATS.length - 1];
}

function createPage(format: PageFormat, margin: number, title: string, placements: LayoutPlacement[]): LayoutPage {
  return {
    pageNumber: 1,
    totalPages: 1,
    format: format.id,
    width: format.width,
    height: format.height,
    margin,
    title,
    placements,
    ruler: {
      id: `layout-ruler-${title}`,
      kind: 'measure',
      x1: margin,
      y1: format.height - margin - 8,
      x2: margin + CONTROL_RULER_MM,
      y2: format.height - margin - 8,
      label: '100 mm control ruler',
      ruleIds: ['R-003', 'R-004'],
    },
  };
}

function tilePiece(piece: PatternPiece, format: PageFormat, margin: number): LayoutPage[] {
  const area = usableArea(format, margin);
  const tileColumns = Math.ceil(piece.width / area.width);
  const tileRows = Math.ceil(piece.height / area.height);
  const pages: LayoutPage[] = [];

  for (let row = 0; row < tileRows; row += 1) {
    for (let column = 0; column < tileColumns; column += 1) {
      const sourceX = piece.x + column * area.width;
      const sourceY = piece.y + row * area.height;
      const width = Math.min(area.width, piece.x + piece.width - sourceX);
      const height = Math.min(area.height, piece.y + piece.height - sourceY);

      pages.push(
        createPage(format, margin, `${piece.name}: фрагмент ${column + 1}.${row + 1}`, [
          {
            kind: 'tile',
            pieceId: piece.id,
            sourceX,
            sourceY,
            x: area.x,
            y: area.y,
            width,
            height,
            tileColumn: column + 1,
            tileRow: row + 1,
            tileColumns,
            tileRows,
          },
        ]),
      );
    }
  }

  return pages;
}

function placePieceOnOwnPage(piece: PatternPiece, format: PageFormat, margin: number): LayoutPage[] {
  if (!canPieceFit(piece, format, margin)) {
    return tilePiece(piece, format, margin);
  }

  const area = usableArea(format, margin);
  const x = area.x + (area.width - piece.width) / 2;
  const y = area.y + (area.height - piece.height) / 2;

  return [
    createPage(format, margin, piece.name, [
      {
        kind: 'piece',
        pieceId: piece.id,
        pieceIds: [piece.id],
        quantity: 1,
        productionName: piece.productionName ?? piece.name,
        sourceX: piece.x,
        sourceY: piece.y,
        x,
        y,
        width: piece.width,
        height: piece.height,
      },
    ]),
  ];
}

function groupProductionPieces(pieces: PatternPiece[]) {
  const groups = new Map<string, PatternPiece[]>();

  pieces.forEach((piece) => {
    const key = piece.groupKey ?? `${piece.id}:${piece.width}:${piece.height}:${piece.radius}`;
    groups.set(key, [...(groups.get(key) ?? []), piece]);
  });

  return [...groups.values()];
}

function placePieceGroupOnOwnPage(pieces: PatternPiece[], format: PageFormat, margin: number): LayoutPage[] {
  const representative = pieces[0];
  if (!representative) return [];

  if (!canPieceFit(representative, format, margin)) {
    return tilePiece(representative, format, margin);
  }

  const area = usableArea(format, margin);
  const x = area.x + (area.width - representative.width) / 2;
  const y = area.y + (area.height - representative.height) / 2;
  const productionName = representative.productionName ?? representative.name;
  const quantity = pieces.length;

  return [
    createPage(format, margin, `${productionName} - ${quantity} дет.`, [
      {
        kind: 'piece',
        pieceId: representative.id,
        pieceIds: pieces.map((piece) => piece.id),
        quantity,
        productionName,
        sourceX: representative.x,
        sourceY: representative.y,
        x,
        y,
        width: representative.width,
        height: representative.height,
      },
    ]),
  ];
}

function placePiecesOnSeparatePages(geometry: PatternGeometry, format: PageFormat, margin: number) {
  return groupProductionPieces(geometry.pieces).flatMap((pieces) => placePieceGroupOnOwnPage(pieces, format, margin));
}

function packAcrossPages(geometry: PatternGeometry, format: PageFormat, margin: number) {
  const pages: LayoutPage[] = [];
  const area = usableArea(format, margin);
  let placements: LayoutPlacement[] = [];
  let cursorX = area.x;
  let cursorY = area.y;
  let rowHeight = 0;

  const flushPage = () => {
    if (placements.length === 0) return;
    pages.push(createPage(format, margin, `Лист выкройки ${pages.length + 1}`, placements));
    placements = [];
    cursorX = area.x;
    cursorY = area.y;
    rowHeight = 0;
  };

  for (const piece of geometry.pieces) {
    if (!canPieceFit(piece, format, margin)) {
      flushPage();
      pages.push(...tilePiece(piece, format, margin));
      continue;
    }

    if (cursorX + piece.width > area.x + area.width) {
      cursorX = area.x;
      cursorY += rowHeight + PIECE_GAP_MM;
      rowHeight = 0;
    }

    if (cursorY + piece.height > area.y + area.height) {
      flushPage();
    }

    placements.push({
      kind: 'piece',
      pieceId: piece.id,
      sourceX: piece.x,
      sourceY: piece.y,
      x: cursorX,
      y: cursorY,
      width: piece.width,
      height: piece.height,
    });
    cursorX += piece.width + PIECE_GAP_MM;
    rowHeight = Math.max(rowHeight, piece.height);
  }

  flushPage();
  return pages;
}

export function createLayoutPlan(geometry: PatternGeometry, options: LayoutOptions = {}): LayoutPlan {
  const margin = options.marginMm ?? DEFAULT_MARGIN_MM;
  const requestedFormat = options.format ?? 'auto';
  const strategy = options.strategy ?? 'piece-per-page';
  const selected =
    strategy === 'piece-per-page'
      ? {
          format: requestedFormat === 'auto' ? choosePiecePageFormat(geometry, margin) : getFormat(requestedFormat),
          singlePage: null,
        }
      : requestedFormat === 'auto'
        ? chooseAutoFormat(geometry, margin)
        : { format: getFormat(requestedFormat), singlePage: null };
  const pages =
    strategy === 'piece-per-page'
      ? placePiecesOnSeparatePages(geometry, selected.format, margin)
      : selected.singlePage
        ? [createPage(selected.format, margin, 'Лист выкройки 1', selected.singlePage)]
        : packAcrossPages(geometry, selected.format, margin);
  const issues: PatternValidationIssue[] = [];

  if (pages.length === 0) {
    issues.push(issue('layout-empty', 'error', 'Layout Engine не смог создать ни одной страницы.'));
  }

  pages.forEach((page, index) => {
    page.pageNumber = index + 1;
    page.totalPages = pages.length;
    if (page.ruler.x2 - page.ruler.x1 !== CONTROL_RULER_MM) {
      issues.push(issue(`layout-ruler-${index + 1}`, 'error', `На странице ${index + 1} контрольная линейка не равна 100 мм.`));
    }
  });

  return {
    format: selected.format.id,
    strategy,
    autoSelected: requestedFormat === 'auto',
    width: selected.format.width,
    height: selected.format.height,
    pages,
    validation: {
      isValid: issues.every((item) => item.severity !== 'error'),
      issues,
    },
  };
}

import { cardholderRules, getCardholderRule } from '../../data/knowledge/cardholderRules';
import type {
  AppliedKnowledgeRule,
  AssemblyPlacement,
  AssemblySeamPair,
  AssemblySeamSegment,
  AssemblyStep,
  CardFit,
  PatternAnnotation,
  PatternGeometry,
  PatternLine,
  PatternMark,
  PatternPiece,
  PatternPoint,
  PocketAttachment,
  StitchPair,
  KnowledgeConfidence,
  PatternValidationIssue,
  WalletPatternParams,
} from '../../types/pattern';

const PAGE_MARGIN_MM = 10;
const PIECE_GAP_MM = 12;

type NormalizedCardholderInput = WalletPatternParams & {
  constructionType: 'stitched-cardholder';
  sourceProductType: 'wallet';
};

type DerivedCardholderValues = {
  // Card-fit configuration (explicit, sourced from rules)
  cardWidth: number;
  cardHeight: number;
  cardRadius: number;
  cardClearanceX: number;
  cardClearanceY: number;
  targetCardReveal: number;
  minCardReveal: number;
  maxCardReveal: number;
  // Stitch / hole configuration
  stitchInset: number;
  safeEdgeDistance: number;
  nominalPitch: number;
  holeDiameter: number;
  minHoleSpacing: number;
  // Pocket geometry derived from the card
  pocketWindowWidth: number;
  pocketWindowDepth: number;
  pocketWidth: number;
  pocketHeight: number;
  realizedReveal: number;
  realizedSideSlack: number;
  // Panel / body geometry
  panelBottomMargin: number;
  panelTopMargin: number;
  pocketRows: number;
  slotStagger: number;
  foldAllowance: number;
  foldedWidth: number;
  bodyWidth: number;
  bodyHeight: number;
  leftFoldX: number;
  rightFoldX: number;
  // Layout anchors
  layoutX: number;
  layoutY: number;
  pocketStartY: number;
};

type PipelineState = {
  input: NormalizedCardholderInput;
  issues: PatternValidationIssue[];
  trace: AppliedKnowledgeRule[];
};

function applyRule(ruleId: string, note: string): AppliedKnowledgeRule {
  const rule = getCardholderRule(ruleId);
  return {
    ruleId: rule.id,
    confidence: rule.confidence,
    automationReadiness: rule.automationReadiness,
    sourceRefs: rule.sourceRefs,
    note,
  };
}

function ruleConfidence(ruleId: string): KnowledgeConfidence {
  return getCardholderRule(ruleId).confidence;
}

function ruleValue(ruleId: string, key: string) {
  const rule = getCardholderRule(ruleId);
  const value = rule.implementation?.[key];
  if (typeof value !== 'number') {
    throw new Error(`Knowledge rule ${ruleId} is missing numeric implementation value: ${key}`);
  }
  return value;
}

function uniqueTrace(trace: AppliedKnowledgeRule[]) {
  return cardholderRules
    .filter((rule) => trace.some((item) => item.ruleId === rule.id))
    .map((rule) => trace.find((item) => item.ruleId === rule.id)!);
}

function issue(
  id: string,
  severity: PatternValidationIssue['severity'],
  message: string,
  ruleIds: string[],
): PatternValidationIssue {
  return { id, severity, message, ruleIds };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Signed distance from a point to the cut edge of a rounded rectangle.
 * Positive = inside the leather, negative = outside. Accounts for rounded corners
 * so stitch holes near a corner are measured against the arc, not the bounding box.
 */
function roundedRectEdgeDistance(px: number, py: number, piece: PatternPiece): number {
  const { x, y, width: w, height: h } = piece;
  const r = Math.min(piece.radius, w / 2, h / 2);
  const inCornerX = px < x + r ? -1 : px > x + w - r ? 1 : 0;
  const inCornerY = py < y + r ? -1 : py > y + h - r ? 1 : 0;

  if (r > 0 && inCornerX !== 0 && inCornerY !== 0) {
    const cx = inCornerX < 0 ? x + r : x + w - r;
    const cy = inCornerY < 0 ? y + r : y + h - r;
    return r - Math.hypot(px - cx, py - cy);
  }

  return Math.min(px - x, x + w - px, py - y, y + h - py);
}

/** A polyline seam path with arc-length helpers, in piece-local coordinates. */
type SeamPath = {
  points: PatternPoint[];
  length: number;
};

/** U-shaped stitch path around a pocket (left edge down, bottom across, right edge up). Top stays open. */
function buildPocketSeamPath(pocketWidth: number, pocketHeight: number, inset: number): SeamPath {
  const left = inset;
  const right = pocketWidth - inset;
  const top = inset;
  const bottom = pocketHeight - inset;
  const points: PatternPoint[] = [
    { x: left, y: top },
    { x: left, y: bottom },
    { x: right, y: bottom },
    { x: right, y: top },
  ];
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return { points, length };
}

/** Walk a polyline and return the point at a given arc-length distance from the start. */
function pointAtArcLength(path: SeamPath, distance: number): PatternPoint {
  let remaining = clamp(distance, 0, path.length);
  for (let i = 1; i < path.points.length; i += 1) {
    const a = path.points[i - 1];
    const b = path.points[i];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= segLen || i === path.points.length - 1) {
      const t = segLen === 0 ? 0 : remaining / segLen;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= segLen;
  }
  return path.points[path.points.length - 1];
}

type HoleLayout = {
  localPoints: PatternPoint[];
  holeCount: number;
  actualPitch: number;
  startOffset: number;
  endOffset: number;
  pathLength: number;
};

/** Evenly distribute stitch holes along the seam path with recomputed actual pitch. */
function layoutHoles(path: SeamPath, nominalPitch: number, edgeOffset: number): HoleLayout {
  const startOffset = edgeOffset;
  const endOffset = edgeOffset;
  const usable = Math.max(0, path.length - startOffset - endOffset);
  const holeCount = Math.max(2, Math.round(usable / nominalPitch) + 1);
  const actualPitch = holeCount > 1 ? usable / (holeCount - 1) : usable;
  const localPoints = Array.from({ length: holeCount }, (_, i) =>
    pointAtArcLength(path, startOffset + i * actualPitch),
  );
  return { localPoints, holeCount, actualPitch: round2(actualPitch), startOffset, endOffset, pathLength: round2(path.length) };
}

function normalizeInput(params: WalletPatternParams): NormalizedCardholderInput {
  return {
    ...params,
    pocketCount: Math.round(params.pocketCount),
    constructionType: 'stitched-cardholder',
    sourceProductType: 'wallet',
  };
}

function validateInput(input: NormalizedCardholderInput): PipelineState {
  const issues: PatternValidationIssue[] = [];
  const printScalePercent = ruleValue('R-004', 'printScalePercent');
  const recommendedMinThickness = ruleValue('R-006', 'recommendedMinThicknessMm');
  const recommendedMaxThickness = ruleValue('R-006', 'recommendedMaxThicknessMm');
  const trace: AppliedKnowledgeRule[] = [
    applyRule('R-001', 'ID-1 card size drives every cardholder fit check.'),
    applyRule('R-002', 'A4 landscape page is the print-ready target.'),
    applyRule('R-004', 'Production PDF must be printed at 100% scale.'),
    applyRule('R-006', 'Leather thickness is checked against cardholder source recommendations.'),
    applyRule('R-009', 'Pocket count is treated as a construction variant.'),
  ];

  if (input.widthMm <= 0 || input.heightMm <= 0) {
    issues.push(issue('input-positive-size', 'error', 'Размеры изделия должны быть положительными.', ['R-001']));
  }

  if (!Number.isInteger(input.pocketCount) || input.pocketCount < 1) {
    issues.push(issue('input-pocket-count', 'error', 'Количество карманов должно быть целым числом больше 0.', ['R-009']));
  }

  if (input.pocketCount > 5) {
    issues.push(
      issue(
        'input-pocket-count-validation',
        'warning',
        'Открытые источники подтверждают 2-5 карманов. Большее количество требует проверки мастером.',
        ['R-009'],
      ),
    );
  }

  if (input.leatherThicknessMm < recommendedMinThickness || input.leatherThicknessMm > recommendedMaxThickness) {
    issues.push(
      issue(
        'input-leather-thickness',
        'warning',
        'Для тонких кардхолдеров источники рекомендуют примерно 1.2-1.4 мм. Другую толщину нужно проверять на прототипе.',
        ['R-006'],
      ),
    );
  }

  if (input.printScale !== printScalePercent) {
    issues.push(issue('input-print-scale', 'error', 'Для выкройки 1:1 масштаб печати должен быть 100%.', ['R-004']));
  }

  return { input, issues, trace };
}

function deriveCardholderValues(state: PipelineState): DerivedCardholderValues {
  state.trace.push(
    applyRule('R-011', 'Hole pitch and diameter come from the stitch-hole rule and are redistributed to fit the seam path.'),
    applyRule('R-018', 'Card cavity clearance is derived from ID-1 size plus engineering clearance.'),
    applyRule('R-019', 'Usable pocket cavity is sized inside the stitch line, not the cut edge.'),
    applyRule('R-020', 'Holes are kept at least the safe edge distance from every cut edge, including rounded corners.'),
    applyRule('R-021', 'Pocket depth is solved from the target card reveal so the card can be gripped.'),
    applyRule('R-023', 'Finished folded width is unfolded into two panels plus a center fold allowance.'),
  );

  const cardWidth = ruleValue('R-001', 'cardWidthMm');
  const cardHeight = ruleValue('R-001', 'cardHeightMm');
  const cardRadius = ruleValue('R-001', 'cardRadiusMinMm');
  const cardClearanceX = ruleValue('R-018', 'sideClearanceMm');
  const cardClearanceY = ruleValue('R-018', 'verticalClearanceMm');
  const minCardReveal = ruleValue('R-021', 'minGripRevealMm');
  const maxCardReveal = ruleValue('R-021', 'maxGripRevealMm');
  const targetCardReveal = clamp(ruleValue('R-021', 'targetGripRevealMm'), minCardReveal, maxCardReveal);

  const stitchInset = state.input.seamAllowanceMm;
  const safeEdgeDistance = ruleValue('R-020', 'minSafeEdgeDistanceMm');
  const nominalPitch = ruleValue('R-011', 'defaultHolePitchMm');
  const holeDiameter = ruleValue('R-011', 'holeDiameterMm');
  const minHoleSpacing = ruleValue('R-011', 'minHoleSpacingMm');

  // Pocket window (usable cavity) is sized from the card, then expanded by the stitch inset.
  const pocketWindowWidth = cardWidth + cardClearanceX * 2;
  const pocketWindowDepth = cardHeight - targetCardReveal;
  const pocketWidth = round2(pocketWindowWidth + stitchInset * 2);
  const pocketHeight = round2(pocketWindowDepth + stitchInset);
  const realizedReveal = round2(cardHeight - (pocketHeight - stitchInset));
  const realizedSideSlack = round2(pocketWidth - stitchInset * 2 - cardWidth);

  // Body panel must host every stacked slot row plus a card-grip zone above the top card.
  const panelBottomMargin = safeEdgeDistance;
  const panelTopMargin = safeEdgeDistance;
  const pocketRows = Math.ceil(state.input.pocketCount / 2);
  const slotStagger = round2(realizedReveal + 4);
  const minBodyHeight = round2(
    panelBottomMargin + panelTopMargin + stitchInset + cardHeight + (pocketRows - 1) * slotStagger,
  );
  const foldAllowance = Math.max(
    ruleValue('R-023', 'minFoldAllowanceMm'),
    round2(state.input.leatherThicknessMm * ruleValue('R-023', 'thicknessMultiplier')),
  );
  const foldedWidth = round2(Math.max(state.input.widthMm, pocketWidth + cardClearanceX * 2));
  const bodyWidth = round2(foldedWidth * 2 + foldAllowance);
  const bodyHeight = round2(Math.max(state.input.heightMm, minBodyHeight));

  const layoutX = PAGE_MARGIN_MM;
  const layoutY = PAGE_MARGIN_MM + 24;
  const pocketStartY = layoutY + bodyHeight + PIECE_GAP_MM;
  const leftFoldX = round2(layoutX + foldedWidth);
  const rightFoldX = round2(layoutX + foldedWidth + foldAllowance);

  return {
    cardWidth,
    cardHeight,
    cardRadius,
    cardClearanceX,
    cardClearanceY,
    targetCardReveal,
    minCardReveal,
    maxCardReveal,
    stitchInset,
    safeEdgeDistance,
    nominalPitch,
    holeDiameter,
    minHoleSpacing,
    pocketWindowWidth: round2(pocketWindowWidth),
    pocketWindowDepth: round2(pocketWindowDepth),
    pocketWidth,
    pocketHeight,
    realizedReveal,
    realizedSideSlack,
    panelBottomMargin,
    panelTopMargin,
    pocketRows,
    slotStagger,
    foldAllowance,
    foldedWidth,
    bodyWidth,
    bodyHeight,
    leftFoldX,
    rightFoldX,
    layoutX,
    layoutY,
    pocketStartY,
  };
}

function createPocketPieces(input: NormalizedCardholderInput, derived: DerivedCardholderValues): PatternPiece[] {
  return Array.from({ length: input.pocketCount }, (_, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    return {
      id: `card-pocket-${index + 1}`,
      name: `Карман ${index + 1}`,
      productionName: 'Карман',
      groupKey: 'card-pocket',
      x: derived.layoutX + column * (derived.pocketWidth + PIECE_GAP_MM),
      y: derived.pocketStartY + row * (derived.pocketHeight + PIECE_GAP_MM),
      width: derived.pocketWidth,
      height: derived.pocketHeight,
      radius: Math.min(input.cornerRadiusMm, 4),
      label: `Карман ${index + 1}`,
      description: 'ID-1 card pocket sized from the card window (R-001, R-018, R-019, R-021)',
      ruleIds: ['R-001', 'R-009', 'R-018', 'R-019', 'R-020', 'R-021'],
    };
  });
}

/** Where each pocket sits on the body, centred on its panel, bottom-aligned with a grip zone above. */
function createAttachments(
  mainBody: PatternPiece,
  pockets: PatternPiece[],
  derived: DerivedCardholderValues,
): PocketAttachment[] {
  const confidence: KnowledgeConfidence =
    pockets.length <= 2 ? ruleConfidence('R-019') : 'needs-master-validation';

  return pockets.map((pocket, index) => {
    const zone: PocketAttachment['zone'] = index % 2 === 0 ? 'left-panel' : 'right-panel';
    const row = Math.floor(index / 2);
    const panelLeft = zone === 'left-panel' ? 0 : derived.foldedWidth + derived.foldAllowance;
    // Stacked slots step upward; canonical 2-pocket build keeps a single row (no stagger).
    const offsetX = round2(panelLeft + (derived.foldedWidth - derived.pocketWidth) / 2);
    const offsetY = round2(
      mainBody.height - derived.panelBottomMargin - derived.pocketHeight - row * derived.slotStagger,
    );

    const baseX = mainBody.x + offsetX;
    const baseY = mainBody.y + offsetY;
    const seam = buildPocketSeamPath(derived.pocketWidth, derived.pocketHeight, derived.stitchInset);
    const seamPath: PatternPoint[] = seam.points.map((point) => ({ x: baseX + point.x, y: baseY + point.y }));
    const alignmentPoints = [
      { id: `${pocket.id}-align-tl`, x: baseX, y: baseY },
      { id: `${pocket.id}-align-tr`, x: baseX + derived.pocketWidth, y: baseY },
      { id: `${pocket.id}-align-bl`, x: baseX, y: baseY + derived.pocketHeight },
      { id: `${pocket.id}-align-br`, x: baseX + derived.pocketWidth, y: baseY + derived.pocketHeight },
    ];

    return {
      id: `${pocket.id}-attachment`,
      pocketId: pocket.id,
      targetPieceId: mainBody.id,
      zone,
      offsetX,
      offsetY,
      seamPath,
      alignmentPoints,
      confidence,
      ruleIds: ['R-009', 'R-019', 'R-020'],
    };
  });
}

/** Build stitched pairs: pocket holes and matching body holes from one shared seam path. */
function createStitchPairs(
  mainBody: PatternPiece,
  pockets: PatternPiece[],
  attachments: PocketAttachment[],
  derived: DerivedCardholderValues,
): { pairs: StitchPair[]; marks: PatternMark[] } {
  const pairs: StitchPair[] = [];
  const marks: PatternMark[] = [];
  const seam = buildPocketSeamPath(derived.pocketWidth, derived.pocketHeight, derived.stitchInset);
  const holeRadius = derived.holeDiameter / 2;

  pockets.forEach((pocket) => {
    const attachment = attachments.find((item) => item.pocketId === pocket.id)!;
    const layout = layoutHoles(seam, derived.nominalPitch, derived.stitchInset);

    const pocketHoleIds: string[] = [];
    const bodyHoleIds: string[] = [];

    layout.localPoints.forEach((local, seamIndex) => {
      const pocketHoleId = `${pocket.id}-hole-${seamIndex + 1}`;
      const bodyHoleId = `${mainBody.id}-from-${pocket.id}-hole-${seamIndex + 1}`;
      pocketHoleIds.push(pocketHoleId);
      bodyHoleIds.push(bodyHoleId);

      marks.push({
        id: pocketHoleId,
        pieceId: pocket.id,
        kind: 'stitch-hole',
        x: round2(pocket.x + local.x),
        y: round2(pocket.y + local.y),
        radius: holeRadius,
        ruleIds: ['R-011', 'R-020'],
        pairId: `${pocket.id}-pair`,
        pairRole: 'pocket',
        seamIndex,
      });

      marks.push({
        id: bodyHoleId,
        pieceId: mainBody.id,
        kind: 'stitch-hole',
        x: round2(mainBody.x + attachment.offsetX + local.x),
        y: round2(mainBody.y + attachment.offsetY + local.y),
        radius: holeRadius,
        ruleIds: ['R-011', 'R-020'],
        pairId: `${pocket.id}-pair`,
        pairRole: 'body',
        seamIndex,
      });
    });

    pairs.push({
      id: `${pocket.id}-pair`,
      pocketId: pocket.id,
      targetPieceId: mainBody.id,
      holeCount: layout.holeCount,
      nominalPitchMm: derived.nominalPitch,
      actualPitchMm: layout.actualPitch,
      pathLengthMm: layout.pathLength,
      startOffsetMm: layout.startOffset,
      endOffsetMm: layout.endOffset,
      pocketHoleIds,
      bodyHoleIds,
      matched: pocketHoleIds.length === bodyHoleIds.length,
      ruleIds: ['R-011', 'R-019', 'R-020'],
    });
  });

  return { pairs, marks };
}

/** Seam lines for both layers: the U-outline on each pocket and the matching outline on the body. */
function createSeamLines(pockets: PatternPiece[], attachments: PocketAttachment[], inset: number): PatternLine[] {
  const lines: PatternLine[] = [];

  pockets.forEach((piece) => {
    const left = piece.x + inset;
    const right = piece.x + piece.width - inset;
    const top = piece.y + inset;
    const bottom = piece.y + piece.height - inset;
    lines.push(
      { id: `${piece.id}-stitch-left`, kind: 'stitch', x1: left, y1: top, x2: left, y2: bottom, label: 'шов', ruleIds: ['R-019', 'R-020'] },
      { id: `${piece.id}-stitch-bottom`, kind: 'stitch', x1: left, y1: bottom, x2: right, y2: bottom, label: 'шов', ruleIds: ['R-019', 'R-020'] },
      { id: `${piece.id}-stitch-right`, kind: 'stitch', x1: right, y1: top, x2: right, y2: bottom, label: 'шов', ruleIds: ['R-019', 'R-020'] },
    );
  });

  attachments.forEach((attachment) => {
    const p = attachment.seamPath;
    for (let i = 1; i < p.length; i += 1) {
      lines.push({
        id: `${attachment.id}-seam-${i}`,
        kind: 'stitch',
        x1: p[i - 1].x,
        y1: p[i - 1].y,
        x2: p[i].x,
        y2: p[i].y,
        label: 'шов кармана',
        ruleIds: ['R-019', 'R-020'],
      });
    }
  });

  return lines;
}

function createProductionAnnotations(
  mainBody: PatternPiece,
  pockets: PatternPiece[],
  attachments: PocketAttachment[],
  derived: DerivedCardholderValues,
): PatternAnnotation[] {
  const bodyAnnotations: PatternAnnotation[] = [
    {
      id: 'main-body-cut',
      pieceId: mainBody.id,
      kind: 'instruction',
      x: mainBody.x + 5,
      y: mainBody.y + 8,
      label: 'крой 1 / задняя деталь',
      ruleIds: ['R-019'],
    },
    {
      id: 'main-body-grain',
      pieceId: mainBody.id,
      kind: 'grain',
      x: mainBody.x + mainBody.width - 20,
      y: mainBody.y + mainBody.height / 2,
      label: 'направление кожи',
      ruleIds: ['R-020'],
    },
    {
      id: 'main-body-fold-zone',
      pieceId: mainBody.id,
      kind: 'instruction',
      x: derived.leftFoldX + derived.foldAllowance / 2,
      y: mainBody.y + mainBody.height - 8,
      label: 'зона сгиба - шерфовать',
      ruleIds: ['R-023'],
    },
  ];

  // "Карман N — пришить здесь" placed at each attachment zone on the body.
  const attachmentAnnotations = attachments.map((attachment, index): PatternAnnotation => ({
    id: `${attachment.id}-here`,
    pieceId: mainBody.id,
    kind: 'instruction',
    x: round2(mainBody.x + attachment.offsetX + derived.pocketWidth / 2),
    y: round2(mainBody.y + attachment.offsetY + derived.pocketHeight / 2),
    label: `карман ${index + 1} — пришить здесь`,
    ruleIds: ['R-009', 'R-019'],
  }));

  const pocketAnnotations = pockets.flatMap((piece, index): PatternAnnotation[] => [
    {
      id: `${piece.id}-cut`,
      pieceId: piece.id,
      kind: 'instruction',
      x: piece.x + 5,
      y: piece.y + 7,
      label: 'крой / карман',
      ruleIds: ['R-009', 'R-019'],
    },
    {
      id: `${piece.id}-opening`,
      pieceId: piece.id,
      kind: 'opening',
      x: piece.x + piece.width / 2,
      y: piece.y + derived.safeEdgeDistance - 2.5,
      label: 'вход карты - не прошивать',
      ruleIds: ['R-019', 'R-021'],
    },
    {
      id: `${piece.id}-glue-zone`,
      pieceId: piece.id,
      kind: 'glue',
      x: piece.x + piece.width / 2,
      y: piece.y + piece.height - derived.stitchInset - 3,
      label: 'совместить по меткам перед швом',
      ruleIds: ['R-019', 'R-020'],
    },
    {
      id: `${piece.id}-index`,
      pieceId: piece.id,
      kind: 'label',
      x: piece.x + piece.width - 5,
      y: piece.y + 7,
      label: `№${index + 1}`,
      ruleIds: ['R-009'],
    },
  ]);

  return [...bodyAnnotations, ...attachmentAnnotations, ...pocketAnnotations];
}

/** Registration crosses at the four pocket corners on the body for precise alignment. */
function createAlignmentMarks(attachments: PocketAttachment[]): PatternMark[] {
  return attachments.flatMap((attachment) =>
    attachment.alignmentPoints.map((point) => ({
      id: `${point.id}-mark`,
      pieceId: attachment.targetPieceId,
      kind: 'registration' as const,
      x: round2(point.x),
      y: round2(point.y),
      radius: 1.4,
      label: 'совмещение',
      ruleIds: ['R-019'],
    })),
  );
}

function createAssemblySteps(input: NormalizedCardholderInput): AssemblyStep[] {
  return [
    {
      id: 'assembly-cut',
      order: 1,
      text: `Вырежьте основу x1 и карманы x${input.pocketCount}. Печатайте 100% и сначала проверьте линейку 100 мм.`,
      ruleIds: ['R-003', 'R-004', 'R-009'],
    },
    {
      id: 'assembly-place',
      order: 2,
      text: 'Совместите карман с зоной «пришить здесь» на основе по четырём меткам совмещения, затем слегка подклейте.',
      ruleIds: ['R-019', 'R-020'],
    },
    {
      id: 'assembly-openings',
      order: 3,
      text: 'Не прошивайте верхний край каждого кармана: это вход карты.',
      ruleIds: ['R-019', 'R-021'],
    },
    {
      id: 'assembly-stitch',
      order: 4,
      text: 'Прошивайте по парным отверстиям сквозь оба слоя: левый край, низ, правый край.',
      ruleIds: ['R-011', 'R-019', 'R-020'],
    },
  ];
}

function buildAssemblyModel(
  mainBody: PatternPiece,
  pockets: PatternPiece[],
  attachments: PocketAttachment[],
  pairs: StitchPair[],
  derived: DerivedCardholderValues,
  allMatched: boolean,
) {
  const placements: AssemblyPlacement[] = attachments.map((attachment, index) => {
    const pocket = pockets[index];
    return {
      id: `${pocket.id}-assembly-placement`,
      pieceId: pocket.id,
      targetPieceId: mainBody.id,
      translateX: round2(mainBody.x + attachment.offsetX - pocket.x),
      translateY: round2(mainBody.y + attachment.offsetY - pocket.y),
      layer: 1,
      label: attachment.zone === 'left-panel' ? 'Левая панель' : 'Правая панель',
      ruleIds: ['R-009', 'R-019', 'R-020'],
    };
  });

  const seamSegments: AssemblySeamSegment[] = [];
  const seamPairs: AssemblySeamPair[] = [];

  pockets.forEach((pocket, index) => {
    const placement = placements[index];
    const left = pocket.x + derived.stitchInset;
    const right = pocket.x + pocket.width - derived.stitchInset;
    const top = pocket.y + derived.stitchInset;
    const bottom = pocket.y + pocket.height - derived.stitchInset;
    const segments: AssemblySeamSegment[] = [
      { id: `${pocket.id}-src-left`, pieceId: pocket.id, x1: left, y1: top, x2: left, y2: bottom, role: 'source', ruleIds: ['R-019', 'R-020'] },
      { id: `${pocket.id}-src-bottom`, pieceId: pocket.id, x1: left, y1: bottom, x2: right, y2: bottom, role: 'source', ruleIds: ['R-019', 'R-020'] },
      { id: `${pocket.id}-src-right`, pieceId: pocket.id, x1: right, y1: top, x2: right, y2: bottom, role: 'source', ruleIds: ['R-019', 'R-020'] },
    ];

    segments.forEach((source) => {
      const target: AssemblySeamSegment = {
        ...source,
        id: source.id.replace('-src-', '-tgt-'),
        pieceId: mainBody.id,
        x1: source.x1 + placement.translateX,
        y1: source.y1 + placement.translateY,
        x2: source.x2 + placement.translateX,
        y2: source.y2 + placement.translateY,
        role: 'target',
      };
      seamSegments.push(source, target);
      seamPairs.push({
        id: `${source.id}-pair`,
        sourceSegmentId: source.id,
        targetSegmentId: target.id,
        toleranceMm: 0.25,
        ruleIds: ['R-019', 'R-020'],
      });
    });
  });

  void pairs;
  return {
    status: allMatched ? ('validated' as const) : ('prototype-required' as const),
    placements,
    seamSegments,
    seamPairs,
  };
}

function buildGeometry(state: PipelineState, derived: DerivedCardholderValues): PatternGeometry {
  state.trace.push(
    applyRule('R-003', 'A 100 mm control ruler is generated as the metric scale test.'),
    applyRule('R-016', 'Visible pocket lips can receive crease guide lines; offset remains a master-validation value.'),
    applyRule('R-022', 'All generated pieces are checked against the page bounds.'),
  );

  const mainBody: PatternPiece = {
    id: 'main-body',
    name: 'Основа кардхолдера',
    productionName: 'Основа',
    groupKey: 'main-body',
    x: derived.layoutX,
    y: derived.layoutY,
    width: derived.bodyWidth,
    height: derived.bodyHeight,
    radius: state.input.cornerRadiusMm,
    label: 'Основа',
    description: 'Back plate sized from card-fit pockets, panel grip zone and selected layout',
    ruleIds: ['R-001', 'R-018', 'R-019', 'R-020', 'R-023'],
  };

  const pockets = createPocketPieces(state.input, derived);
  const pieces = [mainBody, ...pockets];
  const attachments = createAttachments(mainBody, pockets, derived);
  const { pairs, marks: stitchHoleMarks } = createStitchPairs(mainBody, pockets, attachments, derived);
  const alignmentMarks = createAlignmentMarks(attachments);
  const marks = [...stitchHoleMarks, ...alignmentMarks];

  const bodyFoldLines: PatternLine[] = [
    {
      id: 'main-body-left-fold',
      kind: 'fold',
      x1: derived.leftFoldX,
      y1: mainBody.y + derived.stitchInset,
      x2: derived.leftFoldX,
      y2: mainBody.y + mainBody.height - derived.stitchInset,
      label: 'сгиб',
      ruleIds: ['R-023'],
    },
    {
      id: 'main-body-right-fold',
      kind: 'fold',
      x1: derived.rightFoldX,
      y1: mainBody.y + derived.stitchInset,
      x2: derived.rightFoldX,
      y2: mainBody.y + mainBody.height - derived.stitchInset,
      label: 'сгиб',
      ruleIds: ['R-023'],
    },
  ];
  const creaseLines: PatternLine[] = pockets.map((piece) => ({
    id: `${piece.id}-crease-lip`,
    kind: 'fold',
    x1: piece.x + derived.stitchInset,
    y1: piece.y + derived.safeEdgeDistance,
    x2: piece.x + piece.width - derived.stitchInset,
    y2: piece.y + derived.safeEdgeDistance,
    label: 'крис',
    ruleIds: ['R-016', 'R-019', 'R-021'],
  }));
  const seamLines = createSeamLines(pockets, attachments, derived.stitchInset);
  const lines = [...seamLines, ...bodyFoldLines, ...creaseLines];

  const annotations = createProductionAnnotations(mainBody, pockets, attachments, derived);
  const allMatched = pairs.every((pair) => pair.matched);
  const assembly = buildAssemblyModel(mainBody, pockets, attachments, pairs, derived, allMatched);

  const lastPiece = pieces[pieces.length - 1];
  const bounds = {
    width: Math.max(...pieces.map((piece) => piece.x + piece.width)) - PAGE_MARGIN_MM,
    height: lastPiece.y + lastPiece.height - PAGE_MARGIN_MM,
  };

  const cardFit: CardFit = {
    cardWidthMm: derived.cardWidth,
    cardHeightMm: derived.cardHeight,
    cardClearanceXMm: derived.cardClearanceX,
    cardClearanceYMm: derived.cardClearanceY,
    targetCardRevealMm: derived.targetCardReveal,
    minCardRevealMm: derived.minCardReveal,
    maxCardRevealMm: derived.maxCardReveal,
    pocketWindowWidthMm: derived.pocketWindowWidth,
    pocketWindowDepthMm: derived.pocketWindowDepth,
    realizedRevealMm: derived.realizedReveal,
    realizedSideSlackMm: derived.realizedSideSlack,
  };

  const geometry: PatternGeometry = {
    templateId: state.input.templateId,
    title: 'Кардхолдер на основе правил',
    params: state.input,
    pipeline: {
      moduleId: 'cardholder.v2.card-driven',
      method:
        'Ввод -> Нормализация -> Валидация -> Card-fit расчёт -> Геометрия -> Привязка кармана -> Stitch-pair движок -> Проверка геометрии -> Раскладка -> Производственный вывод',
      normalizedInput: { ...state.input },
      derivedValues: { ...derived },
    },
    page: {
      width: ruleValue('R-002', 'a4WidthMm'),
      height: ruleValue('R-002', 'a4HeightMm'),
      margin: PAGE_MARGIN_MM,
    },
    bounds,
    pieces,
    lines,
    dimensions: [
      {
        id: 'main-width',
        x1: mainBody.x,
        y1: mainBody.y - 6,
        x2: mainBody.x + mainBody.width,
        y2: mainBody.y - 6,
        label: `${Math.round(mainBody.width)} мм`,
        ruleIds: ['R-001', 'R-018', 'R-019', 'R-023'],
      },
      {
        id: 'main-height',
        x1: mainBody.x + mainBody.width + 6,
        y1: mainBody.y,
        x2: mainBody.x + mainBody.width + 6,
        y2: mainBody.y + mainBody.height,
        label: `${Math.round(mainBody.height)} мм`,
        ruleIds: ['R-001', 'R-018', 'R-019'],
      },
      {
        id: 'card-window',
        x1: pockets[0].x + derived.stitchInset,
        y1: pockets[0].y - 6,
        x2: pockets[0].x + derived.stitchInset + derived.pocketWindowWidth,
        y2: pockets[0].y - 6,
        label: `окно карты ${derived.pocketWindowWidth.toFixed(1)} мм`,
        ruleIds: ['R-001', 'R-018', 'R-019'],
      },
      {
        id: 'card-reveal',
        x1: pockets[0].x + pockets[0].width + 6,
        y1: pockets[0].y,
        x2: pockets[0].x + pockets[0].width + 6,
        y2: pockets[0].y + pockets[0].height,
        label: `вылет ${derived.realizedReveal.toFixed(1)} мм`,
        ruleIds: ['R-021'],
      },
      {
        id: 'folded-panel-width',
        x1: mainBody.x,
        y1: mainBody.y + mainBody.height + 13,
        x2: mainBody.x + derived.foldedWidth,
        y2: mainBody.y + mainBody.height + 13,
        label: `готовая ширина ${Math.round(derived.foldedWidth)} мм`,
        ruleIds: ['R-023'],
      },
    ],
    annotations,
    marks,
    cardFit,
    attachments,
    stitchPairs: pairs,
    assemblySteps: createAssemblySteps(state.input),
    assembly,
    ruler: {
      id: 'ruler-100mm',
      kind: 'measure',
      x1: PAGE_MARGIN_MM,
      y1: ruleValue('R-002', 'a4HeightMm') - 18,
      x2: PAGE_MARGIN_MM + ruleValue('R-003', 'controlRulerMm'),
      y2: ruleValue('R-002', 'a4HeightMm') - 18,
      label: 'контрольная линейка 100 мм',
      ruleIds: ['R-003', 'R-004'],
    },
    warnings: [],
    validation: { isValid: true, issues: [] },
    ruleTrace: [],
  };

  const geometryIssues = validateGeometry(geometry, derived);
  const issues = [...state.issues, ...geometryIssues];
  geometry.validation = {
    isValid: issues.every((item) => item.severity !== 'error'),
    issues,
  };
  geometry.warnings = issues.filter((item) => item.severity !== 'info').map((item) => item.message);
  geometry.ruleTrace = uniqueTrace(state.trace);

  return geometry;
}

function validateGeometry(geometry: PatternGeometry, derived: DerivedCardholderValues): PatternValidationIssue[] {
  const issues: PatternValidationIssue[] = [];
  const mainBody = geometry.pieces.find((piece) => piece.id === 'main-body')!;
  const pockets = geometry.pieces.filter((piece) => piece.id.startsWith('card-pocket-'));
  const pieceById = new Map(geometry.pieces.map((piece) => [piece.id, piece]));

  // 1. Card physically fits the pocket window, with controlled (not excessive) slack.
  pockets.forEach((piece) => {
    const usableW = round2(piece.width - derived.stitchInset * 2);
    const usableDepth = round2(piece.height - derived.stitchInset);
    const requiredW = derived.cardWidth + derived.cardClearanceX * 2;
    if (usableW < derived.cardWidth) {
      issues.push(issue(`${piece.id}-card-width`, 'error', `${piece.name}: карта ID-1 не помещается по ширине (окно ${usableW} мм < ${derived.cardWidth} мм).`, ['R-001', 'R-018', 'R-019']));
    }
    const slack = round2(usableW - derived.cardWidth);
    if (slack > derived.cardClearanceX * 2 + 1) {
      issues.push(issue(`${piece.id}-card-slack`, 'error', `${piece.name}: чрезмерный люфт карты ${slack} мм (допуск ${(derived.cardClearanceX * 2).toFixed(1)} мм).`, ['R-018', 'R-019']));
    }
    if (usableDepth < derived.cardHeight - derived.maxCardReveal) {
      issues.push(issue(`${piece.id}-card-depth`, 'error', `${piece.name}: карман слишком мелкий — карта выпадет.`, ['R-021']));
    }
    void requiredW;
  });

  // 2. Card reveal stays inside the allowed grip range (measured from realized geometry).
  if (derived.realizedReveal < derived.minCardReveal) {
    issues.push(issue('card-reveal-min', 'error', `Вылет карты ${derived.realizedReveal} мм меньше минимума ${derived.minCardReveal} мм для захвата.`, ['R-021']));
  }
  if (derived.realizedReveal > derived.maxCardReveal) {
    issues.push(issue('card-reveal-max', 'error', `Вылет карты ${derived.realizedReveal} мм больше максимума ${derived.maxCardReveal} мм — карта плохо удерживается.`, ['R-021']));
  }

  // 3. Every pocket has an explicit attachment, and it stays inside its body panel.
  pockets.forEach((piece) => {
    const attachment = geometry.attachments.find((item) => item.pocketId === piece.id);
    if (!attachment) {
      issues.push(issue(`${piece.id}-no-attachment`, 'error', `${piece.name}: нет сборочной привязки к основе.`, ['R-019']));
      return;
    }
    const panelLeft = attachment.zone === 'left-panel' ? 0 : derived.foldedWidth + derived.foldAllowance;
    const withinX = attachment.offsetX >= panelLeft - 0.01 && attachment.offsetX + piece.width <= panelLeft + derived.foldedWidth + 0.01;
    const withinY = attachment.offsetY >= -0.01 && attachment.offsetY + piece.height <= mainBody.height + 0.01;
    if (!withinX || !withinY) {
      issues.push(issue(`${attachment.id}-out-of-panel`, 'error', `${piece.name}: зона крепления выходит за пределы панели основы.`, ['R-019', 'R-022']));
    }
    // Card, when seated, must not extend above the panel.
    const cardTopOnBody = mainBody.y + attachment.offsetY + piece.height - derived.stitchInset - derived.cardHeight;
    if (cardTopOnBody < mainBody.y - 0.01) {
      issues.push(issue(`${attachment.id}-card-overflow`, 'error', `${piece.name}: карта выступает за верхний край основы.`, ['R-021', 'R-022']));
    }
  });

  // 4. Stitch lines stay inside their piece (rounded-corner aware).
  geometry.lines
    .filter((line) => line.kind === 'stitch')
    .forEach((line) => {
      const owner = geometry.pieces.find((piece) => {
        const a = roundedRectEdgeDistance(line.x1, line.y1, piece);
        const b = roundedRectEdgeDistance(line.x2, line.y2, piece);
        return a >= -0.01 && b >= -0.01;
      });
      if (!owner) {
        issues.push(issue(`${line.id}-outside`, 'error', 'Линия шва выходит за пределы детали.', ['R-019', 'R-020']));
      }
    });

  // 5. Holes inside contour + 6. not overlapping + 7. R-020 safe edge distance (enforced).
  const holes = geometry.marks.filter((mark) => mark.kind === 'stitch-hole');
  holes.forEach((mark) => {
    const piece = pieceById.get(mark.pieceId);
    if (!piece) {
      issues.push(issue(`${mark.id}-no-piece`, 'error', 'Отверстие шва не привязано к детали.', ['R-011']));
      return;
    }
    const edge = roundedRectEdgeDistance(mark.x, mark.y, piece);
    if (edge < -0.01) {
      issues.push(issue(`${mark.id}-outside`, 'error', 'Отверстие шва выходит за контур детали.', ['R-011', 'R-020']));
    } else if (edge < derived.safeEdgeDistance - 0.01) {
      issues.push(
        issue(
          `${mark.id}-edge`,
          'error',
          `Отверстие ближе ${derived.safeEdgeDistance} мм к краю (${round2(edge)} мм) — кожа прорвётся. Увеличьте припуск.`,
          ['R-020'],
        ),
      );
    }
  });

  // Hole overlap / minimum spacing within each pair.
  geometry.stitchPairs.forEach((pair) => {
    const pairHoles = holes
      .filter((mark) => mark.pairId === pair.id && mark.pairRole === 'pocket')
      .sort((a, b) => (a.seamIndex ?? 0) - (b.seamIndex ?? 0));
    for (let i = 1; i < pairHoles.length; i += 1) {
      const d = Math.hypot(pairHoles[i].x - pairHoles[i - 1].x, pairHoles[i].y - pairHoles[i - 1].y);
      if (d < derived.minHoleSpacing - 0.01) {
        issues.push(issue(`${pair.id}-overlap-${i}`, 'error', `Отверстия шва слишком близко (${round2(d)} мм < ${derived.minHoleSpacing} мм).`, ['R-011']));
        break;
      }
    }
  });

  // 8. Stitched pairs match: equal count, equal order, equal relative positions.
  geometry.stitchPairs.forEach((pair) => {
    if (pair.pocketHoleIds.length !== pair.bodyHoleIds.length) {
      issues.push(issue(`${pair.id}-count`, 'error', `Парный шов: число отверстий кармана и основы не совпадает.`, ['R-011', 'R-019']));
      return;
    }
    const attachment = geometry.attachments.find((item) => item.pocketId === pair.pocketId);
    const pocket = pieceById.get(pair.pocketId);
    if (!attachment || !pocket) return;
    const expectedDX = mainBody.x + attachment.offsetX - pocket.x;
    const expectedDY = mainBody.y + attachment.offsetY - pocket.y;
    for (let i = 0; i < pair.pocketHoleIds.length; i += 1) {
      const ph = holes.find((mark) => mark.id === pair.pocketHoleIds[i]);
      const bh = holes.find((mark) => mark.id === pair.bodyHoleIds[i]);
      if (!ph || !bh) {
        issues.push(issue(`${pair.id}-missing-${i}`, 'error', 'Парный шов: отсутствует одно из совмещённых отверстий.', ['R-011']));
        break;
      }
      if (Math.abs(bh.x - ph.x - expectedDX) > 0.05 || Math.abs(bh.y - ph.y - expectedDY) > 0.05) {
        issues.push(issue(`${pair.id}-misaligned-${i}`, 'error', 'Парный шов: отверстия кармана и основы не совпадают по положению.', ['R-011', 'R-019']));
        break;
      }
    }
  });

  // 9. Multi-slot stacked construction is buildable but flagged for master validation.
  if (pockets.length > 2) {
    issues.push(
      issue(
        'multi-slot-needs-validation',
        'warning',
        'Многослотовая укладка (более 2 карманов) рассчитана геометрически, но методику укладки слотов должен подтвердить мастер.',
        ['R-009', 'R-019'],
      ),
    );
  }

  // Control ruler must be exactly 100 mm.
  if (geometry.ruler.x2 - geometry.ruler.x1 !== 100) {
    issues.push(issue('geometry-ruler', 'error', 'Контрольная линейка должна быть ровно 100 мм.', ['R-003']));
  }

  return issues;
}

export function createSimpleWalletPattern(params: WalletPatternParams): PatternGeometry {
  const normalized = normalizeInput(params);
  const state = validateInput(normalized);
  const derived = deriveCardholderValues(state);
  return buildGeometry(state, derived);
}

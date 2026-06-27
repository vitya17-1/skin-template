export type ProductType = 'wallet';

export type WalletTemplateId = 'minimal-wallet' | 'classic-bifold' | 'card-wallet' | 'long-wallet';

export type PatternLineKind = 'cut' | 'fold' | 'stitch' | 'measure';

export type PageFormatId = 'A4' | 'A3' | 'A2' | 'A1' | 'A0';

export type PageFormatSelection = PageFormatId | 'auto';

export type LayoutStrategy = 'piece-per-page' | 'auto-pack';

export type WalletPatternParams = {
  productType: ProductType;
  templateId: WalletTemplateId;
  widthMm: number;
  heightMm: number;
  pocketCount: number;
  seamAllowanceMm: number;
  cornerRadiusMm: number;
  leatherThicknessMm: number;
  printScale: number;
  pageFormat: PageFormatSelection;
};

export type WalletTemplate = {
  id: WalletTemplateId;
  name: string;
  description: string;
  bestFor: string;
  params: WalletPatternParams;
};

export type PatternPoint = {
  x: number;
  y: number;
};

export type PatternPiece = {
  id: string;
  name: string;
  productionName?: string;
  groupKey?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  label: string;
  description: string;
  ruleIds: string[];
};

export type PatternLine = {
  id: string;
  kind: PatternLineKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  ruleIds: string[];
};

export type PatternDimension = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  ruleIds: string[];
};

export type PatternAnnotationKind = 'label' | 'instruction' | 'warning' | 'grain' | 'opening' | 'glue';

export type PatternAnnotation = {
  id: string;
  pieceId?: string;
  kind: PatternAnnotationKind;
  x: number;
  y: number;
  label: string;
  ruleIds: string[];
};

export type PatternMarkKind = 'stitch-hole' | 'notch' | 'registration';

export type PatternMark = {
  id: string;
  pieceId: string;
  kind: PatternMarkKind;
  x: number;
  y: number;
  radius: number;
  label?: string;
  ruleIds: string[];
  /** Stitch-pair linkage: holes that must align between two stitched layers. */
  pairId?: string;
  pairRole?: 'pocket' | 'body';
  seamIndex?: number;
};

/** Resolved card-fit metrics: both the targets and what the built geometry realizes. */
export type CardFit = {
  cardWidthMm: number;
  cardHeightMm: number;
  cardClearanceXMm: number;
  cardClearanceYMm: number;
  targetCardRevealMm: number;
  minCardRevealMm: number;
  maxCardRevealMm: number;
  // Realized values measured from the built pocket geometry:
  pocketWindowWidthMm: number;
  pocketWindowDepthMm: number;
  realizedRevealMm: number;
  realizedSideSlackMm: number;
};

/** Explicit link between a pocket cut piece and the body panel it is sewn onto. */
export type PocketAttachment = {
  id: string;
  pocketId: string;
  targetPieceId: string;
  zone: 'left-panel' | 'right-panel';
  /** Pocket origin offset inside the target piece (target-local coordinates). */
  offsetX: number;
  offsetY: number;
  /** Seam outline (U-shape) projected onto the body, in page coordinates. */
  seamPath: PatternPoint[];
  /** Corner control points for aligning the pocket on the body, in page coordinates. */
  alignmentPoints: { id: string; x: number; y: number }[];
  confidence: KnowledgeConfidence;
  ruleIds: string[];
};

/** A stitched pair: pocket holes and body holes computed from one shared seam path. */
export type StitchPair = {
  id: string;
  pocketId: string;
  targetPieceId: string;
  holeCount: number;
  nominalPitchMm: number;
  actualPitchMm: number;
  pathLengthMm: number;
  startOffsetMm: number;
  endOffsetMm: number;
  pocketHoleIds: string[];
  bodyHoleIds: string[];
  matched: boolean;
  ruleIds: string[];
};

export type AssemblyStep = {
  id: string;
  order: number;
  text: string;
  ruleIds: string[];
};

export type AssemblyPlacement = {
  id: string;
  pieceId: string;
  targetPieceId: string;
  translateX: number;
  translateY: number;
  layer: number;
  label: string;
  ruleIds: string[];
};

export type AssemblySeamSegment = {
  id: string;
  pieceId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  role: 'source' | 'target';
  ruleIds: string[];
};

export type AssemblySeamPair = {
  id: string;
  sourceSegmentId: string;
  targetSegmentId: string;
  toleranceMm: number;
  ruleIds: string[];
};

export type PatternAssembly = {
  status: 'validated' | 'prototype-required';
  placements: AssemblyPlacement[];
  seamSegments: AssemblySeamSegment[];
  seamPairs: AssemblySeamPair[];
};

export type KnowledgeConfidence =
  | 'source-backed'
  | 'engineering-derived'
  | 'needs-master-validation'
  | 'licensed-reference-required'
  | 'prototype-required';

export type AutomationReadiness = 'ready' | 'ready-with-user-supplied-values' | 'warning-only' | 'not-ready' | 'research-only';

export type KnowledgeRule = {
  id: string;
  name: string;
  description: string;
  sourceRefs: string[];
  confidence: KnowledgeConfidence;
  formula: string;
  variables: string[];
  allowedRanges: string[];
  appliesWhen: string[];
  doesNotApplyWhen: string[];
  automationReadiness: AutomationReadiness;
  knowledgeDocument: string;
  implementation?: Record<string, number | string | boolean>;
};

export type AppliedKnowledgeRule = {
  ruleId: string;
  confidence: KnowledgeConfidence;
  automationReadiness: AutomationReadiness;
  sourceRefs: string[];
  note: string;
};

export type PatternValidationSeverity = 'error' | 'warning' | 'info';

export type PatternValidationIssue = {
  id: string;
  severity: PatternValidationSeverity;
  message: string;
  ruleIds: string[];
};

export type PatternGeometry = {
  templateId: string;
  title: string;
  params: WalletPatternParams;
  pipeline: {
    moduleId: string;
    method: string;
    normalizedInput: Record<string, number | string | boolean>;
    derivedValues: Record<string, number | string | boolean>;
  };
  page: {
    width: number;
    height: number;
    margin: number;
  };
  bounds: {
    width: number;
    height: number;
  };
  pieces: PatternPiece[];
  lines: PatternLine[];
  dimensions: PatternDimension[];
  annotations: PatternAnnotation[];
  marks: PatternMark[];
  cardFit: CardFit;
  attachments: PocketAttachment[];
  stitchPairs: StitchPair[];
  assemblySteps: AssemblyStep[];
  assembly: PatternAssembly;
  ruler: PatternLine;
  warnings: string[];
  validation: {
    isValid: boolean;
    issues: PatternValidationIssue[];
  };
  ruleTrace: AppliedKnowledgeRule[];
};

export type LayoutPiecePlacement = {
  kind: 'piece';
  pieceId: string;
  pieceIds?: string[];
  quantity?: number;
  productionName?: string;
  sourceX: number;
  sourceY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutTilePlacement = {
  kind: 'tile';
  pieceId: string;
  sourceX: number;
  sourceY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tileColumn: number;
  tileRow: number;
  tileColumns: number;
  tileRows: number;
};

export type LayoutPlacement = LayoutPiecePlacement | LayoutTilePlacement;

export type LayoutPage = {
  pageNumber: number;
  totalPages: number;
  format: PageFormatId;
  width: number;
  height: number;
  margin: number;
  title: string;
  placements: LayoutPlacement[];
  ruler: PatternLine;
};

export type LayoutPlan = {
  format: PageFormatId;
  strategy: LayoutStrategy;
  autoSelected: boolean;
  width: number;
  height: number;
  pages: LayoutPage[];
  validation: {
    isValid: boolean;
    issues: PatternValidationIssue[];
  };
};

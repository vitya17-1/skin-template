import { simpleWalletDefaults } from '../src/data/templates/walletTemplates';
import { createSimpleWalletPattern } from '../src/lib/patterns/wallet';

const geometry = createSimpleWalletPattern(simpleWalletDefaults);
const main = geometry.pieces.find((piece) => piece.id === 'main-body');

if (!main) {
  throw new Error('Main body piece is missing');
}

const expectedFoldAllowance = Math.max(6, Math.round(simpleWalletDefaults.leatherThicknessMm * 4 * 10) / 10);
const expectedMainWidth = simpleWalletDefaults.widthMm * 2 + expectedFoldAllowance;
const expectedMainHeight = simpleWalletDefaults.heightMm;
const rulerLength = geometry.ruler.x2 - geometry.ruler.x1;
const pocketPieces = geometry.pieces.filter((piece) => piece.id.startsWith('card-pocket-'));
const stitchLines = geometry.lines.filter((line) => line.kind === 'stitch');
const stitchHoles = geometry.marks.filter((mark) => mark.kind === 'stitch-hole');
const openingAnnotations = geometry.annotations.filter((annotation) => annotation.kind === 'opening');
const grainAnnotations = geometry.annotations.filter((annotation) => annotation.kind === 'grain');
const appliedRuleIds = geometry.ruleTrace.map((rule) => rule.ruleId);
const firstPocket = pocketPieces[0];
const usablePocketWidth = firstPocket.width - simpleWalletDefaults.seamAllowanceMm * 2;

if (main.width !== expectedMainWidth) {
  throw new Error(`Expected main width ${expectedMainWidth} mm, got ${main.width} mm`);
}

if (main.height !== expectedMainHeight) {
  throw new Error(`Expected main height ${expectedMainHeight} mm, got ${main.height} mm`);
}

if (rulerLength !== 100) {
  throw new Error(`Expected control ruler 100 mm, got ${rulerLength} mm`);
}

if (pocketPieces.length !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected ${simpleWalletDefaults.pocketCount} pocket pieces, got ${pocketPieces.length}`);
}

if (stitchLines.length < pocketPieces.length * 3) {
  throw new Error(`Expected at least ${pocketPieces.length * 3} stitch lines, got ${stitchLines.length}`);
}

if (stitchHoles.length === 0) {
  throw new Error('Expected production geometry to include stitch holes');
}

if (openingAnnotations.length !== pocketPieces.length) {
  throw new Error(`Expected ${pocketPieces.length} card opening annotations, got ${openingAnnotations.length}`);
}

if (grainAnnotations.length < 1) {
  throw new Error('Expected production geometry to include grain direction');
}

if (geometry.assemblySteps.length < 4) {
  throw new Error(`Expected at least 4 assembly steps, got ${geometry.assemblySteps.length}`);
}

if (geometry.assembly.status !== 'validated') {
  throw new Error(`Expected two-pocket assembly map to be validated, got ${geometry.assembly.status}`);
}

if (geometry.assembly.placements.length !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected one assembly placement per pocket, got ${geometry.assembly.placements.length}`);
}

if (geometry.assembly.seamPairs.length !== simpleWalletDefaults.pocketCount * 3) {
  throw new Error(`Expected three paired seam segments per pocket, got ${geometry.assembly.seamPairs.length}`);
}

geometry.assembly.seamPairs.forEach((pair) => {
  const source = geometry.assembly.seamSegments.find((segment) => segment.id === pair.sourceSegmentId);
  const target = geometry.assembly.seamSegments.find((segment) => segment.id === pair.targetSegmentId);
  if (!source || !target) throw new Error(`Missing seam segment for pair ${pair.id}`);
  const sourceLength = Math.hypot(source.x2 - source.x1, source.y2 - source.y1);
  const targetLength = Math.hypot(target.x2 - target.x1, target.y2 - target.y1);
  if (Math.abs(sourceLength - targetLength) > pair.toleranceMm) {
    throw new Error(`Assembly seam pair ${pair.id} exceeds tolerance`);
  }
});

if (geometry.page.width !== 297 || geometry.page.height !== 210) {
  throw new Error(`Expected A4 landscape page 297x210 mm, got ${geometry.page.width}x${geometry.page.height}`);
}

if (!firstPocket || usablePocketWidth < 85.6 + 3) {
  throw new Error(`Expected first pocket usable width to fit ID-1 card with clearance, got ${usablePocketWidth} mm`);
}

const foldLines = geometry.lines.filter((line) => line.kind === 'fold' && line.id.startsWith('main-body-'));
if (foldLines.length !== 2) {
  throw new Error(`Expected unfolded bifold body to include 2 center fold lines, got ${foldLines.length}`);
}

for (const ruleId of ['R-001', 'R-002', 'R-003', 'R-004', 'R-018', 'R-019', 'R-020', 'R-022', 'R-023']) {
  if (!appliedRuleIds.includes(ruleId)) {
    throw new Error(`Expected geometry rule trace to include ${ruleId}`);
  }
}

if (!geometry.validation.isValid) {
  throw new Error(`Expected valid geometry, got issues: ${geometry.validation.issues.map((issue) => issue.message).join('; ')}`);
}

// --- Production Validity Fix: card fit ---
const cardFit = geometry.cardFit;
const maxAllowedSlack = cardFit.cardClearanceXMm * 2 + 1;
if (cardFit.realizedSideSlackMm > maxAllowedSlack) {
  throw new Error(`Card side slack ${cardFit.realizedSideSlackMm} mm exceeds allowed ${maxAllowedSlack} mm`);
}
if (cardFit.realizedRevealMm < cardFit.minCardRevealMm) {
  throw new Error(`Card reveal ${cardFit.realizedRevealMm} mm below minimum ${cardFit.minCardRevealMm} mm`);
}
if (cardFit.realizedRevealMm > cardFit.maxCardRevealMm) {
  throw new Error(`Card reveal ${cardFit.realizedRevealMm} mm above maximum ${cardFit.maxCardRevealMm} mm`);
}

// --- Attachment metadata: every pocket is bound to the body with 4 control points ---
if (geometry.attachments.length !== pocketPieces.length) {
  throw new Error(`Expected one attachment per pocket, got ${geometry.attachments.length}`);
}
geometry.attachments.forEach((attachment) => {
  if (attachment.targetPieceId !== 'main-body') {
    throw new Error(`Attachment ${attachment.id} is not bound to main-body`);
  }
  if (attachment.alignmentPoints.length !== 4) {
    throw new Error(`Attachment ${attachment.id} must expose 4 alignment control points`);
  }
});

// --- Stitched pairs: equal counts + logical alignment between pocket and body holes ---
if (geometry.stitchPairs.length !== pocketPieces.length) {
  throw new Error(`Expected one stitch pair per pocket, got ${geometry.stitchPairs.length}`);
}
geometry.stitchPairs.forEach((pair) => {
  if (pair.pocketHoleIds.length !== pair.bodyHoleIds.length) {
    throw new Error(`Stitch pair ${pair.id} pocket/body hole counts differ`);
  }
  if (!pair.matched) {
    throw new Error(`Stitch pair ${pair.id} is not matched`);
  }
  const pocket = geometry.pieces.find((piece) => piece.id === pair.pocketId)!;
  const attachment = geometry.attachments.find((item) => item.pocketId === pair.pocketId)!;
  const dx = main.x + attachment.offsetX - pocket.x;
  const dy = main.y + attachment.offsetY - pocket.y;
  for (let i = 0; i < pair.pocketHoleIds.length; i += 1) {
    const pocketHole = geometry.marks.find((mark) => mark.id === pair.pocketHoleIds[i])!;
    const bodyHole = geometry.marks.find((mark) => mark.id === pair.bodyHoleIds[i])!;
    if (Math.abs(bodyHole.x - pocketHole.x - dx) > 0.05 || Math.abs(bodyHole.y - pocketHole.y - dy) > 0.05) {
      throw new Error(`Stitch pair ${pair.id} hole ${i} does not align between pocket and body`);
    }
  }
});

// --- R-020 enforced as an ERROR when holes fall within the safe edge distance ---
const tooClose = createSimpleWalletPattern({ ...simpleWalletDefaults, seamAllowanceMm: 2 });
const r020Errors = tooClose.validation.issues.filter(
  (item) => item.severity === 'error' && item.ruleIds.includes('R-020'),
);
if (tooClose.validation.isValid || r020Errors.length === 0) {
  throw new Error('Expected R-020 to be enforced as an error when holes sit within 2 mm of the cut edge');
}

// --- Invalid print scale must invalidate the geometry ---
const badScale = createSimpleWalletPattern({ ...simpleWalletDefaults, printScale: 90 });
if (badScale.validation.isValid) {
  throw new Error('Expected wrong print scale to invalidate geometry');
}

console.log('Geometry verification passed');
console.log(`Card reveal: ${cardFit.realizedRevealMm} mm (target ${cardFit.targetCardRevealMm}, range ${cardFit.minCardRevealMm}-${cardFit.maxCardRevealMm})`);
console.log(`Card side slack: ${cardFit.realizedSideSlackMm} mm`);
console.log(`Attachments: ${geometry.attachments.length}, stitch pairs: ${geometry.stitchPairs.length}`);
console.log(`R-020 enforcement errors at seam 2 mm: ${r020Errors.length}`);
console.log(`Main body: ${main.width} x ${main.height} mm`);
console.log(`Folded width: ${simpleWalletDefaults.widthMm} mm`);
console.log(`Fold allowance: ${expectedFoldAllowance} mm`);
console.log(`Control ruler: ${rulerLength} mm`);
console.log(`Pocket pieces: ${pocketPieces.length}`);
console.log(`Stitch lines: ${stitchLines.length}`);
console.log(`Stitch holes: ${stitchHoles.length}`);
console.log(`Annotations: ${geometry.annotations.length}`);
console.log(`Assembly steps: ${geometry.assemblySteps.length}`);
console.log(`Assembly seam pairs: ${geometry.assembly.seamPairs.length}`);
console.log(`Knowledge rules: ${appliedRuleIds.join(', ')}`);

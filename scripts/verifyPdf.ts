import { simpleWalletDefaults, walletTemplates } from '../src/data/templates/walletTemplates';
import { createLayoutPlan } from '../src/lib/layout/pageLayout';
import { createSimpleWalletPattern } from '../src/lib/patterns/wallet';
import { buildWalletPdfManifest, generateWalletPdf } from '../src/lib/pdf/generateWalletPdf';

const geometry = createSimpleWalletPattern(simpleWalletDefaults);
const modifiedGeometry = createSimpleWalletPattern({
  ...simpleWalletDefaults,
  widthMm: simpleWalletDefaults.widthMm - 12,
  pocketCount: simpleWalletDefaults.pocketCount + 1,
});
const cardWalletParams = walletTemplates.find((template) => template.id === 'card-wallet')?.params;
if (!cardWalletParams) {
  throw new Error('Expected card-wallet template to exist');
}
const cardWalletGeometry = createSimpleWalletPattern(cardWalletParams);
const cardWalletLayout = createLayoutPlan(cardWalletGeometry);
const generatedAt = new Date('2026-06-26T10:00:00.000Z');
const cardWalletManifest = buildWalletPdfManifest(cardWalletGeometry, { generatedAt });
const { readFileSync } = await Function('return import("node:fs")')();
const fontBase64 = readFileSync('public/fonts/ArialUnicode.ttf').toString('base64');
const doc = generateWalletPdf(geometry, { generatedAt, fontBase64 });
const modifiedDoc = generateWalletPdf(modifiedGeometry, { generatedAt, fontBase64 });
const manifest = buildWalletPdfManifest(geometry, { generatedAt });
const modifiedManifest = buildWalletPdfManifest(modifiedGeometry, { generatedAt });
const productionLayout = createLayoutPlan(geometry);
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const pageCount = doc.getNumberOfPages();
const bytes = new Uint8Array(doc.output('arraybuffer'));
const modifiedBytes = new Uint8Array(modifiedDoc.output('arraybuffer'));
const header = new TextDecoder().decode(bytes.slice(0, 5));
const almostEqual = (left: number, right: number) => Math.abs(left - right) < 0.01;
const mainBody = geometry.pieces.find((piece) => piece.id === 'main-body');
const expectedFoldAllowance = Math.max(6, Math.round(simpleWalletDefaults.leatherThicknessMm * 4 * 10) / 10);
const expectedMainWidth = simpleWalletDefaults.widthMm * 2 + expectedFoldAllowance;
const expectedMainHeight = simpleWalletDefaults.heightMm;
const openingAnnotations = geometry.annotations.filter((annotation) => annotation.kind === 'opening');
const grainAnnotations = geometry.annotations.filter((annotation) => annotation.kind === 'grain');
const stitchHoles = geometry.marks.filter((mark) => mark.kind === 'stitch-hole');
const expectedProductionSheets = 2;
const expectedPdfPages = expectedProductionSheets + 1;

if (!almostEqual(pageWidth, 297) || !almostEqual(pageHeight, 210)) {
  throw new Error(`Expected A4 landscape 297x210 mm, got ${pageWidth}x${pageHeight}`);
}

if (pageCount !== expectedPdfPages) {
  throw new Error(`Expected cover page + one production page per unique detail (${expectedPdfPages}), got ${pageCount}`);
}

if (manifest.page.pageCount !== pageCount) {
  throw new Error(`Expected manifest page count ${pageCount}, got ${manifest.page.pageCount}`);
}

if (productionLayout.strategy !== 'piece-per-page') {
  throw new Error(`Expected production layout strategy piece-per-page, got ${productionLayout.strategy}`);
}

if (manifest.page.productionSheetCount !== expectedProductionSheets) {
  throw new Error('Expected production layout to create one page per unique production detail');
}

const pocketPlacement = productionLayout.pages.flatMap((page) => page.placements).find((placement) => placement.pieceId.startsWith('card-pocket-'));
const pocketQuantity = pocketPlacement?.kind === 'piece' ? pocketPlacement.quantity : undefined;
if (pocketQuantity !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected grouped pocket placement quantity ${simpleWalletDefaults.pocketCount}, got ${pocketQuantity}`);
}

if (header !== '%PDF-') {
  throw new Error(`Expected PDF header, got ${header}`);
}

if (geometry.ruler.x2 - geometry.ruler.x1 !== 100) {
  throw new Error('Expected 100 mm control ruler in source geometry');
}

if (!mainBody || mainBody.width !== expectedMainWidth || mainBody.height !== expectedMainHeight) {
  throw new Error(`Expected main body ${expectedMainWidth}x${expectedMainHeight} mm, got ${mainBody?.width}x${mainBody?.height}`);
}

if (manifest.page.width !== geometry.page.width || manifest.page.height !== geometry.page.height) {
  throw new Error('PDF manifest page does not match source geometry page');
}

if (manifest.rulerLengthMm !== 100) {
  throw new Error(`Expected manifest ruler 100 mm, got ${manifest.rulerLengthMm}`);
}

if (manifest.mainBody.width !== mainBody.width || manifest.mainBody.height !== mainBody.height) {
  throw new Error('PDF manifest main body does not match source geometry');
}

if (manifest.pocketCount !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected manifest pocket count ${simpleWalletDefaults.pocketCount}, got ${manifest.pocketCount}`);
}

if (manifest.foldLineCount !== simpleWalletDefaults.pocketCount + 2) {
  throw new Error(`Expected pocket crease lines plus 2 body fold lines in manifest, got ${manifest.foldLineCount}`);
}

if (!manifest.sourceSummary.includes(`ширина ${simpleWalletDefaults.widthMm} мм`)) {
  throw new Error('PDF manifest source summary is missing width parameter');
}

if (bytes.length < 4000) {
  throw new Error(`Expected non-empty PDF over 4000 bytes, got ${bytes.length}`);
}

if (openingAnnotations.length !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected PDF source geometry to include ${simpleWalletDefaults.pocketCount} card opening annotations`);
}

if (grainAnnotations.length < 1) {
  throw new Error('Expected PDF source geometry to include grain direction');
}

if (stitchHoles.length === 0) {
  throw new Error('Expected PDF source geometry to include stitch holes');
}

if (geometry.assemblySteps.length < 4) {
  throw new Error('Expected PDF source geometry to include assembly steps');
}

for (const ruleId of ['R-001', 'R-002', 'R-003', 'R-004', 'R-018', 'R-019', 'R-020', 'R-022', 'R-023']) {
  if (!manifest.appliedRules.some((rule) => rule.ruleId === ruleId)) {
    throw new Error(`Expected PDF manifest applied rules to include ${ruleId}`);
  }
}

if (!manifest.appliedRules.some((rule) => rule.confidence === 'source-backed')) {
  throw new Error('Expected PDF manifest to include source-backed rules');
}

if (!manifest.appliedRules.some((rule) => rule.confidence === 'engineering-derived')) {
  throw new Error('Expected PDF manifest to include engineering-derived rules');
}

if (!manifest.validation.isValid) {
  throw new Error('Expected PDF manifest validation to pass');
}

// --- Manifest must carry stitch-pair + attachment metadata for production ---
if (manifest.stitchPairs.count !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected ${simpleWalletDefaults.pocketCount} stitch pairs in manifest, got ${manifest.stitchPairs.count}`);
}
if (!manifest.stitchPairs.allMatched) {
  throw new Error('Expected all stitch pairs to be matched in manifest');
}
if (manifest.stitchPairs.totalHoles <= 0) {
  throw new Error('Expected manifest stitch pairs to report paired holes');
}
if (manifest.attachments.count !== simpleWalletDefaults.pocketCount) {
  throw new Error(`Expected one attachment per pocket in manifest, got ${manifest.attachments.count}`);
}

// --- Manifest must prove a real card fit (not a loose / shallow pocket) ---
if (manifest.cardFit.realizedRevealMm < 12 || manifest.cardFit.realizedRevealMm > 18) {
  throw new Error(`Expected manifest card reveal within 12-18 mm, got ${manifest.cardFit.realizedRevealMm}`);
}
if (manifest.cardFit.sideSlackMm > 4) {
  throw new Error(`Expected manifest card side slack to stay tight, got ${manifest.cardFit.sideSlackMm} mm`);
}

// --- A geometry that violates R-020 must NOT produce a valid manifest ---
const looseGeometry = createSimpleWalletPattern({ ...simpleWalletDefaults, seamAllowanceMm: 2 });
const looseManifest = buildWalletPdfManifest(looseGeometry, { generatedAt });
if (looseManifest.validation.isValid) {
  throw new Error('Expected manifest validation to fail when stitch holes violate R-020');
}

const tiledGeometry = {
  ...geometry,
  pieces: [
    {
      ...mainBody!,
      id: 'oversized-test-piece',
      name: 'Oversized test piece',
      width: 640,
      height: 360,
    },
  ],
  lines: [],
};
const tiledLayout = createLayoutPlan(tiledGeometry, { format: 'A4' });
const tilePages = tiledLayout.pages.flatMap((page) => page.placements).filter((placement) => placement.kind === 'tile');

if (tiledLayout.pages.length <= 1) {
  throw new Error(`Expected oversized piece to be tiled across pages, got ${tiledLayout.pages.length} page`);
}

if (tilePages.length !== tiledLayout.pages.length) {
  throw new Error('Expected every oversized layout page to contain a tile placement');
}

if (!tiledLayout.pages.every((page) => page.ruler.x2 - page.ruler.x1 === 100)) {
  throw new Error('Expected every layout page to include a 100 mm control ruler');
}

if (modifiedManifest.mainBody.width === manifest.mainBody.width) {
  throw new Error('Expected changed width parameter to change PDF geometry manifest');
}

if (modifiedBytes.length === bytes.length) {
  throw new Error('Expected changed parameters to change generated PDF bytes');
}

const cardWalletMain = cardWalletGeometry.pieces.find((piece) => piece.id === 'main-body');
const expectedCardFoldAllowance = Math.max(6, Math.round(cardWalletParams.leatherThicknessMm * 4 * 10) / 10);
const expectedCardMainWidth = cardWalletParams.widthMm * 2 + expectedCardFoldAllowance;
const cardWalletPocketPlacement = cardWalletLayout.pages
  .flatMap((page) => page.placements)
  .find((placement) => placement.kind === 'piece' && placement.pieceId.startsWith('card-pocket-'));

// Body height auto-grows to host stacked card slots; it must never be SHORTER than requested.
if (!cardWalletMain || cardWalletMain.width !== expectedCardMainWidth || cardWalletMain.height < cardWalletParams.heightMm) {
  throw new Error(
    `Expected card-wallet unfolded body ${expectedCardMainWidth} mm wide and at least ${cardWalletParams.heightMm} mm tall, got ${cardWalletMain?.width}x${cardWalletMain?.height}`,
  );
}

if (!cardWalletGeometry.validation.isValid) {
  throw new Error(
    `Expected card-wallet geometry to be valid, got: ${cardWalletGeometry.validation.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.message)
      .join('; ')}`,
  );
}

if (cardWalletGeometry.lines.filter((line) => line.kind === 'fold' && line.id.startsWith('main-body-')).length !== 2) {
  throw new Error('Expected card-wallet production body to include two center fold lines');
}

if (cardWalletPocketPlacement?.kind !== 'piece' || cardWalletPocketPlacement.quantity !== cardWalletParams.pocketCount) {
  throw new Error(`Expected card-wallet pocket sheet quantity ${cardWalletParams.pocketCount}, got ${cardWalletPocketPlacement?.kind === 'piece' ? cardWalletPocketPlacement.quantity : 'none'}`);
}

if (cardWalletManifest.templateId !== 'card-wallet') {
  throw new Error(`Expected selected template card-wallet to reach PDF manifest, got ${cardWalletManifest.templateId}`);
}

console.log('PDF verification passed');
console.log(`PDF page: ${pageWidth} x ${pageHeight} mm`);
console.log(`Pages: ${pageCount}`);
console.log(`Layout: ${manifest.page.format}, ${manifest.page.pageCount} page(s), cover + one unique detail per page`);
console.log(`Bytes: ${bytes.length}`);
console.log(`Template: ${manifest.templateName} (${manifest.templateId})`);
console.log(`Main body: ${manifest.mainBody.width} x ${manifest.mainBody.height} mm`);
console.log(`Folded width: ${simpleWalletDefaults.widthMm} mm`);
console.log(`Fold allowance: ${expectedFoldAllowance} mm`);
console.log(`Control ruler: ${manifest.rulerLengthMm} mm`);
console.log(`Production annotations: ${geometry.annotations.length}`);
console.log(`Stitch holes: ${stitchHoles.length}`);
console.log(`Assembly steps: ${geometry.assemblySteps.length}`);
console.log(`Knowledge rules: ${manifest.appliedRules.map((rule) => `${rule.ruleId}:${rule.confidence}`).join(', ')}`);
console.log(`Tiled oversized piece pages: ${tiledLayout.pages.length}`);
console.log(`Modified main body: ${modifiedManifest.mainBody.width} x ${modifiedManifest.mainBody.height} mm`);
console.log(`Card wallet body: ${cardWalletMain.width} x ${cardWalletMain.height} mm`);
console.log(`Card wallet sheets: ${cardWalletLayout.pages.map((page) => page.title).join(' / ')}`);

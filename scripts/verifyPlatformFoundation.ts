import { productModuleRegistry } from '../src/lib/patterns/moduleRegistry';
import { assessBeltReadiness } from '../src/lib/patterns/belt/readiness';
import { createBeltPrototypeGeometry } from '../src/lib/patterns/belt/geometry';
import { assessShoeReadiness } from '../src/lib/patterns/shoe/readiness';

const ids = productModuleRegistry.map((module) => module.id);
for (const required of ['cardholder', 'belt', 'shoe']) {
  if (!ids.includes(required as (typeof ids)[number])) {
    throw new Error(`Missing product module descriptor: ${required}`);
  }
}

if (productModuleRegistry.some((module) => module.readiness === 'production-ready')) {
  throw new Error('No module may be production-ready before physical prototype and master approval');
}

const beltInput = {
  wearableCircumferenceMm: 900,
  strapWidthMm: 35,
  leatherThicknessMm: 3.5,
  buckleInsideWidthMm: 35,
  buckleBarToTongueMm: 28,
  buckleFoldAllowanceMm: 80,
  tailLengthMm: 180,
  holeCount: 5,
  holePitchMm: 25,
  tongueHoleDiameterMm: 5,
  keeperInsideLengthMm: 78,
  keeperOverlapMm: 10,
};
const belt = assessBeltReadiness(beltInput);
const beltGeometry = createBeltPrototypeGeometry(beltInput);

if (!beltGeometry.validation.isValid) {
  throw new Error(`Expected nominal belt prototype geometry to be valid: ${beltGeometry.validation.issues.map((item) => item.message).join('; ')}`);
}

if (beltGeometry.adjustmentHoles[Math.floor(beltInput.holeCount / 2)]?.x !== beltGeometry.strap.centerHoleX) {
  throw new Error('Expected belt center adjustment hole to equal requested wearable circumference position');
}

if (belt.canGenerateProductionPattern || belt.canClaimProfessionalUse) {
  throw new Error('Belt must remain blocked without hardware sample, physical prototype and master approval');
}

for (const id of ['belt-hardware-sample', 'belt-prototype', 'belt-master-approval']) {
  if (!belt.issues.some((item) => item.id === id)) throw new Error(`Missing belt readiness issue: ${id}`);
}

const shoe = assessShoeReadiness({
  model: 'derby-low',
  construction: 'cemented',
  sizeSystem: 'eu',
  markedSize: 42,
  upperLeatherThicknessMm: 1.4,
  liningThicknessMm: 0.8,
  stitchInsetMm: 3,
  lastingAllowanceMm: 15,
  eyeletCount: 5,
  methodRevision: 'shoe-spec-v1',
  last: {
    id: 'missing-last-test',
    source: 'physical-measurements',
    measurements: {},
    axisConfirmed: false,
    landmarksConfirmed: false,
  },
});

if (shoe.canGeneratePreview || shoe.canGenerateProductionPattern || shoe.canClaimProfessionalUse) {
  throw new Error('Shoe module must remain blocked without a complete digital last and acceptance evidence');
}

for (const id of ['shoe-last-mesh-required', 'shoe-last-measurements-incomplete', 'shoe-last-reference-system', 'shoe-prototype-required', 'shoe-master-approval-required']) {
  if (!shoe.issues.some((item) => item.id === id)) throw new Error(`Missing shoe readiness issue: ${id}`);
}

const inspectedShoe = assessShoeReadiness({
  model: 'derby-low',
  construction: 'cemented',
  sizeSystem: 'eu',
  markedSize: 42,
  upperLeatherThicknessMm: 1.4,
  liningThicknessMm: 0.8,
  stitchInsetMm: 3,
  lastingAllowanceMm: 15,
  eyeletCount: 5,
  methodRevision: 'shoe-spec-v1',
  last: {
    id: 'inspected-last-test',
    source: '3d-scan',
    mesh: { fileName: 'last-42-right.stl', format: 'stl', unit: 'mm' },
    meshInspection: {
      vertexCount: 50_000,
      triangleCount: 99_996,
      boundsMm: { x: 276, y: 96, z: 88 },
      isClosed: true,
      isManifold: true,
      normalsValid: true,
    },
    measurements: {
      lengthMm: 276,
      ballWidthMm: 96,
      ballGirthMm: 248,
      instepGirthMm: 252,
      heelGirthMm: 342,
      heelHeightMm: 24,
    },
    axisConfirmed: true,
    landmarksConfirmed: true,
  },
});

if (!inspectedShoe.canGeneratePreview) {
  throw new Error(`Expected inspected digital last to allow research preview: ${inspectedShoe.issues.map((item) => item.message).join('; ')}`);
}

if (inspectedShoe.canGenerateProductionPattern || inspectedShoe.canClaimProfessionalUse) {
  throw new Error('Inspected last must not bypass flattening, prototype and master approval gates');
}

console.log('Platform foundation verification passed');
console.log(`Modules: ${productModuleRegistry.map((module) => `${module.id}:${module.readiness}`).join(', ')}`);
console.log(`Belt blockers: ${belt.issues.length}`);
console.log(`Shoe blockers: ${shoe.issues.length}`);

import type { BeltGeometry, BeltPatternInput } from '../../../types/belt';

export function createBeltPrototypeGeometry(input: BeltPatternInput): BeltGeometry {
  const foldLineX = input.buckleFoldAllowanceMm;
  const centerHoleX = foldLineX + input.wearableCircumferenceMm;
  const strapLength = centerHoleX + input.tailLengthMm;
  const tongueSlotCenterX = Math.max(0, foldLineX - input.buckleBarToTongueMm);
  const centerIndex = Math.floor(input.holeCount / 2);
  const adjustmentHoles = Array.from({ length: Math.max(0, input.holeCount) }, (_, index) => ({
    x: centerHoleX + (index - centerIndex) * input.holePitchMm,
    y: input.strapWidthMm / 2,
  }));
  const issues: BeltGeometry['validation']['issues'] = [];

  if (input.strapWidthMm > input.buckleInsideWidthMm) {
    issues.push({ id: 'belt-strap-buckle-fit', message: 'Полоса шире внутреннего размера пряжки.', ruleIds: ['BL-002'] });
  }
  if (input.holeCount < 1 || input.holeCount % 2 === 0) {
    issues.push({ id: 'belt-hole-count', message: 'Регулировочные отверстия должны иметь центральное отверстие.', ruleIds: ['BL-003'] });
  }
  if (adjustmentHoles.some((hole) => hole.x <= foldLineX || hole.x >= strapLength)) {
    issues.push({ id: 'belt-hole-bounds', message: 'Одно или несколько отверстий выходят за рабочую часть ремня.', ruleIds: ['BL-003'] });
  }
  if (tongueSlotCenterX <= 0 || tongueSlotCenterX >= foldLineX) {
    issues.push({ id: 'belt-tongue-slot', message: 'Прорезь язычка не помещается в зоне крепления пряжки.', ruleIds: ['BL-004'] });
  }

  return {
    unit: 'mm',
    status: 'prototype-required',
    strap: {
      lengthMm: strapLength,
      widthMm: input.strapWidthMm,
      centerHoleX,
      foldLineX,
      tongueSlotCenterX,
    },
    adjustmentHoles,
    keeper: {
      cutLengthMm: input.keeperInsideLengthMm + input.keeperOverlapMm,
      widthMm: input.strapWidthMm,
    },
    validation: {
      isValid: issues.length === 0,
      issues,
    },
  };
}

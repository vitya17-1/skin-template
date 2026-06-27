import type { EngineeringIssue } from '../../../types/platform';
import type { ShoeLastInput } from '../../../types/shoe';

export type ShoeMeshValidationOptions = {
  lengthToleranceMm?: number;
};

export function validateShoeLastMesh(last: ShoeLastInput, options: ShoeMeshValidationOptions = {}): EngineeringIssue[] {
  const tolerance = options.lengthToleranceMm ?? 2;
  const issues: EngineeringIssue[] = [];

  if (!last.mesh || !last.meshInspection) {
    return [
      {
        id: 'shoe-mesh-inspection-required',
        severity: 'error',
        message: 'Не выполнена техническая проверка цифровой поверхности колодки.',
        ruleIds: ['SH-001', 'SH-003', 'SH-009'],
      },
    ];
  }

  const inspection = last.meshInspection;
  if (inspection.vertexCount < 4 || inspection.triangleCount < 4) {
    issues.push({ id: 'shoe-mesh-empty', severity: 'error', message: 'Mesh не содержит достаточной геометрии.', ruleIds: ['SH-001'] });
  }
  if (!inspection.isClosed || !inspection.isManifold) {
    issues.push({
      id: 'shoe-mesh-topology',
      severity: 'error',
      message: 'Поверхность колодки должна быть замкнутой и manifold перед построением сечений.',
      ruleIds: ['SH-003', 'SH-004'],
    });
  }
  if (!inspection.normalsValid) {
    issues.push({ id: 'shoe-mesh-normals', severity: 'error', message: 'Нормали поверхности колодки повреждены или ориентированы непоследовательно.', ruleIds: ['SH-003'] });
  }

  const measuredLength = last.measurements.lengthMm;
  const meshLength = Math.max(inspection.boundsMm.x, inspection.boundsMm.y, inspection.boundsMm.z);
  if (typeof measuredLength === 'number' && Math.abs(meshLength - measuredLength) > tolerance) {
    issues.push({
      id: 'shoe-mesh-scale',
      severity: 'error',
      message: `Длина mesh ${meshLength.toFixed(1)} мм отличается от измеренной длины ${measuredLength.toFixed(1)} мм больше чем на ${tolerance.toFixed(1)} мм.`,
      ruleIds: ['SH-009'],
    });
  }

  return issues;
}

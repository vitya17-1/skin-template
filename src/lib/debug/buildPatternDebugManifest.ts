import { cardholderKnowledgeContract } from '../../data/knowledge/cardholderContract';
import { cardholderRules } from '../../data/knowledge/cardholderRules';
import { createLayoutPlan, type LayoutOptions } from '../layout/pageLayout';
import type { PatternGeometry } from '../../types/pattern';

type DebugManifestOptions = {
  generatedAt?: Date;
  layout?: LayoutOptions;
};

function rulesUsedBy(ruleIds: string[]) {
  return ruleIds.map((ruleId) => {
    const rule = cardholderRules.find((item) => item.id === ruleId);
    return {
      ruleId,
      confidence: rule?.confidence ?? 'unknown',
      automationReadiness: rule?.automationReadiness ?? 'unknown',
      sourceRefs: rule?.sourceRefs ?? [],
      formula: rule?.formula ?? '',
    };
  });
}

function traceableElement<T extends { id: string; ruleIds: string[] }>(element: T) {
  return {
    ...element,
    ruleTrace: rulesUsedBy(element.ruleIds),
  };
}

export function buildPatternDebugManifest(geometry: PatternGeometry, options: DebugManifestOptions = {}) {
  const layout = createLayoutPlan(geometry, options.layout ?? { format: geometry.params.pageFormat });
  const generatedAt = options.generatedAt ?? new Date();

  return {
    manifestVersion: 'pattern-debug-manifest.v1',
    generatedAt: generatedAt.toISOString(),
    contract: cardholderKnowledgeContract,
    pipeline: geometry.pipeline,
    input: geometry.params,
    normalizedInput: geometry.pipeline.normalizedInput,
    derivedValues: geometry.pipeline.derivedValues,
    validation: {
      geometry: geometry.validation,
      layout: layout.validation,
      isValid: geometry.validation.isValid && layout.validation.isValid,
    },
    knowledgeRules: geometry.ruleTrace.map((rule) => ({
      ...rule,
      rule: cardholderRules.find((item) => item.id === rule.ruleId),
    })),
    productionElements: {
      pieces: geometry.pieces.map(traceableElement),
      lines: geometry.lines.map(traceableElement),
      dimensions: geometry.dimensions.map(traceableElement),
      annotations: geometry.annotations.map(traceableElement),
      marks: geometry.marks.map(traceableElement),
      ruler: traceableElement(geometry.ruler),
      assemblySteps: geometry.assemblySteps.map(traceableElement),
      assembly: {
        status: geometry.assembly.status,
        placements: geometry.assembly.placements.map(traceableElement),
        seamSegments: geometry.assembly.seamSegments.map(traceableElement),
        seamPairs: geometry.assembly.seamPairs.map(traceableElement),
      },
    },
    layout: {
      format: layout.format,
      strategy: layout.strategy,
      autoSelected: layout.autoSelected,
      width: layout.width,
      height: layout.height,
      pages: layout.pages.map((page) => ({
        pageNumber: page.pageNumber,
        totalPages: page.totalPages,
        format: page.format,
        width: page.width,
        height: page.height,
        title: page.title,
        rulerLengthMm: page.ruler.x2 - page.ruler.x1,
        placements: page.placements,
      })),
    },
  };
}

export function createPatternDebugManifestBlob(geometry: PatternGeometry, options?: DebugManifestOptions) {
  return new Blob([JSON.stringify(buildPatternDebugManifest(geometry, options), null, 2)], {
    type: 'application/json',
  });
}

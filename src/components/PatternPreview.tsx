import { createLayoutPlan } from '../lib/layout/pageLayout';
import type { LayoutPlacement, PatternGeometry, PatternLine, PatternLineKind } from '../types/pattern';

type PatternPreviewProps = {
  geometry: PatternGeometry;
};

const lineStyle: Record<PatternLineKind, { stroke: string; dash?: string; width: number }> = {
  cut: { stroke: '#1f2522', width: 0.8 },
  fold: { stroke: '#b14b35', dash: '5 3', width: 0.8 },
  stitch: { stroke: '#3c6f5a', dash: '2 2', width: 0.55 },
  measure: { stroke: '#1f2522', width: 0.8 },
};

export function PatternPreview({ geometry }: PatternPreviewProps) {
  const layout = createLayoutPlan(geometry, { format: geometry.params.pageFormat, strategy: 'piece-per-page' });

  const lineBelongsToPlacement = (line: PatternLine, placement: LayoutPlacement) => {
    const withinX1 = line.x1 >= placement.sourceX && line.x1 <= placement.sourceX + placement.width;
    const withinX2 = line.x2 >= placement.sourceX && line.x2 <= placement.sourceX + placement.width;
    const withinY1 = line.y1 >= placement.sourceY && line.y1 <= placement.sourceY + placement.height;
    const withinY2 = line.y2 >= placement.sourceY && line.y2 <= placement.sourceY + placement.height;
    return withinX1 && withinX2 && withinY1 && withinY2;
  };

  const translateLine = (line: PatternLine, placement: LayoutPlacement) => {
    const dx = placement.x - placement.sourceX;
    const dy = placement.y - placement.sourceY;
    return {
      ...line,
      x1: line.x1 + dx,
      y1: line.y1 + dy,
      x2: line.x2 + dx,
      y2: line.y2 + dy,
    };
  };

  const itemBelongsToPlacement = (item: { x: number; y: number }, placement: LayoutPlacement) =>
    item.x >= placement.sourceX &&
    item.x <= placement.sourceX + placement.width &&
    item.y >= placement.sourceY &&
    item.y <= placement.sourceY + placement.height;

  const translatePoint = <T extends { x: number; y: number }>(item: T, placement: LayoutPlacement): T => {
    const dx = placement.x - placement.sourceX;
    const dy = placement.y - placement.sourceY;
    return { ...item, x: item.x + dx, y: item.y + dy };
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Выкройка для печати</h2>
          <p className="mt-1 text-sm text-ink/62">То, что вы видите, будет напечатано в PDF в масштабе 1:1.</p>
        </div>
        <div className="flex gap-3 text-xs text-ink/62">
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 bg-ink" /> рез</span>
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 border-t border-dashed border-stitch" /> сгиб</span>
        </div>
      </div>

      <div className="grid gap-4 overflow-auto rounded-md border border-black/10 bg-[#fbfaf7] p-3">
        {layout.pages.map((page) => (
          <figure key={page.pageNumber} className="min-w-[520px]">
            <figcaption className="mb-2 flex items-center justify-between text-xs font-semibold text-ink/68">
              <span>
                Лист {page.pageNumber} из {page.totalPages}: {page.title}
              </span>
              <span>{page.format}, 1:1</span>
            </figcaption>
            <svg
              viewBox={`0 0 ${page.width} ${page.height}`}
              className="pattern-animated mx-auto block h-auto w-full max-w-[760px] rounded-sm bg-white shadow-sm"
              aria-label={`Лист выкройки ${page.pageNumber}: ${page.title}`}
            >
              <rect x="0" y="0" width={page.width} height={page.height} fill="#fffdf8" />
              <rect
                x={page.margin}
                y={page.margin}
                width={page.width - page.margin * 2}
                height={page.height - page.margin * 2}
                fill="none"
                stroke="#d8d1c5"
                strokeWidth="0.35"
              />

              {page.placements.map((placement) => {
                const piece = geometry.pieces.find((item) => item.id === placement.pieceId);
                if (!piece) return null;
                const title =
                  placement.kind === 'piece'
                    ? `${placement.productionName ?? piece.productionName ?? piece.label} - ${placement.quantity ?? 1} дет.`
                    : `${piece.label}: фрагмент`;

                return (
                  <g key={`${page.pageNumber}-${placement.pieceId}`} className="origin-center transition duration-500 ease-out">
                    <rect
                      x={placement.x}
                      y={placement.y}
                      width={placement.width}
                      height={placement.height}
                      rx={piece.radius}
                      fill="#f5e9dc"
                      stroke="#1f2522"
                      strokeWidth="0.7"
                    />

                    {geometry.lines
                      .filter((line) => lineBelongsToPlacement(line, placement))
                      .map((line) => {
                        const translated = translateLine(line, placement);
                        const style = lineStyle[translated.kind];
                        return (
                          <line
                            key={translated.id}
                            x1={translated.x1}
                            y1={translated.y1}
                            x2={translated.x2}
                            y2={translated.y2}
                            stroke={style.stroke}
                            strokeWidth={style.width}
                            strokeDasharray={style.dash}
                          />
                        );
                      })}

                    {geometry.marks
                      .filter((mark) => mark.pieceId === piece.id && itemBelongsToPlacement(mark, placement))
                      .map((mark) => translatePoint(mark, placement))
                      .map((mark) => (
                        <circle key={mark.id} cx={mark.x} cy={mark.y} r={mark.radius} fill="#fffdf8" stroke="#3c6f5a" strokeWidth="0.45" />
                      ))}

                    {geometry.annotations
                      .filter((annotation) => annotation.pieceId === piece.id && itemBelongsToPlacement(annotation, placement))
                      .map((annotation) => translatePoint(annotation, placement))
                      .map((annotation) => (
                        <text
                          key={annotation.id}
                          x={annotation.x}
                          y={annotation.y}
                          textAnchor={annotation.kind === 'opening' || annotation.kind === 'glue' ? 'middle' : 'start'}
                          fontSize="3.2"
                          fontWeight={annotation.kind === 'instruction' ? 700 : 400}
                          fill={annotation.kind === 'opening' ? '#b14b35' : '#52605a'}
                        >
                          {annotation.label}
                        </text>
                      ))}

                    <line
                      x1={placement.x}
                      y1={Math.max(page.margin + 24, placement.y - 5)}
                      x2={placement.x + placement.width}
                      y2={Math.max(page.margin + 24, placement.y - 5)}
                      stroke="#52605a"
                      strokeWidth="0.35"
                    />
                    <line
                      x1={Math.min(page.width - page.margin - 4, placement.x + placement.width + 5)}
                      y1={placement.y}
                      x2={Math.min(page.width - page.margin - 4, placement.x + placement.width + 5)}
                      y2={placement.y + placement.height}
                      stroke="#52605a"
                      strokeWidth="0.35"
                    />
                    <text x={placement.x + placement.width / 2} y={Math.max(page.margin + 20, placement.y - 8)} textAnchor="middle" fontSize="3.2" fill="#52605a">
                      {Math.round(placement.width)} мм
                    </text>
                    <text
                      x={Math.min(page.width - page.margin - 2, placement.x + placement.width + 8)}
                      y={placement.y + placement.height / 2}
                      textAnchor="middle"
                      fontSize="3.2"
                      fill="#52605a"
                      transform={`rotate(90 ${Math.min(page.width - page.margin - 2, placement.x + placement.width + 8)} ${placement.y + placement.height / 2})`}
                    >
                      {Math.round(placement.height)} мм
                    </text>

                    <text x={placement.x + placement.width / 2} y={placement.y + placement.height / 2 - 2} textAnchor="middle" fontSize="4" fontWeight="700" fill="#1f2522">
                      {title}
                    </text>
                    <text x={placement.x + placement.width / 2} y={placement.y + placement.height / 2 + 4} textAnchor="middle" fontSize="3.3" fill="#52605a">
                      {Math.round(placement.width)} x {Math.round(placement.height)} мм
                    </text>
                  </g>
                );
              })}

              <g>
                <line x1={page.ruler.x1} y1={page.ruler.y1} x2={page.ruler.x2} y2={page.ruler.y2} stroke="#1f2522" strokeWidth="0.8" />
                {Array.from({ length: 11 }, (_, index) => (
                  <g key={index}>
                    <line
                      x1={page.ruler.x1 + index * 10}
                      y1={page.ruler.y1 - 2}
                      x2={page.ruler.x1 + index * 10}
                      y2={page.ruler.y1 + 2}
                      stroke="#1f2522"
                      strokeWidth="0.45"
                    />
                    <text x={page.ruler.x1 + index * 10} y={page.ruler.y1 + 6} textAnchor="middle" fontSize="3">
                      {index}
                    </text>
                  </g>
                ))}
                <text x={page.ruler.x1 + 50} y={page.ruler.y1 - 4} textAnchor="middle" fontSize="3.5" fontWeight="700">
                  контрольная линейка 10 см
                </text>
              </g>
            </svg>
          </figure>
        ))}
      </div>

      {geometry.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-stitch/25 bg-stitch/10 p-3 text-sm leading-6 text-ink">
          {geometry.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

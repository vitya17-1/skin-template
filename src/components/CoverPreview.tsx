import type { CoverGeometry, CoverPatternInput } from '../types/cover';

type CoverPreviewProps = {
  geometry: CoverGeometry;
  params: CoverPatternInput;
};

export function CoverPreview({ geometry, params }: CoverPreviewProps) {
  const { pieces } = geometry;

  if (pieces.length === 0) return null;

  // Find bounding box for all pieces
  const allX = pieces.flatMap((p) => [p.x, p.x + p.width]);
  const allY = pieces.flatMap((p) => [p.y, p.y + p.height]);
  const minX = Math.min(...allX) - 10;
  const minY = Math.min(...allY) - 25;
  const maxX = Math.max(...allX) + 10;
  const maxY = Math.max(...allY) + 15;
  const viewW = maxX - minX;
  const viewH = maxY - minY;

  const COLORS: Record<string, string> = {
    'outer-cover': '#f5e9dc',
    'inner-lining-left': '#ede0d0',
    'inner-lining-right': '#ede0d0',
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-ink">Выкройка обложки</h2>
        <p className="mt-1 text-sm text-ink/62">
          Внешняя обложка в развёрнутом виде: {Math.round(geometry.totalWidth)} × {Math.round(geometry.totalHeight)} мм
        </p>
      </div>

      <div className="overflow-auto rounded-md border border-black/10 bg-[#fbfaf7] p-3">
        <svg
          viewBox={`${minX} ${minY} ${viewW} ${viewH}`}
          className="block h-auto w-full"
          aria-label="Выкройка обложки"
          style={{ minWidth: '460px' }}
        >
          {pieces.map((piece) => (
            <g key={piece.id}>
              {/* Piece background */}
              <rect
                x={piece.x}
                y={piece.y}
                width={piece.width}
                height={piece.height}
                rx={piece.radius}
                fill={COLORS[piece.id] ?? '#f5e9dc'}
                stroke="#1f2522"
                strokeWidth="0.8"
              />

              {/* Fold lines */}
              {piece.foldLines.map((fl) => (
                <line
                  key={fl.x}
                  x1={fl.x}
                  y1={piece.y + 2}
                  x2={fl.x}
                  y2={piece.y + piece.height - 2}
                  stroke="#b14b35"
                  strokeWidth="0.9"
                  strokeDasharray="5 3"
                />
              ))}

              {/* Label */}
              <text
                x={piece.x + piece.width / 2}
                y={piece.y + piece.height / 2 - 3}
                textAnchor="middle"
                fontSize="4.5"
                fontWeight="700"
                fill="#1f2522"
              >
                {piece.name}
              </text>
              <text
                x={piece.x + piece.width / 2}
                y={piece.y + piece.height / 2 + 5}
                textAnchor="middle"
                fontSize="3.8"
                fill="#52605a"
              >
                {Math.round(piece.width)} × {Math.round(piece.height)} мм
              </text>

              {/* Width dimension */}
              <line x1={piece.x} y1={piece.y - 5} x2={piece.x + piece.width} y2={piece.y - 5} stroke="#52605a" strokeWidth="0.4" />
              <line x1={piece.x} y1={piece.y - 7} x2={piece.x} y2={piece.y - 3} stroke="#52605a" strokeWidth="0.4" />
              <line x1={piece.x + piece.width} y1={piece.y - 7} x2={piece.x + piece.width} y2={piece.y - 3} stroke="#52605a" strokeWidth="0.4" />
              <text x={piece.x + piece.width / 2} y={piece.y - 8} textAnchor="middle" fontSize="3.5" fill="#52605a">
                {Math.round(piece.width)} мм
              </text>
            </g>
          ))}

          {/* Legend */}
          <g transform={`translate(${minX + 5}, ${minY + 5})`}>
            <rect width={110} height={26} rx={3} fill="white" stroke="#d8d1c5" strokeWidth="0.5" />
            <line x1={8} y1={10} x2={22} y2={10} stroke="#b14b35" strokeWidth="1" strokeDasharray="5 3" />
            <text x={26} y={14} fontSize="7" fill="#52605a">линия сгиба (корешок)</text>
            <line x1={8} y1={20} x2={22} y2={20} stroke="#1f2522" strokeWidth="0.8" />
            <text x={26} y={24} fontSize="7" fill="#52605a">линия кроя</text>
          </g>
        </svg>
      </div>

      {/* Assembly notes */}
      <div className="mt-4 rounded-lg border border-black/10 bg-[#fffdf8] p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Инструкция по сборке</p>
        <ol className="grid gap-2 text-xs leading-5 text-ink/72">
          {geometry.assemblyNotes.map((note, i) => (
            <li key={i} className="flex gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-ink">
                {i + 1}
              </span>
              {note}
            </li>
          ))}
        </ol>
      </div>

      {/* Summary */}
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-black/10 bg-[#fffdf8] p-4 text-xs sm:grid-cols-4">
        <div>
          <p className="font-medium text-ink">Обложка (раскрой)</p>
          <p className="text-ink/72">{Math.round(geometry.totalWidth + params.seamAllowanceMm * 2)} × {Math.round(geometry.totalHeight + params.seamAllowanceMm * 2)} мм</p>
        </div>
        <div>
          <p className="font-medium text-ink">Корешок</p>
          <p className="text-ink/72">{params.spineWidthMm} мм</p>
        </div>
        <div>
          <p className="font-medium text-ink">Припуск шва</p>
          <p className="text-ink/72">{params.seamAllowanceMm} мм</p>
        </div>
        <div>
          <p className="font-medium text-ink">Деталей</p>
          <p className="text-ink/72">{pieces.length} шт.</p>
        </div>
      </div>

      {geometry.validation.issues.length > 0 && (
        <div className="mt-3 rounded-md border border-stitch/25 bg-stitch/10 p-3 text-sm leading-6 text-ink">
          {geometry.validation.issues.map((issue) => (
            <p key={issue.id}>{issue.message}</p>
          ))}
        </div>
      )}
    </section>
  );
}

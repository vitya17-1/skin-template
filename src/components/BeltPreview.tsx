import type { BeltGeometry } from '../types/belt';

type BeltPreviewProps = {
  geometry: BeltGeometry;
  strapWidthMm: number;
};

export function BeltPreview({ geometry, strapWidthMm }: BeltPreviewProps) {
  const { strap, adjustmentHoles, keeper } = geometry;

  // Scale everything to fit in ~900px wide SVG
  const SVG_W = 900;
  const PADDING = 40;
  const scale = (SVG_W - PADDING * 2) / strap.lengthMm;
  const strapH = Math.max(18, strapWidthMm * scale);
  const strapY = PADDING + 30;
  const SVG_H = strapY + strapH + (keeper ? strapH + 50 : 20) + PADDING;

  const sx = (mm: number) => PADDING + mm * scale;
  const strapBottom = strapY + strapH;

  // Mark positions
  const foldX = sx(strap.foldLineX);
  const centerHoleX = sx(strap.centerHoleX);
  const tongueX = sx(strap.tongueSlotCenterX);
  const holeR = Math.max(3, (8 / 2) * scale);

  const keeperY = strapBottom + 35;

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-ink">Схема ремня</h2>
        <p className="mt-1 text-sm text-ink/62">
          Масштабированная схема. Длина полосы: <strong>{Math.round(strap.lengthMm)} мм</strong> · Ширина:{' '}
          <strong>{strap.widthMm} мм</strong>
        </p>
      </div>

      <div className="overflow-auto rounded-md border border-black/10 bg-[#fbfaf7] p-3">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="block h-auto w-full"
          aria-label="Схема выкройки ремня"
        >
          {/* Belt strap body */}
          <rect
            x={PADDING}
            y={strapY}
            width={strap.lengthMm * scale}
            height={strapH}
            rx={3}
            fill="#f5e9dc"
            stroke="#1f2522"
            strokeWidth="1"
          />

          {/* Buckle zone (fold area) — shaded */}
          <rect
            x={PADDING}
            y={strapY}
            width={strap.foldLineX * scale}
            height={strapH}
            rx={3}
            fill="#ede0d0"
            stroke="none"
          />

          {/* Fold line */}
          <line x1={foldX} y1={strapY - 8} x2={foldX} y2={strapBottom + 8} stroke="#b14b35" strokeWidth="1.5" strokeDasharray="5 3" />
          <text x={foldX} y={strapY - 12} textAnchor="middle" fontSize="9" fill="#b14b35" fontWeight="600">
            линия сгиба
          </text>

          {/* Tongue slot */}
          <rect
            x={tongueX - 4}
            y={strapY + strapH * 0.3}
            width={8}
            height={strapH * 0.4}
            rx={3}
            fill="#1f2522"
          />
          <text x={tongueX} y={strapBottom + 16} textAnchor="middle" fontSize="8" fill="#52605a">
            прорезь язычка
          </text>

          {/* Adjustment holes */}
          {adjustmentHoles.map((hole, i) => {
            const hx = sx(hole.x);
            const hy = strapY + strapH / 2;
            const isCenter = i === Math.floor(adjustmentHoles.length / 2);
            return (
              <g key={i}>
                <circle cx={hx} cy={hy} r={holeR} fill="#fffdf8" stroke={isCenter ? '#b14b35' : '#3c6f5a'} strokeWidth={isCenter ? 1.5 : 1} />
                {isCenter && (
                  <text x={hx} y={strapY - 12} textAnchor="middle" fontSize="8" fill="#b14b35" fontWeight="600">
                    центр
                  </text>
                )}
              </g>
            );
          })}

          {/* Dimension: total length */}
          <line x1={PADDING} y1={strapBottom + 22} x2={PADDING + strap.lengthMm * scale} y2={strapBottom + 22} stroke="#52605a" strokeWidth="0.8" />
          <line x1={PADDING} y1={strapBottom + 19} x2={PADDING} y2={strapBottom + 25} stroke="#52605a" strokeWidth="0.8" />
          <line x1={PADDING + strap.lengthMm * scale} y1={strapBottom + 19} x2={PADDING + strap.lengthMm * scale} y2={strapBottom + 25} stroke="#52605a" strokeWidth="0.8" />
          <text x={PADDING + (strap.lengthMm * scale) / 2} y={strapBottom + 31} textAnchor="middle" fontSize="9" fill="#52605a">
            {Math.round(strap.lengthMm)} мм — общая длина полосы
          </text>

          {/* Dimension: wearable circumference */}
          <line x1={foldX} y1={strapY + strapH / 2} x2={centerHoleX} y2={strapY + strapH / 2} stroke="#b14b35" strokeWidth="0.8" strokeDasharray="3 2" />

          {/* Keeper strip */}
          {keeper && (
            <g>
              <text x={PADDING} y={keeperY - 5} fontSize="9" fill="#52605a" fontWeight="600">
                Шлёвка × 1
              </text>
              <rect
                x={PADDING}
                y={keeperY}
                width={keeper.cutLengthMm * scale}
                height={strapH * 0.6}
                rx={2}
                fill="#f5e9dc"
                stroke="#1f2522"
                strokeWidth="1"
              />
              <text x={PADDING + (keeper.cutLengthMm * scale) / 2} y={keeperY + strapH * 0.33} textAnchor="middle" fontSize="8" fill="#1f2522" fontWeight="600">
                {Math.round(keeper.cutLengthMm)} × {keeper.widthMm} мм
              </text>
            </g>
          )}

          {/* Legend */}
          <g transform={`translate(${SVG_W - 160}, 10)`}>
            <rect width={150} height={60} rx={4} fill="white" stroke="#d8d1c5" strokeWidth="0.5" />
            <line x1={10} y1={18} x2={30} y2={18} stroke="#b14b35" strokeWidth="1.5" strokeDasharray="5 3" />
            <text x={36} y={22} fontSize="8" fill="#52605a">линия сгиба / сечение</text>
            <circle cx={20} cy={36} r={5} fill="#fffdf8" stroke="#3c6f5a" strokeWidth="1} " />
            <text x={36} y={40} fontSize="8" fill="#52605a">регулировочное отверстие</text>
            <circle cx={20} cy={52} r={5} fill="#fffdf8" stroke="#b14b35" strokeWidth="1.5} " />
            <text x={36} y={56} fontSize="8" fill="#52605a">центральное отверстие</text>
          </g>
        </svg>
      </div>

      {geometry.validation.issues.length > 0 && (
        <div className="mt-3 rounded-md border border-stitch/25 bg-stitch/10 p-3 text-sm leading-6 text-ink">
          {geometry.validation.issues.map((issue) => (
            <p key={issue.id}>{issue.message}</p>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 rounded-lg border border-black/10 bg-[#fffdf8] p-4 text-sm">
        <p className="font-semibold text-ink">Сводка расчёта</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-ink/72 sm:grid-cols-3">
          <div>
            <p className="font-medium text-ink">Длина полосы</p>
            <p>{Math.round(strap.lengthMm)} мм</p>
          </div>
          <div>
            <p className="font-medium text-ink">Рабочая длина</p>
            <p>{Math.round(strap.centerHoleX - strap.foldLineX)} мм</p>
          </div>
          <div>
            <p className="font-medium text-ink">Отверстий</p>
            <p>{adjustmentHoles.length} шт. / шаг {adjustmentHoles.length > 1 ? Math.round(adjustmentHoles[1].x - adjustmentHoles[0].x) : '—'} мм</p>
          </div>
          <div>
            <p className="font-medium text-ink">Шлёвка (крой)</p>
            <p>{keeper ? `${Math.round(keeper.cutLengthMm)} × ${keeper.widthMm} мм` : '—'}</p>
          </div>
          <div>
            <p className="font-medium text-ink">Прорезь язычка</p>
            <p>{Math.round(strap.tongueSlotCenterX)} мм от края</p>
          </div>
          <div>
            <p className="font-medium text-ink">Припуск сгиба</p>
            <p>{Math.round(strap.foldLineX)} мм</p>
          </div>
        </div>
      </div>
    </section>
  );
}

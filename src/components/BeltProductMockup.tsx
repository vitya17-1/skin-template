import { CircleDot, Maximize2, ScanLine, ShieldCheck } from 'lucide-react';
import type { BeltGeometry } from '../types/belt';
import { BeltScene3D } from './BeltScene3D';

type BeltProductMockupProps = {
  geometry: BeltGeometry;
};

export function BeltProductMockup({ geometry }: BeltProductMockupProps) {
  const specs = [
    { icon: Maximize2, label: 'Общая длина', value: `${Math.round(geometry.strap.lengthMm)} мм` },
    { icon: ScanLine, label: 'Ширина', value: `${Math.round(geometry.strap.widthMm)} мм` },
    { icon: CircleDot, label: 'Отверстия', value: `${geometry.adjustmentHoles.length} шт.` },
    { icon: ShieldCheck, label: 'Статус', value: 'Требуется прототип' },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
      <div className="px-6 pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Ваше изделие</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-snugger text-ink">Ремень по вашим параметрам</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink/56">
          3D-модель показывает пропорции полосы, пряжку, шлёвку и регулировочные отверстия до подготовки документации.
        </p>
      </div>
      <div className="mt-5 bg-[radial-gradient(circle_at_50%_15%,#fdf9f2_0%,#ece1d0_52%,#d8cab6_100%)]">
        <BeltScene3D geometry={geometry} />
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div key={spec.label} className="bg-surface px-5 py-4">
              <Icon size={16} className="text-leather" />
              <p className="mt-2 text-xs font-medium text-ink/50">{spec.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink tnum">{spec.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

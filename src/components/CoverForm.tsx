import { Tooltip } from './Tooltip';
import { FieldHint } from './FieldHint';
import { coverPresets } from '../store/coverStore';
import type { CoverPatternInput, CoverProductType } from '../types/cover';

type CoverFormProps = {
  params: CoverPatternInput;
  onChange: <K extends keyof CoverPatternInput>(key: K, value: CoverPatternInput[K]) => void;
  onApplyPreset: (preset: CoverPatternInput) => void;
};

const presetButtons: { id: CoverProductType; label: string; hint: string }[] = [
  { id: 'passport', label: 'Паспорт', hint: '88×125 мм' },
  { id: 'a5-notebook', label: 'Блокнот A5', hint: '148×210 мм' },
  { id: 'a4-document', label: 'Папка A4', hint: '210×297 мм' },
];

export function CoverForm({ params, onChange, onApplyPreset }: CoverFormProps) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hide">Шаг 3 · Обложка</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Параметры обложки</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          Выберите готовый пресет или введите размеры документа вручную.
        </p>
      </div>

      {/* Presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        {presetButtons.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onApplyPreset(coverPresets[p.id])}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              params.productType === p.id
                ? 'border-hide bg-mint text-ink'
                : 'border-black/12 bg-white text-ink/70 hover:border-hide/40'
            }`}
          >
            {p.label}
            <span className="ml-1.5 font-normal opacity-60">{p.hint}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {/* Document size */}
        <div className="rounded-lg border border-black/10 bg-[#fffdf8] p-4">
          <h3 className="mb-1 text-sm font-semibold text-ink">Размер документа</h3>
          <p className="mb-4 text-xs leading-5 text-ink/56">Размер вкладываемого документа в закрытом виде.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: 'docWidthMm' as const, label: 'Ширина', min: 50, max: 320, hint: 'Ширина в закрытом виде. Паспорт РФ: 88 мм.' },
              { key: 'docHeightMm' as const, label: 'Высота', min: 70, max: 450, hint: 'Высота документа. Паспорт РФ: 125 мм.' },
            ].map((f) => (
              <label key={f.key} className="grid gap-2">
                <span className="text-sm font-medium text-ink/78">{f.label}</span>
                <div className="flex items-center rounded-md border border-black/12 bg-white transition focus-within:border-hide">
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={1}
                    value={params[f.key] as number}
                    onChange={(e) => onChange(f.key, Number(e.target.value))}
                    className="min-w-0 flex-1 rounded-md bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                  />
                  <span className="px-3 text-xs text-ink/52">мм</span>
                </div>
                <FieldHint hint={f.hint} range={`${f.min}–${f.max} мм`} />
              </label>
            ))}
          </div>
        </div>

        {/* Construction */}
        <div className="rounded-lg border border-black/10 bg-[#fffdf8] p-4">
          <h3 className="mb-1 text-sm font-semibold text-ink">Конструкция</h3>
          <p className="mb-4 text-xs leading-5 text-ink/56">Корешок, припуски и радиусы угла.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                key: 'spineWidthMm' as const, label: 'Ширина корешка', min: 0, max: 50, step: 1,
                hint: 'Ширина средней части (зоны сгиба). Для тонкого блокнота: 5-10 мм, для толстой папки: 15-30 мм.',
                tooltip: 'Корешок — зона между двумя панелями обложки. Чем толще блокнот, тем шире корешок.',
              },
              {
                key: 'seamAllowanceMm' as const, label: 'Припуск шва', min: 3, max: 15, step: 1,
                hint: 'Добавляется по периметру. Стандарт: 5-8 мм.',
                tooltip: 'Учитывается при крое внешней обложки. На внутреннюю подкладку не добавляется.',
              },
              {
                key: 'cornerRadiusMm' as const, label: 'Радиус угла', min: 0, max: 20, step: 1,
                hint: 'Скругление углов обложки. 0 = прямой угол.',
                tooltip: 'Скруглённые углы смотрятся профессиональнее и дольше не затираются.',
              },
              {
                key: 'leatherThicknessMm' as const, label: 'Толщина кожи', min: 0.6, max: 3.0, step: 0.1,
                hint: 'Для обложек рекомендуется 1.0–1.6 мм.',
                tooltip: 'Влияет на гибкость обложки. Слишком толстая кожа плохо складывается.',
              },
            ].map((f) => (
              <label key={f.key} className="grid gap-2">
                <span className="flex items-center justify-between gap-3 text-sm font-medium text-ink/78">
                  <span>{f.label}</span>
                  {'tooltip' in f && <Tooltip text={f.tooltip} />}
                </span>
                <div className="flex items-center rounded-md border border-black/12 bg-white transition focus-within:border-hide">
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={params[f.key] as number}
                    onChange={(e) => onChange(f.key, Number(e.target.value))}
                    className="min-w-0 flex-1 rounded-md bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                  />
                  <span className="px-3 text-xs text-ink/52">мм</span>
                </div>
                <FieldHint hint={f.hint} range={`${f.min}–${f.max} мм`} />
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="rounded-lg border border-black/10 bg-[#fffdf8] p-4">
          <h3 className="mb-1 text-sm font-semibold text-ink">Дополнения</h3>
          <div className="grid gap-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={params.hasInnerLining}
                onChange={(e) => onChange('hasInnerLining', e.target.checked)}
                className="h-4 w-4 rounded border-black/20 accent-hide"
              />
              <span className="text-sm text-ink">Внутренняя подкладка (лайнинг)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={params.hasCardSlots}
                onChange={(e) => {
                  onChange('hasCardSlots', e.target.checked);
                  if (e.target.checked && params.cardSlotCount === 0) onChange('cardSlotCount', 2);
                }}
                className="h-4 w-4 rounded border-black/20 accent-hide"
              />
              <span className="text-sm text-ink">Карманы для карт</span>
            </label>
            {params.hasCardSlots && (
              <label className="ml-7 grid gap-2">
                <span className="text-sm font-medium text-ink/78">Количество карманов</span>
                <div className="flex items-center rounded-md border border-black/12 bg-white w-32 transition focus-within:border-hide">
                  <input
                    type="number"
                    min={1}
                    max={4}
                    step={1}
                    value={params.cardSlotCount}
                    onChange={(e) => onChange('cardSlotCount', Math.round(Number(e.target.value)))}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                  />
                  <span className="px-3 text-xs text-ink/52">шт.</span>
                </div>
              </label>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

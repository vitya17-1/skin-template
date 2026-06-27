import { Tooltip } from './Tooltip';
import { FieldHint } from './FieldHint';
import type { BeltPatternInput } from '../types/belt';

type Field = {
  key: keyof BeltPatternInput;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  tooltip: string;
};

const fields: Field[] = [
  {
    key: 'wearableCircumferenceMm',
    label: 'Обхват (рабочая длина)',
    unit: 'мм',
    min: 500,
    max: 1500,
    step: 5,
    hint: 'Расстояние от линии сгиба пряжки до центрального отверстия. Измерьте существующий ремень или обхват талии в месте носки.',
    tooltip: 'Это главный размер ремня. Не путайте с размером одежды — он всегда отличается.',
  },
  {
    key: 'strapWidthMm',
    label: 'Ширина ремня',
    unit: 'мм',
    min: 15,
    max: 80,
    step: 1,
    hint: 'Стандартные: брючный 30-40 мм, армейский 38-40 мм, женский 20-25 мм.',
    tooltip: 'Ширина должна быть меньше или равна внутренней ширине пряжки.',
  },
  {
    key: 'leatherThicknessMm',
    label: 'Толщина кожи',
    unit: 'мм',
    min: 2.0,
    max: 6.0,
    step: 0.1,
    hint: 'Для ремня рекомендуется 3-4.5 мм растительного дубления.',
    tooltip: 'Влияет на припуск сгиба у пряжки и жёсткость изделия.',
  },
  {
    key: 'buckleInsideWidthMm',
    label: 'Внутр. ширина пряжки',
    unit: 'мм',
    min: 15,
    max: 85,
    step: 0.5,
    hint: 'Измерьте пазовую часть пряжки изнутри. Ремень должен входить с зазором ~1 мм.',
    tooltip: 'Ширина ремня должна быть не больше этого значения минус зазор.',
  },
  {
    key: 'buckleBarToTongueMm',
    label: 'Стержень → язычок пряжки',
    unit: 'мм',
    min: 8,
    max: 40,
    step: 0.5,
    hint: 'Расстояние от оси стержня пряжки до центра язычка. Измерьте вашу пряжку.',
    tooltip: 'Определяет, где сделать прорезь под язычок на ременной полосе.',
  },
  {
    key: 'buckleFoldAllowanceMm',
    label: 'Припуск сгиба пряжки',
    unit: 'мм',
    min: 50,
    max: 150,
    step: 5,
    hint: 'Длина зоны, которая загибается вокруг пряжки и крепится. Обычно 70-90 мм.',
    tooltip: 'Включает сгиб вокруг стержня + зону крепления (клёпки или стежки).',
  },
  {
    key: 'tailLengthMm',
    label: 'Длина хвостовика',
    unit: 'мм',
    min: 80,
    max: 300,
    step: 5,
    hint: 'Длина ремня после центрального отверстия. Стандарт: 100-150 мм.',
    tooltip: 'Часть, которая остаётся свободной после застёгивания ремня.',
  },
  {
    key: 'holeCount',
    label: 'Количество отверстий',
    unit: 'шт',
    min: 3,
    max: 9,
    step: 2,
    hint: 'Всегда нечётное — центральное отверстие и симметричные ±1-4. Стандарт: 5.',
    tooltip: 'Центральное отверстие = рабочая длина. Остальные — регулировка на 1-4 шага.',
  },
  {
    key: 'holePitchMm',
    label: 'Шаг отверстий',
    unit: 'мм',
    min: 15,
    max: 40,
    step: 5,
    hint: 'Расстояние между отверстиями. Стандарт: 25 мм (1 дюйм).',
    tooltip: 'Один шаг = одно деление регулировки длины ремня.',
  },
  {
    key: 'tongueHoleDiameterMm',
    label: 'Диаметр отверстия',
    unit: 'мм',
    min: 4,
    max: 14,
    step: 0.5,
    hint: 'Подбирайте под язычок пряжки. Стандарт: 8 мм.',
    tooltip: 'Слишком малое — язычок застревает, слишком большое — быстро разбивается.',
  },
  {
    key: 'keeperInsideLengthMm',
    label: 'Шлёвка: внутр. длина',
    unit: 'мм',
    min: 30,
    max: 80,
    step: 1,
    hint: 'Внутренняя длина шлёвки = ширина ремня + зазор ~8-10 мм.',
    tooltip: 'Шлёвка удерживает хвостовик ремня. Делается из той же кожи.',
  },
  {
    key: 'keeperOverlapMm',
    label: 'Шлёвка: перехлёст',
    unit: 'мм',
    min: 15,
    max: 40,
    step: 1,
    hint: 'Длина перехлёста для сшивания или склейки. Стандарт: 20-25 мм.',
    tooltip: 'Суммарная длина выкройки шлёвки = внутренняя длина + перехлёст × 2.',
  },
];

type BeltFormProps = {
  params: BeltPatternInput;
  onChange: <K extends keyof BeltPatternInput>(key: K, value: BeltPatternInput[K]) => void;
  issues: { id: string; message: string; ruleIds: string[] }[];
};

export function BeltForm({ params, onChange, issues }: BeltFormProps) {
  const groups: { title: string; description: string; keys: (keyof BeltPatternInput)[] }[] = [
    {
      title: 'Размер ремня',
      description: 'Главные параметры — от них зависит общая длина и позиция отверстий.',
      keys: ['wearableCircumferenceMm', 'strapWidthMm', 'leatherThicknessMm'],
    },
    {
      title: 'Пряжка',
      description: 'Измерьте вашу фурнитуру — без этого точная выкройка невозможна.',
      keys: ['buckleInsideWidthMm', 'buckleBarToTongueMm', 'buckleFoldAllowanceMm'],
    },
    {
      title: 'Отверстия и хвостовик',
      description: 'Регулировочные отверстия и длина свободного конца.',
      keys: ['tailLengthMm', 'holeCount', 'holePitchMm', 'tongueHoleDiameterMm'],
    },
    {
      title: 'Шлёвка',
      description: 'Кольцо, удерживающее хвостовик ремня.',
      keys: ['keeperInsideLengthMm', 'keeperOverlapMm'],
    },
  ];

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hide">Шаг 3 · Ремень</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Параметры ремня</h2>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          Введите параметры изделия и вашей фурнитуры. Геометрия рассчитывается по правилам и обновляется мгновенно.
        </p>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => {
          const groupFields = group.keys.map((k) => fields.find((f) => f.key === k)!).filter(Boolean);
          return (
            <div key={group.title} className="rounded-lg border border-black/10 bg-[#fffdf8] p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
                <p className="mt-1 text-xs leading-5 text-ink/56">{group.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {groupFields.map((field) => {
                  const issue = issues.find((i) => i.ruleIds.length > 0 && field.key.includes('Width') && i.id.includes('buckle'));
                  return (
                    <label key={field.key} className="grid gap-2">
                      <span className="flex items-center justify-between gap-3 text-sm font-medium text-ink/78">
                        <span>{field.label}</span>
                        <Tooltip text={field.tooltip} />
                      </span>
                      <div className="flex items-center rounded-md border border-black/12 bg-white transition focus-within:border-hide">
                        <input
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={params[field.key] as number}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            onChange(field.key, (field.key === 'holeCount' ? Math.round(v) : v) as BeltPatternInput[typeof field.key]);
                          }}
                          className="min-w-0 flex-1 rounded-md bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                        />
                        <span className="px-3 text-xs text-ink/52">{field.unit}</span>
                      </div>
                      <FieldHint hint={field.hint} range={`${field.min}–${field.max} ${field.unit}`} error={issue?.message} />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { FieldHint } from './FieldHint';
import { Tooltip } from './Tooltip';
import { walletFieldRules, type WalletFieldKey } from '../lib/patterns/validation';
import type { PageFormatSelection, WalletPatternParams } from '../types/pattern';

type PatternFormProps = {
  params: WalletPatternParams;
  onChange: <K extends keyof WalletPatternParams>(key: K, value: WalletPatternParams[K]) => void;
  errors: string[];
};

type NumberFieldProps = {
  fieldKey: WalletFieldKey;
  value: number;
  error?: string;
  onChange: (value: number) => void;
};

function NumberField({ fieldKey, value, error, onChange }: NumberFieldProps) {
  const rule = walletFieldRules[fieldKey];
  const range = `${rule.min}-${rule.max} ${rule.unit}`;

  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-sm font-medium text-ink/78">
        <span>{rule.label}</span>
        <Tooltip text={rule.tooltip} />
      </span>
      <div
        className={`flex items-center rounded-md border bg-white transition focus-within:border-hide ${
          error ? 'border-stitch/60' : 'border-black/12'
        }`}
      >
        <input
          type="number"
          min={rule.min}
          max={rule.max}
          step={rule.step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 rounded-md bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
        />
        <span className="px-3 text-xs text-ink/52">{rule.unit}</span>
      </div>
      <FieldHint hint={rule.hint} range={range} error={error} />
    </label>
  );
}

function getFieldError(errors: string[], label: string) {
  return errors.find((error) => error.startsWith(label));
}

const pageFormatOptions: { value: PageFormatSelection; label: string; hint: string }[] = [
  { value: 'auto', label: 'Автоматически', hint: 'Сервис сам выберет минимальный подходящий лист.' },
  { value: 'A4', label: 'A4 landscape', hint: 'Обычный домашний принтер.' },
  { value: 'A3', label: 'A3 landscape', hint: 'Больше места для крупных деталей.' },
  { value: 'A2', label: 'A2 landscape', hint: 'Для больших выкроек.' },
  { value: 'A1', label: 'A1 landscape', hint: 'Широкий лист для мастерских.' },
  { value: 'A0', label: 'A0 landscape', hint: 'Максимальный поддерживаемый формат.' },
];

export function PatternForm({ params, onChange, errors }: PatternFormProps) {
  const groups: { title: string; description: string; fields: WalletFieldKey[] }[] = [
    {
      title: 'Размер изделия',
      description: 'Габариты готового изделия в сложенном виде.',
      fields: ['widthMm', 'heightMm'],
    },
    {
      title: 'Конструкция',
      description: 'Карманы, припуски и радиусы, влияющие на детали.',
      fields: ['pocketCount', 'seamAllowanceMm', 'cornerRadiusMm'],
    },
    {
      title: 'Материал и печать',
      description: 'Толщина кожи и масштаб производственного вывода.',
      fields: ['leatherThicknessMm', 'printScale'],
    },
  ];

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hide">Шаг 3</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Настройте изделие</h2>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Введите параметры будущего изделия. Геометрия и документация обновляются автоматически.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <div key={group.title} className="rounded-lg border border-black/10 bg-[#fffdf8] p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
              <p className="mt-1 text-xs leading-5 text-ink/56">{group.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((fieldKey) => {
                const rule = walletFieldRules[fieldKey];
                return (
                  <NumberField
                    key={rule.key}
                    fieldKey={rule.key}
                    value={params[rule.key]}
                    error={getFieldError(errors, rule.label)}
                    onChange={(value) => onChange(rule.key, rule.key === 'pocketCount' ? Math.round(value) : value)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-black/10 bg-[#fffdf8] p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-ink">Формат документации</h3>
            <p className="mt-1 text-xs leading-5 text-ink/56">Выберите лист для печати или оставьте автоматический подбор.</p>
          </div>
          <label className="grid gap-2">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-ink/78">
              <span>Формат листа</span>
              <Tooltip text="В режиме Auto выкройка размещается на минимальном подходящем формате. Если деталь больше листа, PDF разобьет ее на страницы для склейки." />
            </span>
            <select
              value={params.pageFormat}
              onChange={(event) => onChange('pageFormat', event.target.value as PageFormatSelection)}
              className="rounded-md border border-black/12 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-hide"
            >
              {pageFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldHint
              hint={pageFormatOptions.find((option) => option.value === params.pageFormat)?.hint ?? pageFormatOptions[0].hint}
              range="A4-A0"
            />
          </label>
        </div>
      </div>
    </section>
  );
}

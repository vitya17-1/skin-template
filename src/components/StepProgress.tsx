import { Check } from 'lucide-react';

type StepProgressProps = {
  currentStep: number;
  hasErrors: boolean;
  onSelect: (step: number) => void;
};

export function StepProgress({ currentStep, hasErrors, onSelect }: StepProgressProps) {
  const steps = [
    { label: 'Изделие', hint: 'Категория' },
    { label: 'Модель', hint: 'Конструкция' },
    { label: 'Параметры', hint: 'Размеры' },
    { label: 'Результат', hint: 'Проверка' },
    { label: 'Документы', hint: 'Экспорт' },
  ];

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <section className="rounded-2xl border border-line bg-surface/80 p-2 shadow-soft backdrop-blur">
      <div className="relative grid grid-cols-5">
        {/* Track */}
        <div className="absolute left-[10%] right-[10%] top-[22px] h-[2px] rounded-full bg-line2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-leather to-leather-deep transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep && !(hasErrors && stepNum >= 3);
          const isActive = stepNum === currentStep;
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => onSelect(stepNum)}
              className="group relative flex flex-col items-center gap-2.5 rounded-xl px-1 py-3 text-center transition"
            >
              <span
                className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'border-leather bg-ink text-white shadow-glow scale-105'
                    : isComplete
                      ? 'border-leather bg-leather text-white'
                      : 'border-line2 bg-surface text-ink/35 group-hover:border-leather/40'
                }`}
              >
                {isComplete ? <Check size={18} strokeWidth={2.5} /> : <span className="tnum">{stepNum}</span>}
              </span>
              <span className="flex flex-col">
                <span
                  className={`text-[13px] font-semibold leading-tight transition ${
                    isActive || isComplete ? 'text-ink' : 'text-ink/45'
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 hidden text-[11px] text-ink/40 sm:block">{step.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

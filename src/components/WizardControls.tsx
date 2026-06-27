import { ArrowLeft, ArrowRight } from 'lucide-react';

type WizardControlsProps = {
  currentStep: number;
  hasErrors: boolean;
  onBack: () => void;
  onNext: () => void;
};

const nextLabels: Record<number, string> = {
  1: 'Выбрать модель',
  2: 'Настроить изделие',
  3: 'Посмотреть результат',
  4: 'Получить документацию',
};

export function WizardControls({ currentStep, hasErrors, onBack, onNext }: WizardControlsProps) {
  if (currentStep === 5) {
    return (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-surface px-4 py-3.5 text-sm font-semibold text-ink transition hover:bg-surface2"
      >
        <ArrowLeft size={16} />
        Вернуться к результату
      </button>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-line2 bg-surface px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft size={16} />
        Назад
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={hasErrors && currentStep >= 2}
        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-soft"
      >
        {nextLabels[currentStep]}
        <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

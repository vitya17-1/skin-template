import { useMemo, useRef, useState } from 'react';
import { BeltDownload } from './components/BeltDownload';
import { BeltForm } from './components/BeltForm';
import { BeltProductMockup } from './components/BeltProductMockup';
import { BeltPreview } from './components/BeltPreview';
import { CoverDownload } from './components/CoverDownload';
import { CoverForm } from './components/CoverForm';
import { CoverProductMockup } from './components/CoverProductMockup';
import { CoverPreview } from './components/CoverPreview';
import { DownloadPanel } from './components/DownloadPanel';
import { Hero } from './components/Hero';
import { PatternForm } from './components/PatternForm';
import { ModulePreviewTabs } from './components/ModulePreviewTabs';
import { PreviewTabs } from './components/PreviewTabs';
import { ProductCategorySelector } from './components/ProductCategorySelector';
import { StepProgress } from './components/StepProgress';
import { TemplateSelector } from './components/TemplateSelector';
import { ValidationMessage } from './components/ValidationMessage';
import { WizardControls } from './components/WizardControls';
import { createCoverGeometry } from './lib/patterns/cover/geometry';
import { createLayoutPlan } from './lib/layout/pageLayout';
import { createBeltPrototypeGeometry } from './lib/patterns/belt/geometry';
import { createSimpleWalletPattern } from './lib/patterns/wallet';
import { validateWalletParams } from './lib/patterns/validation';
import { useBeltStore } from './store/beltStore';
import { useCoverStore } from './store/coverStore';
import { usePatternStore } from './store/patternStore';
import { mm } from './utils/number';

type Category = 'cardholder' | 'wallet' | 'belt' | 'cover' | 'bag' | 'shoe';

export default function App() {
  const constructorRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category>('cardholder');

  // Wallet/cardholder
  const { params, updateParam, applyTemplate } = usePatternStore();
  const geometry = useMemo(() => createSimpleWalletPattern(params), [params]);
  const layout = useMemo(() => createLayoutPlan(geometry, { format: params.pageFormat }), [geometry, params.pageFormat]);
  const validationMessages = useMemo(() => validateWalletParams(params), [params]);
  const hasWalletErrors = validationMessages.length > 0 || geometry.warnings.length > 0;

  // Belt
  const { params: beltParams, updateParam: updateBeltParam } = useBeltStore();
  const beltGeometry = useMemo(() => createBeltPrototypeGeometry(beltParams), [beltParams]);

  // Cover
  const { params: coverParams, updateParam: updateCoverParam, applyPreset: applyCoverPreset } = useCoverStore();
  const coverGeometry = useMemo(() => createCoverGeometry(coverParams), [coverParams]);

  const isWallet = selectedCategory === 'cardholder';
  const isBelt = selectedCategory === 'belt';
  const isCover = selectedCategory === 'cover';

  const hasErrors = isWallet ? hasWalletErrors : false;

  const activePreview = currentStep === 5 ? 'pattern' : 'product';
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id as Category);
    setCurrentStep(1);
  };

  return (
    <main className="min-h-screen text-ink">
      <Hero onStart={() => constructorRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="constructor" ref={constructorRef} className="mx-auto max-w-7xl scroll-mt-20 px-5 py-10 md:px-8 lg:py-14">
        <StepProgress currentStep={currentStep} hasErrors={hasErrors} onSelect={setCurrentStep} />

        <div className="mt-5 grid gap-6 lg:grid-cols-[430px_1fr]">
          {/* Left column — wizard steps */}
          <div className="grid content-start gap-5">

            {/* Step 1: Category */}
            {currentStep === 1 && (
              <ProductCategorySelector selectedId={selectedCategory} onSelect={handleCategorySelect} />
            )}

            {/* Step 2: Template (wallet only) / info panel for belt/cover */}
            {currentStep === 2 && isWallet && (
              <TemplateSelector selectedId={params.templateId} onSelect={applyTemplate} />
            )}
            {currentStep === 2 && isBelt && (
              <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Шаг 2 · Ремень</p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-snugger text-ink">Что нужно подготовить</h2>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/64">
                  {[
                    'Измерьте обхват талии в месте носки ремня или возьмите замер с подходящего ремня.',
                    'Подготовьте пряжку и измерьте: внутреннюю ширину, расстояние от стержня до язычка.',
                    'Определите толщину заготовки кожи (для ремня обычно 3–4.5 мм).',
                    'Выберите ширину ремня с учётом ваших шлёвок и пряжки.',
                  ].map((tip, i) => (
                    <li key={tip} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leather-tint text-[11px] font-bold text-leather-deep tnum">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {currentStep === 2 && isCover && (
              <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Шаг 2 · Обложка</p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-snugger text-ink">Подготовка</h2>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/64">
                  {[
                    'Измерьте документ в закрытом виде (ширина × высота).',
                    'Решите, нужны ли карманы для карт внутри.',
                    'Выберите тип кожи: для обложек рекомендуется 1.0–1.6 мм.',
                    'Подберите нитку в цвет кожи или контрастную — по вашему выбору.',
                  ].map((tip, i) => (
                    <li key={tip} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leather-tint text-[11px] font-bold text-leather-deep tnum">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Step 3: Form */}
            {currentStep === 3 && isWallet && (
              <>
                <PatternForm params={params} onChange={updateParam} errors={validationMessages} />
                <ValidationMessage messages={[...validationMessages, ...geometry.warnings]} />
              </>
            )}
            {currentStep === 3 && isBelt && (
              <BeltForm params={beltParams} onChange={updateBeltParam} issues={beltGeometry.validation.issues} />
            )}
            {currentStep === 3 && isCover && (
              <CoverForm params={coverParams} onChange={updateCoverParam} onApplyPreset={applyCoverPreset} />
            )}

            {/* Step 4: Check result */}
            {currentStep === 4 && (
              <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-leather">Шаг 4 · Проверка</p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-snugger text-ink">Проверьте результат</h2>
                <p className="mt-2 text-sm leading-6 text-ink/56">
                  Убедитесь, что все размеры верны. Схема справа обновляется в реальном времени.
                </p>
                {isWallet && <ValidationMessage messages={[...validationMessages, ...geometry.warnings]} />}
                {isBelt && beltGeometry.validation.issues.length > 0 && (
                  <ValidationMessage messages={beltGeometry.validation.issues.map((i) => i.message)} />
                )}
                {isCover && coverGeometry.validation.issues.length > 0 && (
                  <ValidationMessage messages={coverGeometry.validation.issues.map((i) => i.message)} />
                )}
              </section>
            )}

            {/* Step 5: Download */}
            {currentStep === 5 && isWallet && (
              <DownloadPanel geometry={geometry} validationMessages={validationMessages} />
            )}
            {currentStep === 5 && isBelt && (
              <BeltDownload geometry={beltGeometry} params={beltParams} />
            )}
            {currentStep === 5 && isCover && (
              <CoverDownload geometry={coverGeometry} params={coverParams} />
            )}

            <WizardControls
              currentStep={currentStep}
              hasErrors={isWallet ? validationMessages.length > 0 : false}
              onBack={goBack}
              onNext={goNext}
            />
          </div>

          {/* Right column — live preview */}
          <div className="grid gap-5">
            {isWallet && (
              <>
                <PreviewTabs geometry={geometry} params={params} activeView={activePreview} />
                <section className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-soft sm:grid-cols-3">
                  {[
                    ['Производственная геометрия', `${mm(geometry.pieces[0].width)} × ${mm(geometry.pieces[0].height)}`],
                    ['Изделие', `Складной кардхолдер · ${params.pocketCount} карм.`],
                    ['Документация', `${layout.format} · ${params.printScale}% · 10 см`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-surface px-5 py-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">{label}</p>
                      <p className="mt-1.5 text-sm font-semibold text-ink tnum">{value}</p>
                    </div>
                  ))}
                </section>
              </>
            )}

            {isBelt && (
              <ModulePreviewTabs
                productLabel="Ваш ремень"
                activeView={activePreview}
                product={<BeltProductMockup geometry={beltGeometry} />}
                pattern={<BeltPreview geometry={beltGeometry} strapWidthMm={beltParams.strapWidthMm} />}
              />
            )}

            {isCover && (
              <ModulePreviewTabs
                productLabel="Ваша обложка"
                activeView={activePreview}
                product={<CoverProductMockup geometry={coverGeometry} params={coverParams} />}
                pattern={<CoverPreview geometry={coverGeometry} params={coverParams} />}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

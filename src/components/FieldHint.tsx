type FieldHintProps = {
  hint: string;
  range: string;
  error?: string;
};

export function FieldHint({ hint, range, error }: FieldHintProps) {
  return (
    <div className="grid gap-1 text-xs leading-5">
      <p className="text-ink/56">{hint}</p>
      <p className="text-ink/42">Диапазон: {range}</p>
      {error ? <p className="font-medium text-stitch">{error}</p> : null}
    </div>
  );
}

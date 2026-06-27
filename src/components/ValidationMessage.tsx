import { AlertTriangle } from 'lucide-react';

type ValidationMessageProps = {
  messages: string[];
};

export function ValidationMessage({ messages }: ValidationMessageProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-stitch/25 bg-stitch/10 p-3 text-sm leading-6 text-ink">
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <AlertTriangle size={16} />
        Проверьте параметры
      </div>
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}

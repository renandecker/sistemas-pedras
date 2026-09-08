import { AlertTriangle, OctagonX } from 'lucide-react';

export default function AlertaTecnico({ nivel, mensagem }) {
  const isErro = nivel === 'ERRO';
  return (
    <div
      className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
        isErro
          ? 'bg-red-50 text-red-800 border border-red-200'
          : 'bg-amber-50 text-amber-800 border border-amber-200'
      }`}
    >
      {isErro ? (
        <OctagonX className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
      ) : (
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
      )}
      <span>{mensagem}</span>
    </div>
  );
}

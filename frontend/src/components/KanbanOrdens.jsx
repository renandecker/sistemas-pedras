import { useEffect, useMemo, useState } from 'react';
import { GripVertical, User, CalendarClock } from 'lucide-react';
import { OrdemServicoAPI } from '../api/client.js';

const FASES = [
  { id: 'RASCUNHO', label: 'Rascunho' },
  { id: 'MEDICAO_FINA', label: 'Medição Fina' },
  { id: 'CORTE', label: 'Corte' },
  { id: 'LAPIDACAO_ACABAMENTO', label: 'Lapidação/Acabamento' },
  { id: 'MONTAGEM', label: 'Montagem' },
  { id: 'INSTALACAO', label: 'Instalação' },
  { id: 'CONCLUIDO', label: 'Concluído' },
];

export default function KanbanOrdens() {
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [arrastando, setArrastando] = useState(null);
  const [erro, setErro] = useState(null);

  function carregar() {
    setCarregando(true);
    OrdemServicoAPI.listar()
      .then(setOrdens)
      .catch(() => setErro('Não foi possível carregar as ordens de serviço.'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
  }, []);

  const colunas = useMemo(() => {
    const mapa = Object.fromEntries(FASES.map((f) => [f.id, []]));
    for (const os of ordens) {
      (mapa[os.faseAtual] ?? mapa.RASCUNHO).push(os);
    }
    return mapa;
  }, [ordens]);

  async function soltarEm(faseDestino) {
    if (!arrastando) return;
    const os = arrastando;
    setArrastando(null);
    if (os.faseAtual === faseDestino) return;

    // otimista: move localmente, reverte se a API rejeitar (ex.: pular etapa)
    const anterior = ordens;
    setOrdens((prev) =>
      prev.map((o) => (o.id === os.id ? { ...o, faseAtual: faseDestino } : o))
    );
    setErro(null);
    try {
      await OrdemServicoAPI.moverFase(os.id, { novaFase: faseDestino, alteradoPor: 'operador' });
    } catch (e) {
      setOrdens(anterior);
      setErro(e?.response?.data?.erro || 'Não é possível mover para essa fase.');
    }
  }

  return (
    <div className="max-w-full px-8 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-[#201c19]">Produção — Ordens de Serviço</h1>
        <p className="text-stone-500 mt-1">Arraste os cartões entre as fases para atualizar o andamento.</p>
      </header>

      {erro && (
        <div className="mb-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-stone-400 text-sm">Carregando...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {FASES.map((fase) => (
            <div
              key={fase.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltarEm(fase.id)}
              className="w-64 shrink-0 bg-stone-100 rounded-lg p-3"
            >
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-sm font-semibold text-stone-700">{fase.label}</h3>
                <span className="text-xs text-stone-400 bg-white rounded-full w-5 h-5 flex items-center justify-center">
                  {colunas[fase.id]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2 min-h-[80px]">
                {colunas[fase.id]?.map((os) => (
                  <div
                    key={os.id}
                    draggable
                    onDragStart={() => setArrastando(os)}
                    className="bg-white rounded-md border border-stone-200 p-3 cursor-grab active:cursor-grabbing shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <GripVertical className="w-3.5 h-3.5" />
                      {os.codigo}
                    </div>
                    <div className="text-sm font-medium text-stone-800">
                      {os.orcamento?.cliente?.nome ?? 'Cliente não informado'}
                    </div>
                    {os.responsavel && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1.5">
                        <User className="w-3.5 h-3.5" /> {os.responsavel}
                      </div>
                    )}
                    {os.dataPrevistaEntrega && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                        <CalendarClock className="w-3.5 h-3.5" /> {os.dataPrevistaEntrega}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

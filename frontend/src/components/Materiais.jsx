import { useEffect, useState } from 'react';
import { Plus, Boxes } from 'lucide-react';
import api, { MaterialAPI } from '../api/client.js';

const CATEGORIAS = ['GRANITO', 'MARMORE', 'QUARTZO', 'QUARTZITO', 'ULTRACOMPACTO'];

const NOVO_MATERIAL = {
  nome: '',
  categoria: 'GRANITO',
  densidadeKgM3: '2700',
  espessuraPadraoM: '0.020',
  precoM2: '',
  estoqueM2: '0',
  percentualPerdaPadrao: '10',
};

const fmtMoeda = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState(NOVO_MATERIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  function carregar() {
    MaterialAPI.listar().then(setMateriais).catch(() => setErro('Não foi possível carregar os materiais.'));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await api.post('/materiais', {
        nome: novo.nome,
        categoria: novo.categoria,
        densidadeKgM3: Number(novo.densidadeKgM3),
        espessuraPadraoM: Number(novo.espessuraPadraoM),
        precoM2: Number(novo.precoM2),
        estoqueM2: Number(novo.estoqueM2),
        percentualPerdaPadrao: Number(novo.percentualPerdaPadrao),
      });
      setNovo(NOVO_MATERIAL);
      setMostrarForm(false);
      carregar();
    } catch (e) {
      setErro(e?.response?.data?.erro || 'Erro ao salvar material.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-[#201c19]">Materiais</h1>
          <p className="text-stone-500 mt-1">Chapas de granito, mármore, quartzo e ultracompactos.</p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-copper-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-copper-600"
        >
          <Plus className="w-4 h-4" /> Novo material
        </button>
      </header>

      {erro && (
        <div className="mb-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2">{erro}</div>
      )}

      {mostrarForm && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="Nome">
              <input className="input" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            </Campo>
            <Campo label="Categoria">
              <select className="input" value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Densidade (kg/m³)">
              <input type="number" className="input" value={novo.densidadeKgM3} onChange={(e) => setNovo({ ...novo, densidadeKgM3: e.target.value })} />
            </Campo>
            <Campo label="Espessura padrão (m)">
              <input type="number" step="0.001" className="input" value={novo.espessuraPadraoM} onChange={(e) => setNovo({ ...novo, espessuraPadraoM: e.target.value })} />
            </Campo>
            <Campo label="Preço por m² (R$)">
              <input type="number" step="0.01" className="input" value={novo.precoM2} onChange={(e) => setNovo({ ...novo, precoM2: e.target.value })} />
            </Campo>
            <Campo label="Estoque (m²)">
              <input type="number" step="0.01" className="input" value={novo.estoqueM2} onChange={(e) => setNovo({ ...novo, estoqueM2: e.target.value })} />
            </Campo>
            <Campo label="Perda padrão (%) — 10 a 15">
              <input type="number" step="0.5" min="10" max="15" className="input" value={novo.percentualPerdaPadrao} onChange={(e) => setNovo({ ...novo, percentualPerdaPadrao: e.target.value })} />
            </Campo>
          </div>
          <button
            onClick={salvar}
            disabled={salvando || !novo.nome || !novo.precoM2}
            className="mt-4 bg-copper-500 hover:bg-copper-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {salvando ? 'Salvando...' : 'Salvar material'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-100">
        {materiais.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Boxes className="w-4 h-4 text-copper-500" strokeWidth={1.75} />
              <div>
                <div className="text-sm font-medium text-stone-800">{m.nome}</div>
                <div className="text-xs text-stone-500">
                  {m.categoria} · {m.densidadeKgM3} kg/m³ · perda padrão {m.percentualPerdaPadrao}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{fmtMoeda(m.precoM2)}/m²</div>
              <div className="text-xs text-stone-500">{m.estoqueM2} m² em estoque</div>
            </div>
          </div>
        ))}
        {materiais.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-stone-400">Nenhum material cadastrado ainda.</div>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

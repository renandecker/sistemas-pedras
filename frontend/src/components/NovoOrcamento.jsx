import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ScrollText, Scale, Ruler } from 'lucide-react';
import { MaterialAPI, AcabamentoAPI, ClienteAPI, OrcamentoAPI } from '../api/client.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import AlertaTecnico from './AlertaTecnico.jsx';

const ITEM_VAZIO = {
  materialId: '',
  acabamentoId: '',
  descricaoPeca: '',
  comprimentoM: '',
  profundidadeM: '',
  alturaFrontaoM: '0',
  alturaSaiaM: '0',
  espessuraM: '',
  percentualPerda: '10',
  projecaoBalancoCm: '0',
  possuiRecorteCuba: false,
  possuiRecorteCooktop: false,
  bordaMinimaRecorteCm: '',
  custoRecorteCuba: '0',
  custoRecorteCooktop: '0',
  metragemLinearAcabamento: '0',
};

const fmtMoeda = (v) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (v, casas = 3) => (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function NovoOrcamento() {
  const [materiais, setMateriais] = useState([]);
  const [acabamentos, setAcabamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');

  const [rascunhoItem, setRascunhoItem] = useState(ITEM_VAZIO);
  const [itens, setItens] = useState([]); // itens já confirmados no orçamento
  const [preview, setPreview] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    MaterialAPI.listar().then(setMateriais).catch(() => {});
    AcabamentoAPI.listar().then(setAcabamentos).catch(() => {});
    ClienteAPI.listar().then(setClientes).catch(() => {});
  }, []);

  const debounced = useDebouncedValue(rascunhoItem, 300);

  const materialSelecionado = materiais.find((m) => m.id === rascunhoItem.materialId);

  // recalcula em tempo real assim que os campos relevantes do rascunho mudam
  useEffect(() => {
    if (!debounced.materialId || !debounced.comprimentoM || !debounced.profundidadeM) {
      setPreview(null);
      return;
    }
    setCalculando(true);
    const payload = {
      ...debounced,
      acabamentoId: debounced.acabamentoId || null,
      comprimentoM: Number(debounced.comprimentoM),
      profundidadeM: Number(debounced.profundidadeM),
      alturaFrontaoM: Number(debounced.alturaFrontaoM || 0),
      alturaSaiaM: Number(debounced.alturaSaiaM || 0),
      espessuraM: debounced.espessuraM ? Number(debounced.espessuraM) : null,
      percentualPerda: debounced.percentualPerda ? Number(debounced.percentualPerda) : null,
      projecaoBalancoCm: Number(debounced.projecaoBalancoCm || 0),
      bordaMinimaRecorteCm: debounced.bordaMinimaRecorteCm ? Number(debounced.bordaMinimaRecorteCm) : null,
      custoRecorteCuba: Number(debounced.custoRecorteCuba || 0),
      custoRecorteCooktop: Number(debounced.custoRecorteCooktop || 0),
      metragemLinearAcabamento: Number(debounced.metragemLinearAcabamento || 0),
    };
    OrcamentoAPI.calcularItem(payload)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setCalculando(false));
  }, [debounced]);

  const totais = useMemo(() => {
    return itens.reduce(
      (acc, it) => ({
        areaUtil: acc.areaUtil + it.calc.areaUtilM2,
        areaBruta: acc.areaBruta + it.calc.areaBrutaM2,
        peso: acc.peso + it.calc.pesoCalculadoKg,
        custoMaterial: acc.custoMaterial + it.calc.custoMaterialItem,
        custoAcabamento: acc.custoAcabamento + it.calc.custoAcabamentoItem,
        custoRecortes: acc.custoRecortes + it.calc.custoRecortes,
        subtotal: acc.subtotal + it.calc.precoSubtotal,
      }),
      { areaUtil: 0, areaBruta: 0, peso: 0, custoMaterial: 0, custoAcabamento: 0, custoRecortes: 0, subtotal: 0 }
    );
  }, [itens]);

  function adicionarItem() {
    if (!preview || preview.alertaBordaInsuficiente) return;
    const material = materiais.find((m) => m.id === rascunhoItem.materialId);
    const acabamento = acabamentos.find((a) => a.id === rascunhoItem.acabamentoId);
    setItens((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        req: rascunhoItem,
        materialNome: material?.nome,
        acabamentoNome: acabamento?.nome,
        calc: preview,
      },
    ]);
    setRascunhoItem(ITEM_VAZIO);
    setPreview(null);
  }

  function removerItem(id) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  async function salvarOrcamento() {
    if (!clienteId || itens.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um cliente e adicione ao menos um item.' });
      return;
    }
    setEnviando(true);
    setMensagem(null);
    try {
      const payload = {
        clienteId,
        itens: itens.map((i) => ({
          ...i.req,
          acabamentoId: i.req.acabamentoId || null,
          comprimentoM: Number(i.req.comprimentoM),
          profundidadeM: Number(i.req.profundidadeM),
          alturaFrontaoM: Number(i.req.alturaFrontaoM || 0),
          alturaSaiaM: Number(i.req.alturaSaiaM || 0),
          espessuraM: i.req.espessuraM ? Number(i.req.espessuraM) : null,
          percentualPerda: i.req.percentualPerda ? Number(i.req.percentualPerda) : null,
          projecaoBalancoCm: Number(i.req.projecaoBalancoCm || 0),
          bordaMinimaRecorteCm: i.req.bordaMinimaRecorteCm ? Number(i.req.bordaMinimaRecorteCm) : null,
          custoRecorteCuba: Number(i.req.custoRecorteCuba || 0),
          custoRecorteCooktop: Number(i.req.custoRecorteCooktop || 0),
          metragemLinearAcabamento: Number(i.req.metragemLinearAcabamento || 0),
        })),
        taxaFreteInstalacao: 0,
      };
      await OrcamentoAPI.criar(payload);
      setMensagem({ tipo: 'sucesso', texto: 'Orçamento salvo como rascunho com sucesso.' });
      setItens([]);
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e?.response?.data?.erro || 'Erro ao salvar orçamento.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-[#201c19]">Novo Orçamento</h1>
        <p className="text-stone-500 mt-1">
          Área, peso e valores são recalculados automaticamente a cada medida informada.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-8">
        {/* coluna esquerda: formulário */}
        <div className="col-span-2 space-y-6">
          <section className="bg-white rounded-lg border border-stone-200 p-6">
            <label className="text-sm font-medium text-stone-600">Cliente</label>
            <select
              className="mt-1.5 w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </section>

          <section className="bg-white rounded-lg border border-stone-200 p-6">
            <h2 className="font-display text-xl mb-4">Adicionar peça</h2>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Descrição da peça">
                <input
                  className="input"
                  placeholder="Ex.: Bancada Cooktop"
                  value={rascunhoItem.descricaoPeca}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, descricaoPeca: e.target.value })}
                />
              </Campo>

              <Campo label="Material">
                <select
                  className="input"
                  value={rascunhoItem.materialId}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, materialId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {materiais.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome} — {fmtMoeda(m.precoM2)}/m²</option>
                  ))}
                </select>
              </Campo>

              <Campo label="Comprimento (m)">
                <input type="number" step="0.01" className="input" value={rascunhoItem.comprimentoM}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, comprimentoM: e.target.value })} />
              </Campo>
              <Campo label="Profundidade (m)">
                <input type="number" step="0.01" className="input" value={rascunhoItem.profundidadeM}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, profundidadeM: e.target.value })} />
              </Campo>
              <Campo label="Altura frontão (m)">
                <input type="number" step="0.01" className="input" value={rascunhoItem.alturaFrontaoM}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, alturaFrontaoM: e.target.value })} />
              </Campo>
              <Campo label="Altura saia (m)">
                <input type="number" step="0.01" className="input" value={rascunhoItem.alturaSaiaM}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, alturaSaiaM: e.target.value })} />
              </Campo>
              <Campo label={`Espessura (m) ${materialSelecionado ? `— padrão ${materialSelecionado.espessuraPadraoM}` : ''}`}>
                <input type="number" step="0.001" className="input" placeholder={materialSelecionado?.espessuraPadraoM ?? ''}
                  value={rascunhoItem.espessuraM}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, espessuraM: e.target.value })} />
              </Campo>
              <Campo label="Perda técnica (%) — 10 a 15">
                <input type="number" step="0.5" min="10" max="15" className="input" value={rascunhoItem.percentualPerda}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, percentualPerda: e.target.value })} />
              </Campo>

              <Campo label="Acabamento de borda">
                <select className="input" value={rascunhoItem.acabamentoId}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, acabamentoId: e.target.value })}>
                  <option value="">Nenhum</option>
                  {acabamentos.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </Campo>
              <Campo label="Metragem linear de acabamento (m)">
                <input type="number" step="0.01" className="input" value={rascunhoItem.metragemLinearAcabamento}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, metragemLinearAcabamento: e.target.value })} />
              </Campo>

              <Campo label="Projeção em balanço (cm)">
                <input type="number" step="1" className="input" value={rascunhoItem.projecaoBalancoCm}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, projecaoBalancoCm: e.target.value })} />
              </Campo>
              <Campo label="Menor borda de recorte (cm)">
                <input type="number" step="0.1" className="input" value={rascunhoItem.bordaMinimaRecorteCm}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, bordaMinimaRecorteCm: e.target.value })} />
              </Campo>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={rascunhoItem.possuiRecorteCuba}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, possuiRecorteCuba: e.target.checked })} />
                Recorte de cuba
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={rascunhoItem.possuiRecorteCooktop}
                  onChange={(e) => setRascunhoItem({ ...rascunhoItem, possuiRecorteCooktop: e.target.checked })} />
                Recorte de cooktop
              </label>
            </div>

            {/* preview em tempo real */}
            {(preview || calculando) && (
              <div className="mt-5 border-t border-stone-200 pt-4 space-y-3">
                {calculando && <p className="text-xs text-stone-400">Calculando...</p>}
                {preview && (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <MiniStat icon={Ruler} label="Área bruta" valor={`${fmtNum(preview.areaBrutaM2)} m²`} />
                      <MiniStat icon={Scale} label="Peso" valor={`${fmtNum(preview.pesoCalculadoKg, 2)} kg`} />
                      <MiniStat icon={ScrollText} label="Subtotal peça" valor={fmtMoeda(preview.precoSubtotal)} />
                    </div>
                    {preview.alertas?.map((a, i) => (
                      <AlertaTecnico key={i} nivel={a.nivel} mensagem={a.mensagem} />
                    ))}
                  </>
                )}
              </div>
            )}

            <button
              onClick={adicionarItem}
              disabled={!preview || preview.alertaBordaInsuficiente}
              className="mt-5 inline-flex items-center gap-2 bg-copper-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-copper-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Adicionar peça ao orçamento
            </button>
          </section>

          {itens.length > 0 && (
            <section className="bg-white rounded-lg border border-stone-200 p-6">
              <h2 className="font-display text-xl mb-4">Peças do orçamento</h2>
              <div className="divide-y divide-stone-100">
                {itens.map((it) => (
                  <div key={it.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{it.req.descricaoPeca || 'Peça sem descrição'}</div>
                      <div className="text-xs text-stone-500">
                        {it.materialNome} · {fmtNum(it.calc.areaBrutaM2)} m² · {fmtNum(it.calc.pesoCalculadoKg, 1)} kg
                        {it.acabamentoNome ? ` · ${it.acabamentoNome}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">{fmtMoeda(it.calc.precoSubtotal)}</span>
                      <button onClick={() => removerItem(it.id)} className="text-stone-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* coluna direita: resumo/totais */}
        <div className="col-span-1">
          <div className="sticky top-8 bg-[#171412] text-white rounded-lg p-6 space-y-4">
            <h2 className="font-display text-lg text-copper-400">Resumo do orçamento</h2>
            <ResumoLinha label="Área útil total" valor={`${fmtNum(totais.areaUtil)} m²`} />
            <ResumoLinha label="Área bruta total" valor={`${fmtNum(totais.areaBruta)} m²`} />
            <ResumoLinha label="Peso total" valor={`${fmtNum(totais.peso, 1)} kg`} />
            <div className="border-t border-white/10 my-2" />
            <ResumoLinha label="Custo material" valor={fmtMoeda(totais.custoMaterial)} />
            <ResumoLinha label="Custo acabamentos" valor={fmtMoeda(totais.custoAcabamento)} />
            <ResumoLinha label="Recortes/serviços" valor={fmtMoeda(totais.custoRecortes)} />
            <div className="border-t border-white/10 my-2" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/60">Valor total</span>
              <span className="font-display text-2xl text-copper-400">{fmtMoeda(totais.subtotal)}</span>
            </div>

            {mensagem && (
              <div className={`text-sm rounded-md px-3 py-2 ${mensagem.tipo === 'erro' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {mensagem.texto}
              </div>
            )}

            <button
              onClick={salvarOrcamento}
              disabled={enviando || itens.length === 0}
              className="w-full bg-copper-500 hover:bg-copper-600 disabled:opacity-40 text-white text-sm font-medium py-2.5 rounded-md mt-2"
            >
              {enviando ? 'Salvando...' : 'Salvar orçamento (rascunho)'}
            </button>
          </div>
        </div>
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

function MiniStat({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-md px-3 py-2">
      <Icon className="w-4 h-4 text-copper-500" strokeWidth={1.75} />
      <div>
        <div className="text-[11px] text-stone-400 leading-none">{label}</div>
        <div className="text-sm font-medium leading-tight">{valor}</div>
      </div>
    </div>
  );
}

function ResumoLinha({ label, valor }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className="font-medium">{valor}</span>
    </div>
  );
}

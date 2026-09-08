import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/colors';
import { CampoTexto } from '../components/Campo';
import Campo from '../components/Campo';
import AlertaTecnico from '../components/AlertaTecnico';
import { Card, MiniStat } from '../components/Card';
import { MaterialAPI, AcabamentoAPI, ClienteAPI, OrcamentoAPI } from '../api/client';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { fmtMoeda, fmtNum } from '../utils/format';

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

export default function NovoOrcamentoScreen() {
  const [materiais, setMateriais] = useState([]);
  const [acabamentos, setAcabamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');

  const [rascunho, setRascunho] = useState(ITEM_VAZIO);
  const [itens, setItens] = useState([]);
  const [preview, setPreview] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(null);

  useEffect(() => {
    Promise.all([MaterialAPI.listar(), AcabamentoAPI.listar(), ClienteAPI.listar()])
      .then(([m, a, c]) => {
        setMateriais(m);
        setAcabamentos(a);
        setClientes(c);
      })
      .catch((e) => setErroCarregamento(e.message));
  }, []);

  const debounced = useDebouncedValue(rascunho, 350);
  const materialSelecionado = materiais.find((m) => m.id === rascunho.materialId);

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

  const totais = useMemo(
    () =>
      itens.reduce(
        (acc, it) => ({
          areaBruta: acc.areaBruta + it.calc.areaBrutaM2,
          peso: acc.peso + it.calc.pesoCalculadoKg,
          subtotal: acc.subtotal + it.calc.precoSubtotal,
        }),
        { areaBruta: 0, peso: 0, subtotal: 0 }
      ),
    [itens]
  );

  function adicionarItem() {
    if (!preview || preview.alertaBordaInsuficiente) return;
    const material = materiais.find((m) => m.id === rascunho.materialId);
    const acabamento = acabamentos.find((a) => a.id === rascunho.acabamentoId);
    setItens((prev) => [
      ...prev,
      { id: String(Date.now()), req: rascunho, materialNome: material?.nome, acabamentoNome: acabamento?.nome, calc: preview },
    ]);
    setRascunho(ITEM_VAZIO);
    setPreview(null);
  }

  function removerItem(id) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  async function salvar() {
    if (!clienteId || itens.length === 0) {
      Alert.alert('Atenção', 'Selecione um cliente e adicione ao menos um item.');
      return;
    }
    setEnviando(true);
    try {
      const payload = {
        clienteId,
        taxaFreteInstalacao: 0,
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
      };
      await OrcamentoAPI.criar(payload);
      Alert.alert('Sucesso', 'Orçamento salvo como rascunho.');
      setItens([]);
      setClienteId('');
    } catch (e) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (erroCarregamento) {
    return (
      <View style={styles.centralizado}>
        <Ionicons name="cloud-offline-outline" size={32} color={colors.error} />
        <Text style={styles.erroTexto}>{erroCarregamento}</Text>
        <Text style={styles.erroDica}>Verifique o endereço da API em src/api/client.js.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.h1}>Novo Orçamento</Text>

      <Card style={{ marginBottom: spacing.md }}>
        <Campo label="Cliente">
          <View style={styles.pickerBorder}>
            <Picker selectedValue={clienteId} onValueChange={setClienteId}>
              <Picker.Item label="Selecione um cliente..." value="" />
              {clientes.map((c) => (
                <Picker.Item key={c.id} label={c.nome} value={c.id} />
              ))}
            </Picker>
          </View>
        </Campo>
      </Card>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.h2}>Adicionar peça</Text>

        <CampoTexto
          label="Descrição da peça"
          placeholder="Ex.: Bancada Cooktop"
          value={rascunho.descricaoPeca}
          onChangeText={(v) => setRascunho({ ...rascunho, descricaoPeca: v })}
        />

        <Campo label="Material">
          <View style={styles.pickerBorder}>
            <Picker
              selectedValue={rascunho.materialId}
              onValueChange={(v) => setRascunho({ ...rascunho, materialId: v })}
            >
              <Picker.Item label="Selecione..." value="" />
              {materiais.map((m) => (
                <Picker.Item key={m.id} label={`${m.nome} — ${fmtMoeda(m.precoM2)}/m²`} value={m.id} />
              ))}
            </Picker>
          </View>
        </Campo>

        <View style={styles.linha}>
          <View style={styles.metade}>
            <CampoTexto label="Comprimento (m)" keyboardType="decimal-pad" value={rascunho.comprimentoM}
              onChangeText={(v) => setRascunho({ ...rascunho, comprimentoM: v })} />
          </View>
          <View style={styles.metade}>
            <CampoTexto label="Profundidade (m)" keyboardType="decimal-pad" value={rascunho.profundidadeM}
              onChangeText={(v) => setRascunho({ ...rascunho, profundidadeM: v })} />
          </View>
        </View>

        <View style={styles.linha}>
          <View style={styles.metade}>
            <CampoTexto label="Altura frontão (m)" keyboardType="decimal-pad" value={rascunho.alturaFrontaoM}
              onChangeText={(v) => setRascunho({ ...rascunho, alturaFrontaoM: v })} />
          </View>
          <View style={styles.metade}>
            <CampoTexto label="Altura saia (m)" keyboardType="decimal-pad" value={rascunho.alturaSaiaM}
              onChangeText={(v) => setRascunho({ ...rascunho, alturaSaiaM: v })} />
          </View>
        </View>

        <View style={styles.linha}>
          <View style={styles.metade}>
            <CampoTexto
              label="Espessura (m)"
              placeholder={materialSelecionado?.espessuraPadraoM?.toString() ?? ''}
              keyboardType="decimal-pad"
              value={rascunho.espessuraM}
              onChangeText={(v) => setRascunho({ ...rascunho, espessuraM: v })}
            />
          </View>
          <View style={styles.metade}>
            <CampoTexto label="Perda técnica (%) 10–15" keyboardType="decimal-pad" value={rascunho.percentualPerda}
              onChangeText={(v) => setRascunho({ ...rascunho, percentualPerda: v })} />
          </View>
        </View>

        <Campo label="Acabamento de borda">
          <View style={styles.pickerBorder}>
            <Picker
              selectedValue={rascunho.acabamentoId}
              onValueChange={(v) => setRascunho({ ...rascunho, acabamentoId: v })}
            >
              <Picker.Item label="Nenhum" value="" />
              {acabamentos.map((a) => (
                <Picker.Item key={a.id} label={a.nome} value={a.id} />
              ))}
            </Picker>
          </View>
        </Campo>

        <CampoTexto
          label="Metragem linear de acabamento (m)"
          keyboardType="decimal-pad"
          value={rascunho.metragemLinearAcabamento}
          onChangeText={(v) => setRascunho({ ...rascunho, metragemLinearAcabamento: v })}
        />

        <View style={styles.linha}>
          <View style={styles.metade}>
            <CampoTexto label="Projeção em balanço (cm)" keyboardType="decimal-pad" value={rascunho.projecaoBalancoCm}
              onChangeText={(v) => setRascunho({ ...rascunho, projecaoBalancoCm: v })} />
          </View>
          <View style={styles.metade}>
            <CampoTexto label="Menor borda de recorte (cm)" keyboardType="decimal-pad" value={rascunho.bordaMinimaRecorteCm}
              onChangeText={(v) => setRascunho({ ...rascunho, bordaMinimaRecorteCm: v })} />
          </View>
        </View>

        <View style={styles.switchLinha}>
          <Text style={styles.switchLabel}>Recorte de cuba</Text>
          <Switch
            value={rascunho.possuiRecorteCuba}
            onValueChange={(v) => setRascunho({ ...rascunho, possuiRecorteCuba: v })}
            trackColor={{ true: colors.copperLight }}
          />
        </View>
        <View style={styles.switchLinha}>
          <Text style={styles.switchLabel}>Recorte de cooktop</Text>
          <Switch
            value={rascunho.possuiRecorteCooktop}
            onValueChange={(v) => setRascunho({ ...rascunho, possuiRecorteCooktop: v })}
            trackColor={{ true: colors.copperLight }}
          />
        </View>

        {calculando && (
          <View style={styles.calculandoLinha}>
            <ActivityIndicator size="small" color={colors.copper} />
            <Text style={styles.calculandoTexto}>Calculando...</Text>
          </View>
        )}

        {preview && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.statsLinha}>
              <MiniStat icon="resize-outline" label="Área bruta" valor={`${fmtNum(preview.areaBrutaM2)} m²`} />
              <MiniStat icon="barbell-outline" label="Peso" valor={`${fmtNum(preview.pesoCalculadoKg, 2)} kg`} />
              <MiniStat icon="pricetag-outline" label="Subtotal" valor={fmtMoeda(preview.precoSubtotal)} />
            </View>
            {preview.alertas?.map((a, i) => (
              <AlertaTecnico key={i} nivel={a.nivel} mensagem={a.mensagem} />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.botao, (!preview || preview.alertaBordaInsuficiente) && styles.botaoDesabilitado]}
          disabled={!preview || preview.alertaBordaInsuficiente}
          onPress={adicionarItem}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.botaoTexto}>Adicionar peça ao orçamento</Text>
        </TouchableOpacity>
      </Card>

      {itens.length > 0 && (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.h2}>Peças do orçamento</Text>
          {itens.map((it) => (
            <View key={it.id} style={styles.itemLinha}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{it.req.descricaoPeca || 'Peça sem descrição'}</Text>
                <Text style={styles.itemSub}>
                  {it.materialNome} · {fmtNum(it.calc.areaBrutaM2)} m² · {fmtNum(it.calc.pesoCalculadoKg, 1)} kg
                </Text>
              </View>
              <Text style={styles.itemValor}>{fmtMoeda(it.calc.precoSubtotal)}</Text>
              <TouchableOpacity onPress={() => removerItem(it.id)} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.resumo}>
        <Text style={styles.resumoTitulo}>Resumo</Text>
        <View style={styles.resumoLinha}>
          <Text style={styles.resumoLabel}>Área bruta total</Text>
          <Text style={styles.resumoValor}>{fmtNum(totais.areaBruta)} m²</Text>
        </View>
        <View style={styles.resumoLinha}>
          <Text style={styles.resumoLabel}>Peso total</Text>
          <Text style={styles.resumoValor}>{fmtNum(totais.peso, 1)} kg</Text>
        </View>
        <View style={styles.resumoDivider} />
        <View style={styles.resumoLinha}>
          <Text style={styles.resumoLabelGrande}>Valor total</Text>
          <Text style={styles.resumoValorGrande}>{fmtMoeda(totais.subtotal)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.botaoSalvar, (enviando || itens.length === 0) && styles.botaoDesabilitado]}
          disabled={enviando || itens.length === 0}
          onPress={salvar}
        >
          <Text style={styles.botaoTexto}>{enviando ? 'Salvando...' : 'Salvar orçamento (rascunho)'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 8 },
  erroTexto: { color: colors.error, fontWeight: '600', textAlign: 'center' },
  erroDica: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  h1: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  h2: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  linha: { flexDirection: 'row', gap: spacing.sm },
  metade: { flex: 1 },
  pickerBorder: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  switchLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: { fontSize: 13, color: colors.textSecondary },
  calculandoLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  calculandoTexto: { fontSize: 12, color: colors.textMuted },
  statsLinha: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.copper,
    borderRadius: radius.sm,
    paddingVertical: 12,
    marginTop: spacing.md,
  },
  botaoDesabilitado: { opacity: 0.4 },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitulo: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  itemSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemValor: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  resumo: {
    backgroundColor: colors.dark,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  resumoTitulo: { color: colors.copperLight, fontWeight: '700', fontSize: 15, marginBottom: spacing.sm },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  resumoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  resumoValor: { color: '#fff', fontSize: 13, fontWeight: '600' },
  resumoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: spacing.sm },
  resumoLabelGrande: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  resumoValorGrande: { color: colors.copperLight, fontSize: 22, fontWeight: '700' },
  botaoSalvar: {
    backgroundColor: colors.copper,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});

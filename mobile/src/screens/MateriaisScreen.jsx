import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, radius } from '../theme/colors';
import { MaterialAPI } from '../api/client';
import { CampoTexto } from '../components/Campo';
import Campo from '../components/Campo';
import { fmtMoeda } from '../utils/format';

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

export default function MateriaisScreen() {
  const [materiais, setMateriais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState(NOVO_MATERIAL);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    setErro(null);
    return MaterialAPI.listar().then(setMateriais).catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  function onRefresh() {
    setAtualizando(true);
    carregar().finally(() => setAtualizando(false));
  }

  async function salvarMaterial() {
    if (!novo.nome || !novo.precoM2) {
      Alert.alert('Atenção', 'Preencha ao menos nome e preço por m².');
      return;
    }
    setSalvando(true);
    try {
      await MaterialAPI.criar({
        nome: novo.nome,
        categoria: novo.categoria,
        densidadeKgM3: Number(novo.densidadeKgM3),
        espessuraPadraoM: Number(novo.espessuraPadraoM),
        precoM2: Number(novo.precoM2),
        estoqueM2: Number(novo.estoqueM2),
        percentualPerdaPadrao: Number(novo.percentualPerdaPadrao),
      });
      setNovo(NOVO_MATERIAL);
      setModalAberto(false);
      carregar();
    } catch (e) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h1}>Materiais</Text>
        <TouchableOpacity style={styles.botaoNovo} onPress={() => setModalAberto(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.botaoNovoTexto}>Novo</Text>
        </TouchableOpacity>
      </View>

      {erro && <Text style={styles.erroTexto}>{erro}</Text>}

      <FlatList
        data={materiais}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={colors.copper} />}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum material cadastrado.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcone}>
              <Ionicons name="cube-outline" size={18} color={colors.copper} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardDetalhe}>
                {item.categoria} · {item.densidadeKgM3} kg/m³ · perda {item.percentualPerdaPadrao}%
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardPreco}>{fmtMoeda(item.precoM2)}/m²</Text>
              <Text style={styles.cardEstoque}>{item.estoqueM2} m² em estoque</Text>
            </View>
          </View>
        )}
      />

      <Modal visible={modalAberto} animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: spacing.lg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.h1}>Novo material</Text>
            <TouchableOpacity onPress={() => setModalAberto(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <CampoTexto label="Nome" value={novo.nome} onChangeText={(v) => setNovo({ ...novo, nome: v })} />

          <Campo label="Categoria">
            <View style={styles.pickerBorder}>
              <Picker selectedValue={novo.categoria} onValueChange={(v) => setNovo({ ...novo, categoria: v })}>
                {CATEGORIAS.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
          </Campo>

          <CampoTexto label="Densidade (kg/m³)" keyboardType="decimal-pad" value={novo.densidadeKgM3}
            onChangeText={(v) => setNovo({ ...novo, densidadeKgM3: v })} />
          <CampoTexto label="Espessura padrão (m)" keyboardType="decimal-pad" value={novo.espessuraPadraoM}
            onChangeText={(v) => setNovo({ ...novo, espessuraPadraoM: v })} />
          <CampoTexto label="Preço por m² (R$)" keyboardType="decimal-pad" value={novo.precoM2}
            onChangeText={(v) => setNovo({ ...novo, precoM2: v })} />
          <CampoTexto label="Estoque (m²)" keyboardType="decimal-pad" value={novo.estoqueM2}
            onChangeText={(v) => setNovo({ ...novo, estoqueM2: v })} />
          <CampoTexto label="Perda padrão (%) — 10 a 15" keyboardType="decimal-pad" value={novo.percentualPerdaPadrao}
            onChangeText={(v) => setNovo({ ...novo, percentualPerdaPadrao: v })} />

          <TouchableOpacity style={styles.botaoSalvar} onPress={salvarMaterial} disabled={salvando}>
            <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar material'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  h1: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  botaoNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.copper,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  botaoNovoTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  erroTexto: { color: colors.error, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  vazio: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardIcone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNome: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  cardDetalhe: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardPreco: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  cardEstoque: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  pickerBorder: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  botaoSalvar: {
    backgroundColor: colors.copper,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  botaoSalvarTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

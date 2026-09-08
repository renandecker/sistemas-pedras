import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/colors';
import { OrdemServicoAPI } from '../api/client';

const FASES = [
  { id: 'RASCUNHO', label: 'Rascunho' },
  { id: 'MEDICAO_FINA', label: 'Medição Fina' },
  { id: 'CORTE', label: 'Corte' },
  { id: 'LAPIDACAO_ACABAMENTO', label: 'Lapidação' },
  { id: 'MONTAGEM', label: 'Montagem' },
  { id: 'INSTALACAO', label: 'Instalação' },
  { id: 'CONCLUIDO', label: 'Concluído' },
];

export default function OrdensServicoScreen() {
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  const [faseAtiva, setFaseAtiva] = useState('RASCUNHO');
  const [movendo, setMovendo] = useState(null);

  const carregar = useCallback(() => {
    setErro(null);
    return OrdemServicoAPI.listar()
      .then(setOrdens)
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  function onRefresh() {
    setAtualizando(true);
    carregar().finally(() => setAtualizando(false));
  }

  const ordensDaFase = ordens.filter((o) => o.faseAtual === faseAtiva);
  const indiceFaseAtiva = FASES.findIndex((f) => f.id === faseAtiva);
  const proximaFase = FASES[indiceFaseAtiva + 1];

  async function avancarFase(os) {
    if (!proximaFase) return;
    setMovendo(os.id);
    try {
      await OrdemServicoAPI.moverFase(os.id, { novaFase: proximaFase.id, alteradoPor: 'operador-mobile' });
      await carregar();
    } catch (e) {
      Alert.alert('Não foi possível mover', e.message);
    } finally {
      setMovendo(null);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centralizado}>
        <Ionicons name="cloud-offline-outline" size={32} color={colors.error} />
        <Text style={styles.erroTexto}>{erro}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Produção</Text>

      {/* abas horizontais de fase */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.abas} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}>
        {FASES.map((fase) => {
          const count = ordens.filter((o) => o.faseAtual === fase.id).length;
          const ativa = fase.id === faseAtiva;
          return (
            <TouchableOpacity
              key={fase.id}
              onPress={() => setFaseAtiva(fase.id)}
              style={[styles.aba, ativa && styles.abaAtiva]}
            >
              <Text style={[styles.abaTexto, ativa && styles.abaTextoAtivo]}>{fase.label}</Text>
              <View style={[styles.badge, ativa && styles.badgeAtivo]}>
                <Text style={[styles.badgeTexto, ativa && styles.badgeTextoAtivo]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={colors.copper} />}
      >
        {ordensDaFase.length === 0 && (
          <Text style={styles.vazio}>Nenhuma ordem de serviço nesta fase.</Text>
        )}

        {ordensDaFase.map((os) => (
          <View key={os.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="reader-outline" size={14} color={colors.textMuted} />
              <Text style={styles.cardCodigo}>{os.codigo}</Text>
            </View>
            <Text style={styles.cardCliente}>{os.orcamento?.cliente?.nome ?? 'Cliente não informado'}</Text>
            {os.responsavel && (
              <View style={styles.cardLinha}>
                <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.cardTexto}>{os.responsavel}</Text>
              </View>
            )}
            {os.dataPrevistaEntrega && (
              <View style={styles.cardLinha}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.cardTexto}>{os.dataPrevistaEntrega}</Text>
              </View>
            )}

            {proximaFase && (
              <TouchableOpacity
                style={styles.botaoAvancar}
                onPress={() => avancarFase(os)}
                disabled={movendo === os.id}
              >
                {movendo === os.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.botaoAvancarTexto}>Avançar para {proximaFase.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  erroTexto: { color: colors.error, fontWeight: '600' },
  h1: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  abas: { flexGrow: 0, marginBottom: spacing.sm },
  aba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  abaAtiva: { backgroundColor: colors.dark, borderColor: colors.dark },
  abaTexto: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  abaTextoAtivo: { color: '#fff' },
  badge: { backgroundColor: colors.surfaceAlt, borderRadius: 999, minWidth: 18, alignItems: 'center', paddingHorizontal: 5 },
  badgeAtivo: { backgroundColor: 'rgba(255,255,255,0.15)' },
  badgeTexto: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  badgeTextoAtivo: { color: '#fff' },
  vazio: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardCodigo: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  cardCliente: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  cardLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardTexto: { fontSize: 12, color: colors.textSecondary },
  botaoAvancar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.copper,
    borderRadius: radius.sm,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  botaoAvancarTexto: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

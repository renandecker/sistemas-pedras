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
import { colors, spacing, radius } from '../theme/colors';
import { ClienteAPI } from '../api/client';
import { CampoTexto } from '../components/Campo';

const NOVO_CLIENTE = { nome: '', telefone: '', email: '', endereco: '', documento: '' };

export default function ClientesScreen() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState(NOVO_CLIENTE);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    setErro(null);
    return ClienteAPI.listar().then(setClientes).catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  function onRefresh() {
    setAtualizando(true);
    carregar().finally(() => setAtualizando(false));
  }

  async function salvarCliente() {
    if (!novo.nome) {
      Alert.alert('Atenção', 'Informe ao menos o nome do cliente.');
      return;
    }
    setSalvando(true);
    try {
      await ClienteAPI.criar(novo);
      setNovo(NOVO_CLIENTE);
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
        <Text style={styles.h1}>Clientes</Text>
        <TouchableOpacity style={styles.botaoNovo} onPress={() => setModalAberto(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.botaoNovoTexto}>Novo</Text>
        </TouchableOpacity>
      </View>

      {erro && <Text style={styles.erroTexto}>{erro}</Text>}

      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={colors.copper} />}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum cliente cadastrado.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcone}>
              <Ionicons name="person-outline" size={18} color={colors.copper} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              {item.telefone ? <Text style={styles.cardDetalhe}>{item.telefone}</Text> : null}
              {item.email ? <Text style={styles.cardDetalhe}>{item.email}</Text> : null}
            </View>
          </View>
        )}
      />

      <Modal visible={modalAberto} animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: spacing.lg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.h1}>Novo cliente</Text>
            <TouchableOpacity onPress={() => setModalAberto(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <CampoTexto label="Nome" value={novo.nome} onChangeText={(v) => setNovo({ ...novo, nome: v })} />
          <CampoTexto label="Telefone" keyboardType="phone-pad" value={novo.telefone}
            onChangeText={(v) => setNovo({ ...novo, telefone: v })} />
          <CampoTexto label="E-mail" keyboardType="email-address" autoCapitalize="none" value={novo.email}
            onChangeText={(v) => setNovo({ ...novo, email: v })} />
          <CampoTexto label="Endereço" value={novo.endereco} onChangeText={(v) => setNovo({ ...novo, endereco: v })} />
          <CampoTexto label="CPF/CNPJ" value={novo.documento} onChangeText={(v) => setNovo({ ...novo, documento: v })} />

          <TouchableOpacity style={styles.botaoSalvar} onPress={salvarCliente} disabled={salvando}>
            <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar cliente'}</Text>
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
  cardDetalhe: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
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

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/colors';
import { API_BASE_URL } from '../api/client';

const ATALHOS = [
  { rota: 'NovoOrcamento', icone: 'document-text-outline', titulo: 'Novo Orçamento', desc: 'Calcule área, peso e valor em tempo real' },
  { rota: 'OrdensServico', icone: 'grid-outline', titulo: 'Produção', desc: 'Acompanhe as ordens de serviço por fase' },
  { rota: 'Materiais', icone: 'cube-outline', titulo: 'Materiais', desc: 'Chapas de granito, mármore, quartzo...' },
  { rota: 'Clientes', icone: 'people-outline', titulo: 'Clientes', desc: 'Cadastro e histórico de clientes' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.header}>
        <Ionicons name="diamond-outline" size={28} color={colors.copper} />
        <Text style={styles.titulo}>Marmoraria</Text>
        <Text style={styles.subtitulo}>Gestão de orçamentos e produção</Text>
      </View>

      <View style={styles.grid}>
        {ATALHOS.map((item) => (
          <TouchableOpacity
            key={item.rota}
            style={styles.cardAtalho}
            onPress={() => navigation.navigate(item.rota)}
            activeOpacity={0.7}
          >
            <View style={styles.iconeCirculo}>
              <Ionicons name={item.icone} size={22} color={colors.copper} />
            </View>
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.apiInfo}>
        <Ionicons name="server-outline" size={14} color={colors.textMuted} />
        <Text style={styles.apiTexto}>API: {API_BASE_URL}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
  titulo: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  subtitulo: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  cardAtalho: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconeCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitulo: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  cardDesc: { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
  apiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  apiTexto: { fontSize: 10, color: colors.textMuted },
});

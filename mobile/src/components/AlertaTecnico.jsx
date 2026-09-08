import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/colors';

export default function AlertaTecnico({ nivel, mensagem }) {
  const isErro = nivel === 'ERRO';
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isErro ? colors.errorBg : colors.warningBg },
      ]}
    >
      <Ionicons
        name={isErro ? 'close-circle' : 'warning'}
        size={16}
        color={isErro ? colors.error : colors.warning}
        style={{ marginTop: 1 }}
      />
      <Text style={[styles.texto, { color: isErro ? colors.error : colors.warning }]}>
        {mensagem}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  texto: {
    fontSize: 13,
    flex: 1,
  },
});

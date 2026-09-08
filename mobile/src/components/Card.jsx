import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/colors';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function MiniStat({ icon, label, valor }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.copper} />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValor}>{valor}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statValor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

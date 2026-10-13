import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoBadge } from '@/components/demo-badge';
import { AppButton, AppText, Tappable } from '@/components/ui';
import { useRole, type Role } from '@/role/role-provider';
import { radius, screenPadding, spacing, useTheme } from '@/theme';

const roles: { role: Role; title: string; text: string }[] = [
  { role: 'listener', title: 'Hörer', text: 'Jetzt läuft, Verlauf, Bewerten, Songwunsch.' },
  {
    role: 'moderator',
    title: 'Moderation',
    text: 'Überblick, Live-Ticker und Wunschliste im Studio.',
  },
];

const homes: Record<Role, Href> = { listener: '/', moderator: '/overview' };

export default function DemoSheet() {
  const colors = useTheme();
  const { role: activeRole, setRole } = useRole();

  function chooseRole(role: Role) {
    if (role === activeRole) return router.back();
    // The role guard removes the screens below the sheet, so going back would find nothing.
    setRole(role);
    router.replace(homes[role]);
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        onPress={router.back}
        accessibilityLabel="Demo-Steuerung schließen"
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.sheet, { backgroundColor: colors.surface.default }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.line.strong }]} />
        <View style={styles.titleRow}>
          <AppText variant="title" accessibilityRole="header">
            Demo-Steuerung
          </AppText>
          <DemoBadge static />
        </View>
        <AppText tone="secondary">
          Gehört nicht zur App. Kein echtes Login — der Schalter zeigt, was die jeweilige Rolle im
          Betrieb sieht.
        </AppText>

        <AppText variant="overline" tone="muted" style={styles.overline}>
          Rolle
        </AppText>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {roles.map(({ role, title, text }) => {
            const active = role === activeRole;
            return (
              <Tappable
                key={role}
                onPress={() => chooseRole(role)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={[
                  styles.option,
                  active
                    ? { borderColor: colors.accent.base, backgroundColor: colors.surface.raised }
                    : { borderColor: colors.line.default, backgroundColor: colors.surface.sunken },
                ]}
              >
                <AppText variant="headline">{title}</AppText>
                <AppText tone="secondary">{text}</AppText>
              </Tappable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <AppButton
            label="Components"
            variant="secondary"
            onPress={() => router.replace('/components')}
            style={styles.flex}
          />
          <AppButton label="Schließen" onPress={router.back} style={styles.flex} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    gap: spacing.md,
    padding: screenPadding.listener,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  overline: { marginTop: spacing.sm },
  options: { gap: spacing.md },
  option: { gap: spacing.xs, padding: spacing.xl, borderWidth: 1, borderRadius: radius.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  flex: { flex: 1 },
});

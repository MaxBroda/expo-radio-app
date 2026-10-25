import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoBadge } from '@/components/demo-badge';
import { AppButton, AppText, Pill, Tappable } from '@/components/ui';
import { demoMoment } from '@/demo/demo-clock';
import { useDemo, useDemoFlags, useDemoSlot } from '@/demo/demo-provider';
import type { DemoFlags } from '@/demo/demo-settings';
import { useRole, type Role } from '@/role/role-provider';
import { schedule, type Slot } from '@/seed/schedule';
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

type Toggle = {
  label: string;
  isOn: (f: DemoFlags) => boolean;
  toggle: (f: DemoFlags) => Partial<DemoFlags>;
};

const toggles: Toggle[] = [
  {
    label: 'Lädt',
    isOn: (f) => f.connection === 'loading',
    toggle: (f) => ({ connection: f.connection === 'loading' ? 'online' : 'loading' }),
  },
  {
    label: 'Keine Verbindung',
    isOn: (f) => f.connection === 'offline',
    toggle: (f) => ({ connection: f.connection === 'offline' ? 'online' : 'offline' }),
  },
  {
    label: 'Verlauf leer',
    isOn: (f) => f.emptyHistory,
    toggle: (f) => ({ emptyHistory: !f.emptyHistory }),
  },
  {
    label: 'Senden schlägt fehl',
    isOn: (f) => f.sendFails,
    toggle: (f) => ({ sendFails: !f.sendFails }),
  },
  {
    label: 'Bewertungsfenster zu',
    isOn: (f) => f.ratingWindowClosed,
    toggle: (f) => ({ ratingWindowClosed: !f.ratingWindowClosed }),
  },
  {
    label: 'Kontingent erschöpft',
    isOn: (f) => f.quotaExhausted,
    toggle: (f) => ({ quotaExhausted: !f.quotaExhausted }),
  },
  { label: 'Ansturm', isOn: (f) => f.rush, toggle: (f) => ({ rush: !f.rush }) },
];

const defaultSlot = schedule.slot('feierabend');

function slotLabel(slot: Slot) {
  return `${String(Math.floor(slot.start / 60)).padStart(2, '0')}:00 ${slot.title}`;
}

export default function DemoSheet() {
  const colors = useTheme();
  const { role: activeRole, setRole } = useRole();
  const { clock, settings } = useDemo();
  const flags = useDemoFlags();
  const activeSlot = useDemoSlot();
  const activeCount = toggles.filter((t) => t.isOn(flags)).length;

  function chooseRole(role: Role) {
    if (role === activeRole) return router.back();
    // The role guard removes the screens below the sheet, so going back would find nothing.
    setRole(role);
    router.replace(homes[role]);
  }

  function resetAll() {
    settings.reset();
    clock.jumpTo(demoMoment(defaultSlot));
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        onPress={() => router.back()}
        accessibilityLabel="Demo-Steuerung schließen"
      />
      <SafeAreaView
        edges={['bottom']}
        style={[styles.sheet, { backgroundColor: colors.surface.default }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.line.strong }]} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                      : {
                          borderColor: colors.line.default,
                          backgroundColor: colors.surface.sunken,
                        },
                  ]}
                >
                  <AppText variant="headline">{title}</AppText>
                  <AppText tone="secondary">{text}</AppText>
                </Tappable>
              );
            })}
          </View>

          <AppText variant="overline" tone="muted" style={styles.overline}>
            Sendung
          </AppText>
          <View style={styles.pills}>
            {schedule.all.map((slot) => (
              <Pill
                key={slot.key}
                label={slotLabel(slot)}
                size="large"
                active={slot.key === activeSlot.key}
                onPress={() => clock.jumpTo(demoMoment(slot))}
              />
            ))}
          </View>

          <AppText variant="overline" tone="muted" style={styles.overline}>
            Zustände schalten
          </AppText>
          <View style={styles.pills}>
            {toggles.map((t) => (
              <Pill
                key={t.label}
                label={t.label}
                size="large"
                active={t.isOn(flags)}
                onPress={() => settings.set(t.toggle(flags))}
              />
            ))}
          </View>
          <AppText variant="caption" tone="muted">
            {activeCount === 0
              ? 'Kein Zustand aktiv — die Screens zeigen den Normalfall.'
              : `${activeCount} ${activeCount === 1 ? 'Zustand' : 'Zustände'} aktiv — die Screens zeigen jetzt die jeweilige Variante.`}
          </AppText>

          <AppButton
            label="Components"
            variant="secondary"
            size="compact"
            onPress={() => router.replace('/components')}
            style={styles.components}
          />
        </ScrollView>
        <View style={styles.actions}>
          <AppButton
            label="Alles zurücksetzen"
            variant="secondary"
            onPress={resetAll}
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
    maxHeight: '90%',
    gap: spacing.md,
    padding: screenPadding.listener,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  overline: { marginTop: spacing.sm },
  content: { gap: spacing.md },
  options: { gap: spacing.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  components: { alignSelf: 'flex-start', marginTop: spacing.sm },
  option: { gap: spacing.xs, padding: spacing.xl, borderWidth: 1, borderRadius: radius.lg },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});

import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoBadge } from '@/components/demo-badge';
import { AppButton, AppText, Pill, Tappable } from '@/components/ui';
import { demoMoment } from '@/demo/demo-clock';
import { useDemo, useDemoFlags, useDemoSlot } from '@/demo/demo-provider';
import type { DemoFlags, DemoListener } from '@/demo/demo-settings';
import { useRole, type Role } from '@/role/role-provider';
import { schedule, type Slot } from '@/seed/schedule';
import {
  radius,
  screenPadding,
  spacing,
  useColorSchemePreference,
  useTheme,
  type ColorSchemePreference,
} from '@/theme';

type RoleChoice = {
  value: Role;
  title: string;
  description: string;
};

type StateChoice = {
  label: string;
  selected: (flags: DemoFlags) => boolean;
  change: (flags: DemoFlags) => Partial<DemoFlags>;
};

type ThemeChoice = {
  value: ColorSchemePreference;
  label: string;
};

const roleChoices: readonly RoleChoice[] = [
  {
    value: 'listener',
    title: 'Hörer',
    description: 'Jetzt läuft, Verlauf, Bewerten, Songwunsch.',
  },
  {
    value: 'moderator',
    title: 'Moderation',
    description: 'Überblick, Live-Ticker und Wunschliste im Studio.',
  },
];

const roleHomes: Record<Role, Href> = {
  listener: '/',
  moderator: '/overview',
};

const stateChoices: readonly StateChoice[] = [
  {
    label: 'Lädt',
    selected: ({ connection }) => connection === 'loading',
    change: ({ connection }) => ({ connection: connection === 'loading' ? 'online' : 'loading' }),
  },
  {
    label: 'Keine Verbindung',
    selected: ({ connection }) => connection === 'offline',
    change: ({ connection }) => ({ connection: connection === 'offline' ? 'online' : 'offline' }),
  },
  {
    label: 'Verlauf leer',
    selected: ({ emptyHistory }) => emptyHistory,
    change: ({ emptyHistory }) => ({ emptyHistory: !emptyHistory }),
  },
  {
    label: 'Senden schlägt fehl',
    selected: ({ sendFails }) => sendFails,
    change: ({ sendFails }) => ({ sendFails: !sendFails }),
  },
  {
    label: 'Bewertungsfenster zu',
    selected: ({ ratingWindowClosed }) => ratingWindowClosed,
    change: ({ ratingWindowClosed }) => ({ ratingWindowClosed: !ratingWindowClosed }),
  },
  {
    label: 'Kontingent erschöpft',
    selected: ({ quotaExhausted }) => quotaExhausted,
    change: ({ quotaExhausted }) => ({ quotaExhausted: !quotaExhausted }),
  },
  {
    label: 'Ansturm',
    selected: ({ rush }) => rush,
    change: ({ rush }) => ({ rush: !rush }),
  },
];

const listeners: DemoListener[] = [1, 2, 3];

const themeChoices: readonly ThemeChoice[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

const initialSlot = schedule.slot('feierabend');

function formatSlot(slot: Slot): string {
  const hour = Math.floor(slot.start / 60)
    .toString()
    .padStart(2, '0');
  return `${hour}:00 ${slot.title}`;
}

function stateSummary(count: number): string {
  if (count === 0) return 'Kein Zustand aktiv — die Screens zeigen den Normalfall.';
  const noun = count === 1 ? 'Zustand' : 'Zustände';
  return `${count} ${noun} aktiv — die Screens zeigen jetzt die jeweilige Variante.`;
}

export default function DemoSheet() {
  const colors = useTheme();
  const { role, setRole } = useRole();
  const { clock, settings } = useDemo();
  const flags = useDemoFlags();
  const currentSlot = useDemoSlot();
  const { preference, setPreference } = useColorSchemePreference();
  const selectedStates = stateChoices.reduce(
    (count, choice) => count + Number(choice.selected(flags)),
    0,
  );

  const selectRole = (nextRole: Role) => {
    if (nextRole === role) {
      router.back();
      return;
    }

    setRole(nextRole);
    router.replace(roleHomes[nextRole]);
  };

  const resetDemo = () => {
    settings.reset();
    clock.jumpTo(demoMoment(initialSlot));
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityLabel="Demo-Steuerung schließen"
        onPress={() => router.back()}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
      />

      <SafeAreaView
        edges={['bottom']}
        style={[styles.panel, { backgroundColor: colors.surface.default }]}
      >
        <View style={[styles.dragHandle, { backgroundColor: colors.line.strong }]} />

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.headingRow}>
            <AppText accessibilityRole="header" variant="title">
              Demo-Steuerung
            </AppText>
            <DemoBadge static />
          </View>

          <AppText tone="secondary">
            Gehört nicht zur App. Kein echtes Login — der Schalter zeigt, was die jeweilige Rolle im
            Betrieb sieht.
          </AppText>

          <ControlSection title="Rolle">
            <RoleSelector activeRole={role} onSelect={selectRole} />
          </ControlSection>

          <ControlSection title="Simulierter Hörer">
            <View style={styles.pillRow}>
              {listeners.map((listener) => (
                <Pill
                  key={listener}
                  label={`Hörer ${listener}`}
                  size="large"
                  active={flags.listener === listener}
                  onPress={() => settings.set({ listener })}
                />
              ))}
            </View>
          </ControlSection>

          <ControlSection title="Sendung">
            <SlotSelector
              activeKey={currentSlot.key}
              onSelect={(slot) => clock.jumpTo(demoMoment(slot))}
            />
          </ControlSection>

          <ControlSection title="Zustände schalten">
            <StateSelector
              flags={flags}
              onToggle={(choice) => settings.set(choice.change(flags))}
            />
            <AppText variant="caption" tone="muted">
              {stateSummary(selectedStates)}
            </AppText>
          </ControlSection>

          <ControlSection title="Theme">
            <ThemeSelector
              value={preference}
              onSelect={(nextPreference) => setPreference(nextPreference)}
            />
          </ControlSection>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label="Alles zurücksetzen"
            variant="secondary"
            onPress={resetDemo}
            style={styles.footerButton}
          />
          <AppButton label="Schließen" onPress={router.back} style={styles.footerButton} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ControlSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" tone="muted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function RoleSelector({
  activeRole,
  onSelect,
}: {
  activeRole: Role;
  onSelect: (role: Role) => void;
}) {
  const colors = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={styles.roleList}>
      {roleChoices.map((choice) => {
        const selected = choice.value === activeRole;
        const surface = selected ? colors.surface.raised : colors.surface.sunken;
        const border = selected ? colors.accent.base : colors.line.default;

        return (
          <Tappable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onSelect(choice.value)}
            style={[styles.roleCard, { backgroundColor: surface, borderColor: border }]}
          >
            <AppText variant="headline">{choice.title}</AppText>
            <AppText tone="secondary">{choice.description}</AppText>
          </Tappable>
        );
      })}
    </View>
  );
}

function SlotSelector({
  activeKey,
  onSelect,
}: {
  activeKey: Slot['key'];
  onSelect: (slot: Slot) => void;
}) {
  return (
    <View style={styles.pillRow}>
      {schedule.all.map((slot) => (
        <Pill
          key={slot.key}
          label={formatSlot(slot)}
          size="large"
          active={slot.key === activeKey}
          onPress={() => onSelect(slot)}
        />
      ))}
    </View>
  );
}

function StateSelector({
  flags,
  onToggle,
}: {
  flags: DemoFlags;
  onToggle: (choice: StateChoice) => void;
}) {
  return (
    <View style={styles.pillRow}>
      {stateChoices.map((choice) => (
        <Pill
          key={choice.label}
          label={choice.label}
          size="large"
          active={choice.selected(flags)}
          onPress={() => onToggle(choice)}
        />
      ))}
    </View>
  );
}

function ThemeSelector({
  value,
  onSelect,
}: {
  value: ColorSchemePreference;
  onSelect: (value: ColorSchemePreference) => void;
}) {
  return (
    <View style={styles.pillRow}>
      {themeChoices.map((choice) => (
        <Pill
          key={choice.value}
          label={choice.label}
          size="large"
          active={choice.value === value}
          onPress={() => onSelect(choice.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    maxHeight: '90%',
    gap: spacing.md,
    padding: screenPadding.listener,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  dragHandle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
  },
  body: {
    gap: spacing.md,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  roleList: {
    gap: spacing.md,
  },
  roleCard: {
    gap: spacing.xs,
    padding: spacing.xl,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

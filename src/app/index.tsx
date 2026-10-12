import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppText, Card, Pill, Skeleton, StatusBanner, TextField } from '@/components/ui';
import { screenPadding, spacing, useTheme } from '@/theme';

const filters = [
  { key: 'all', label: 'Alle 12' },
  { key: 'tracks', label: 'Titel 8' },
  { key: 'shows', label: 'Moderation 4' },
];

export default function ComponentShowcase() {
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('all');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="wordmark">WELLE 7</AppText>

        <Section title="Typografie">
          <AppText variant="display">Nordlicht</AppText>
          <AppText variant="title">Song wünschen</AppText>
          <AppText variant="headline">Playlist bewerten</AppText>
          <AppText tone="secondary">Halbmond Kollektiv</AppText>
          <AppText variant="label" tone="muted">
            Lena Osterkamp · bis 20:00
          </AppText>
          <AppText variant="mono" tone="muted">
            Spätsommerkanal · 2024 · 3:52
          </AppText>
        </Section>

        <Section title="Buttons">
          <AppButton label="Playlist bewerten" onPress={() => {}} />
          <AppButton label="Song wünschen" variant="secondary" onPress={() => {}} />
          <AppButton label="Wunsch absenden" disabled onPress={() => {}} />
          <View style={styles.row}>
            <AppButton label="übernehmen" size="compact" onPress={() => {}} style={styles.flex} />
            <AppButton
              label="ablehnen"
              size="compact"
              variant="secondary"
              onPress={() => {}}
              style={styles.flex}
            />
          </View>
        </Section>

        <Section title="Pills">
          <View style={styles.row}>
            {filters.map(({ key, label }) => (
              <Pill
                key={key}
                size="large"
                label={label}
                active={filter === key}
                onPress={() => setFilter(key)}
              />
            ))}
          </View>
          <Pill label="LIVE 18:42" />
        </Section>

        <Section title="Karten">
          <Card>
            <AppText variant="bodyStrong">Feierabendwelle</AppText>
            <AppText variant="label" tone="muted">
              Lena Osterkamp · bis 20:00
            </AppText>
          </Card>
          <Card tone="sunken">
            <AppText variant="bodyStrong">surface.sunken</AppText>
          </Card>
          <Card tone="raised">
            <AppText variant="bodyStrong">surface.raised</AppText>
          </Card>
        </Section>

        <Section title="Eingaben">
          <TextField
            label="Suche"
            hideLabel
            value={search}
            onChangeText={setSearch}
            placeholder="Titel oder Interpret suchen"
          />
          <TextField
            label="Kommentar"
            optional
            multiline
            maxLength={240}
            value={comment}
            onChangeText={setComment}
          />
          <TextField
            label="Suche gesperrt"
            hideLabel
            disabled
            value=""
            onChangeText={() => {}}
            placeholder="Suche pausiert bis 19:00"
          />
        </Section>

        <Section title="Statusmeldungen">
          <StatusBanner
            tone="error"
            title="Keine Verbindung zum Sender"
            text="Letzter bekannter Stand — zuletzt aktualisiert vor 3 Minuten."
          />
          <StatusBanner
            tone="info"
            title="Schon bewertet"
            text="Pro Titel zählt eine Stimme. Deine Wertung: 4 von 5."
          />
          <StatusBanner tone="success" title="Danke, ist angekommen" />
        </Section>

        <Section title="Skeleton">
          <View style={styles.row}>
            <Skeleton width={48} height={48} radius={8} />
            <View style={[styles.flex, styles.skeletonLines]}>
              <Skeleton width="70%" height={14} />
              <Skeleton width="44%" height={11} />
            </View>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" tone="muted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: screenPadding.listener, gap: spacing.xxl },
  section: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  flex: { flex: 1 },
  skeletonLines: { gap: spacing.sm },
});

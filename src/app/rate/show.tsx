import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/modal-header';
import { AppText, Card, StatusBanner } from '@/components/ui';
import type { Show } from '@/domain/show';
import { useStations } from '@/stations/stations-provider';
import { screenPadding } from '@/theme';

export default function RateShowScreen() {
  const { playout } = useStations();
  const [show, setShow] = useState<Show | 'loading' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    playout.getNowPlaying().then(
      (current) => {
        if (active) setShow(current.show);
      },
      () => {
        if (active) setShow('error');
      },
    );
    return () => {
      active = false;
    };
  }, [playout]);

  return (
    <SafeAreaView style={styles.screen}>
      <ModalHeader title="Moderation bewerten" />
      <View style={styles.content}>
        {show === 'loading' ? (
          <Card
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Sendung wird geladen"
          >
            <AppText tone="muted">Sendung wird geladen …</AppText>
          </Card>
        ) : show === 'error' ? (
          <StatusBanner tone="error" title="Sendung gerade nicht verfügbar" />
        ) : (
          <Card>
            <AppText variant="headline">{show.hostName ?? 'Keine Moderation'}</AppText>
            <AppText tone="secondary">{show.title}</AppText>
            <AppText variant="mono" tone="muted">
              {show.startsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {show.endsAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </AppText>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: screenPadding.listener },
});

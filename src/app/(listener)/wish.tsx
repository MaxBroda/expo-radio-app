import { router, useFocusEffect } from 'expo-router';
import { CircleAlert, Search, WifiOff } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AreaScreen } from '@/components/area-screen';
import { AppButton, AppText, Skeleton, StatusBanner, TextField } from '@/components/ui';
import { CoverPlaceholder } from '@/components/wish/cover-placeholder';
import { QuotaMeter } from '@/components/wish/quota-meter';
import { useTrackSearch, type TrackSearch } from '@/components/wish/use-track-search';
import {
  alreadyRequestedText,
  clockTime,
  problemText,
  trackLine,
  votesLabel,
} from '@/components/wish/wish-format';
import { WishOption } from '@/components/wish/wish-option';
import type { Track } from '@/domain/track';
import type { Wish, WishedSong } from '@/domain/wish';
import type { WishQuota } from '@/domain/wish-quota';
import { validateWish, wishLimits, WishRejectedError } from '@/domain/wish-validation';
import type { MusicDatabase } from '@/ports/music-database';
import type { WishSystem } from '@/ports/wish-system';
import { useStations } from '@/stations/stations-provider';
import { screenPadding, spacing, touchTarget, useTheme } from '@/theme';

type Choice = { kind: 'catalog'; track: Track } | { kind: 'freeText'; description: string };

type Popular = { wish: Wish; track?: Track };

const popularCount = 3;

function toSong(choice: Choice): WishedSong {
  return choice.kind === 'catalog'
    ? { kind: 'catalog', trackId: choice.track.id }
    : { kind: 'freeText', description: choice.description };
}

async function loadPopular(wishSystem: WishSystem, musicDatabase: MusicDatabase) {
  const open = (await wishSystem.list())
    .filter((wish) => wish.status === 'open')
    .sort((a, b) => b.votes - a.votes)
    .slice(0, popularCount);
  return Promise.all(
    open.map(async (wish): Promise<Popular> => ({
      wish,
      track:
        wish.song.kind === 'catalog' ? await musicDatabase.lookup(wish.song.trackId) : undefined,
    })),
  );
}

export default function WishScreen() {
  const colors = useTheme();
  const { wishSystem, musicDatabase } = useStations();
  const [query, setQuery] = useState('');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [greeting, setGreeting] = useState('');
  const [quota, setQuota] = useState<WishQuota | null>(null);
  const [popular, setPopular] = useState<Popular[] | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const search = useTrackSearch(query);

  // Quota and list change in the studio and through the demo sheet, so both reload on every visit.
  useFocusEffect(
    useCallback(() => {
      let current = true;
      setSendFailed(false);
      setAlreadyRequested(false);
      Promise.all([wishSystem.quota(), loadPopular(wishSystem, musicDatabase)]).then(
        ([nextQuota, nextPopular]) => {
          if (!current) return;
          setQuota(nextQuota);
          setPopular(nextPopular);
          setUnreachable(false);
        },
        () => current && setUnreachable(true),
      );
      return () => {
        current = false;
      };
    }, [wishSystem, musicDatabase]),
  );

  const validation = validateWish({ song: choice ? toSong(choice) : undefined, greeting });
  const exhausted = quota?.exhausted ?? false;
  const resetTime = quota ? clockTime(quota.resetsAt) : '';
  const canSend =
    quota !== null && !exhausted && !unreachable && validation.ok && !sending && !alreadyRequested;

  function changeQuery(text: string) {
    setQuery(text);
    setChoice(null);
    setSendFailed(false);
    setAlreadyRequested(false);
  }

  function choose(next: Choice) {
    setChoice(next);
    setSendFailed(false);
    setAlreadyRequested(false);
  }

  async function send() {
    if (!validation.ok) return;
    setSending(true);
    setSendFailed(false);
    try {
      const wish = await wishSystem.submitRequest(validation.input);
      setQuery('');
      setChoice(null);
      setGreeting('');
      router.push({
        pathname: '/wish/sent',
        params: { id: wish.id, greeting: validation.input.greeting ?? '' },
      });
    } catch (error) {
      if (error instanceof WishRejectedError && error.reason === 'quotaExhausted') {
        wishSystem.quota().then(setQuota, () => setUnreachable(true));
      } else if (error instanceof WishRejectedError && error.reason === 'alreadyRequested') {
        setAlreadyRequested(true);
      } else {
        setSendFailed(true);
      }
    } finally {
      setSending(false);
    }
  }

  let hint: { text: string; tone: 'muted' | 'accent' | 'critical' };
  if (exhausted) {
    hint = { text: `Kontingent erschöpft, ab ${resetTime} wieder möglich.`, tone: 'muted' };
  } else if (alreadyRequested) {
    hint = { text: alreadyRequestedText, tone: 'critical' };
  } else if (!choice) {
    hint = { text: problemText.songMissing, tone: 'muted' };
  } else if (!validation.ok) {
    hint = { text: problemText[validation.problems[0]], tone: 'critical' };
  } else {
    const label = choice.kind === 'catalog' ? choice.track.title : 'Freitext-Wunsch';
    hint = { text: `Gewählt: ${label}`, tone: 'accent' };
  }

  return (
    <AreaScreen area="listener">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <AppText variant="display" accessibilityRole="header">
          Song wünschen
        </AppText>

        <TextField
          label="Titel oder Interpret suchen"
          hideLabel
          value={query}
          onChangeText={changeQuery}
          placeholder={
            exhausted ? `Suche pausiert bis ${resetTime}` : 'Titel oder Interpret suchen'
          }
          disabled={exhausted || unreachable}
          icon={<Search size={20} color={query ? colors.accent.base : colors.text.muted} />}
        />

        {quota && <QuotaMeter quota={quota} />}

        {unreachable ? (
          <StatusBanner
            tone="error"
            title="Keine Verbindung"
            text="Wünsche können gerade nicht gesendet werden. Versuch es gleich noch einmal."
            icon={<WifiOff size={20} color={colors.critical.base} />}
          />
        ) : exhausted ? (
          <StatusBanner
            tone="error"
            title="Kontingent erschöpft"
            text={`Drei Wünsche pro Stunde, damit nicht einzelne Hörer die Liste bestimmen. Um ${resetTime} ist wieder einer frei.`}
            icon={<CircleAlert size={20} color={colors.critical.base} />}
          />
        ) : (
          <>
            <Choices
              search={search}
              query={query}
              popular={popular}
              choice={choice}
              onChoose={choose}
            />
            <TextField
              label="Gruß an die Moderation"
              optional
              multiline
              lines={2}
              maxLength={wishLimits.greetingMax}
              value={greeting}
              onChangeText={setGreeting}
              placeholder="Grüße aus der Spätschicht …"
            />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.line.default }]}>
        {sendFailed && !exhausted && !unreachable && (
          <StatusBanner
            tone="error"
            title="Wunsch nicht gesendet"
            text="Das Studio ist gerade nicht erreichbar. Deine Auswahl bleibt erhalten."
          />
        )}
        <AppText variant="label" tone={hint.tone}>
          {hint.text}
        </AppText>
        <AppButton
          label={sending ? 'Wird gesendet …' : 'Wunsch absenden'}
          onPress={send}
          disabled={!canSend}
        />
      </View>
    </AreaScreen>
  );
}

type ChoicesProps = {
  search: TrackSearch;
  query: string;
  popular: Popular[] | null;
  choice: Choice | null;
  onChoose: (choice: Choice) => void;
};

function Choices({ search, query, popular, choice, onChoose }: ChoicesProps) {
  const colors = useTheme();
  const isTrack = (track: Track) => choice?.kind === 'catalog' && choice.track.id === track.id;
  const isText = (text: string) => choice?.kind === 'freeText' && choice.description === text;

  if (search.status === 'idle') {
    return (
      <Section title="Oft gewünscht heute">
        {popular === null
          ? [0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={74} radius={14} />)
          : popular.map(({ wish, track }) =>
              wish.song.kind === 'catalog' ? (
                track && (
                  <WishOption
                    key={wish.id}
                    title={track.title}
                    subtitle={trackLine(track, wish.votes)}
                    selected={isTrack(track)}
                    onPress={() => onChoose({ kind: 'catalog', track })}
                    leading={<CoverPlaceholder seed={track.id} />}
                  />
                )
              ) : (
                <WishOption
                  key={wish.id}
                  title="Freitext-Wunsch"
                  subtitle={`„${wish.song.description}“ · ${votesLabel(wish.votes)}`}
                  selected={isText(wish.song.description)}
                  onPress={() =>
                    wish.song.kind === 'freeText' &&
                    onChoose({ kind: 'freeText', description: wish.song.description })
                  }
                  leading={<CoverPlaceholder seed={wish.id} />}
                />
              ),
            )}
      </Section>
    );
  }

  if (search.status === 'searching') {
    return (
      <Section title="Suche im Katalog …">
        <Skeleton width="100%" height={74} radius={14} />
        <Skeleton width="100%" height={74} radius={14} />
      </Section>
    );
  }

  if (search.status === 'failed') {
    return (
      <StatusBanner
        tone="error"
        title="Suche nicht erreichbar"
        text="Der Musikkatalog antwortet gerade nicht."
        icon={<WifiOff size={20} color={colors.critical.base} />}
      />
    );
  }

  if (search.tracks.length > 0) {
    return (
      <Section title={`${search.tracks.length} Treffer im Katalog · einen auswählen`}>
        {search.tracks.map((track) => (
          <WishOption
            key={track.id}
            title={track.title}
            subtitle={trackLine(track)}
            selected={isTrack(track)}
            onPress={() => onChoose({ kind: 'catalog', track })}
            leading={<CoverPlaceholder seed={track.id} />}
          />
        ))}
      </Section>
    );
  }

  const description = query.trim();
  return (
    <View style={styles.section}>
      <View style={styles.noHit}>
        <View style={[styles.noHitIcon, { borderColor: colors.line.strong }]}>
          <Search size={20} color={colors.text.muted} />
        </View>
        <View style={styles.noHitText}>
          <AppText variant="bodyStrong">Kein Treffer im Katalog</AppText>
          <AppText tone="secondary">Deine Beschreibung geht so ins Studio.</AppText>
        </View>
      </View>
      <WishOption
        eyebrow="Als Freitext-Wunsch"
        title={`„${description}“`}
        subtitle=""
        selected={isText(description)}
        onPress={() => onChoose({ kind: 'freeText', description })}
      />
    </View>
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
  scroll: { flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  section: { gap: spacing.sm },
  noHit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noHitIcon: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noHitText: { flex: 1 },
  footer: {
    gap: spacing.md,
    marginHorizontal: -screenPadding.listener,
    paddingHorizontal: screenPadding.listener,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

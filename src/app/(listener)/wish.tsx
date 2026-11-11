import { router, useFocusEffect } from 'expo-router';
import { CircleAlert, Search, WifiOff } from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
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
import { useDemo, useDemoFlags } from '@/demo/demo-provider';
import type { Track } from '@/domain/track';
import type { Wish, WishedSong } from '@/domain/wish';
import type { WishQuota } from '@/domain/wish-quota';
import { validateWish, wishLimits, WishRejectedError } from '@/domain/wish-validation';
import type { MusicDatabase } from '@/ports/music-database';
import type { WishSystem } from '@/ports/wish-system';
import { useStations } from '@/stations/stations-provider';
import { screenPadding, spacing, touchTarget, useTheme } from '@/theme';

type Choice = { kind: 'catalog'; track: Track } | { kind: 'freeText'; description: string };

type PopularWish = {
  wish: Wish;
  track?: Track;
};

type ScreenState = {
  query: string;
  choice: Choice | null;
  greeting: string;
  quota: WishQuota | null;
  popular: PopularWish[] | null;
  unreachable: boolean;
  sending: boolean;
  sendFailed: boolean;
  alreadyRequested: boolean;
};

type ScreenAction =
  | { type: 'focusStarted' }
  | { type: 'contentLoaded'; quota: WishQuota; popular: PopularWish[] }
  | { type: 'contentFailed' }
  | { type: 'queryChanged'; query: string }
  | { type: 'choiceChanged'; choice: Choice }
  | { type: 'greetingChanged'; greeting: string }
  | { type: 'sendingStarted' }
  | { type: 'sendingFinished' }
  | { type: 'requestSent' }
  | { type: 'quotaLoaded'; quota: WishQuota }
  | { type: 'quotaFailed' }
  | { type: 'duplicateRejected' }
  | { type: 'requestFailed' };

const popularLimit = 3;

const initialState: ScreenState = {
  query: '',
  choice: null,
  greeting: '',
  quota: null,
  popular: null,
  unreachable: false,
  sending: false,
  sendFailed: false,
  alreadyRequested: false,
};

function reduceScreen(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case 'focusStarted':
      return { ...state, sendFailed: false, alreadyRequested: false };
    case 'contentLoaded':
      return {
        ...state,
        quota: action.quota,
        popular: action.popular,
        unreachable: false,
      };
    case 'contentFailed':
      return { ...state, unreachable: true };
    case 'queryChanged':
      return {
        ...state,
        query: action.query,
        choice: null,
        sendFailed: false,
        alreadyRequested: false,
      };
    case 'choiceChanged':
      return {
        ...state,
        choice: action.choice,
        sendFailed: false,
        alreadyRequested: false,
      };
    case 'greetingChanged':
      return { ...state, greeting: action.greeting };
    case 'sendingStarted':
      return { ...state, sending: true, sendFailed: false };
    case 'sendingFinished':
      return { ...state, sending: false };
    case 'requestSent':
      return { ...state, query: '', choice: null, greeting: '' };
    case 'quotaLoaded':
      return { ...state, quota: action.quota };
    case 'quotaFailed':
      return { ...state, unreachable: true };
    case 'duplicateRejected':
      return { ...state, alreadyRequested: true };
    case 'requestFailed':
      return { ...state, sendFailed: true };
  }
}

function choiceToSong(choice: Choice): WishedSong {
  if (choice.kind === 'catalog') {
    return { kind: 'catalog', trackId: choice.track.id };
  }

  return { kind: 'freeText', description: choice.description };
}

async function fetchPopular(
  wishSystem: WishSystem,
  musicDatabase: MusicDatabase,
): Promise<PopularWish[]> {
  const wishes = await wishSystem.list();
  const popular = wishes
    .filter(({ status }) => status === 'open')
    .sort((left, right) => right.votes - left.votes)
    .slice(0, popularLimit);

  return Promise.all(
    popular.map(async (wish) => {
      const track =
        wish.song.kind === 'catalog' ? await musicDatabase.lookup(wish.song.trackId) : undefined;

      return { wish, track };
    }),
  );
}

type Hint = {
  text: string;
  tone: 'muted' | 'accent' | 'critical';
};

function createHint(
  choice: Choice | null,
  validation: ReturnType<typeof validateWish>,
  exhausted: boolean,
  resetTime: string,
  duplicate: boolean,
): Hint {
  if (exhausted) {
    return {
      text: `Kontingent erschöpft, ab ${resetTime} wieder möglich.`,
      tone: 'muted',
    };
  }

  if (duplicate) {
    return { text: alreadyRequestedText, tone: 'critical' };
  }

  if (choice === null) {
    return { text: problemText.songMissing, tone: 'muted' };
  }

  if (!validation.ok) {
    return { text: problemText[validation.problems[0]], tone: 'critical' };
  }

  const selected = choice.kind === 'catalog' ? choice.track.title : 'Freitext-Wunsch';
  return { text: `Gewählt: ${selected}`, tone: 'accent' };
}

export default function WishScreen() {
  const { listener } = useDemoFlags();
  const { clock } = useDemo();
  const revision = useSyncExternalStore(
    (onChange) => clock.subscribe(onChange),
    () => clock.revision,
    () => clock.revision,
  );
  return <WishForm key={`${listener}:${revision}`} />;
}

function WishForm() {
  const { clock, settings } = useDemo();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const colors = useTheme();
  const { wishSystem, musicDatabase } = useStations();
  const [state, dispatch] = useReducer(reduceScreen, initialState);
  const search = useTrackSearch(state.query);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      dispatch({ type: 'focusStarted' });

      Promise.all([wishSystem.quota(), fetchPopular(wishSystem, musicDatabase)]).then(
        ([quota, popular]) => {
          if (active) {
            dispatch({ type: 'contentLoaded', quota, popular });
          }
        },
        () => {
          if (active) {
            dispatch({ type: 'contentFailed' });
          }
        },
      );

      return () => {
        active = false;
      };
    }, [musicDatabase, wishSystem]),
  );

  const validation = validateWish({
    song: state.choice === null ? undefined : choiceToSong(state.choice),
    greeting: state.greeting,
  });
  const exhausted = state.quota?.exhausted ?? false;
  const resetTime = state.quota === null ? '' : clockTime(state.quota.resetsAt);
  const canSend =
    state.quota !== null &&
    !exhausted &&
    !state.unreachable &&
    validation.ok &&
    !state.sending &&
    !state.alreadyRequested;
  const hint = createHint(state.choice, validation, exhausted, resetTime, state.alreadyRequested);

  const changeQuery = (query: string) => dispatch({ type: 'queryChanged', query });
  const choose = (choice: Choice) => dispatch({ type: 'choiceChanged', choice });
  const changeGreeting = (greeting: string) => dispatch({ type: 'greetingChanged', greeting });

  async function send() {
    if (!validation.ok) {
      return;
    }

    const listener = settings.get().listener;
    const revision = clock.revision;
    const isCurrent = () =>
      mounted.current && settings.get().listener === listener && clock.revision === revision;
    dispatch({ type: 'sendingStarted' });

    try {
      const wish = await wishSystem.submitRequest(validation.input);
      if (!isCurrent()) return;
      dispatch({ type: 'requestSent' });
      router.push({
        pathname: '/wish/sent',
        params: { id: wish.id, greeting: validation.input.greeting ?? '' },
      });
    } catch (error) {
      if (!isCurrent()) return;
      if (error instanceof WishRejectedError && error.reason === 'quotaExhausted') {
        wishSystem.quota().then(
          (quota) => dispatch({ type: 'quotaLoaded', quota }),
          () => dispatch({ type: 'quotaFailed' }),
        );
      } else if (error instanceof WishRejectedError && error.reason === 'alreadyRequested') {
        dispatch({ type: 'duplicateRejected' });
      } else {
        dispatch({ type: 'requestFailed' });
      }
    } finally {
      if (isCurrent()) dispatch({ type: 'sendingFinished' });
    }
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
          value={state.query}
          onChangeText={changeQuery}
          placeholder={
            exhausted ? `Suche pausiert bis ${resetTime}` : 'Titel oder Interpret suchen'
          }
          disabled={exhausted || state.unreachable}
          icon={<Search size={20} color={state.query ? colors.accent.base : colors.text.muted} />}
        />

        {state.quota ? <QuotaMeter quota={state.quota} /> : null}

        {state.unreachable ? (
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
            <ChoiceList
              search={search}
              query={state.query}
              popular={state.popular}
              choice={state.choice}
              onChoose={choose}
            />
            <TextField
              label="Gruß an die Moderation"
              optional
              multiline
              lines={2}
              maxLength={wishLimits.greetingMax}
              value={state.greeting}
              onChangeText={changeGreeting}
              placeholder="Grüße aus der Spätschicht …"
            />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.line.default }]}>
        {state.sendFailed && !exhausted && !state.unreachable ? (
          <StatusBanner
            tone="error"
            title="Wunsch nicht gesendet"
            text="Das Studio ist gerade nicht erreichbar. Deine Auswahl bleibt erhalten."
          />
        ) : null}
        <AppText variant="label" tone={hint.tone}>
          {hint.text}
        </AppText>
        <AppButton
          label={state.sending ? 'Wird gesendet …' : 'Wunsch absenden'}
          onPress={send}
          disabled={!canSend}
        />
      </View>
    </AreaScreen>
  );
}

type ChoiceListProps = {
  search: TrackSearch;
  query: string;
  popular: PopularWish[] | null;
  choice: Choice | null;
  onChoose: (choice: Choice) => void;
};

function ChoiceList({ search, query, popular, choice, onChoose }: ChoiceListProps) {
  const colors = useTheme();
  const selectedTrack = (track: Track) =>
    choice?.kind === 'catalog' && choice.track.id === track.id;
  const selectedText = (description: string) =>
    choice?.kind === 'freeText' && choice.description === description;

  if (search.status === 'idle') {
    return (
      <Section title="Oft gewünscht heute">
        {popular === null
          ? [0, 1, 2].map((key) => <Skeleton key={key} width="100%" height={74} radius={14} />)
          : popular.map(({ wish, track }) => {
              if (wish.song.kind === 'catalog') {
                return track ? (
                  <WishOption
                    key={wish.id}
                    title={track.title}
                    subtitle={trackLine(track, wish.votes)}
                    selected={selectedTrack(track)}
                    onPress={() => onChoose({ kind: 'catalog', track })}
                    leading={<CoverPlaceholder seed={track.id} />}
                  />
                ) : null;
              }

              const description = wish.song.description;
              return (
                <WishOption
                  key={wish.id}
                  title="Freitext-Wunsch"
                  subtitle={`„${description}“ · ${votesLabel(wish.votes)}`}
                  selected={selectedText(description)}
                  onPress={() => onChoose({ kind: 'freeText', description })}
                  leading={<CoverPlaceholder seed={wish.id} />}
                />
              );
            })}
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
            selected={selectedTrack(track)}
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
        selected={selectedText(description)}
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
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  noHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noHitIcon: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noHitText: {
    flex: 1,
  },
  footer: {
    gap: spacing.md,
    marginHorizontal: -screenPadding.listener,
    paddingHorizontal: screenPadding.listener,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

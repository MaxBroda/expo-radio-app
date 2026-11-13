import { useRatings } from '@/components/studio/use-ratings';
import { useWishes } from '@/components/studio/use-wishes';
import { useNowPlaying } from '@/components/now-playing/use-now-playing';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { useTheme } from '@/theme';
import { AreaScreen } from '@/components/area-screen';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { OfflineBanner } from '@/components/studio/offline-banner';
import { AppButton, AppText } from '@/components/ui';
import { RotateCw } from 'lucide-react-native';
import { MoodCard } from '@/components/studio/mood-card';
import { KeyFigures } from '@/components/studio/key-figures';
import { LatestRating } from '@/components/studio/latest-rating';
import { TopWish } from '@/components/studio/top-wish';

export default function OverviewScreen() {
  const ratings = useRatings();
  const { wishes, setStatus } = useWishes();
  const { state, retry } = useNowPlaying();
  const now = useTickingNow();
  const colors = useTheme();

  const offline = state.status === 'offline';

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />

      <OfflineBanner />

      <MoodCard ratings={ratings} now={now} />

      {offline ? (
        <>
          <AppText tone="muted">
            Aktionen an der Wunschliste sind gesperrt, solange der Stand nicht aktuell ist.
          </AppText>
          <AppButton
            label="Erneut verbinden"
            icon={<RotateCw size={18} color={colors.accent.ink} />}
            onPress={retry}
          />
        </>
      ) : (
        <>
          <KeyFigures ratings={ratings} wishes={wishes} now={now} />
          <LatestRating ratings={ratings} now={now} />
          <TopWish wishes={wishes} onSetStatus={setStatus} />
        </>
      )}
    </AreaScreen>
  );
}

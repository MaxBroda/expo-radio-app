import { useRatings } from '@/components/studio/use-ratings';
import { useWishes } from '@/components/studio/use-wishes';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { AreaScreen } from '@/components/area-screen';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { MoodCard } from '@/components/studio/mood-card';
import { KeyFigures } from '@/components/studio/key-figures';
import { LatestRating } from '@/components/studio/latest-rating';
import { TopWish } from '@/components/studio/top-wish';

export default function OverviewScreen() {
  const ratings = useRatings();
  const { wishes, setStatus } = useWishes();
  const now = useTickingNow();

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
      <MoodCard ratings={ratings} now={now} />
      <KeyFigures ratings={ratings} wishes={wishes} now={now} />
      <LatestRating ratings={ratings} now={now} />
      <TopWish wishes={wishes} onSetStatus={setStatus} />
    </AreaScreen>
  );
}

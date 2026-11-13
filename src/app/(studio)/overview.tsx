import { AreaScreen } from '@/components/area-screen';
import { useTickingNow } from '@/components/now-playing/use-ticking-now';
import { MoodCard } from '@/components/studio/mood-card';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { useRatings } from '@/components/studio/use-ratings';

export default function OverviewScreen() {
  const ratings = useRatings();
  const now = useTickingNow();

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
      <MoodCard ratings={ratings} now={now} />
    </AreaScreen>
  );
}

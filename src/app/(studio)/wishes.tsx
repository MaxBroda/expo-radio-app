import { AreaScreen } from '@/components/area-screen';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { useWishes } from '@/components/studio/use-wishes';
import { WishSummary } from '@/components/studio/wish-summary';

export default function WishesScreen() {
  const wishes = useWishes();

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
      <WishSummary wishes={wishes} />
    </AreaScreen>
  );
}

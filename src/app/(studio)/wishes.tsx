import { AreaScreen } from '@/components/area-screen';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';

export default function WishesScreen() {
  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
    </AreaScreen>
  );
}

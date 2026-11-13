import { AreaScreen } from '@/components/area-screen';
import { NowPlayingBar } from '@/components/studio/now-playing-bar';
import { useWishes } from '@/components/studio/use-wishes';
import { WishSort, type Sort } from '@/components/studio/wish-sort';
import { WishSummary } from '@/components/studio/wish-summary';
import { useState } from 'react';

export default function WishesScreen() {
  const wishes = useWishes();
  const [sort, setSort] = useState<Sort>('votes');

  return (
    <AreaScreen area="studio">
      <NowPlayingBar />
      <WishSummary wishes={wishes} />
      <WishSort selected={sort} onSelect={setSort} />
    </AreaScreen>
  );
}

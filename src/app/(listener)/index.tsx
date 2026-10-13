import { router } from 'expo-router';

import { AreaScreen } from '@/components/area-screen';
import { ComponentsLink, ScreenPlaceholder } from '@/components/screen-placeholder';
import { AppButton } from '@/components/ui';

export default function NowPlayingScreen() {
  return (
    <AreaScreen area="listener">
      <ScreenPlaceholder title="Jetzt läuft" screenshots="01–03">
        <AppButton label="Playlist bewerten" onPress={() => router.push('/rate/track')} />
        <AppButton
          label="Moderation bewerten"
          variant="secondary"
          onPress={() => router.push('/rate/show')}
        />
        <AppButton label="Song wünschen" variant="secondary" onPress={() => router.push('/wish')} />
        <ComponentsLink />
      </ScreenPlaceholder>
    </AreaScreen>
  );
}

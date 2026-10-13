import { AreaScreen } from '@/components/area-screen';
import { ComponentsLink, ScreenPlaceholder } from '@/components/screen-placeholder';

export default function OverviewScreen() {
  return (
    <AreaScreen area="studio">
      <ScreenPlaceholder title="Überblick" screenshots="20–21, 25">
        <ComponentsLink />
      </ScreenPlaceholder>
    </AreaScreen>
  );
}

import { useNowPlaying } from '@/components/now-playing/use-now-playing';
import { useTheme } from '@/theme';
import { StatusBanner } from '@/components/ui';
import { CircleAlert } from 'lucide-react-native';

export function OfflineBanner() {
  const { state } = useNowPlaying();
  const colors = useTheme();

  if (state.status !== 'offline') return null;

  return (
    <StatusBanner
      tone="error"
      title="Keine Verbindung zum Feedback-Dienst"
      text="Ticker und Barometer stehen still. Neue Bewertungen gehen nicht verloren — sie werden nachgeliefert, sobald die Verbindung steht."
      icon={<CircleAlert size={20} color={colors.critical.text} />}
    />
  );
}

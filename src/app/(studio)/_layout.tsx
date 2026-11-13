import { usePathname } from 'expo-router';
import { TopTabs } from 'expo-router/js-top-tabs';
import { CirclePlus, Gauge, MessageSquare } from 'lucide-react-native';

import { useRushRatings } from '@/components/studio/use-rush-ratings';
import { useUnseenRatings } from '@/components/studio/use-unseen-ratings';
import { renderTabBar, tabBadge, tabIcon } from '@/navigation/tab-bar';
import { useTheme } from '@/theme';

export default function StudioTabs() {
  const colors = useTheme();
  useRushRatings();
  const unseen = useUnseenRatings(usePathname() === '/ticker');

  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={renderTabBar('studio')}
      screenOptions={{ sceneStyle: { backgroundColor: colors.bg.studio } }}
    >
      <TopTabs.Screen
        name="overview"
        options={{ title: 'Überblick', tabBarIcon: tabIcon(Gauge) }}
      />
      <TopTabs.Screen
        name="ticker"
        options={{
          title: 'Ticker',
          tabBarIcon: tabIcon(MessageSquare),
          tabBarBadge: tabBadge(unseen),
        }}
      />
      <TopTabs.Screen
        name="wishes"
        options={{ title: 'Wünsche', tabBarIcon: tabIcon(CirclePlus) }}
      />
    </TopTabs>
  );
}

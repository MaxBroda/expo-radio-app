import { TopTabs } from 'expo-router/js-top-tabs';
import { CirclePlus, Gauge, MessageSquare } from 'lucide-react-native';

import { renderTabBar, tabIcon } from '@/navigation/tab-bar';
import { useTheme } from '@/theme';

export default function StudioTabs() {
  const colors = useTheme();

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
        options={{ title: 'Ticker', tabBarIcon: tabIcon(MessageSquare) }}
      />
      <TopTabs.Screen
        name="wishes"
        options={{ title: 'Wünsche', tabBarIcon: tabIcon(CirclePlus) }}
      />
    </TopTabs>
  );
}

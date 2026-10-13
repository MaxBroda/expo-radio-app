import { TopTabs } from 'expo-router/js-top-tabs';
import { CirclePlus, Radio, TextAlignStart } from 'lucide-react-native';

import { renderTabBar, tabIcon } from '@/navigation/tab-bar';
import { useTheme } from '@/theme';

export default function ListenerTabs() {
  const colors = useTheme();

  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={renderTabBar('listener')}
      screenOptions={{ sceneStyle: { backgroundColor: colors.bg.base } }}
    >
      <TopTabs.Screen name="index" options={{ title: 'Jetzt läuft', tabBarIcon: tabIcon(Radio) }} />
      <TopTabs.Screen
        name="history"
        options={{ title: 'Verlauf', tabBarIcon: tabIcon(TextAlignStart) }}
      />
      <TopTabs.Screen name="wish" options={{ title: 'Wunsch', tabBarIcon: tabIcon(CirclePlus) }} />
    </TopTabs>
  );
}

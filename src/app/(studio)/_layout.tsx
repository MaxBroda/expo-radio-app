import { Tabs } from 'expo-router';
import { CirclePlus, Gauge, MessageSquare } from 'lucide-react-native';

import { useTabOptions } from '@/navigation/use-tab-options';

export default function StudioTabs() {
  return (
    <Tabs screenOptions={useTabOptions('studio')}>
      <Tabs.Screen
        name="overview"
        options={{ title: 'Überblick', tabBarIcon: ({ color }) => <Gauge color={color} /> }}
      />
      <Tabs.Screen
        name="ticker"
        options={{ title: 'Ticker', tabBarIcon: ({ color }) => <MessageSquare color={color} /> }}
      />
      <Tabs.Screen
        name="wishes"
        options={{ title: 'Wünsche', tabBarIcon: ({ color }) => <CirclePlus color={color} /> }}
      />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import { CirclePlus, Radio, TextAlignStart } from 'lucide-react-native';

import { useTabOptions } from '@/navigation/use-tab-options';

export default function ListenerTabs() {
  return (
    <Tabs screenOptions={useTabOptions('listener')}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Jetzt läuft', tabBarIcon: ({ color }) => <Radio color={color} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Verlauf', tabBarIcon: ({ color }) => <TextAlignStart color={color} /> }}
      />
      <Tabs.Screen
        name="wish"
        options={{ title: 'Wunsch', tabBarIcon: ({ color }) => <CirclePlus color={color} /> }}
      />
    </Tabs>
  );
}

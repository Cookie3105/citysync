import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

import AdReports from './screens/AdReports';
import AdFleetStatus from './screens/AdFleetStatus';
import AdZones from './screens/AdZones';
import AdIncentives from './screens/AdIncentives';

export type AdminTabParamList = {
  ReportTab: undefined;
  FleetTab: undefined;
  ZonesTab: undefined;
  IncentivesTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const tabIcon: Record<keyof AdminTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  ReportTab: 'chart-box',
  FleetTab: 'map-marker-multiple',
  ZonesTab: 'map-marker-radius',
  IncentivesTab: 'gift',
};
const tabLabel: Record<keyof AdminTabParamList, string> = {
  ReportTab: 'Report',
  FleetTab: 'Mezzi',
  ZonesTab: 'Zone',
  IncentivesTab: 'Incentivi',
};

export default function AdminNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 60 + insets.bottom, paddingBottom: (insets.bottom || 8) + 2, paddingTop: 8,
          borderTopColor: colors.divider, backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarLabel: tabLabel[route.name],
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={tabIcon[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="ReportTab" component={AdReports} />
      <Tab.Screen name="FleetTab" component={AdFleetStatus} />
      <Tab.Screen name="ZonesTab" component={AdZones} />
      <Tab.Screen name="IncentivesTab" component={AdIncentives} />
    </Tab.Navigator>
  );
}

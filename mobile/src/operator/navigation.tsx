import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

import OpDashboard from './screens/OpDashboard';
import OpFleet from './screens/OpFleet';
import OpFaults from './screens/OpFaults';
import OpSupport from './screens/OpSupport';
import OpChat from './screens/OpChat';
import OpMore from './screens/OpMore';
import OpReservations from './screens/OpReservations';
import OpMaintenance from './screens/OpMaintenance';
import OpParking from './screens/OpParking';
import OpBonus from './screens/OpBonus';
import OpAccounts from './screens/OpAccounts';

export type OpSupportStackParamList = {
  Support: undefined;
  Chat: { idRichiesta: string; titolo?: string };
};
export type OpMoreStackParamList = {
  More: undefined;
  Reservations: undefined;
  Maintenance: undefined;
  Parking: undefined;
  Bonus: undefined;
  Accounts: undefined;
};
export type OpTabParamList = {
  DashTab: undefined;
  FleetTab: undefined;
  FaultsTab: undefined;
  SupportTab: undefined;
  MoreTab: undefined;
};

const SupportStackNav = createNativeStackNavigator<OpSupportStackParamList>();
function SupportStack() {
  return (
    <SupportStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SupportStackNav.Screen name="Support" component={OpSupport} />
      <SupportStackNav.Screen name="Chat" component={OpChat} />
    </SupportStackNav.Navigator>
  );
}

const MoreStackNav = createNativeStackNavigator<OpMoreStackParamList>();
function MoreStack() {
  return (
    <MoreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MoreStackNav.Screen name="More" component={OpMore} />
      <MoreStackNav.Screen name="Reservations" component={OpReservations} />
      <MoreStackNav.Screen name="Maintenance" component={OpMaintenance} />
      <MoreStackNav.Screen name="Parking" component={OpParking} />
      <MoreStackNav.Screen name="Bonus" component={OpBonus} />
      <MoreStackNav.Screen name="Accounts" component={OpAccounts} />
    </MoreStackNav.Navigator>
  );
}

const Tab = createBottomTabNavigator<OpTabParamList>();
const tabIcon: Record<keyof OpTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  DashTab: 'view-dashboard',
  FleetTab: 'map-marker-multiple',
  FaultsTab: 'alert-circle-outline',
  SupportTab: 'lifebuoy',
  MoreTab: 'dots-horizontal',
};
const tabLabel: Record<keyof OpTabParamList, string> = {
  DashTab: 'Dashboard',
  FleetTab: 'Flotta',
  FaultsTab: 'Guasti',
  SupportTab: 'Assistenza',
  MoreTab: 'Altro',
};

export default function OperatorNavigator() {
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
      <Tab.Screen name="DashTab" component={OpDashboard} />
      <Tab.Screen name="FleetTab" component={OpFleet} />
      <Tab.Screen name="FaultsTab" component={OpFaults} />
      <Tab.Screen name="SupportTab" component={SupportStack} />
      <Tab.Screen name="MoreTab" component={MoreStack} />
    </Tab.Navigator>
  );
}

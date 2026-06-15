import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useT } from '../state/SettingsContext';
import type {
  HomeStackParamList, HistoryStackParamList, SupportStackParamList,
  ProfileStackParamList, TabParamList,
} from './types';

import MapScreen from '../screens/MapScreen';
import RideScreen from '../screens/RideScreen';
import SummaryScreen from '../screens/SummaryScreen';
import ReportFaultScreen from '../screens/ReportFaultScreen';
import RouteScreen from '../screens/RouteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SupportScreen from '../screens/SupportScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PaymentScreen from '../screens/PaymentScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PatenteScreen from '../screens/PatenteScreen';
import WalletScreen from '../screens/WalletScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Home = createNativeStackNavigator<HomeStackParamList>();
function HomeStack() {
  return (
    <Home.Navigator screenOptions={{ headerShown: false }}>
      <Home.Screen name="Map" component={MapScreen} />
      <Home.Screen name="Ride" component={RideScreen} />
      <Home.Screen name="Summary" component={SummaryScreen} />
      <Home.Screen name="ReportFault" component={ReportFaultScreen} />
      <Home.Screen name="Route" component={RouteScreen} />
    </Home.Navigator>
  );
}

const History = createNativeStackNavigator<HistoryStackParamList>();
function HistoryStack() {
  return (
    <History.Navigator screenOptions={{ headerShown: false }}>
      <History.Screen name="History" component={HistoryScreen} />
      <History.Screen name="Summary" component={SummaryScreen} />
    </History.Navigator>
  );
}

const Support = createNativeStackNavigator<SupportStackParamList>();
function SupportStack() {
  return (
    <Support.Navigator screenOptions={{ headerShown: false }}>
      <Support.Screen name="Support" component={SupportScreen} />
      <Support.Screen name="Chat" component={ChatScreen} />
    </Support.Navigator>
  );
}

const Profile = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStack() {
  return (
    <Profile.Navigator screenOptions={{ headerShown: false }}>
      <Profile.Screen name="Profile" component={ProfileScreen} />
      <Profile.Screen name="Payment" component={PaymentScreen} />
      <Profile.Screen name="EditProfile" component={EditProfileScreen} />
      <Profile.Screen name="Patente" component={PatenteScreen} />
      <Profile.Screen name="Wallet" component={WalletScreen} />
      <Profile.Screen name="Promotions" component={PromotionsScreen} />
      <Profile.Screen name="Settings" component={SettingsScreen} />
    </Profile.Navigator>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();
const tabIcon: Record<keyof TabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  HomeTab: 'map-marker-radius',
  HistoryTab: 'history',
  SupportTab: 'lifebuoy',
  ProfileTab: 'account-circle',
};
const tabLabel: Record<keyof TabParamList, string> = {
  HomeTab: 'Mappa',
  HistoryTab: 'Storico',
  SupportTab: 'Assistenza',
  ProfileTab: 'Profilo',
};

export default function RootNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const t = useT();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        // L'altezza include l'inset inferiore (barra gesti/notch) così le etichette
        // non vengono tagliate sui dispositivi reali.
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: (insets.bottom || 8) + 2,
          paddingTop: 8,
          borderTopColor: colors.divider,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarLabel: t(tabLabel[route.name]),
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={tabIcon[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="HistoryTab" component={HistoryStack} />
      <Tab.Screen name="SupportTab" component={SupportStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import SetupScreen        from './screens/SetupScreen';
import HomeScreen         from './screens/HomeScreen';
import EventsScreen       from './screens/EventsScreen';
import EventDetailScreen  from './screens/EventDetailScreen';
import UploadsScreen      from './screens/UploadsScreen';
import ProfileScreen      from './screens/ProfileScreen';
import QRScannerScreen    from './screens/QRScannerScreen';
import QuickActionsScreen from './screens/QuickActionsScreen';
import SplashScreen       from './screens/SplashScreen';
import GalleryScreen      from './screens/GalleryScreen';
import ProfilePickerScreen from './screens/ProfilePickerScreen';
import EventPickerScreen   from './screens/EventPickerScreen';
import CameraScreen        from './screens/CameraScreen';

import { getServerConfig, getDeviceProfile, getDeviceToken, getActiveEvent } from './services/storage';
import { registerBackgroundSync } from './services/sync';
import { setupNotificationsHandler } from './services/notify';
import { colors } from './theme';

import HomeIcon    from './components/icons/HomeIcon';
import EventsIcon  from './components/icons/EventsIcon';
import UploadsIcon from './components/icons/UploadsIcon';
import ProfileIcon from './components/icons/ProfileIcon';
import { Camera } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

setupNotificationsHandler();

// Tema escuro para o navegador
const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card:       colors.bgElevated,
    text:       colors.text,
    border:     colors.border,
    primary:    colors.brand,
    notification: colors.error,
  },
};

// ── Bottom Tabs ──
function CenterTabButton({ onPress }) {
  return (
    <View style={styles.centerBtnWrap} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.centerBtn}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Camera size={28} color="#fff" strokeWidth={2} />
      </TouchableOpacity>
      <Text style={styles.centerBtnLabel}>CÂMERA</Text>
    </View>
  );
}

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -3, textTransform: 'uppercase' },
        tabBarItemStyle:  { paddingVertical: 6 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'INÍCIO',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon size={22} color={color} filled={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsScreen}
        options={{
          tabBarLabel: 'AGENDA',
          tabBarIcon: ({ color, focused }) => (
            <EventsIcon size={22} color={color} filled={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="QuickTab"
        component={QuickActionsScreen}
        options={{
          tabBarLabel: 'CÂMERA',
          tabBarButton: (props) => (
            <CenterTabButton onPress={() => navigation.navigate('Camera')} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadsTab"
        component={UploadsScreen}
        options={{
          tabBarLabel: 'UPLOAD',
          tabBarIcon: ({ color, focused }) => (
            <UploadsIcon size={22} color={color} filled={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'PERFIL',
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon size={22} color={color} filled={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold,
  });

  const [bootDelay, setBootDelay] = useState(true);

  useEffect(() => {
    (async () => {
      const [config, profile, token, activeEv] = await Promise.all([
        getServerConfig(), getDeviceProfile(), getDeviceToken(), getActiveEvent(),
      ]);
      const hasAuth = !!(token || config?.password);

      if (!config?.serverUrl || !hasAuth) {
        // Não conectado → tela de Setup
        setInitialRoute('Setup');
      } else if (!profile?.name) {
        // Pareou mas não tem perfil → ProfilePicker
        setInitialRoute('ProfilePicker');
      } else if (!activeEv || activeEv.expired) {
        // Tem perfil mas sem evento ativo → EventPicker
        setInitialRoute('EventPicker');
      } else {
        // Tudo pronto → vai direto pra Câmera
        setInitialRoute('Main');
        registerBackgroundSync();
      }
    })();
    // Mostra splash por no mínimo 1.5s pra animação aparecer
    const t = setTimeout(() => setBootDelay(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!initialRoute || !fontsLoaded || bootDelay) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={NavTheme}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgElevated },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen
            name="Setup"
            component={SetupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="QuickActions"
            component={QuickActionsScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="Gallery"
            component={GalleryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Uploads"
            component={UploadsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfilePicker"
            component={ProfilePickerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventPicker"
            component={EventPickerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 92 : 80,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingTop: 10,
  },
  centerBtnWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
  },
  centerBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -16,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.bgElevated,
  },
  centerBtnLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: -12,
  },
});

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing, Dimensions, Image } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Rect, Path, G } from 'react-native-svg';
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
import { Camera, Folder, Image as ImageIcon } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const { width: SCREEN_W } = Dimensions.get('window');
const BG_MENU = require('./assets/tab_bg.png');


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
// Efeito: botão sólido azul + glow + fumaça em movimento + partículas sutis.
// Animação lenta e contínua, elegante e tecnológico.
const TAB_SPARK_ANGLES = [25, 85, 145, 205, 265, 325];
const TAB_STAGE_SIZE   = 170;

function CenterTabButton({ onPress, onLongPress }) {
  const accent = '#1F8BFF';
  const accentSoft = '#5AAEFF';

  return (
    <View style={styles.centerBtnWrap} pointerEvents="box-none">
      <View
        style={[styles.tabStage, { width: TAB_STAGE_SIZE, height: TAB_STAGE_SIZE }]}
        pointerEvents="box-none"
      >
        {/* glow azul difuso atrás do botão */}
        <Svg width="100%" height="100%" viewBox="0 0 300 300" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="cam-aura" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={accent} stopOpacity={0.38} />
              <Stop offset="35%" stopColor={accent} stopOpacity={0.16} />
              <Stop offset="70%" stopColor={accent} stopOpacity={0.04} />
              <Stop offset="100%" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="cam-fill" cx="50%" cy="32%" rx="70%" ry="70%">
              <Stop offset="0%" stopColor="#6BB6FF" />
              <Stop offset="55%" stopColor={accent} />
              <Stop offset="100%" stopColor="#0E6BDD" />
            </RadialGradient>
            <RadialGradient id="cam-inner-shine" cx="50%" cy="20%" rx="60%" ry="40%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* botão azul sólido brilhante */}
          <Circle cx={150} cy={150} r={70} fill="url(#cam-fill)" />

          {/* highlight superior (shine de vidro) */}
          <Circle cx={150} cy={150} r={70} fill="url(#cam-inner-shine)" />

          {/* anel interno fino */}
          <Circle cx={150} cy={150} r={64} fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.2} />
        </Svg>

        {/* Área clicável + ícone Camera centralizado */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={300}
          style={styles.tabHitArea}
        >
          <Camera size={32} color="#fff" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TabBarChassis() {
  const W = SCREEN_W;
  const VB_W = 1600;
  const VB_H = 360;
  const H = (W * VB_H) / VB_W;
  return (
    <View style={styles.chassisWrap} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="barFill" x1="800" y1="40" x2="800" y2="360" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#1B2A44" stopOpacity="1" />
            <Stop offset="0.3" stopColor="#0F1A2E" stopOpacity="1" />
            <Stop offset="0.7" stopColor="#070E1C" stopOpacity="1" />
            <Stop offset="1" stopColor="#03070F" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="centerGlow" cx="50%" cy="42%" rx="35%" ry="80%">
            <Stop offset="0" stopColor="#1F8BFF" stopOpacity="0.18" />
            <Stop offset="0.6" stopColor="#1F8BFF" stopOpacity="0.04" />
            <Stop offset="1" stopColor="#1F8BFF" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="strokeLight" x1="800" y1="80" x2="800" y2="360" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#7A92B8" stopOpacity="0.9" />
            <Stop offset="0.4" stopColor="#2A3F5C" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#060B14" stopOpacity="0.6" />
          </LinearGradient>
          <RadialGradient id="socketShade" cx="50%" cy="42%" rx="62%" ry="62%">
            <Stop offset="0" stopColor="#020509" stopOpacity="1" />
            <Stop offset="0.7" stopColor="#04080F" stopOpacity="1" />
            <Stop offset="1" stopColor="#0A1322" stopOpacity="0.85" />
          </RadialGradient>
          <RadialGradient id="camGlow" cx="50%" cy="50%" rx="65%" ry="65%">
            <Stop offset="0" stopColor="#1F8BFF" stopOpacity="0.32" />
            <Stop offset="0.55" stopColor="#1F8BFF" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#1F8BFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* pill chassis com curva sutil pra cima no centro */}
        <Path
          d="M0 145
             C0 95 48 70 115 70
             H660
             C700 70 705 50 760 40
             C786 35 814 35 840 40
             C895 50 900 70 940 70
             H1485
             C1552 70 1600 95 1600 145
             V360
             H0
             Z"
          fill="url(#barFill)"
          stroke="#8AA8D8"
          strokeOpacity="0.95"
          strokeWidth="2"
        />

        {/* glow azul interno do chassis */}
        <Path
          d="M0 145
             C0 95 48 70 115 70
             H660
             C700 70 705 50 760 40
             C786 35 814 35 840 40
             C895 50 900 70 940 70
             H1485
             C1552 70 1600 95 1600 145
             V360
             H0
             Z"
          fill="url(#centerGlow)"
        />

        {/* brilho fino superior (top highlight glass) */}
        <Path
          d="M18 136
             C18 98 58 78 116 78
             H660
             C702 78 712 60 762 50
             C786 45 814 45 838 50
             C888 60 898 78 940 78
             H1484
             C1542 78 1582 98 1582 136"
          stroke="#9FBDE5"
          strokeOpacity="0.7"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />

      </Svg>
    </View>
  );
}

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   '#1F8BFF',
        tabBarInactiveTintColor: '#5A7090',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarBackground: () => <TabBarChassis />,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon size={21} color={color} filled={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Projetos',
          tabBarIcon: ({ color, focused }) => (
            <Folder size={21} color={color} strokeWidth={focused ? 2.4 : 2} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tab.Screen
        name="QuickTab"
        component={QuickActionsScreen}
        options={{
          tabBarLabel: 'Câmera',
          tabBarButton: () => (
            <CenterTabButton
              onPress={() => navigation.navigate('Camera')}
              onLongPress={() => navigation.navigate('QuickActions')}
            />
          ),
        }}
      />
      <Tab.Screen
        name="GalleryTab"
        component={GalleryScreen}
        options={{
          tabBarLabel: 'Galeria',
          tabBarIcon: ({ color, focused }) => (
            <ImageIcon size={21} color={color} strokeWidth={focused ? 2.4 : 2} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadsTab"
        component={UploadsScreen}
        options={{
          tabBarLabel: 'Upload',
          tabBarIcon: ({ color, focused }) => (
            <UploadsIcon size={21} color={color} filled={focused} />
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
      // BYPASS temporário: vai direto pra Main, sem precisar parear celular
      setInitialRoute('Main');
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
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 92 : 78,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 6,
    shadowColor: 'transparent',
    overflow: 'visible',
    position: 'relative',
  },
  tabItem: {
    paddingTop: 6,
    paddingBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  chassisWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  tabStage: {
    position: 'absolute',
    left: '50%',
    marginLeft: -85,
    top: -67,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tabHitArea: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSparkWrap: {
    position: 'absolute',
    left: '50%', top: '50%',
  },
  tabSpark: {
    width: 3.5, height: 3.5,
    borderRadius: 2,
    marginLeft: -1.75, marginTop: -1.75,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  centerBtnLabel: {
    color: '#1F8BFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
});

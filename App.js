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
import ConnectAuraScreen   from './screens/ConnectAuraScreen';

import * as ExpoSplash from 'expo-splash-screen';

import { getServerConfig, getDeviceProfile, getDeviceToken, getActiveEvent } from './services/storage';
import { registerBackgroundSync } from './services/sync';
import { setupNotificationsHandler } from './services/notify';
import { runBootSequence } from './src/boot/bootSequence';
import { colors } from './theme';

import { Image as RNImage } from 'react-native';

// Tab icons usam os PNGs novos da iconografia oficial.
// Ativo: tintColor azul vivo. Inativo: cinza.
const TAB_ICONS = {
  home:     require('./assets/icons/nav_inicio.png'),
  projetos: require('./assets/icons/nav_projetos.png'),
  camera:   require('./assets/icons/nav_camera.png'),
  galeria:  require('./assets/icons/nav_galeria.png'),
  upload:   require('./assets/icons/nav_upload.png'),
};
import { UploadProvider, useUploads } from './src/context/UploadContext';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const { width: SCREEN_W } = Dimensions.get('window');
const BG_MENU = require('./assets/tab_bg.png');

// Segura o splash nativo enquanto o JS roda o boot (fonts + token + rede).
// hideAsync sera chamado quando tudo estiver pronto.
ExpoSplash.preventAutoHideAsync().catch(() => {});

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
  // Animação da aura (respiração contínua)
  const auraPulse = useRef(new Animated.Value(0)).current;
  // Smoke girando em direções opostas
  const smokeA = useRef(new Animated.Value(0)).current;
  const smokeB = useRef(new Animated.Value(0)).current;
  // 4 partículas orbitando em ângulos diferentes
  const sparks = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const aura = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(auraPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    aura.start();

    // Smoke A — rotação lenta horária
    const smokeAnimA = Animated.loop(
      Animated.timing(smokeA, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    );
    smokeAnimA.start();
    // Smoke B — rotação ainda mais lenta anti-horária
    const smokeAnimB = Animated.loop(
      Animated.timing(smokeB, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true })
    );
    smokeAnimB.start();

    const sparkConfigs = [
      { delay: 0,    duration: 2200 },
      { delay: 550,  duration: 2400 },
      { delay: 1100, duration: 2100 },
      { delay: 1650, duration: 2500 },
    ];
    const sparkLoops = sparkConfigs.map((cfg, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(cfg.delay),
          Animated.timing(sparks[i], {
            toValue: 1, duration: cfg.duration,
            easing: Easing.inOut(Easing.quad), useNativeDriver: true,
          }),
          Animated.timing(sparks[i], { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    sparkLoops.forEach(l => l.start());

    return () => {
      aura.stop();
      smokeAnimA.stop();
      smokeAnimB.stop();
      sparkLoops.forEach(l => l.stop());
    };
  }, []);

  const smokeARot = smokeA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const smokeBRot = smokeB.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const auraScale   = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const auraOpacity = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });
  const ringScale   = auraPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const SPARK_ANGLES = [35, 125, 215, 305];

  return (
    <View style={styles.centerBtnWrap} pointerEvents="box-none">
      {/* Smoke layer A — rotação horária, blob off-center */}
      <Animated.View
        style={[styles.smokeLayer, { transform: [{ rotate: smokeARot }] }]}
        pointerEvents="none"
      >
        <Svg width={130} height={130} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="smokeA1" cx="35%" cy="50%" r="35%">
              <Stop offset="0%" stopColor="#5AAEFF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#5AAEFF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="smokeA2" cx="70%" cy="35%" r="30%">
              <Stop offset="0%" stopColor="#1F8BFF" stopOpacity={0.28} />
              <Stop offset="100%" stopColor="#1F8BFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#smokeA1)" />
          <Circle cx={50} cy={50} r={50} fill="url(#smokeA2)" />
        </Svg>
      </Animated.View>

      {/* Smoke layer B — rotação anti-horária, blob diferente */}
      <Animated.View
        style={[styles.smokeLayer, { transform: [{ rotate: smokeBRot }] }]}
        pointerEvents="none"
      >
        <Svg width={130} height={130} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="smokeB1" cx="65%" cy="60%" r="32%">
              <Stop offset="0%" stopColor="#73B7FF" stopOpacity={0.32} />
              <Stop offset="100%" stopColor="#73B7FF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="smokeB2" cx="30%" cy="65%" r="28%">
              <Stop offset="0%" stopColor="#1F8BFF" stopOpacity={0.22} />
              <Stop offset="100%" stopColor="#1F8BFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#smokeB1)" />
          <Circle cx={50} cy={50} r={50} fill="url(#smokeB2)" />
        </Svg>
      </Animated.View>

      {/* Aura pulsante (degradê radial real) */}
      <Animated.View
        style={[styles.centerHalo, { opacity: auraOpacity, transform: [{ scale: auraScale }] }]}
        pointerEvents="none"
      >
        <Svg width={110} height={110} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#5AAEFF" stopOpacity={0.55} />
              <Stop offset="45%"  stopColor="#1F8BFF" stopOpacity={0.18} />
              <Stop offset="80%"  stopColor="#1F8BFF" stopOpacity={0.04} />
              <Stop offset="100%" stopColor="#1F8BFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#auraGrad)" />
        </Svg>
      </Animated.View>

      {/* Anel azul fino que pulsa de leve */}
      <Animated.View
        style={[styles.centerRing, { transform: [{ scale: ringScale }] }]}
        pointerEvents="none"
      />

      {/* 4 partículas orbitando */}
      {SPARK_ANGLES.map((baseAngle, i) => {
        const anim = sparks[i];
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${baseAngle}deg`, `${baseAngle + 240}deg`],
        });
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-42, -56],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.15, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = anim.interpolate({
          inputRange: [0, 0.2, 0.6, 1],
          outputRange: [0.3, 0.9, 1, 0.3],
        });
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[styles.sparkWrap, { opacity, transform: [{ rotate }, { translateY }, { scale }] }]}
          >
            <View style={styles.spark} />
          </Animated.View>
        );
      })}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        style={styles.centerBtn}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="cbg" cx="50%" cy="40%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor="#0F2745" />
              <Stop offset="60%" stopColor="#081628" />
              <Stop offset="100%" stopColor="#030A14" />
            </RadialGradient>
            <RadialGradient id="cshine" cx="50%" cy="18%" rx="50%" ry="35%">
              <Stop offset="0%" stopColor="#5AAEFF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#5AAEFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={48} fill="url(#cbg)" />
          <Circle cx={50} cy={50} r={48} fill="url(#cshine)" />
          <Circle cx={50} cy={50} r={45} fill="none" stroke="rgba(90,174,255,0.25)" strokeWidth={0.8} />
        </Svg>
        <RNImage source={TAB_ICONS.camera} style={{ width: 30, height: 30, tintColor: '#5AAEFF', resizeMode: 'contain' }} />
      </TouchableOpacity>
    </View>
  );
}

function TabBarChassis() {
  return (
    <View style={styles.chassisWrap} pointerEvents="none">
      <View style={styles.chassisPill} />
    </View>
  );
}

// Ícone com badge numérico para uploads pendentes.
function UploadTabIcon({ focused }) {
  const { pendingCount } = useUploads();
  return (
    <View style={styles.tabIconWrap}>
      <RNImage
        source={TAB_ICONS.upload}
        style={[styles.tabIcon, { tintColor: focused ? '#1F8BFF' : '#5A7090' }]}
      />
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
        </View>
      )}
    </View>
  );
}

// Wrapper genérico — só centraliza o ícone.
function TabIcon({ children }) {
  return <View style={styles.tabIconWrap}>{children}</View>;
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
          tabBarIcon: ({ focused }) => (
            <TabIcon>
              <RNImage source={TAB_ICONS.home} style={[styles.tabIcon, { tintColor: focused ? '#1F8BFF' : '#5A7090' }]} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Projetos',
          tabBarIcon: ({ focused }) => (
            <TabIcon>
              <RNImage source={TAB_ICONS.projetos} style={[styles.tabIcon, { tintColor: focused ? '#1F8BFF' : '#5A7090' }]} />
            </TabIcon>
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
          tabBarIcon: ({ focused }) => (
            <TabIcon>
              <RNImage source={TAB_ICONS.galeria} style={[styles.tabIcon, { tintColor: focused ? '#1F8BFF' : '#5A7090' }]} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="UploadsTab"
        component={UploadsScreen}
        options={{
          tabBarLabel: 'Upload',
          tabBarIcon: ({ focused }) => (
            <UploadTabIcon focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [bootResult, setBootResult] = useState(null);
  const [splashFading, setSplashFading] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold,
  });

  // Boot real: migra credenciais legadas, le token, snapshot inicial de rede.
  // Decide a rota inicial baseado em ter token pareado:
  //   - hasToken=true  -> Main (app pareado, abre direto)
  //   - hasToken=false -> ConnectAura (Fase 2: tela de descoberta/pareamento)
  useEffect(() => {
    (async () => {
      try {
        const result = await runBootSequence();
        setBootResult(result);
        setInitialRoute(result.hasToken ? 'Main' : 'ConnectAura');
      } catch (e) {
        console.warn('[boot] falha:', e?.message);
        setBootResult({ token: null, hasToken: false });
        setInitialRoute('ConnectAura');
      }
    })();
  }, []);

  // Quando boot + fonts terminaram: esconde splash nativo + dispara fade-out
  // do splash custom. Sem delay fixo — timing eh determinado pelas operacoes.
  useEffect(() => {
    if (initialRoute && fontsLoaded && bootResult && !splashFading) {
      ExpoSplash.hideAsync().catch(() => {});
      setSplashFading(true);
    }
  }, [initialRoute, fontsLoaded, bootResult, splashFading]);

  if (!splashHidden) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen
          fadingOut={splashFading}
          onFadeOutComplete={() => setSplashHidden(true)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <UploadProvider>
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={NavTheme}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgElevated },
            headerTintColor: '#fff',
            headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#fff' },
            headerBackTitleVisible: false,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
            // Animação suave em todas as telas
            animation: 'fade_from_bottom',
            animationDuration: 220,
          }}
        >
          <Stack.Screen
            name="ConnectAura"
            component={ConnectAuraScreen}
            options={{ headerShown: false }}
          />
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
            options={{ headerShown: true, title: '', headerBackTitle: 'Voltar', headerTransparent: true }}
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
            options={{ headerShown: true, title: 'Galeria', headerBackTitle: 'Voltar' }}
          />
          <Stack.Screen
            name="Uploads"
            component={UploadsScreen}
            options={{ headerShown: true, title: 'Sincronização', headerBackTitle: 'Voltar' }}
          />
          <Stack.Screen
            name="ProfilePicker"
            component={ProfilePickerScreen}
            options={{ headerShown: true, title: 'Perfil', headerBackTitle: 'Voltar' }}
          />
          <Stack.Screen
            name="EventPicker"
            component={EventPickerScreen}
            options={{ headerShown: true, title: 'Evento ativo', headerBackTitle: 'Voltar' }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </UploadProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 94 : 80,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingTop: 14,
    paddingHorizontal: 12,
    shadowColor: 'transparent',
    overflow: 'visible',
    position: 'relative',
  },
  tabItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chassisWrap: {
    position: 'absolute',
    left: 12, right: 12, bottom: Platform.OS === 'ios' ? 16 : 8,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chassisPill: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(8,14,26,0.92)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(31,139,255,0.18)',
    overflow: 'hidden',
  },
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  centerBtn: {
    position: 'absolute',
    top: -28,
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(90,174,255,0.55)',
    shadowColor: '#1F8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  centerRing: {
    position: 'absolute',
    top: -33,
    width: 78, height: 78, borderRadius: 39,
    borderWidth: 1,
    borderColor: 'rgba(90,174,255,0.35)',
    shadowColor: '#1F8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  centerHalo: {
    position: 'absolute',
    top: -49,
    width: 110, height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smokeLayer: {
    position: 'absolute',
    top: -59,
    width: 130, height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  spark: {
    width: 4, height: 4, borderRadius: 2,
    marginLeft: -2, marginTop: -2,
    backgroundColor: '#BCE0FF',
    shadowColor: '#1F8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#06090F',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    lineHeight: 13,
  },
  tabIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});

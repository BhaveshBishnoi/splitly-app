import { AppProvider } from '@/app/context/AppContext';
import { AD_UNIT_IDS } from '@/app/utils/ads';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds, { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Load App Open ad
let appOpenAd: AppOpenAd | null = null;

function loadAppOpenAd() {
  appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen, {
    requestNonPersonalizedAdsOnly: false,
  });

  appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
    appOpenAd?.show();
  });

  appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
    appOpenAd = null;
  });

  appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
    appOpenAd = null;
  });

  appOpenAd.load();
}

function AppOpenAdManager() {
  const appState = useRef(AppState.currentState);
  const hasShownOnLaunch = useRef(false);

  useEffect(() => {
    // Initialize Mobile Ads SDK first, then show app open ad
    mobileAds()
      .initialize()
      .then(() => {
        if (!hasShownOnLaunch.current) {
          hasShownOnLaunch.current = true;
          // Small delay to let the app render first
          setTimeout(loadAppOpenAd, 1500);
        }
      });

    // Show app open ad when app comes to foreground from background
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        loadAppOpenAd();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0d0f14' }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" backgroundColor="#0d0f14" translucent={false} />
          <AppOpenAdManager />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0d0f14' },
              animation: 'fade',
            }}
          />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

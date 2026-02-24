import { AppProvider } from '@/app/context/AppContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0d0d0d' }}>
      <AppProvider>
        <StatusBar style="light" backgroundColor="#0d0d0d" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0d0d' } }} />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

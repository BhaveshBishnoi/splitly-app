import { useApp } from '@/app/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
    active: '#bb86fc',
    inactive: '#555',
    bg: '#141414',
    border: 'rgba(255,255,255,0.07)',
};

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { expenses, members } = useApp();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.active,
                tabBarInactiveTintColor: COLORS.inactive,
                tabBarStyle: {
                    backgroundColor: COLORS.bg,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    height: 60 + (Platform.OS === 'ios' ? insets.bottom : 8),
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    title: 'Expenses',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" size={size} color={color} />
                    ),
                    tabBarBadge: expenses.length > 0 ? expenses.length : undefined,
                    tabBarBadgeStyle: { backgroundColor: '#03dac6', fontSize: 10 },
                }}
            />
            <Tabs.Screen
                name="balances"
                options={{
                    title: 'Balances',
                    tabBarIcon: ({ color, size }) => (
                        <View>
                            <Ionicons name="wallet" size={size} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

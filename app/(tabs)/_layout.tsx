import { useApp } from '@/app/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
    active: '#bb86fc',
    inactive: '#4a4a5a',
    bg: '#0d0f14',
    border: 'rgba(255,255,255,0.06)',
};

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { expenses } = useApp();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: C.active,
                tabBarInactiveTintColor: C.inactive,
                tabBarStyle: {
                    backgroundColor: C.bg,
                    borderTopColor: C.border,
                    borderTopWidth: 1,
                    height: 56 + (Platform.OS === 'ios' ? insets.bottom : 12),
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                    marginTop: 2,
                },
                tabBarItemStyle: {
                    paddingTop: 0,
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
                    tabBarBadgeStyle: {
                        backgroundColor: '#03dac6',
                        fontSize: 10,
                        color: '#0d0f14',
                        fontWeight: '700',
                    },
                }}
            />
            <Tabs.Screen
                name="balances"
                options={{
                    title: 'Balances',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="wallet" size={size} color={color} />
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

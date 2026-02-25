import { useApp } from '@/app/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
    active: '#bb86fc',
    inactive: '#3d3d52',
    bg: '#0d0f14',
    cardBg: '#13161e',
    border: 'rgba(187,134,252,0.12)',
};

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
    return (
        <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: focused ? 'rgba(187,134,252,0.14)' : 'transparent',
        }}>
            <Ionicons name={name} size={22} color={color} />
        </View>
    );
}

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
                    backgroundColor: C.cardBg,
                    borderTopColor: C.border,
                    borderTopWidth: 1,
                    height: 64 + (Platform.OS === 'ios' ? insets.bottom : 12),
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
                    paddingTop: 6,
                    paddingHorizontal: 4,
                    elevation: 20,
                    shadowColor: '#bb86fc',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 0.3,
                    marginTop: 0,
                },
                tabBarItemStyle: {
                    paddingTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="home" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    title: 'Expenses',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="receipt" color={color} focused={focused} />
                    ),
                    tabBarBadge: expenses.length > 0 ? expenses.length : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#03dac6',
                        fontSize: 10,
                        color: '#0d0f14',
                        fontWeight: '700',
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                    },
                }}
            />
            <Tabs.Screen
                name="balances"
                options={{
                    title: 'Balances',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="wallet" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="bar-chart" color={color} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

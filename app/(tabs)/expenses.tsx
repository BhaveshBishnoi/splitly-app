import { useApp, CATEGORY_ICONS, formatINR } from '@/app/context/AppContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
    bg: '#0d0f14',
    card: '#161a22',
    border: 'rgba(255,255,255,0.07)',
    purple: '#bb86fc',
    teal: '#03dac6',
    text: '#f0f0f5',
    subText: '#8a8a99',
};

export default function ExpensesScreen() {
    const { expenses, removeExpense, totalExpense } = useApp();
    const insets = useSafeAreaInsets();

    const handleDelete = (id: string) => {
        Alert.alert('Delete Expense', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    removeExpense(id);
                },
            },
        ]);
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Expenses</Text>
                    <Text style={styles.subtitle}>{expenses.length} total · {formatINR(totalExpense)}</Text>
                </View>
            </View>

            {expenses.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialCommunityIcons name="receipt-text-outline" size={56} color="#333" />
                    <Text style={styles.emptyTitle}>No expenses yet</Text>
                    <Text style={styles.emptyHint}>Add your first expense from the Home tab</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >
                    {expenses.slice().reverse().map(exp => (
                        <TouchableOpacity
                            key={exp.id}
                            style={styles.item}
                            onLongPress={() => handleDelete(exp.id)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.iconBox}>
                                <Ionicons name={(CATEGORY_ICONS[exp.category] || 'ellipsis-horizontal') as any} size={22} color={C.teal} />
                            </View>
                            <View style={styles.itemBody}>
                                <Text style={styles.itemDesc} numberOfLines={1}>{exp.desc}</Text>
                                <Text style={styles.itemMeta}>
                                    {exp.category} · Paid by <Text style={styles.highlight}>{exp.paidBy}</Text>
                                </Text>
                                <Text style={styles.itemMeta}>{exp.members.join(', ')}</Text>
                            </View>
                            <View style={styles.itemRight}>
                                <Text style={styles.itemAmount}>{formatINR(exp.amount)}</Text>
                                <Text style={styles.itemDate}>
                                    {new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    <Text style={styles.hint}>Long press to delete</Text>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
    subtitle: { color: C.subText, fontSize: 13, marginTop: 2 },
    scroll: { padding: 16, paddingBottom: 32 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyTitle: { color: '#555', fontSize: 17, fontWeight: '600', marginTop: 16 },
    emptyHint: { color: '#3a3a4a', fontSize: 13, marginTop: 6 },
    item: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: C.border,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(3,218,198,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    itemBody: { flex: 1 },
    itemDesc: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 3 },
    itemMeta: { color: C.subText, fontSize: 12, marginTop: 1 },
    highlight: { color: C.purple, fontWeight: '600' },
    itemRight: { alignItems: 'flex-end', marginLeft: 8 },
    itemAmount: { color: C.purple, fontSize: 16, fontWeight: '700', marginBottom: 3 },
    itemDate: { color: '#555', fontSize: 11 },
    hint: { textAlign: 'center', color: '#3a3a4a', fontSize: 12, marginTop: 8 },
});

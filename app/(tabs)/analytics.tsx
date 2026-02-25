import { useApp, CATEGORIES, CATEGORY_ICONS, formatINR } from '@/app/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
    bg: '#0d0f14',
    card: '#161a22',
    border: 'rgba(255,255,255,0.07)',
    purple: '#bb86fc',
    teal: '#03dac6',
    orange: '#ffb74d',
    red: '#cf6679',
    subText: '#8a8a99',
};

const BAR_COLORS = ['#bb86fc', '#03dac6', '#ffb74d', '#cf6679', '#80cbc4', '#f48fb1', '#a5d6a7'];

const CAT_ICONS: Record<string, string> = {
    Food: 'restaurant',
    Travel: 'airplane',
    Entertainment: 'game-controller',
    Shopping: 'cart',
    Utilities: 'flash',
    Other: 'ellipsis-horizontal',
    Rent: 'home',
    Health: 'heart',
    Groceries: 'basket',
};

const STAT_CONFIG = [
    { key: 'total', label: 'Total Spent', icon: 'wallet', color: C.purple },
    { key: 'avg', label: 'Avg / Expense', icon: 'trending-up', color: C.teal },
    { key: 'max', label: 'Largest', icon: 'trophy', color: C.orange },
];

function BarRow({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon?: string }) {
    const pct = max > 0 ? value / max : 0;
    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {icon && (
                        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: `${color}1a`, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name={icon as any} size={12} color={color} />
                        </View>
                    )}
                    <Text style={{ color: '#ddd', fontSize: 13, fontWeight: '600' }}>{label}</Text>
                </View>
                <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{formatINR(value)}</Text>
            </View>
            <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
            </View>
        </View>
    );
}

export default function AnalyticsScreen() {
    const { members, expenses, getMemberBalances, totalExpense } = useApp();

    const catTotals: Record<string, number> = {};
    CATEGORIES.forEach(c => { catTotals[c] = 0; });
    expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const usedCats = CATEGORIES.filter(c => catTotals[c] > 0);
    const maxCat = Math.max(...usedCats.map(c => catTotals[c]), 1);

    const maxMember = Math.max(...members.map(m => getMemberBalances[m.name]?.paid || 0), 1);

    const avg = expenses.length > 0 ? totalExpense / expenses.length : 0;
    const largExp = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    const stats = [
        { label: 'Total Spent', value: formatINR(totalExpense), icon: 'wallet-outline', color: C.purple, bg: 'rgba(187,134,252,0.1)' },
        { label: 'Avg / Expense', value: formatINR(avg), icon: 'trending-up-outline', color: C.teal, bg: 'rgba(3,218,198,0.1)' },
        { label: 'Largest', value: formatINR(largExp), icon: 'trophy-outline', color: C.orange, bg: 'rgba(255,183,77,0.1)' },
    ];

    const medalColors = [C.orange, '#b0b0b0', '#cd7f32'];

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>{expenses.length} expenses analysed</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{expenses.length}</Text>
                </View>
            </View>

            {expenses.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIconRing}>
                        <Ionicons name="bar-chart-outline" size={44} color={C.purple} />
                    </View>
                    <Text style={styles.emptyTitle}>No data yet</Text>
                    <Text style={styles.emptyHint}>Add expenses to see insights</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Summary Stats */}
                    <View style={styles.statRow}>
                        {stats.map(s => (
                            <View key={s.label} style={[styles.statCard, { borderTopColor: s.color, borderTopWidth: 2 }]}>
                                <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                                </View>
                                <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Category Breakdown */}
                    {usedCats.length > 0 && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.cardIconBg, { backgroundColor: 'rgba(187,134,252,0.12)' }]}>
                                    <Ionicons name="pie-chart" size={16} color={C.purple} />
                                </View>
                                <Text style={styles.cardTitle}>Spending by Category</Text>
                            </View>
                            {usedCats.map((cat, i) => (
                                <BarRow
                                    key={cat}
                                    label={cat}
                                    value={catTotals[cat]}
                                    max={maxCat}
                                    color={BAR_COLORS[i % BAR_COLORS.length]}
                                    icon={CAT_ICONS[cat] || 'ellipsis-horizontal'}
                                />
                            ))}
                        </View>
                    )}

                    {/* Member Contributions */}
                    {members.length > 0 && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.cardIconBg, { backgroundColor: 'rgba(3,218,198,0.12)' }]}>
                                    <Ionicons name="people" size={16} color={C.teal} />
                                </View>
                                <Text style={[styles.cardTitle, { color: C.teal }]}>Paid by Member</Text>
                            </View>
                            {members.map((m, i) => {
                                const paid = getMemberBalances[m.name]?.paid || 0;
                                return (
                                    <BarRow
                                        key={m.id}
                                        label={m.name}
                                        value={paid}
                                        max={maxMember}
                                        color={BAR_COLORS[i % BAR_COLORS.length]}
                                    />
                                );
                            })}
                        </View>
                    )}

                    {/* Top Expenses */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: 'rgba(255,183,77,0.12)' }]}>
                                <Ionicons name="trophy" size={16} color={C.orange} />
                            </View>
                            <Text style={[styles.cardTitle, { color: C.orange }]}>Top 5 Expenses</Text>
                        </View>
                        {expenses
                            .slice()
                            .sort((a, b) => b.amount - a.amount)
                            .slice(0, 5)
                            .map((e, i) => (
                                <View key={e.id} style={[styles.topItem, i < 4 && styles.topItemBorder]}>
                                    <View style={[styles.rank, {
                                        backgroundColor: i < 3 ? `${medalColors[i]}15` : 'rgba(255,255,255,0.04)',
                                    }]}>
                                        <Text style={[styles.rankText, { color: i < 3 ? medalColors[i] : C.subText }]}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{e.desc}</Text>
                                        <Text style={{ color: C.subText, fontSize: 12, marginTop: 2 }}>{e.category} · {e.paidBy}</Text>
                                    </View>
                                    <Text style={{ color: C.orange, fontWeight: '800', fontSize: 15 }}>{formatINR(e.amount)}</Text>
                                </View>
                            ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
    subtitle: { color: C.subText, fontSize: 12, marginTop: 2 },
    countBadge: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(187,134,252,0.1)',
        borderWidth: 1, borderColor: 'rgba(187,134,252,0.25)',
        justifyContent: 'center', alignItems: 'center',
    },
    countBadgeText: { color: C.purple, fontSize: 15, fontWeight: '900' },
    scroll: { padding: 16, paddingBottom: 32 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 12 },
    emptyIconRing: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(187,134,252,0.08)',
        borderWidth: 1, borderColor: 'rgba(187,134,252,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    emptyTitle: { color: '#ccc', fontSize: 18, fontWeight: '700', marginTop: 4 },
    emptyHint: { color: '#454555', fontSize: 13 },
    statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12,
        borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 6,
    },
    statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
    statLabel: { color: C.subText, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    card: {
        backgroundColor: C.card, borderRadius: 20, padding: 18,
        marginBottom: 16, borderWidth: 1, borderColor: C.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    cardIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: C.purple },
    topItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    },
    topItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    rank: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    rankText: { fontSize: 14, fontWeight: '800' },
});

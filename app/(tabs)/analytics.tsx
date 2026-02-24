import { useApp, CATEGORIES, CATEGORY_ICONS, formatINR } from '@/app/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? value / max : 0;
    return (
        <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ color: '#ddd', fontSize: 13, fontWeight: '500' }}>{label}</Text>
                <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{formatINR(value)}</Text>
            </View>
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
            </View>
        </View>
    );
}

export default function AnalyticsScreen() {
    const { members, expenses, getMemberBalances, totalExpense } = useApp();
    const insets = useSafeAreaInsets();

    // Category breakdown
    const catTotals: Record<string, number> = {};
    CATEGORIES.forEach(c => { catTotals[c] = 0; });
    expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const usedCats = CATEGORIES.filter(c => catTotals[c] > 0);
    const maxCat = Math.max(...usedCats.map(c => catTotals[c]), 1);

    // Member contribution
    const maxMember = Math.max(...members.map(m => getMemberBalances[m.name]?.paid || 0), 1);

    // Stats
    const avg = expenses.length > 0 ? totalExpense / expenses.length : 0;
    const largExp = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>{expenses.length} expenses analysed</Text>
                </View>
            </View>

            {expenses.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="bar-chart-outline" size={56} color="#333" />
                    <Text style={styles.emptyTitle}>No data yet</Text>
                    <Text style={styles.emptyHint}>Add expenses to see insights</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Summary Stats */}
                    <View style={styles.statRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{formatINR(totalExpense)}</Text>
                            <Text style={styles.statLabel}>Total Spent</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{formatINR(avg)}</Text>
                            <Text style={styles.statLabel}>Avg / Expense</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{formatINR(largExp)}</Text>
                            <Text style={styles.statLabel}>Largest</Text>
                        </View>
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
                                <View key={e.id} style={styles.topItem}>
                                    <View style={styles.rank}>
                                        <Text style={styles.rankText}>{i + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{e.desc}</Text>
                                        <Text style={{ color: C.subText, fontSize: 12, marginTop: 2 }}>{e.category} · {e.paidBy}</Text>
                                    </View>
                                    <Text style={{ color: C.orange, fontWeight: '700', fontSize: 14 }}>{formatINR(e.amount)}</Text>
                                </View>
                            ))}
                    </View>
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
    statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: C.border, alignItems: 'center',
    },
    statValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 4 },
    statLabel: { color: C.subText, fontSize: 11 },
    card: {
        backgroundColor: C.card, borderRadius: 20, padding: 18,
        marginBottom: 16, borderWidth: 1, borderColor: C.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    cardIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: C.purple },
    topItem: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    },
    rank: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: 'rgba(255,183,77,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    rankText: { color: C.orange, fontSize: 13, fontWeight: '700' },
});

import { useApp, formatINR } from '@/app/context/AppContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
    green: '#81c784',
    subText: '#8a8a99',
};

const AVATAR_COLORS = ['#bb86fc', '#03dac6', '#ffb74d', '#cf6679', '#80cbc4', '#f48fb1', '#a5d6a7'];

export default function BalancesScreen() {
    const { members, getMemberBalances, settlementPlan, totalExpense } = useApp();

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Balances</Text>
                    <Text style={styles.subtitle}>{members.length} members · {formatINR(totalExpense)} total</Text>
                </View>
                {settlementPlan.length === 0 && members.length > 0 && (
                    <View style={styles.settledChip}>
                        <Ionicons name="checkmark-circle" size={14} color={C.teal} />
                        <Text style={styles.settledChipText}>Settled</Text>
                    </View>
                )}
                {settlementPlan.length > 0 && (
                    <View style={styles.pendingChip}>
                        <Ionicons name="alert-circle" size={14} color={C.orange} />
                        <Text style={styles.pendingChipText}>{settlementPlan.length} pending</Text>
                    </View>
                )}
            </View>

            {members.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIconRing}>
                        <Ionicons name="wallet-outline" size={44} color={C.purple} />
                    </View>
                    <Text style={styles.emptyTitle}>No members yet</Text>
                    <Text style={styles.emptyHint}>Add members from the Home tab{'\n'}to see balances</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Balance Cards */}
                    <Text style={styles.sectionTitle}>💳  Member Balances</Text>
                    {members.map((m, idx) => {
                        const b = getMemberBalances[m.name] ?? { paid: 0, split: 0, net: 0 };
                        const isPositive = b.net > 0.01;
                        const isNegative = b.net < -0.01;
                        const accentColor = isPositive ? C.teal : isNegative ? C.red : C.subText;
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        return (
                            <View key={m.id} style={[styles.balCard, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
                                <View style={[styles.avatar, { backgroundColor: `${avatarColor}22` }]}>
                                    <Text style={[styles.avatarText, { color: avatarColor }]}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.balCardCenter}>
                                    <Text style={styles.memberName}>{m.name}</Text>
                                    <View style={styles.balMetaRow}>
                                        <View style={styles.metaBadge}>
                                            <Text style={styles.metaBadgeLabel}>Paid</Text>
                                            <Text style={styles.metaBadgeVal}>{formatINR(b.paid)}</Text>
                                        </View>
                                        <View style={styles.metaDivider} />
                                        <View style={styles.metaBadge}>
                                            <Text style={styles.metaBadgeLabel}>Share</Text>
                                            <Text style={styles.metaBadgeVal}>{formatINR(b.split)}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.netContainer}>
                                    <Text style={[styles.netAmount, { color: accentColor }]}>
                                        {isPositive ? '+' : ''}{formatINR(b.net)}
                                    </Text>
                                    <View style={[styles.netLabelPill, { backgroundColor: `${accentColor}18` }]}>
                                        <Text style={[styles.netLabel, { color: accentColor }]}>
                                            {isPositive ? 'gets back' : isNegative ? 'owes' : '✓ settled'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {/* Settlement Plan */}
                    {settlementPlan.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>⚡  How to Settle Up</Text>
                            {settlementPlan.map((txn, i) => (
                                <View key={i} style={styles.txnCard}>
                                    <View style={[styles.txnAvatar, { backgroundColor: 'rgba(207,102,121,0.15)' }]}>
                                        <Text style={[styles.avatarText, { color: C.red }]}>{txn.from.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                                        <Text style={styles.txnText}>
                                            <Text style={{ color: '#fff', fontWeight: '800' }}>{txn.from}</Text>
                                            <Text style={{ color: C.subText }}> pays </Text>
                                            <Text style={{ color: '#fff', fontWeight: '800' }}>{txn.to}</Text>
                                        </Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={14} color={C.subText} style={{ marginHorizontal: 4 }} />
                                    <View style={styles.txnBadge}>
                                        <Text style={styles.txnAmount}>{formatINR(txn.amount)}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {settlementPlan.length === 0 && members.length > 0 && (
                        <View style={styles.settledBanner}>
                            <MaterialCommunityIcons name="party-popper" size={24} color={C.teal} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.settledBannerTitle}>All settled up!</Text>
                                <Text style={styles.settledBannerSub}>Everyone's even. 🎉</Text>
                            </View>
                        </View>
                    )}
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
    settledChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(3,218,198,0.1)', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3,218,198,0.25)',
    },
    settledChipText: { color: C.teal, fontSize: 12, fontWeight: '700' },
    pendingChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,183,77,0.1)', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,183,77,0.25)',
    },
    pendingChipText: { color: C.orange, fontSize: 12, fontWeight: '700' },
    scroll: { padding: 16, paddingBottom: 32 },
    sectionTitle: { color: C.subText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 12 },
    emptyIconRing: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(187,134,252,0.08)',
        borderWidth: 1, borderColor: 'rgba(187,134,252,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    emptyTitle: { color: '#ccc', fontSize: 18, fontWeight: '700', marginTop: 4 },
    emptyHint: { color: '#454555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: '800' },
    balCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: C.border,
        overflow: 'hidden',
    },
    balCardCenter: { flex: 1, marginLeft: 12 },
    memberName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
    balMetaRow: { flexDirection: 'row', alignItems: 'center' },
    metaBadge: { alignItems: 'center' },
    metaBadgeLabel: { color: C.subText, fontSize: 10, fontWeight: '600', marginBottom: 2 },
    metaBadgeVal: { color: '#ccc', fontSize: 12, fontWeight: '700' },
    metaDivider: { width: 1, height: 24, backgroundColor: C.border, marginHorizontal: 12 },
    netContainer: { alignItems: 'flex-end' },
    netAmount: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    netLabelPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    netLabel: { fontSize: 11, fontWeight: '700' },
    txnCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: C.border,
    },
    txnAvatar: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    txnText: { fontSize: 14 },
    txnBadge: {
        backgroundColor: 'rgba(255,183,77,0.15)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 6,
        borderWidth: 1, borderColor: 'rgba(255,183,77,0.25)',
    },
    txnAmount: { color: C.orange, fontWeight: '800', fontSize: 14 },
    settledBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(3,218,198,0.07)', borderRadius: 18,
        padding: 18, marginTop: 20,
        borderWidth: 1, borderColor: 'rgba(3,218,198,0.18)',
    },
    settledBannerTitle: { color: C.teal, fontSize: 17, fontWeight: '800' },
    settledBannerSub: { color: '#3d7d78', fontSize: 13, marginTop: 2 },
});

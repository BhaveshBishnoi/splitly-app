import { useApp, formatINR } from '@/app/context/AppContext';
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

export default function BalancesScreen() {
    const { members, getMemberBalances, settlementPlan, totalExpense } = useApp();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Balances</Text>
                    <Text style={styles.subtitle}>Total: {formatINR(totalExpense)}</Text>
                </View>
            </View>

            {members.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="wallet-outline" size={56} color="#333" />
                    <Text style={styles.emptyTitle}>No members yet</Text>
                    <Text style={styles.emptyHint}>Add members from the Home tab to see balances</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Balance Cards */}
                    <Text style={styles.sectionTitle}>Member Balances</Text>
                    {members.map(m => {
                        const b = getMemberBalances[m.name] ?? { paid: 0, split: 0, net: 0 };
                        const isPositive = b.net > 0.01;
                        const isNegative = b.net < -0.01;
                        return (
                            <View key={m.id} style={styles.balCard}>
                                <View style={styles.balCardLeft}>
                                    <View style={[styles.avatar, { backgroundColor: isPositive ? 'rgba(3,218,198,0.2)' : isNegative ? 'rgba(207,102,121,0.2)' : 'rgba(255,255,255,0.08)' }]}>
                                        <Text style={[styles.avatarText, { color: isPositive ? C.teal : isNegative ? C.red : C.subText }]}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.memberName}>{m.name}</Text>
                                        <Text style={styles.memberMeta}>
                                            Paid {formatINR(b.paid)} · Owes {formatINR(b.split)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.netContainer}>
                                    <Text style={[
                                        styles.netAmount,
                                        isPositive ? { color: C.teal } : isNegative ? { color: C.red } : { color: C.subText }
                                    ]}>
                                        {isPositive ? '+' : ''}{formatINR(b.net)}
                                    </Text>
                                    <Text style={styles.netLabel}>
                                        {isPositive ? 'gets back' : isNegative ? 'owes' : 'settled'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}

                    {/* Settlement Plan */}
                    {settlementPlan.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>How to Settle Up ⚡️</Text>
                            {settlementPlan.map((txn, i) => (
                                <View key={i} style={styles.txnCard}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{txn.from.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                                        <Text style={styles.txnText}>
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>{txn.from}</Text>
                                            <Text style={{ color: C.subText }}> pays </Text>
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>{txn.to}</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.txnBadge}>
                                        <Text style={styles.txnAmount}>{formatINR(txn.amount)}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {settlementPlan.length === 0 && members.length > 0 && (
                        <View style={styles.settledBanner}>
                            <Ionicons name="checkmark-circle" size={22} color={C.teal} />
                            <Text style={styles.settledText}>All settled up! 🎉</Text>
                        </View>
                    )}
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
    sectionTitle: { color: C.subText, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyTitle: { color: '#555', fontSize: 17, fontWeight: '600', marginTop: 16 },
    emptyHint: { color: '#3a3a4a', fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(187,134,252,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: C.purple, fontSize: 16, fontWeight: 'bold' },
    balCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: C.border,
    },
    balCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    memberName: { color: '#fff', fontSize: 15, fontWeight: '600' },
    memberMeta: { color: C.subText, fontSize: 12, marginTop: 2 },
    netContainer: { alignItems: 'flex-end' },
    netAmount: { fontSize: 16, fontWeight: '800' },
    netLabel: { color: C.subText, fontSize: 11, marginTop: 2 },
    txnCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: C.border,
    },
    txnText: { fontSize: 14 },
    txnBadge: {
        backgroundColor: 'rgba(255,183,77,0.15)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    txnAmount: { color: C.orange, fontWeight: '700', fontSize: 14 },
    settledBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(3,218,198,0.08)', borderRadius: 14,
        padding: 16, marginTop: 16, gap: 8,
        borderWidth: 1, borderColor: 'rgba(3,218,198,0.2)',
    },
    settledText: { color: C.teal, fontSize: 16, fontWeight: '600' },
});

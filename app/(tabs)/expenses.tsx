import { useApp, CATEGORY_ICONS, formatINR } from '@/app/context/AppContext';
import { AD_UNIT_IDS } from '@/app/utils/ads';
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
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
    bg: '#0d0f14',
    card: '#161a22',
    cardAlt: '#12151c',
    border: 'rgba(255,255,255,0.07)',
    purple: '#bb86fc',
    teal: '#03dac6',
    text: '#f0f0f5',
    subText: '#8a8a99',
};

const CAT_COLORS: Record<string, string> = {
    Food: '#ff8a65',
    Travel: '#4dd0e1',
    Entertainment: '#ce93d8',
    Shopping: '#f06292',
    Utilities: '#aed581',
    Other: '#03dac6',
    Rent: '#ffb74d',
    Health: '#ef5350',
    Groceries: '#66bb6a',
};

export default function ExpensesScreen() {
    const { expenses, removeExpense, totalExpense } = useApp();

    const handleDelete = (id: string) => {
        Alert.alert('Delete Expense', 'Remove this expense?', [
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
        <SafeAreaView style={styles.root} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Expenses</Text>
                    <Text style={styles.subtitle}>{expenses.length} transactions · {formatINR(totalExpense)}</Text>
                </View>
                <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>{formatINR(totalExpense)}</Text>
                </View>
            </View>

            {expenses.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIconRing}>
                        <MaterialCommunityIcons name="receipt-text-outline" size={44} color={C.purple} />
                    </View>
                    <Text style={styles.emptyTitle}>No expenses yet</Text>
                    <Text style={styles.emptyHint}>Add your first expense from the{'\n'}Home tab</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >
                    {expenses.slice().reverse().map((exp, idx) => {
                        const catColor = CAT_COLORS[exp.category] || C.teal;
                        return (
                            <TouchableOpacity
                                key={exp.id}
                                style={styles.item}
                                onLongPress={() => handleDelete(exp.id)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.colorBar, { backgroundColor: catColor }]} />
                                <View style={[styles.iconBox, { backgroundColor: `${catColor}18` }]}>
                                    <Ionicons name={(CATEGORY_ICONS[exp.category] || 'ellipsis-horizontal') as any} size={22} color={catColor} />
                                </View>
                                <View style={styles.itemBody}>
                                    <Text style={styles.itemDesc} numberOfLines={1}>{exp.desc}</Text>
                                    <View style={styles.metaRow}>
                                        <View style={[styles.catPill, { backgroundColor: `${catColor}20` }]}>
                                            <Text style={[styles.catPillText, { color: catColor }]}>{exp.category}</Text>
                                        </View>
                                        <Text style={styles.itemMeta}> · </Text>
                                        <Text style={styles.itemMeta}>Paid by <Text style={styles.highlight}>{exp.paidBy}</Text></Text>
                                    </View>
                                    <Text style={styles.members} numberOfLines={1}>{exp.members.join(' · ')}</Text>
                                </View>
                                <View style={styles.itemRight}>
                                    <Text style={styles.itemAmount}>{formatINR(exp.amount)}</Text>
                                    <Text style={styles.itemDate}>
                                        {new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <View style={styles.hintRow}>
                        <Ionicons name="hand-left-outline" size={13} color="#3a3a4a" />
                        <Text style={styles.hint}>  Long press to delete</Text>
                    </View>
                </ScrollView>
            )}
            {/* Banner Ad */}
            <View style={styles.bannerContainer}>
                <BannerAd
                    unitId={AD_UNIT_IDS.banner}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
    subtitle: { color: C.subText, fontSize: 12, marginTop: 2 },
    totalBadge: {
        backgroundColor: 'rgba(187,134,252,0.12)',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(187,134,252,0.25)',
    },
    totalBadgeText: { color: C.purple, fontSize: 14, fontWeight: '800' },
    scroll: { padding: 14, paddingBottom: 32 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 12 },
    emptyIconRing: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(187,134,252,0.08)',
        borderWidth: 1, borderColor: 'rgba(187,134,252,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    emptyTitle: { color: '#ccc', fontSize: 18, fontWeight: '700', marginTop: 4 },
    emptyHint: { color: '#454555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    item: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
    iconBox: {
        width: 46, height: 46, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginRight: 12, marginLeft: 6,
    },
    itemBody: { flex: 1 },
    itemDesc: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    catPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    catPillText: { fontSize: 11, fontWeight: '700' },
    itemMeta: { color: C.subText, fontSize: 11 },
    highlight: { color: C.purple, fontWeight: '700' },
    members: { color: '#555', fontSize: 11, marginTop: 1 },
    itemRight: { alignItems: 'flex-end', marginLeft: 8 },
    itemAmount: { color: C.purple, fontSize: 16, fontWeight: '800', marginBottom: 4 },
    itemDate: { color: '#454555', fontSize: 11, fontWeight: '500' },
    hintRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    hint: { textAlign: 'center', color: '#3a3a4a', fontSize: 12 },
    bannerContainer: {
        alignItems: 'center',
        backgroundColor: '#0d0f14',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
});

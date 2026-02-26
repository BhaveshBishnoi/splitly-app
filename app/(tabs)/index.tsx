import { useApp, CATEGORIES, CATEGORY_ICONS, formatINR } from '@/app/context/AppContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
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
    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',
};

const CAT_COLORS: Record<string, string> = {
    Food: '#ff8a65', Travel: '#4dd0e1', Entertainment: '#ce93d8',
    Shopping: '#f06292', Utilities: '#aed581', Other: '#03dac6',
    Rent: '#ffb74d', Health: '#ef5350', Groceries: '#66bb6a',
};

const AVATAR_PALETTE = ['#bb86fc', '#03dac6', '#ffb74d', '#f48fb1', '#80cbc4', '#a5d6a7', '#ce93d8'];

export default function HomeScreen() {
    const { members, expenses, isReady, addMember, removeMember, addExpense, clearAll } = useApp();

    const [newMemberName, setNewMemberName] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [newExpenseDesc, setNewExpenseDesc] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('Other');

    const handleAddMember = useCallback(() => {
        if (newMemberName.trim()) {
            const ok = addMember(newMemberName.trim());
            if (!ok) {
                Alert.alert('Duplicate', 'This member already exists.');
                return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setNewMemberName('');
        }
    }, [newMemberName, addMember]);

    const handleRemoveMember = useCallback((id: string, name: string) => {
        Alert.alert('Remove Member', `Remove ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    removeMember(id);
                    setSelectedMembers(prev => prev.filter(m => m !== name));
                    if (paidBy === name) setPaidBy('');
                },
            },
        ]);
    }, [paidBy, removeMember]);

    const handleAddExpense = useCallback(() => {
        if (!newExpenseAmount || selectedMembers.length === 0 || !paidBy) {
            Alert.alert('Missing Details', 'Fill amount, select payer, and pick members to split.');
            return;
        }
        const amount = Number(newExpenseAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addExpense({ desc: newExpenseDesc.trim() || 'Untitled', amount, members: selectedMembers, paidBy, category: selectedCategory });
        setNewExpenseAmount('');
        setNewExpenseDesc('');
        setSelectedMembers([]);
        setPaidBy('');
        setSelectedCategory('Other');
    }, [newExpenseAmount, newExpenseDesc, selectedMembers, paidBy, selectedCategory, addExpense]);

    const handleClearAll = useCallback(() => {
        Alert.alert('Reset Everything', 'Delete all members and expenses?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    clearAll();
                    setSelectedMembers([]);
                    setPaidBy('');
                    setNewExpenseAmount('');
                    setNewExpenseDesc('');
                },
            },
        ]);
    }, [clearAll]);

    if (!isReady) {
        return (
            <SafeAreaView style={styles.loadingRoot} edges={['top']}>
                <View style={styles.loadingSpinner}>
                    <Ionicons name="git-branch-outline" size={32} color={C.purple} />
                </View>
                <Text style={styles.loadingText}>Loading…</Text>
            </SafeAreaView>
        );
    }

    const isExpenseReady = !!newExpenseAmount && !!paidBy && selectedMembers.length > 0;

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        <View style={styles.logoRow}>
                            <View style={styles.logoIcon}>
                                <Ionicons name="git-compare-outline" size={20} color="#0d0f14" />
                            </View>
                            <View>
                                <Text style={styles.title}>Splitly</Text>
                                <Text style={styles.subtitle}>Fair sharing, zero arguments.</Text>
                            </View>
                        </View>
                        {(members.length > 0 || expenses.length > 0) && (
                            <TouchableOpacity
                                onPress={handleClearAll}
                                style={styles.resetBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="trash-outline" size={16} color="#ff4444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── SQUAD MEMBERS ── */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: 'rgba(187,134,252,0.15)' }]}>
                                <Ionicons name="people" size={17} color={C.purple} />
                            </View>
                            <Text style={styles.cardTitle}>Squad</Text>
                            {members.length > 0 && (
                                <View style={styles.countChip}>
                                    <Text style={styles.countChipText}>{members.length}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Add someone's name…"
                                placeholderTextColor={C.subText}
                                value={newMemberName}
                                onChangeText={setNewMemberName}
                                onSubmitEditing={handleAddMember}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={styles.addBtn} onPress={handleAddMember}>
                                <Ionicons name="person-add" size={18} color="#0d0f14" />
                            </TouchableOpacity>
                        </View>

                        {members.length > 0 && (
                            <View style={styles.chips}>
                                {members.map((m, idx) => {
                                    const avatarColor = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                                    return (
                                        <TouchableOpacity
                                            key={m.id}
                                            style={styles.chip}
                                            onPress={() => handleRemoveMember(m.id, m.name)}
                                        >
                                            <View style={[styles.avatar, { backgroundColor: `${avatarColor}28` }]}>
                                                <Text style={[styles.avatarText, { color: avatarColor }]}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={styles.chipText}>{m.name}</Text>
                                            <Ionicons name="close" size={13} color="#555" style={{ marginLeft: 4 }} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {members.length === 0 && (
                            <Text style={styles.emptyHint}>Add people you split with</Text>
                        )}
                    </View>

                    {/* ── NEW EXPENSE ── */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: 'rgba(3,218,198,0.15)' }]}>
                                <Ionicons name="receipt" size={17} color={C.teal} />
                            </View>
                            <Text style={[styles.cardTitle, { color: C.teal }]}>Add Expense</Text>
                        </View>

                        {/* Description + Amount */}
                        <View style={styles.expRow}>
                            <TextInput
                                style={[styles.input, { flex: 2, marginRight: 8, marginBottom: 0 }]}
                                placeholder="Description"
                                placeholderTextColor={C.subText}
                                value={newExpenseDesc}
                                onChangeText={setNewExpenseDesc}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1.1, marginBottom: 0 }]}
                                placeholder="₹ Amount"
                                placeholderTextColor={C.subText}
                                value={newExpenseAmount}
                                onChangeText={setNewExpenseAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Category */}
                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {CATEGORIES.map(cat => {
                                    const catColor = CAT_COLORS[cat] || C.teal;
                                    const isActive = selectedCategory === cat;
                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.catBtn,
                                                isActive && { backgroundColor: `${catColor}18`, borderColor: `${catColor}55` },
                                            ]}
                                            onPress={() => setSelectedCategory(cat)}
                                        >
                                            <Ionicons
                                                name={CATEGORY_ICONS[cat] as any}
                                                size={13}
                                                color={isActive ? catColor : C.subText}
                                            />
                                            <Text style={[styles.catText, isActive && { color: catColor, fontWeight: '700' }]}>{cat}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Who paid */}
                        <Text style={styles.label}>Who paid?</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {members.map((m, idx) => {
                                    const avatarColor = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                                    const active = paidBy === m.name;
                                    return (
                                        <TouchableOpacity
                                            key={m.id}
                                            style={[
                                                styles.payerBtn,
                                                active && { backgroundColor: `${avatarColor}18`, borderColor: `${avatarColor}55` },
                                            ]}
                                            onPress={() => setPaidBy(m.name)}
                                        >
                                            <View style={[styles.payerAvatar, { backgroundColor: `${avatarColor}28` }]}>
                                                <Text style={[styles.payerAvatarText, { color: avatarColor }]}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.payerText, active && { color: avatarColor, fontWeight: '700' }]}>
                                                {m.name}
                                            </Text>
                                            {active && <Ionicons name="checkmark-circle" size={14} color={avatarColor} />}
                                        </TouchableOpacity>
                                    );
                                })}
                                {members.length === 0 && <Text style={styles.emptyHint}>Add members first</Text>}
                            </View>
                        </ScrollView>

                        {/* Split among */}
                        <View style={styles.splitHeader}>
                            <Text style={styles.label}>Split among</Text>
                            {members.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedMembers(
                                        selectedMembers.length === members.length ? [] : members.map(m => m.name)
                                    );
                                }}>
                                    <Text style={styles.link}>
                                        {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.splitBox}>
                            {members.map((m, idx) => {
                                const sel = selectedMembers.includes(m.name);
                                const avatarColor = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[
                                            styles.memberRow,
                                            idx < members.length - 1 && styles.memberRowBorder,
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedMembers(prev =>
                                                sel ? prev.filter(n => n !== m.name) : [...prev, m.name]
                                            );
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[
                                                styles.avatar,
                                                { backgroundColor: sel ? `${avatarColor}28` : 'rgba(255,255,255,0.05)' },
                                            ]}>
                                                <Text style={[styles.avatarText, { color: sel ? avatarColor : '#555' }]}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.memberName, { color: sel ? '#fff' : C.subText }]}>
                                                {m.name}
                                            </Text>
                                        </View>
                                        <Switch
                                            value={sel}
                                            onValueChange={() => {
                                                Haptics.selectionAsync();
                                                setSelectedMembers(prev =>
                                                    sel ? prev.filter(n => n !== m.name) : [...prev, m.name]
                                                );
                                            }}
                                            trackColor={{ false: '#2a2a3a', true: `${avatarColor}50` }}
                                            thumbColor={sel ? avatarColor : '#4a4a5a'}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                            {members.length === 0 && (
                                <Text style={[styles.emptyHint, { padding: 12 }]}>Add members to split with</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.addExpBtn, !isExpenseReady && styles.addExpBtnDisabled]}
                            onPress={handleAddExpense}
                            disabled={!isExpenseReady}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle" size={20} color={isExpenseReady ? '#0d0f14' : '#555'} style={{ marginRight: 8 }} />
                            <Text style={[styles.addExpBtnText, !isExpenseReady && { color: '#555' }]}>Add Expense</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loadingRoot: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingSpinner: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: 'rgba(187,134,252,0.1)',
        borderWidth: 1, borderColor: 'rgba(187,134,252,0.25)',
        justifyContent: 'center', alignItems: 'center',
    },
    loadingText: { color: C.purple, fontSize: 16, fontWeight: '600' },

    scroll: { padding: 16, paddingBottom: 36 },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, marginTop: 4,
    },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoIcon: {
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: C.purple,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: C.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
        elevation: 8,
    },
    title: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
    subtitle: { color: C.subText, fontSize: 12, marginTop: 1 },
    resetBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(255,68,68,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,68,68,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },

    // Card
    card: {
        backgroundColor: C.card, borderRadius: 22, padding: 18,
        marginBottom: 16, borderWidth: 1, borderColor: C.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    cardIconBg: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: C.purple, flex: 1 },
    countChip: {
        backgroundColor: 'rgba(187,134,252,0.15)', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: 'rgba(187,134,252,0.3)',
    },
    countChipText: { color: C.purple, fontSize: 12, fontWeight: '800' },

    // Input
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    expRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    input: {
        backgroundColor: C.inputBg, color: '#fff', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 13, fontSize: 14,
        borderWidth: 1, borderColor: C.inputBorder, marginBottom: 0,
    },
    addBtn: {
        backgroundColor: C.purple, width: 48, height: 48,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        shadowColor: C.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
        elevation: 5,
    },

    // Member chips
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20, paddingVertical: 7, paddingRight: 10, paddingLeft: 6, gap: 6,
    },
    avatar: {
        width: 26, height: 26, borderRadius: 13,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 11, fontWeight: '800' },
    chipText: { color: '#eee', fontSize: 13, fontWeight: '600' },
    emptyHint: { color: '#3d3d52', fontSize: 13, fontStyle: 'italic', paddingTop: 4 },

    // Labels
    label: { fontSize: 12, fontWeight: '700', color: C.subText, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    link: { fontSize: 13, fontWeight: '700', color: C.purple },
    splitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

    // Category pills
    catBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    catText: { color: C.subText, fontSize: 12, fontWeight: '500' },

    // Payer buttons
    payerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    payerAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    payerAvatarText: { fontSize: 11, fontWeight: '800' },
    payerText: { color: C.subText, fontSize: 14, fontWeight: '500' },

    // Split box
    splitBox: {
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 4, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    memberRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 11, gap: 10,
    },
    memberRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    memberName: { fontSize: 14, marginLeft: 10, fontWeight: '600' },

    // Add Expense button
    addExpBtn: {
        backgroundColor: C.teal, padding: 15, borderRadius: 16,
        alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
        shadowColor: C.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
        elevation: 6,
    },
    addExpBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        shadowOpacity: 0, elevation: 0,
    },
    addExpBtnText: { color: '#0d0f14', fontSize: 15, fontWeight: '800' },
});

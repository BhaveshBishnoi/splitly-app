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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
    bg: '#0d0f14',
    card: '#161a22',
    border: 'rgba(255,255,255,0.07)',
    purple: '#bb86fc',
    teal: '#03dac6',
    text: '#f0f0f5',
    subText: '#8a8a99',
    inputBg: 'rgba(255,255,255,0.06)',
};

export default function HomeScreen() {
    const { members, expenses, isReady, addMember, removeMember, addExpense, clearAll } = useApp();
    const insets = useSafeAreaInsets();

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
            <View style={[styles.loading, { paddingTop: insets.top }]}>
                <Text style={styles.loadingText}>Loading…</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
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
                    {/* HEADER */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Splitly</Text>
                            <Text style={styles.subtitle}>Fair sharing, zero arguments.</Text>
                        </View>
                        {(members.length > 0 || expenses.length > 0) && (
                            <TouchableOpacity onPress={handleClearAll} style={styles.resetBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="refresh" size={18} color="#ff4444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* SQUAD MEMBERS */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: 'rgba(187,134,252,0.12)' }]}>
                                <Ionicons name="people" size={18} color={C.purple} />
                            </View>
                            <Text style={styles.cardTitle}>Squad Members</Text>
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
                                <Ionicons name="add" size={22} color="#0d0f14" />
                            </TouchableOpacity>
                        </View>

                        {members.length > 0 && (
                            <View style={styles.chips}>
                                {members.map(m => (
                                    <TouchableOpacity key={m.id} style={styles.chip} onPress={() => handleRemoveMember(m.id, m.name)}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{m.name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <Text style={styles.chipText}>{m.name}</Text>
                                        <Ionicons name="close-circle" size={15} color="#666" style={{ marginLeft: 4 }} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* NEW EXPENSE */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconBg, { backgroundColor: 'rgba(3,218,198,0.12)' }]}>
                                <Ionicons name="receipt" size={18} color={C.teal} />
                            </View>
                            <Text style={[styles.cardTitle, { color: C.teal }]}>New Expense</Text>
                        </View>

                        <View style={styles.expRow}>
                            <TextInput
                                style={[styles.input, { flex: 2, marginRight: 8, marginBottom: 0 }]}
                                placeholder="What was it for?"
                                placeholderTextColor={C.subText}
                                value={newExpenseDesc}
                                onChangeText={setNewExpenseDesc}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="₹ Amount"
                                placeholderTextColor={C.subText}
                                value={newExpenseAmount}
                                onChangeText={setNewExpenseAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Category */}
                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Ionicons
                                            name={CATEGORY_ICONS[cat] as any}
                                            size={14}
                                            color={selectedCategory === cat ? C.teal : C.subText}
                                        />
                                        <Text style={[styles.catText, selectedCategory === cat && { color: C.teal }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Who paid */}
                        <Text style={styles.label}>Who paid?</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {members.map(m => (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.payerBtn, paidBy === m.name && styles.payerBtnActive]}
                                        onPress={() => setPaidBy(m.name)}
                                    >
                                        <MaterialCommunityIcons
                                            name={paidBy === m.name ? 'check-circle' : 'checkbox-blank-circle-outline'}
                                            size={16}
                                            color={paidBy === m.name ? C.teal : C.subText}
                                        />
                                        <Text style={[styles.payerText, paidBy === m.name && { color: C.teal }]}>{m.name}</Text>
                                    </TouchableOpacity>
                                ))}
                                {members.length === 0 && <Text style={styles.emptyHint}>Add members first</Text>}
                            </View>
                        </ScrollView>

                        {/* Split among */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={styles.label}>Split among</Text>
                            {members.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedMembers(selectedMembers.length === members.length ? [] : members.map(m => m.name));
                                }}>
                                    <Text style={styles.link}>{selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.splitBox}>
                            {members.map(m => {
                                const sel = selectedMembers.includes(m.name);
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={styles.memberRow}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedMembers(prev => sel ? prev.filter(n => n !== m.name) : [...prev, m.name]);
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.avatar, { backgroundColor: sel ? C.purple : '#333' }]}>
                                                <Text style={[styles.avatarText, { color: sel ? '#0d0f14' : '#999' }]}>{m.name.charAt(0).toUpperCase()}</Text>
                                            </View>
                                            <Text style={[styles.memberName, { color: sel ? '#fff' : C.subText }]}>{m.name}</Text>
                                        </View>
                                        <Switch
                                            value={sel}
                                            onValueChange={() => {
                                                Haptics.selectionAsync();
                                                setSelectedMembers(prev => sel ? prev.filter(n => n !== m.name) : [...prev, m.name]);
                                            }}
                                            trackColor={{ false: '#2c2c2c', true: 'rgba(187,134,252,0.45)' }}
                                            thumbColor={sel ? C.purple : '#666'}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                            {members.length === 0 && <Text style={styles.emptyHint}>Add members to split with</Text>}
                        </View>

                        <TouchableOpacity
                            style={[styles.addExpBtn, (!newExpenseAmount || !paidBy || selectedMembers.length === 0) && styles.addExpBtnDisabled]}
                            onPress={handleAddExpense}
                            disabled={!newExpenseAmount || !paidBy || selectedMembers.length === 0}
                        >
                            <Ionicons name="add-circle" size={20} color="#0d0f14" style={{ marginRight: 8 }} />
                            <Text style={styles.addExpBtnText}>Add Expense</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loading: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: C.purple, fontSize: 18, fontWeight: 'bold' },
    scroll: { padding: 16, paddingBottom: 32 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, marginTop: 8,
    },
    title: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
    subtitle: { color: C.subText, fontSize: 13, marginTop: 2 },
    resetBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,68,68,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    card: {
        backgroundColor: C.card, borderRadius: 20, padding: 18,
        marginBottom: 16, borderWidth: 1, borderColor: C.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardIconBg: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: C.purple },
    label: { fontSize: 13, fontWeight: '600', color: C.subText, marginBottom: 8 },
    link: { fontSize: 13, fontWeight: '600', color: C.purple },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
    expRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    input: {
        backgroundColor: C.inputBg, color: '#fff', borderRadius: 12,
        padding: 13, fontSize: 14, marginBottom: 12,
        borderWidth: 1, borderColor: C.border,
    },
    addBtn: {
        backgroundColor: C.purple, width: 46, height: 46,
        borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
        paddingVertical: 6, paddingRight: 10, paddingLeft: 6,
    },
    avatar: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: '#0d0f14', fontSize: 11, fontWeight: 'bold' },
    chipText: { color: '#eee', fontSize: 13, marginLeft: 6, fontWeight: '500' },
    catBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'transparent',
    },
    catBtnActive: { backgroundColor: 'rgba(3,218,198,0.1)', borderColor: 'rgba(3,218,198,0.3)' },
    catText: { color: C.subText, fontSize: 12, fontWeight: '500' },
    payerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'transparent',
    },
    payerBtnActive: { backgroundColor: 'rgba(3,218,198,0.1)', borderColor: 'rgba(3,218,198,0.3)' },
    payerText: { color: C.subText, fontSize: 14, fontWeight: '500' },
    splitBox: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 6, marginBottom: 14 },
    memberRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    memberName: { fontSize: 14, marginLeft: 10, fontWeight: '500' },
    emptyHint: { color: '#555', fontSize: 13, fontStyle: 'italic', paddingVertical: 8, paddingHorizontal: 4 },
    addExpBtn: {
        backgroundColor: C.teal, padding: 14, borderRadius: 14,
        alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center',
    },
    addExpBtnDisabled: { backgroundColor: '#2c2c2c', opacity: 0.6 },
    addExpBtnText: { color: '#0d0f14', fontSize: 15, fontWeight: '700' },
});

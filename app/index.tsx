import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEYS = {
  MEMBERS: '@contry_manager_members',
  EXPENSES: '@contry_manager_expenses',
};

export interface Member {
  id: string;
  name: string;
  totalSpent: number;
}

export interface Expense {
  id: string;
  desc: string;
  amount: number;
  members: string[];
  paidBy: string;
  date: string;
}

export default function Index() {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isReady) {
      saveData();
    }
  }, [members, expenses, isReady]);

  const loadData = async () => {
    try {
      const storedMembers = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERS);
      const storedExpenses = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);

      if (storedMembers) setMembers(JSON.parse(storedMembers));
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setIsReady(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  const addMember = useCallback(() => {
    if (newMemberName.trim()) {
      const name = newMemberName.trim();
      if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
        Alert.alert('Duplicate', 'This member already exists.');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMembers(prev => [...prev, { id: Date.now().toString(), name, totalSpent: 0 }]);
      setNewMemberName('');
    }
  }, [newMemberName, members]);

  const removeMember = useCallback((name: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setMembers(prev => prev.filter(m => m.name !== name));
            setSelectedMembers(prev => prev.filter(m => m !== name));
            if (paidBy === name) setPaidBy('');
          }
        }
      ]
    );
  }, [paidBy]);

  const addExpense = useCallback(() => {
    if (newExpenseAmount && selectedMembers.length > 0 && paidBy) {
      const amount = Number(newExpenseAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const splitAmount = amount / selectedMembers.length;

      const expenseItem = {
        id: Date.now().toString(),
        desc: newExpenseDesc.trim() || 'Untitled Expense',
        amount,
        members: selectedMembers,
        paidBy,
        date: new Date().toISOString()
      };

      setExpenses(prev => [...prev, expenseItem]);

      setMembers(prev =>
        prev.map(member =>
          selectedMembers.includes(member.name)
            ? { ...member, totalSpent: member.totalSpent + splitAmount }
            : member,
        )
      );

      setNewExpenseAmount('');
      setNewExpenseDesc('');
      setSelectedMembers([]);
      setPaidBy('');
    } else {
      Alert.alert('Missing Details', 'Please fill amount, select payer, and pick members to split.');
    }
  }, [newExpenseAmount, newExpenseDesc, selectedMembers, paidBy]);

  const removeExpense = useCallback((id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense? Balances will be recalculated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setExpenses(prev => prev.filter(e => e.id !== id));
          }
        }
      ]
    );
  }, []);

  const clearAllData = () => {
    Alert.alert(
      "Reset Everything",
      "This will delete all members and expenses. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setMembers([]);
            setExpenses([]);
            setSelectedMembers([]);
            setPaidBy('');
            setNewExpenseAmount('');
            setNewExpenseDesc('');
          }
        }
      ]
    );
  };

  const getMemberBalances = useMemo(() => {
    const balances: Record<string, { paid: number; split: number; net: number }> = {};
    members.forEach(m => {
      balances[m.name] = { paid: 0, split: 0, net: 0 };
    });

    expenses.forEach(exp => {
      if (balances[exp.paidBy]) {
        balances[exp.paidBy].paid += exp.amount;
      }
      const splitAmount = exp.amount / exp.members.length;
      exp.members.forEach(m => {
        if (balances[m]) {
          balances[m].split += splitAmount;
        }
      });
    });

    // Calculate net
    Object.keys(balances).forEach(name => {
      balances[name].net = balances[name].paid - balances[name].split;
    });

    return balances;
  }, [members, expenses]);

  const settlementPlan = useMemo(() => {
    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    Object.entries(getMemberBalances).forEach(([name, data]) => {
      if (data.net < -0.01) debtors.push({ name, amount: Math.abs(data.net) });
      else if (data.net > 0.01) creditors.push({ name, amount: data.net });
    });

    const transactions = [];

    while (debtors.length > 0 && creditors.length > 0) {
      // Sort to match largest debtors with largest creditors
      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);

      const d = debtors[0];
      const c = creditors[0];
      const amount = Math.min(d.amount, c.amount);

      transactions.push({ from: d.name, to: c.name, amount });

      d.amount -= amount;
      c.amount -= amount;

      if (d.amount < 0.01) debtors.shift();
      if (c.amount < 0.01) creditors.shift();
    }

    return transactions;
  }, [getMemberBalances]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Splitly</Text>
              <Text style={styles.subtitle}>Fair sharing, zero arguments.</Text>
            </View>
            {(members.length > 0 || expenses.length > 0) && (
              <TouchableOpacity onPress={clearAllData} style={styles.headerBtn}>
                <Ionicons name="refresh" size={20} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* ADD MEMBER SECTION */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color="#bb86fc" />
              <Text style={styles.cardTitle}>Squad Members</Text>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter member's name"
                placeholderTextColor="#666"
                value={newMemberName}
                onChangeText={setNewMemberName}
                onSubmitEditing={addMember}
              />
              <TouchableOpacity style={styles.addButton} onPress={addMember}>
                <Ionicons name="add" size={24} color="#121212" />
              </TouchableOpacity>
            </View>

            {members.length > 0 && (
              <View style={styles.memberChipsContainer}>
                {members.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.chip}
                    onPress={() => removeMember(member.name)}
                  >
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarMiniText}>{member.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.chipText}>{member.name}</Text>
                    <Ionicons name="close-circle" size={16} color="#888" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ADD EXPENSE SECTION */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt" size={20} color="#03dac6" />
              <Text style={[styles.cardTitle, { color: '#03dac6' }]}>New Expense</Text>
            </View>

            <View style={styles.expenseInputs}>
              <TextInput
                style={[styles.input, { flex: 2, marginRight: 8 }]}
                placeholder="What was this for? (e.g. Pizza)"
                placeholderTextColor="#666"
                value={newExpenseDesc}
                onChangeText={setNewExpenseDesc}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="$ Amount"
                placeholderTextColor="#666"
                value={newExpenseAmount}
                onChangeText={setNewExpenseAmount}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionLabel}>Who paid for it?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <View style={styles.pickerContainer}>
                {members.map(member => (
                  <TouchableOpacity
                    key={member.name}
                    style={[
                      styles.payerBtn,
                      paidBy === member.name && styles.payerBtnActive,
                    ]}
                    onPress={() => setPaidBy(member.name)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={paidBy === member.name ? "check-circle" : "checkbox-blank-circle-outline"}
                      size={18}
                      color={paidBy === member.name ? "#03dac6" : "#aaa"}
                    />
                    <Text style={[
                      styles.payerBtnText,
                      paidBy === member.name && styles.payerBtnTextActive
                    ]}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {members.length === 0 && (
                  <Text style={styles.emptyText}>Add members first to set a payer</Text>
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={styles.sectionLabel}>Who was it for? (Split)</Text>
              {members.length > 0 && (
                <TouchableOpacity onPress={() => {
                  Haptics.selectionAsync();
                  if (selectedMembers.length === members.length) {
                    setSelectedMembers([]);
                  } else {
                    setSelectedMembers(members.map(m => m.name));
                  }
                }}>
                  <Text style={styles.linkText}>
                    {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.splitMembersContainer}>
              {members.map(member => {
                const isSelected = selectedMembers.includes(member.name);
                return (
                  <TouchableOpacity
                    key={member.name}
                    style={styles.memberRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMembers(prev =>
                        isSelected ? prev.filter(n => n !== member.name) : [...prev, member.name]
                      );
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.avatarMini, { backgroundColor: isSelected ? '#bb86fc' : '#444' }]}>
                        <Text style={[styles.avatarMiniText, { color: isSelected ? '#121212' : '#aaa' }]}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.memberRowText, { color: isSelected ? '#fff' : '#aaa' }]}>{member.name}</Text>
                    </View>
                    <Switch
                      value={isSelected}
                      onValueChange={() => {
                        Haptics.selectionAsync();
                        setSelectedMembers(prev =>
                          isSelected ? prev.filter(n => n !== member.name) : [...prev, member.name]
                        );
                      }}
                      trackColor={{ false: '#333', true: 'rgba(187, 134, 252, 0.5)' }}
                      thumbColor={isSelected ? '#bb86fc' : '#888'}
                    />
                  </TouchableOpacity>
                );
              })}
              {members.length === 0 && (
                <Text style={styles.emptyText}>No members available to split</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: '#03dac6' },
                (!newExpenseAmount || selectedMembers.length === 0 || !paidBy) && styles.actionButtonDisabled
              ]}
              onPress={addExpense}
              disabled={!newExpenseAmount || selectedMembers.length === 0 || !paidBy}
            >
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

          {/* BALANCES & SETTLEMENT PLAN */}
          {members.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet" size={20} color="#ffb74d" />
                <Text style={[styles.cardTitle, { color: '#ffb74d' }]}>Balances Table</Text>
              </View>

              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Member</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Spent</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Paid</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Owes</Text>
                </View>
                {members.map(member => {
                  const data = getMemberBalances[member.name];
                  const isPositive = data.net > 0.01;
                  const isNegative = data.net < -0.01;
                  return (
                    <View key={member.name} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold', color: '#fff' }]}>{member.name}</Text>
                      <Text style={styles.tableCell}>${data.split.toFixed(2)}</Text>
                      <Text style={styles.tableCell}>${data.paid.toFixed(2)}</Text>
                      <Text style={[
                        styles.tableCell,
                        { fontWeight: '900' },
                        isPositive ? { color: '#03dac6' } : isNegative ? { color: '#cf6679' } : { color: '#888' }
                      ]}>
                        {isPositive ? '+' : ''}{data.net.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Group Spent:</Text>
                <Text style={styles.totalAmountText}>${totalExpense.toFixed(2)}</Text>
              </View>

              {settlementPlan.length > 0 && (
                <View style={styles.settlementSection}>
                  <Text style={styles.settlementTitle}>How to settle up ⚡️</Text>
                  {settlementPlan.map((txn, index) => (
                    <View key={index} style={styles.txnItem}>
                      <View style={styles.txnLeft}>
                        <View style={styles.avatarMini}>
                          <Text style={styles.avatarMiniText}>{txn.from.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.txnText}>
                          <Text style={{ fontWeight: 'bold', color: '#fff' }}>{txn.from}</Text> owes <Text style={{ fontWeight: 'bold', color: '#fff' }}>{txn.to}</Text>
                        </Text>
                      </View>
                      <Text style={styles.txnAmount}>${txn.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* RECENT EXPENSES */}
          {expenses.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={20} color="#bb86fc" />
                <Text style={[styles.cardTitle, { color: '#bb86fc' }]}>Recent Expenses</Text>
              </View>

              {expenses.slice().reverse().map(exp => (
                <TouchableOpacity
                  key={exp.id}
                  style={styles.historyItem}
                  onLongPress={() => removeExpense(exp.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.historyIcon}>
                    <MaterialCommunityIcons name="receipt-text" size={24} color="#888" />
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historyDesc}>{exp.desc}</Text>
                    <Text style={styles.historyPaidBy}>Paid by {exp.paidBy}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyAmount}>${exp.amount.toFixed(2)}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <Text style={{ textAlign: 'center', color: '#555', fontSize: 12, marginTop: 10 }}>
                Long press an expense to delete it
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#bb86fc',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  headerBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    marginTop: 12,
    marginBottom: 10,
  },
  linkText: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#bb86fc',
    width: 48,
    height: 48,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingRight: 10,
    paddingLeft: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#eee',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  payerBtnActive: {
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    borderColor: 'rgba(3, 218, 198, 0.3)',
  },
  payerBtnText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  payerBtnTextActive: {
    color: '#03dac6',
    fontWeight: 'bold',
  },
  splitMembersContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  memberRowText: {
    color: '#eee',
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  actionButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#aaa',
  },
  tableCell: {
    flex: 1,
    color: '#ddd',
    fontSize: 13,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
  },
  totalLabel: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  totalAmountText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  settlementSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  settlementTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  txnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 10,
  },
  txnAmount: {
    color: '#ffb74d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyBody: {
    flex: 1,
  },
  historyDesc: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyPaidBy: {
    color: '#888',
    fontSize: 12,
  },
  historyAmount: {
    color: '#bb86fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyDate: {
    color: '#666',
    fontSize: 11,
  }
});

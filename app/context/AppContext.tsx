import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
    MEMBERS: '@splitly_members',
    EXPENSES: '@splitly_expenses',
};

export interface Member {
    id: string;
    name: string;
}

export interface Expense {
    id: string;
    desc: string;
    amount: number;
    members: string[];
    paidBy: string;
    date: string;
    category: string;
}

export interface Balance {
    paid: number;
    split: number;
    net: number;
}

export interface Transaction {
    from: string;
    to: string;
    amount: number;
}

interface AppContextType {
    members: Member[];
    expenses: Expense[];
    isReady: boolean;
    addMember: (name: string) => boolean;
    removeMember: (id: string) => void;
    addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
    removeExpense: (id: string) => void;
    clearAll: () => void;
    getMemberBalances: Record<string, Balance>;
    settlementPlan: Transaction[];
    totalExpense: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [m, e] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.MEMBERS),
                    AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
                ]);
                if (m) setMembers(JSON.parse(m));
                if (e) setExpenses(JSON.parse(e));
            } catch (err) {
                console.error('Load error', err);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (!isReady) return;
        AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members)).catch(console.error);
    }, [members, isReady]);

    useEffect(() => {
        if (!isReady) return;
        AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)).catch(console.error);
    }, [expenses, isReady]);

    const addMember = useCallback((name: string): boolean => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        setMembers(prev => {
            if (prev.find(m => m.name.toLowerCase() === trimmed.toLowerCase())) return prev;
            return [...prev, { id: Date.now().toString(), name: trimmed }];
        });
        return true;
    }, []);

    const removeMember = useCallback((id: string) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    const addExpense = useCallback((expense: Omit<Expense, 'id' | 'date'>) => {
        setExpenses(prev => [
            ...prev,
            { ...expense, id: Date.now().toString(), date: new Date().toISOString() },
        ]);
    }, []);

    const removeExpense = useCallback((id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setMembers([]);
        setExpenses([]);
    }, []);

    const getMemberBalances = useMemo<Record<string, Balance>>(() => {
        const balances: Record<string, Balance> = {};
        members.forEach(m => { balances[m.name] = { paid: 0, split: 0, net: 0 }; });
        expenses.forEach(exp => {
            if (balances[exp.paidBy] !== undefined) balances[exp.paidBy].paid += exp.amount;
            const share = exp.amount / exp.members.length;
            exp.members.forEach(name => {
                if (balances[name] !== undefined) balances[name].split += share;
            });
        });
        Object.keys(balances).forEach(name => {
            balances[name].net = balances[name].paid - balances[name].split;
        });
        return balances;
    }, [members, expenses]);

    const settlementPlan = useMemo<Transaction[]>(() => {
        const debtors: { name: string; amount: number }[] = [];
        const creditors: { name: string; amount: number }[] = [];
        Object.entries(getMemberBalances).forEach(([name, data]) => {
            if (data.net < -0.01) debtors.push({ name, amount: Math.abs(data.net) });
            else if (data.net > 0.01) creditors.push({ name, amount: data.net });
        });
        const txns: Transaction[] = [];
        while (debtors.length > 0 && creditors.length > 0) {
            debtors.sort((a, b) => b.amount - a.amount);
            creditors.sort((a, b) => b.amount - a.amount);
            const d = debtors[0], c = creditors[0];
            const amt = Math.min(d.amount, c.amount);
            txns.push({ from: d.name, to: c.name, amount: amt });
            d.amount -= amt; c.amount -= amt;
            if (d.amount < 0.01) debtors.shift();
            if (c.amount < 0.01) creditors.shift();
        }
        return txns;
    }, [getMemberBalances]);

    const totalExpense = useMemo(() => expenses.reduce((a, e) => a + e.amount, 0), [expenses]);

    return (
        <AppContext.Provider value={{
            members, expenses, isReady,
            addMember, removeMember, addExpense, removeExpense, clearAll,
            getMemberBalances, settlementPlan, totalExpense,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

export const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Utilities', 'Entertainment', 'Rent', 'Other'];

export const CATEGORY_ICONS: Record<string, string> = {
    Food: 'fast-food',
    Travel: 'airplane',
    Shopping: 'cart',
    Utilities: 'flash',
    Entertainment: 'film',
    Rent: 'home',
    Other: 'ellipsis-horizontal',
};

export function formatINR(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

import { useSyncExternalStore } from "react";

export type TxnType = "given" | "received";
export type TxnCategory =
  | "Cash loan"
  | "Business payment"
  | "Shop purchase"
  | "Rent"
  | "Personal"
  | "Other";

export interface Transaction {
  id: string;
  clientId: string;
  type: TxnType;
  amount: number;
  category: TxnCategory;
  note?: string;
  date: string; // ISO
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface CallLogEntry {
  id: string;
  name: string;
  phone?: string;
  time: string; // ISO
  direction: "incoming" | "outgoing" | "missed";
  note?: string;
  reminderAt?: string;
}

export interface Task {
  id: string;
  contactName: string;
  phone?: string;
  note: string;
  reminderAt?: string;
  done: boolean;
  createdAt: string;
  source: "manual" | "call";
  callId?: string;
}

interface AppState {
  clients: Client[];
  transactions: Transaction[];
  calls: CallLogEntry[];
  tasks: Task[];
}

const KEY = "khata-app-v1";

const seedCalls: CallLogEntry[] = [
  { id: "c1", name: "Ramesh Kumar", phone: "+91 98200 11122", time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), direction: "incoming" },
  { id: "c2", name: "Priya Sharma", phone: "+91 99100 22334", time: new Date(Date.now() - 1000 * 60 * 90).toISOString(), direction: "outgoing" },
  { id: "c3", name: "Anil Verma", phone: "+91 98765 43210", time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), direction: "missed" },
  { id: "c4", name: "Sunita Devi", phone: "+91 97000 11223", time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), direction: "incoming" },
  { id: "c5", name: "Mohit Gupta", phone: "+91 96111 44556", time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), direction: "outgoing" },
];

const initial: AppState = {
  clients: [],
  transactions: [],
  calls: seedCalls,
  tasks: [],
};

let state: AppState = initial;
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {}
}
load();

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state),
    () => selector(initial),
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const actions = {
  addClient(name: string, phone?: string): Client {
    const c: Client = { id: uid(), name, phone, createdAt: new Date().toISOString() };
    state = { ...state, clients: [c, ...state.clients] };
    emit();
    return c;
  },
  deleteClient(id: string) {
    state = {
      ...state,
      clients: state.clients.filter((c) => c.id !== id),
      transactions: state.transactions.filter((t) => t.clientId !== id),
    };
    emit();
  },
  addTransaction(t: Omit<Transaction, "id" | "createdAt">) {
    const txn: Transaction = { ...t, id: uid(), createdAt: new Date().toISOString() };
    state = { ...state, transactions: [txn, ...state.transactions] };
    emit();
    return txn;
  },
  deleteTransaction(id: string) {
    state = { ...state, transactions: state.transactions.filter((t) => t.id !== id) };
    emit();
  },
  updateCall(id: string, patch: Partial<CallLogEntry>) {
    state = {
      ...state,
      calls: state.calls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
    emit();
  },
  addCall(call: Omit<CallLogEntry, "id">) {
    state = { ...state, calls: [{ ...call, id: uid() }, ...state.calls] };
    emit();
  },
  addTask(t: Omit<Task, "id" | "createdAt" | "done">) {
    const task: Task = { ...t, id: uid(), done: false, createdAt: new Date().toISOString() };
    state = { ...state, tasks: [task, ...state.tasks] };
    emit();
    return task;
  },
  toggleTask(id: string) {
    state = {
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    };
    emit();
  },
  deleteTask(id: string) {
    state = { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
    emit();
  },
};

export function clientBalance(clientId: string, txns: Transaction[]): number {
  // Positive = client owes you (receive). Negative = you owe client (pay).
  return txns
    .filter((t) => t.clientId === clientId)
    .reduce((sum, t) => sum + (t.type === "given" ? t.amount : -t.amount), 0);
}

export function formatINR(n: number): string {
  const abs = Math.abs(n);
  return "₹" + abs.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

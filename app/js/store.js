// State store: loads/saves the household's data in localStorage and
// provides the money maths every view shares.
import { seedState } from './data.js';

const STORAGE_KEY = 'hearth-ledger-v1';
let state = null;
const listeners = [];

export function loadState() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions) && parsed.budgets) {
        state = parsed;
        return state;
      }
    }
  } catch (err) {
    // Corrupt or unavailable storage: fall back to the seed below.
  }
  state = seedState();
  persist();
  return state;
}

export function getState() {
  return loadState();
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Storage full or blocked: the app keeps working in memory.
  }
}

export function update(mutator) {
  mutator(state);
  persist();
  for (const fn of listeners) fn(state);
}

export function onChange(fn) {
  listeners.push(fn);
}

export function resetToSeed() {
  state = seedState();
  persist();
  for (const fn of listeners) fn(state);
}

export function setMonth(month) {
  update((s) => { s.month = month; });
}

// ---- money maths -----------------------------------------------------------

export function money(n) {
  const abs = Math.abs(n);
  const text = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? '-$' : '$') + text;
}

export function monthOf(dateStr) {
  return (dateStr || '').slice(0, 7);
}

export function transactionsInMonth(s, month) {
  return s.transactions.filter((t) => monthOf(t.date) === month);
}

export function monthTotals(s, month) {
  let income = 0;
  let spending = 0;
  let saved = 0;
  for (const t of transactionsInMonth(s, month)) {
    if (t.category === 'income') income += t.amount;
    else if (t.category === 'savings') saved += -t.amount;
    else if (t.amount < 0) spending += -t.amount;
    else income += t.amount;
  }
  return { income, spending, saved, net: income - spending - saved };
}

export function spendingByCategory(s, month) {
  const totals = {};
  for (const t of transactionsInMonth(s, month)) {
    if (t.category === 'income' || t.category === 'savings') continue;
    if (t.amount < 0) totals[t.category] = (totals[t.category] || 0) + -t.amount;
  }
  return totals;
}

export function recentMonths(s, count) {
  const months = new Set(s.transactions.map((t) => monthOf(t.date)).filter(Boolean));
  return Array.from(months).sort().slice(-count);
}

export function nextDueDate(bill, fromDate) {
  const from = fromDate ? new Date(fromDate + 'T00:00:00') : new Date();
  const year = from.getFullYear();
  const month = from.getMonth();
  let candidate = new Date(year, month, Math.min(bill.dayOfMonth, 28));
  if (candidate <= from) candidate = new Date(year, month + 1, Math.min(bill.dayOfMonth, 28));
  return candidate.toISOString().slice(0, 10);
}

export function needsWantsSavings(s, month) {
  const totals = monthTotals(s, month);
  const byCat = spendingByCategory(s, month);
  let needs = 0;
  let wants = 0;
  for (const [cat, amount] of Object.entries(byCat)) {
    const kind = cat === 'dining' || cat === 'fun' || cat === 'shopping' || cat === 'other' ? 'want' : 'need';
    if (kind === 'need') needs += amount;
    else wants += amount;
  }
  return { income: totals.income, needs, wants, savings: totals.saved };
}

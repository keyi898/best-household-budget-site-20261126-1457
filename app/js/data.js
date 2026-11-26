// Seed data and shared constants for Hearth Ledger.
// Everything here is original demo content for a fictional two-adult household.

export const CATEGORIES = [
  { id: 'housing', name: 'Housing', kind: 'need', color: '#0f4c4c' },
  { id: 'groceries', name: 'Groceries', kind: 'need', color: '#7fa88a' },
  { id: 'utilities', name: 'Utilities & bills', kind: 'need', color: '#5b8db8' },
  { id: 'transport', name: 'Transport', kind: 'need', color: '#c99a2e' },
  { id: 'health', name: 'Health', kind: 'need', color: '#c46a7d' },
  { id: 'dining', name: 'Dining out', kind: 'want', color: '#c25e3a' },
  { id: 'fun', name: 'Entertainment', kind: 'want', color: '#8a6fa8' },
  { id: 'shopping', name: 'Shopping', kind: 'want', color: '#d98e4a' },
  { id: 'kids', name: 'Kids & school', kind: 'need', color: '#4a9e8f' },
  { id: 'savings', name: 'Savings transfer', kind: 'saving', color: '#2e7d4f' },
  { id: 'other', name: 'Other', kind: 'want', color: '#9a9486' },
];

export const INCOME_SOURCES = ['Salary — Alex', 'Salary — Sam', 'Freelance', 'Interest', 'Other income'];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

let uidCounter = 1000;
export function uid(prefix) {
  uidCounter += 1;
  return prefix + '-' + Date.now().toString(36) + '-' + uidCounter;
}

function tx(id, date, label, category, amount, account) {
  return { id, date, label, category, amount, account: account || 'Joint checking', note: '' };
}

export function seedState() {
  const transactions = [
    // Current month (November 2026) — the month screenshots show
    tx('t1', '2026-11-01', 'Salary — Alex', 'income', 4200),
    tx('t2', '2026-11-01', 'Salary — Sam', 'income', 3100),
    tx('t3', '2026-11-02', 'Rent — Maple St flat', 'housing', -1650),
    tx('t4', '2026-11-03', 'Weekly groceries — Market Basket', 'groceries', -186.4),
    tx('t5', '2026-11-04', 'Electricity — City Power', 'utilities', -118.6),
    tx('t6', '2026-11-05', 'Bus passes (2 adults)', 'transport', -96),
    tx('t7', '2026-11-06', 'Dentist check-up — Sam', 'health', -85),
    tx('t8', '2026-11-07', 'Groceries — top-up shop', 'groceries', -64.2),
    tx('t9', '2026-11-08', 'Dinner with friends — Osteria', 'dining', -92.5),
    tx('t10', '2026-11-09', 'Kids football club fees', 'kids', -140),
    tx('t11', '2026-11-10', 'Water & sewer', 'utilities', -54.3),
    tx('t12', '2026-11-11', 'Fuel — car', 'transport', -58.9),
    tx('t13', '2026-11-12', 'Streaming bundle', 'fun', -24.99),
    tx('t14', '2026-11-13', 'Groceries — weekly shop', 'groceries', -172.8),
    tx('t15', '2026-11-14', 'Winter boots — Alex', 'shopping', -119),
    tx('t16', '2026-11-15', 'Freelance design invoice', 'income', 650),
    tx('t17', '2026-11-16', 'Broadband', 'utilities', -59.99),
    tx('t18', '2026-11-17', 'School trip payment', 'kids', -45),
    tx('t19', '2026-11-18', 'Groceries — weekly shop', 'groceries', -158.3),
    tx('t20', '2026-11-19', 'Cinema tickets (family)', 'fun', -48),
    tx('t21', '2026-11-20', 'Transfer to savings', 'savings', -800, 'Savings'),
    tx('t22', '2026-11-21', 'Takeaway — Friday treat', 'dining', -54.6),
    tx('t23', '2026-11-22', 'Pharmacy', 'health', -23.4),
    tx('t24', '2026-11-23', 'Groceries — weekly shop', 'groceries', -141.9),
    tx('t25', '2026-11-24', 'Car insurance (monthly)', 'transport', -132),
    // October 2026
    tx('t26', '2026-10-01', 'Salary — Alex', 'income', 4200),
    tx('t27', '2026-10-01', 'Salary — Sam', 'income', 3100),
    tx('t28', '2026-10-02', 'Rent — Maple St flat', 'housing', -1650),
    tx('t29', '2026-10-05', 'Groceries — weekly shop', 'groceries', -705.2),
    tx('t30', '2026-10-08', 'Electricity & gas', 'utilities', -196.4),
    tx('t31', '2026-10-12', 'Dining out', 'dining', -210.3),
    tx('t32', '2026-10-15', 'Transport & fuel', 'transport', -268.1),
    tx('t33', '2026-10-18', 'Kids & school', 'kids', -185),
    tx('t34', '2026-10-21', 'Shopping', 'shopping', -164.5),
    tx('t35', '2026-10-24', 'Entertainment', 'fun', -88.2),
    tx('t36', '2026-10-27', 'Health', 'health', -60),
    tx('t37', '2026-10-29', 'Transfer to savings', 'savings', -750, 'Savings'),
    // September 2026
    tx('t38', '2026-09-01', 'Salary — Alex', 'income', 4200),
    tx('t39', '2026-09-01', 'Salary — Sam', 'income', 3100),
    tx('t40', '2026-09-02', 'Rent — Maple St flat', 'housing', -1650),
    tx('t41', '2026-09-06', 'Groceries', 'groceries', -688.9),
    tx('t42', '2026-09-10', 'Utilities', 'utilities', -201.7),
    tx('t43', '2026-09-14', 'Dining out', 'dining', -176.8),
    tx('t44', '2026-09-18', 'Transport', 'transport', -241.6),
    tx('t45', '2026-09-22', 'Kids & school', 'kids', -230),
    tx('t46', '2026-09-25', 'Shopping & fun', 'shopping', -215.4),
    tx('t47', '2026-09-28', 'Transfer to savings', 'savings', -700, 'Savings'),
    // August 2026 (holiday month — spending spikes)
    tx('t48', '2026-08-01', 'Salary — Alex', 'income', 4200),
    tx('t49', '2026-08-01', 'Salary — Sam', 'income', 3100),
    tx('t50', '2026-08-02', 'Rent — Maple St flat', 'housing', -1650),
    tx('t51', '2026-08-07', 'Groceries', 'groceries', -540.3),
    tx('t52', '2026-08-12', 'Holiday flights & hotel', 'fun', -1180),
    tx('t53', '2026-08-16', 'Dining out (holiday)', 'dining', -390.5),
    tx('t54', '2026-08-20', 'Utilities & transport', 'utilities', -330.2),
    tx('t55', '2026-08-26', 'Transfer to savings', 'savings', -300, 'Savings'),
    // July 2026
    tx('t56', '2026-07-01', 'Salary — Alex', 'income', 4200),
    tx('t57', '2026-07-01', 'Salary — Sam', 'income', 3100),
    tx('t58', '2026-07-02', 'Rent — Maple St flat', 'housing', -1650),
    tx('t59', '2026-07-08', 'Groceries', 'groceries', -662.1),
    tx('t60', '2026-07-15', 'Utilities & transport', 'utilities', -452.8),
    tx('t61', '2026-07-20', 'Dining, shopping & fun', 'dining', -480.6),
    tx('t62', '2026-07-27', 'Transfer to savings', 'savings', -720, 'Savings'),
    // June 2026
    tx('t63', '2026-06-01', 'Salary — Alex', 'income', 4150),
    tx('t64', '2026-06-01', 'Salary — Sam', 'income', 3050),
    tx('t65', '2026-06-02', 'Rent — Maple St flat', 'housing', -1650),
    tx('t66', '2026-06-09', 'Groceries', 'groceries', -701.4),
    tx('t67', '2026-06-16', 'Utilities & transport', 'utilities', -468.9),
    tx('t68', '2026-06-23', 'Dining, shopping & fun', 'shopping', -512.3),
    tx('t69', '2026-06-28', 'Transfer to savings', 'savings', -680, 'Savings'),
  ];

  const budgets = {
    housing: 1700, groceries: 800, utilities: 320, transport: 320, health: 180,
    dining: 220, fun: 160, shopping: 200, kids: 260, other: 120,
  };

  const bills = [
    { id: 'b1', name: 'Rent — Maple St flat', amount: 1650, dayOfMonth: 2, category: 'housing', autopay: true, lastPaid: '2026-11-02' },
    { id: 'b2', name: 'Broadband', amount: 59.99, dayOfMonth: 16, category: 'utilities', autopay: true, lastPaid: '2026-11-16' },
    { id: 'b3', name: 'Electricity — City Power', amount: 118.6, dayOfMonth: 4, category: 'utilities', autopay: false, lastPaid: '2026-11-04' },
    { id: 'b4', name: 'Car insurance', amount: 132, dayOfMonth: 24, category: 'transport', autopay: true, lastPaid: '2026-11-24' },
    { id: 'b5', name: 'Streaming bundle', amount: 24.99, dayOfMonth: 12, category: 'fun', autopay: true, lastPaid: '2026-11-12' },
    { id: 'b6', name: 'Mobile phones (family plan)', amount: 68, dayOfMonth: 28, category: 'utilities', autopay: false, lastPaid: '2026-10-28' },
    { id: 'b7', name: 'Kids football club', amount: 140, dayOfMonth: 9, category: 'kids', autopay: false, lastPaid: '2026-11-09' },
  ];

  const goals = [
    { id: 'g1', name: 'Emergency fund (3 months)', target: 12000, saved: 8450, deadline: '2027-06-30', note: 'Kept in the instant-access savings account.' },
    { id: 'g2', name: 'Summer holiday 2027', target: 3500, saved: 1120, deadline: '2027-07-01', note: 'Flights + a week by the coast for four.' },
    { id: 'g3', name: 'New boiler', target: 2800, saved: 2650, deadline: '2027-01-15', note: 'Old boiler is 14 years old — replace before it fails.' },
    { id: 'g4', name: 'Kids college starter', target: 10000, saved: 3200, deadline: '2030-09-01', note: 'Long-term pot, topped up on birthdays.' },
  ];

  return { transactions, budgets, bills, goals, month: '2026-11', version: 1 };
}

// Router and interaction wiring for Hearth Ledger.
// Hash routes: #/ overview, #/transactions, #/budgets, #/bills, #/goals, #/analyze.
import { CATEGORIES, INCOME_SOURCES, uid } from './data.js';
import { getState, loadState, update, setMonth, resetToSeed, money } from './store.js';
import { dashboardView, transactionsView, budgetsView, billsView, goalsView, analyzeView, esc } from './views.js';

const viewEl = document.getElementById('view');
const modalRoot = document.getElementById('modalRoot');
const toastRoot = document.getElementById('toastRoot');
const monthInput = document.getElementById('monthInput');

let txFilter = { category: 'all', query: '' };
let targets = { needs: 50, wants: 30, savings: 20 };

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function route() {
  const hash = location.hash || '#/';
  const name = hash.replace('#/', '').split('/')[0] || 'dashboard';
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('data-nav') === (name === '' ? 'dashboard' : name));
  });
  if (name === 'transactions') viewEl.innerHTML = transactionsView(txFilter);
  else if (name === 'budgets') viewEl.innerHTML = budgetsView();
  else if (name === 'bills') viewEl.innerHTML = billsView();
  else if (name === 'goals') viewEl.innerHTML = goalsView();
  else if (name === 'analyze') viewEl.innerHTML = analyzeView(targets);
  else viewEl.innerHTML = dashboardView();
  window.scrollTo(0, 0);
}

function closeModal() {
  modalRoot.innerHTML = '';
}

function openModal(title, bodyHtml, onSubmit) {
  modalRoot.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><h2>' + esc(title) + '</h2>' + bodyHtml +
    '<div class="actions"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn" data-submit>Save</button></div></div></div>';
  modalRoot.querySelector('[data-close]').addEventListener('click', closeModal);
  modalRoot.querySelector('.modal-back').addEventListener('click', (e) => { if (e.target.classList.contains('modal-back')) closeModal(); });
  modalRoot.querySelector('[data-submit]').addEventListener('click', () => {
    const form = modalRoot.querySelector('form');
    const data = Object.fromEntries(new FormData(form).entries());
    if (onSubmit(data)) closeModal();
  });
}

function categoryOptions(selected) {
  let html = '<option value="income"' + (selected === 'income' ? ' selected' : '') + '>Income</option>';
  for (const cat of CATEGORIES) {
    html += '<option value="' + cat.id + '"' + (selected === cat.id ? ' selected' : '') + '>' + cat.name + '</option>';
  }
  return html;
}

function txForm(existing) {
  const t = existing || { date: getState().month + '-15', label: '', category: 'groceries', amount: '', account: 'Joint checking' };
  const isIncome = t.category === 'income';
  const displayAmount = t.amount === '' ? '' : Math.abs(t.amount);
  return '<form><div class="form-grid">' +
    '<label class="f">Date<input type="date" name="date" required value="' + t.date + '"></label>' +
    '<label class="f">Type & category<select name="category">' + categoryOptions(t.category) + '</select></label>' +
    '<label class="f full">Description<input type="text" name="label" required placeholder="e.g. Weekly groceries" value="' + esc(t.label) + '"></label>' +
    '<label class="f">Amount ($)<input type="number" name="amount" min="0" step="0.01" required value="' + displayAmount + '"></label>' +
    '<label class="f">Account<select name="account"><option' + (t.account === 'Joint checking' ? ' selected' : '') + '>Joint checking</option><option' + (t.account === 'Savings' ? ' selected' : '') + '>Savings</option><option' + (t.account === 'Cash' ? ' selected' : '') + '>Cash</option></select></label>' +
    '<p class="muted full">Income sources used by this household: ' + INCOME_SOURCES.join(', ') + '. Pick “Income” as the category for money in; everything else is recorded as money out.</p>' +
    '</div></form>';
}

function saveTx(data, existingId) {
  const amount = Number(data.amount);
  if (!data.date || !data.label || !(amount > 0)) { toast('Fill in date, description and a positive amount.'); return false; }
  const signed = data.category === 'income' ? amount : -amount;
  update((s) => {
    if (existingId) {
      const row = s.transactions.find((t) => t.id === existingId);
      if (row) Object.assign(row, { date: data.date, label: data.label, category: data.category, amount: signed, account: data.account });
    } else {
      s.transactions.push({ id: uid('t'), date: data.date, label: data.label, category: data.category, amount: signed, account: data.account, note: '' });
    }
  });
  toast(existingId ? 'Transaction updated.' : 'Transaction added.');
  route();
  return true;
}

function billForm(existing) {
  const b = existing || { name: '', amount: '', dayOfMonth: 1, category: 'utilities', autopay: false };
  return '<form><div class="form-grid">' +
    '<label class="f full">Bill name<input type="text" name="name" required value="' + esc(b.name) + '"></label>' +
    '<label class="f">Amount ($)<input type="number" name="amount" min="0" step="0.01" required value="' + b.amount + '"></label>' +
    '<label class="f">Day of month<input type="number" name="dayOfMonth" min="1" max="28" required value="' + b.dayOfMonth + '"></label>' +
    '<label class="f">Category<select name="category">' + CATEGORIES.filter((c) => c.id !== 'savings').map((c) => '<option value="' + c.id + '"' + (b.category === c.id ? ' selected' : '') + '>' + c.name + '</option>').join('') + '</select></label>' +
    '<label class="f">Autopay<select name="autopay"><option value="yes"' + (b.autopay ? ' selected' : '') + '>Yes — automatic</option><option value="no"' + (!b.autopay ? ' selected' : '') + '>No — pay manually</option></select></label>' +
    '</div></form>';
}

function goalForm(existing) {
  const g = existing || { name: '', target: '', saved: 0, deadline: '2027-12-31', note: '' };
  return '<form><div class="form-grid">' +
    '<label class="f full">Goal name<input type="text" name="name" required value="' + esc(g.name) + '"></label>' +
    '<label class="f">Target ($)<input type="number" name="target" min="1" step="10" required value="' + g.target + '"></label>' +
    '<label class="f">Already saved ($)<input type="number" name="saved" min="0" step="10" value="' + g.saved + '"></label>' +
    '<label class="f">Deadline<input type="date" name="deadline" required value="' + g.deadline + '"></label>' +
    '<label class="f">Note<input type="text" name="note" value="' + esc(g.note || '') + '"></label>' +
    '</div></form>';
}

function exportCsv() {
  const s = getState();
  const lines = ['date,label,category,amount,account'];
  for (const t of [...s.transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    lines.push([t.date, '"' + String(t.label).replaceAll('"', '""') + '"', t.category, t.amount, t.account || ''].join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'hearth-ledger-transactions.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  toast('CSV exported.');
}

function importCsv(file) {
  file.text().then((text) => {
    const lines = text.trim().split(/\r?\n/);
    let added = 0;
    update((s) => {
      for (const line of lines.slice(1)) {
        const parts = line.split(',');
        if (parts.length < 4) continue;
        const amount = Number(parts[3]);
        if (!parts[0] || Number.isNaN(amount)) continue;
        s.transactions.push({ id: uid('t'), date: parts[0], label: parts[1].replace(/^"|"$/g, ''), category: parts[2] || 'other', amount, account: parts[4] || 'Joint checking', note: '' });
        added += 1;
      }
    });
    toast(added ? 'Imported ' + added + ' transactions.' : 'No rows imported — check the CSV format.');
    route();
  });
}

viewEl.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  const s = getState();

  if (action === 'add-tx') openModal('Add transaction', txForm(null), (data) => saveTx(data, null));
  if (action === 'edit-tx') openModal('Edit transaction', txForm(s.transactions.find((t) => t.id === id)), (data) => saveTx(data, id));
  if (action === 'delete-tx') {
    if (confirm('Delete this transaction?')) {
      update((st) => { st.transactions = st.transactions.filter((t) => t.id !== id); });
      toast('Transaction deleted.');
      route();
    }
  }
  if (action === 'export-csv') exportCsv();
  if (action === 'save-budget') {
    const input = viewEl.querySelector('[data-budget-input="' + id + '"]');
    const value = Math.max(0, Number(input.value) || 0);
    update((st) => { st.budgets[id] = value; });
    toast('Budget updated to ' + money(value) + '.');
    route();
  }
  if (action === 'add-bill') openModal('Add bill', billForm(null), (data) => saveBill(data, null));
  if (action === 'edit-bill') openModal('Edit bill', billForm(s.bills.find((b) => b.id === id)), (data) => saveBill(data, id));
  if (action === 'delete-bill') {
    if (confirm('Delete this bill?')) {
      update((st) => { st.bills = st.bills.filter((b) => b.id !== id); });
      toast('Bill deleted.');
      route();
    }
  }
  if (action === 'pay-bill') {
    const bill = s.bills.find((b) => b.id === id);
    const today = new Date().toISOString().slice(0, 10);
    update((st) => {
      st.transactions.push({ id: uid('t'), date: today, label: bill.name, category: bill.category, amount: -bill.amount, account: 'Joint checking', note: '' });
      const row = st.bills.find((b) => b.id === id);
      if (row) row.lastPaid = today;
    });
    toast(bill.name + ' marked paid (' + money(bill.amount) + ').');
    route();
  }
  if (action === 'add-goal') openModal('New savings goal', goalForm(null), (data) => saveGoal(data, null));
  if (action === 'edit-goal') openModal('Edit goal', goalForm(s.goals.find((g) => g.id === id)), (data) => saveGoal(data, id));
  if (action === 'delete-goal') {
    if (confirm('Delete this goal?')) {
      update((st) => { st.goals = st.goals.filter((g) => g.id !== id); });
      toast('Goal deleted.');
      route();
    }
  }
  if (action === 'contribute-goal') {
    const input = viewEl.querySelector('[data-goal-input="' + id + '"]');
    const amount = Number(input.value) || 0;
    if (!(amount > 0)) { toast('Enter a positive amount.'); return; }
    update((st) => {
      const goal = st.goals.find((g) => g.id === id);
      if (goal) goal.saved += amount;
    });
    toast(money(amount) + ' added to the goal.');
    route();
  }
});

function saveBill(data, existingId) {
  const amount = Number(data.amount);
  if (!data.name || !(amount > 0)) { toast('Give the bill a name and a positive amount.'); return false; }
  update((s) => {
    const fields = { name: data.name, amount, dayOfMonth: Math.min(28, Math.max(1, Number(data.dayOfMonth) || 1)), category: data.category, autopay: data.autopay === 'yes' };
    if (existingId) {
      const row = s.bills.find((b) => b.id === existingId);
      if (row) Object.assign(row, fields);
    } else {
      s.bills.push({ id: uid('b'), lastPaid: '', ...fields });
    }
  });
  toast(existingId ? 'Bill updated.' : 'Bill added.');
  route();
  return true;
}

function saveGoal(data, existingId) {
  const target = Number(data.target);
  if (!data.name || !(target > 0)) { toast('Give the goal a name and a positive target.'); return false; }
  update((s) => {
    const fields = { name: data.name, target, saved: Math.max(0, Number(data.saved) || 0), deadline: data.deadline, note: data.note || '' };
    if (existingId) {
      const row = s.goals.find((g) => g.id === existingId);
      if (row) Object.assign(row, fields);
    } else {
      s.goals.push({ id: uid('g'), ...fields });
    }
  });
  toast(existingId ? 'Goal updated.' : 'Goal created.');
  route();
  return true;
}

viewEl.addEventListener('input', (event) => {
  if (event.target.id === 'txFilterCat') { txFilter.category = event.target.value; route(); }
  if (event.target.id === 'txFilterQuery') { txFilter.query = event.target.value; route(); }
  if (event.target.id === 'importCsv' && event.target.files[0]) importCsv(event.target.files[0]);
  const slider = event.target.closest('[data-target-slider]');
  if (slider) {
    const key = slider.getAttribute('data-target-slider');
    const value = Number(slider.value);
    const others = Object.keys(targets).filter((k) => k !== key);
    const rest = 100 - value;
    const otherSum = others.reduce((sum, k) => sum + targets[k], 0) || 1;
    targets[key] = value;
    targets[others[0]] = Math.round(rest * (targets[others[0]] / otherSum));
    targets[others[1]] = rest - targets[others[0]];
    route();
  }
});

monthInput.addEventListener('change', () => {
  if (monthInput.value) { setMonth(monthInput.value); route(); }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Reset everything back to the demo data? Your changes will be lost.')) {
    resetToSeed();
    monthInput.value = getState().month;
    toast('Demo data restored.');
    route();
  }
});

window.addEventListener('hashchange', route);
loadState();
monthInput.value = getState().month;
route();

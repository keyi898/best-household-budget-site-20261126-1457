// View renderers for Hearth Ledger. Each function returns HTML for one
// hash route; main.js wires the buttons inside after rendering.
import { CATEGORIES, categoryById } from './data.js';
import { getState, money, monthTotals, spendingByCategory, transactionsInMonth, recentMonths, nextDueDate, needsWantsSavings } from './store.js';
import { donutChart, monthlyBars, progressBar } from './charts.js';

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function monthLabel(month) {
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [y, m] = month.split('-').map(Number);
  return (names[m - 1] || month) + ' ' + y;
}

function head(title, blurb, actionHtml) {
  return '<div class="page-head"><div><h1>' + title + '</h1><p>' + blurb + '</p></div>' + (actionHtml || '') + '</div>';
}

export function dashboardView() {
  const s = getState();
  const month = s.month;
  const totals = monthTotals(s, month);
  const byCat = spendingByCategory(s, month);
  const savingsRate = totals.income > 0 ? Math.round((totals.saved / totals.income) * 100) : 0;
  const rows = recentMonths(s, 6).map((m) => ({ month: m, ...monthTotals(s, m) }));
  const budgetRows = Object.entries(s.budgets).map(([catId, limit]) => ({ catId, limit, spent: byCat[catId] || 0 }))
    .sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit)).slice(0, 5);
  const upcoming = [...s.bills].map((b) => ({ ...b, due: nextDueDate(b) })).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  const goalRows = s.goals.slice(0, 3);

  let html = head('Overview — ' + monthLabel(month),
    'Where the household money went this month, what is left, and what is coming up. Change the month in the top bar to look back.',
    '<a class="btn" href="#/transactions">+ Add transaction</a>');

  html += '<div class="grid kpis">' +
    kpi('Income', money(totals.income), 'salaries + other income') +
    kpi('Spending', money(totals.spending), 'excluding savings transfers') +
    kpi('Saved', money(totals.saved), savingsRate + '% of income') +
    kpi('Left over', money(totals.net), totals.net >= 0 ? 'still in the current account' : 'overdrawn this month', totals.net >= 0 ? 'pos' : 'neg') +
    '</div>';
  html += '<p class="muted" style="margin:-4px 0 0">' + savingsInsight(savingsRate, totals) + ' <a href="#/analyze">See the 50/30/20 split</a></p>';

  html += '<div class="grid two">';
  html += '<section class="card"><h2>Where it went</h2><p class="sub">Spending by category, ' + monthLabel(month) + '.</p>' + donutChart(byCat, totals.spending) + '</section>';
  html += '<section class="card"><h2>Last six months</h2><p class="sub">Income against spending and savings.</p>' + monthlyBars(rows) + '</section>';
  html += '</div>';

  html += '<div class="grid three" style="margin-top:16px">';
  html += '<section class="card"><h2>Budget health</h2><p class="sub">Tightest budgets first. <a href="#/budgets">All budgets</a></p>';
  for (const row of budgetRows) {
    const cat = categoryById(row.catId);
    html += '<p style="margin:10px 0 0"><span class="dot" style="background:' + cat.color + '"></span><strong>' + cat.name + '</strong> — ' + money(row.spent) + ' of ' + money(row.limit) + '</p>' + progressBar(row.spent, row.limit);
  }
  html += '</section>';

  html += '<section class="card"><h2>Coming up</h2><p class="sub">Next bills due. <a href="#/bills">All bills</a></p>';
  for (const bill of upcoming) {
    html += '<p style="margin:10px 0"><strong>' + esc(bill.name) + '</strong><br><span class="muted">Due ' + bill.due + ' · ' + money(bill.amount) + (bill.autopay ? ' · autopay' : ' · manual') + '</span></p>';
  }
  html += '</section>';

  html += '<section class="card"><h2>Savings goals</h2><p class="sub">Progress so far. <a href="#/goals">All goals</a></p>';
  for (const goal of goalRows) {
    const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
    html += '<p style="margin:10px 0 0"><strong>' + esc(goal.name) + '</strong> — ' + pct + '%</p>' + progressBar(goal.saved, goal.target) + '<p class="muted">' + money(goal.saved) + ' of ' + money(goal.target) + ' by ' + goal.deadline + '</p>';
  }
  html += '</section></div>';
  return html;
}

function savingsInsight(rate, totals) {
  if (totals.income <= 0) return 'No income recorded yet this month — add a salary to see your savings rate.';
  if (rate >= 20) return 'Savings rate ' + rate + '% — at or above the 20% rule-of-thumb. Strong month.';
  if (rate >= 10) return 'Savings rate ' + rate + '% — solid, with room to push toward 20%.';
  if (rate > 0) return 'Savings rate ' + rate + '% — below the 20% guide; the analyzer shows where to find the difference.';
  return 'Nothing moved to savings yet this month.';
}

function kpi(label, value, note, cls) {
  return '<section class="card kpi"><div class="label">' + label + '</div><div class="value ' + (cls || '') + '">' + value + '</div><div class="note">' + note + '</div></section>';
}

export function transactionsView(filter) {
  const s = getState();
  const month = s.month;
  let rows = transactionsInMonth(s, month).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  if (filter && filter.category && filter.category !== 'all') rows = rows.filter((t) => t.category === filter.category);
  if (filter && filter.query) {
    const q = filter.query.toLowerCase();
    rows = rows.filter((t) => t.label.toLowerCase().includes(q));
  }
  const totals = monthTotals(s, month);

  let html = head('Transactions — ' + monthLabel(month),
    'Every pound in and out. Add, edit or delete entries — totals and charts update everywhere. Export a CSV for your records.',
    '<button type="button" class="btn" data-action="add-tx">+ Add transaction</button>');

  html += '<div class="toolbar">' +
    '<label>Category <select id="txFilterCat"><option value="all">All categories</option>' +
    '<option value="income">Income</option>' +
    CATEGORIES.map((c) => '<option value="' + c.id + '"' + (filter && filter.category === c.id ? ' selected' : '') + '>' + c.name + '</option>').join('') +
    '</select></label>' +
    '<label>Search <input type="search" id="txFilterQuery" placeholder="e.g. groceries" value="' + esc(filter && filter.query ? filter.query : '') + '"></label>' +
    '<span class="spacer"></span>' +
    '<span class="muted">In ' + money(totals.income) + ' · Out ' + money(totals.spending) + ' · Saved ' + money(totals.saved) + '</span>' +
    '<button type="button" class="btn plain small" data-action="export-csv">Export CSV</button>' +
    '<label class="btn plain small" style="cursor:pointer">Import CSV<input type="file" id="importCsv" accept=".csv" hidden></label>' +
    '</div>';

  if (!rows.length) {
    html += '<div class="empty">No transactions match. <button type="button" class="btn small" data-action="add-tx">Add the first one</button></div>';
    return html;
  }

  html += '<section class="card"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th class="num">Amount</th><th></th></tr></thead><tbody>';
  for (const t of rows) {
    const cat = t.category === 'income' ? { name: 'Income', color: '#2e7d4f' } : categoryById(t.category);
    const pill = t.category === 'income' ? '<span class="pill income">income</span>' : '<span class="pill expense">expense</span>';
    html += '<tr><td>' + t.date + '</td><td><strong>' + esc(t.label) + '</strong> ' + pill + '</td>' +
      '<td><span class="dot" style="background:' + cat.color + '"></span>' + cat.name + '</td>' +
      '<td>' + esc(t.account || '—') + '</td>' +
      '<td class="num ' + (t.amount >= 0 ? 'pos' : 'neg') + '">' + money(t.amount) + '</td>' +
      '<td><span class="row-actions"><button type="button" class="icon-btn" data-action="edit-tx" data-id="' + t.id + '">Edit</button>' +
      '<button type="button" class="icon-btn" data-action="delete-tx" data-id="' + t.id + '">Delete</button></span></td></tr>';
  }
  html += '</tbody></table></section>';
  return html;
}

export function budgetsView() {
  const s = getState();
  const byCat = spendingByCategory(s, s.month);
  let html = head('Budgets — ' + monthLabel(s.month),
    'A monthly limit per category. Bars turn amber at 85% and red when you go over. Edit any limit inline.',
    '');
  html += '<div class="grid three" style="margin-top:16px">';
  for (const cat of CATEGORIES) {
    if (cat.id === 'savings') continue;
    const limit = s.budgets[cat.id] || 0;
    const spent = byCat[cat.id] || 0;
    const left = limit - spent;
    const status = spent > limit ? '<span class="neg"><strong>' + money(-left) + ' over</strong></span>' : '<span class="pos">' + money(left) + ' left</span>';
    html += '<section class="card"><h2><span class="dot" style="background:' + cat.color + '"></span>' + cat.name + '</h2>' +
      '<p class="sub">' + (cat.kind === 'need' ? 'Need' : 'Want') + ' · spent ' + money(spent) + '</p>' +
      progressBar(spent, limit) +
      '<p>' + status + ' of ' + money(limit) + '</p>' +
      '<label class="f">Monthly limit ($)<input type="number" min="0" step="10" value="' + limit + '" data-budget-input="' + cat.id + '"></label>' +
      '<p style="margin-top:10px"><button type="button" class="btn small" data-action="save-budget" data-id="' + cat.id + '">Save limit</button></p></section>';
  }
  html += '</div>';
  return html;
}

export function billsView() {
  const s = getState();
  const bills = [...s.bills].map((b) => ({ ...b, due: nextDueDate(b) })).sort((a, b) => a.due.localeCompare(b.due));
  const monthlyTotal = bills.reduce((sum, b) => sum + b.amount, 0);
  let html = head('Bills & subscriptions',
    'Recurring payments and when they land next. Mark a bill paid to record it as a transaction.',
    '<button type="button" class="btn" data-action="add-bill">+ Add bill</button>');
  html += '<p class="muted" style="margin-top:10px">Recurring total: <strong>' + money(monthlyTotal) + ' / month</strong> across ' + bills.length + ' bills.</p>';
  html += '<section class="card"><table><thead><tr><th>Bill</th><th>Category</th><th>Next due</th><th>Last paid</th><th class="num">Amount</th><th></th></tr></thead><tbody>';
  for (const bill of bills) {
    const cat = categoryById(bill.category);
    html += '<tr><td><strong>' + esc(bill.name) + '</strong><br><span class="muted">' + (bill.autopay ? 'Autopay' : 'Manual payment') + ' · day ' + bill.dayOfMonth + '</span></td>' +
      '<td><span class="dot" style="background:' + cat.color + '"></span>' + cat.name + '</td>' +
      '<td>' + bill.due + '</td><td>' + (bill.lastPaid || '—') + '</td>' +
      '<td class="num">' + money(bill.amount) + '</td>' +
      '<td><span class="row-actions"><button type="button" class="icon-btn" data-action="pay-bill" data-id="' + bill.id + '">Mark paid</button>' +
      '<button type="button" class="icon-btn" data-action="edit-bill" data-id="' + bill.id + '">Edit</button>' +
      '<button type="button" class="icon-btn" data-action="delete-bill" data-id="' + bill.id + '">Delete</button></span></td></tr>';
  }
  html += '</tbody></table></section>';
  return html;
}

export function goalsView() {
  const s = getState();
  let html = head('Savings goals',
    'What the household is saving toward. Add money to a goal and watch the bar move; the monthly amount needed is worked out from the deadline.',
    '<button type="button" class="btn" data-action="add-goal">+ New goal</button>');
  html += '<div class="grid three" style="margin-top:16px">';
  for (const goal of s.goals) {
    const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
    const remaining = Math.max(0, goal.target - goal.saved);
    const monthsLeft = Math.max(1, Math.round((new Date(goal.deadline) - new Date(s.month + '-01')) / (1000 * 60 * 60 * 24 * 30.4)));
    const perMonth = remaining > 0 ? remaining / monthsLeft : 0;
    html += '<section class="card"><div class="goal-head"><h2>' + esc(goal.name) + '</h2><span class="big">' + pct + '%</span></div>' +
      '<p class="sub">' + esc(goal.note || '') + '</p>' +
      progressBar(goal.saved, goal.target) +
      '<p>' + money(goal.saved) + ' of ' + money(goal.target) + ' · by ' + goal.deadline + '</p>' +
      '<p class="muted">' + (remaining > 0 ? money(remaining) + ' to go — about ' + money(perMonth) + '/month for ' + monthsLeft + ' months.' : 'Goal reached — nicely done.') + '</p>' +
      '<label class="f">Add amount ($)<input type="number" min="1" step="10" value="50" data-goal-input="' + goal.id + '"></label>' +
      '<p style="margin-top:10px" class="row-actions"><button type="button" class="btn small" data-action="contribute-goal" data-id="' + goal.id + '">Add to goal</button>' +
      '<button type="button" class="icon-btn" data-action="edit-goal" data-id="' + goal.id + '">Edit</button>' +
      '<button type="button" class="icon-btn" data-action="delete-goal" data-id="' + goal.id + '">Delete</button></p></section>';
  }
  html += '</div>';
  return html;
}

export function analyzeView(targets) {
  const s = getState();
  const split = needsWantsSavings(s, s.month);
  const income = Math.max(split.income, 1);
  const actual = {
    needs: (split.needs / income) * 100,
    wants: (split.wants / income) * 100,
    savings: (split.savings / income) * 100,
  };
  const t = targets || { needs: 50, wants: 30, savings: 20 };
  function verdict(label, actualPct, targetPct) {
    const diff = actualPct - targetPct;
    if (Math.abs(diff) <= 3) return label + ' is on target (' + actualPct.toFixed(0) + '% vs ' + targetPct + '%).';
    if (diff > 0) return label + ' is ' + diff.toFixed(0) + ' points over target — trim ' + money((diff / 100) * income) + ' to hit ' + targetPct + '%.';
    return label + ' is ' + Math.abs(diff).toFixed(0) + ' points under target — room to move ' + money((Math.abs(diff) / 100) * income) + ' here.';
  }
  let html = head('50/30/20 analyzer — ' + monthLabel(s.month),
    'The classic rule: half of take-home pay for needs, 30% for wants, 20% saved. Drag the targets to fit your household and see what changes.',
    '');
  html += '<section class="card"><h2>Your split this month</h2><p class="sub">Based on income of ' + money(split.income) + '.</p>' +
    '<div class="split-bar"><span style="width:' + actual.needs.toFixed(1) + '%;background:#0f4c4c"></span><span style="width:' + actual.wants.toFixed(1) + '%;background:#c25e3a"></span><span style="width:' + actual.savings.toFixed(1) + '%;background:#2e7d4f"></span></div>' +
    '<p><span class="dot" style="background:#0f4c4c"></span>Needs ' + money(split.needs) + ' (' + actual.needs.toFixed(0) + '%) &nbsp; ' +
    '<span class="dot" style="background:#c25e3a"></span>Wants ' + money(split.wants) + ' (' + actual.wants.toFixed(0) + '%) &nbsp; ' +
    '<span class="dot" style="background:#2e7d4f"></span>Savings ' + money(split.savings) + ' (' + actual.savings.toFixed(0) + '%)</p></section>';

  html += '<div class="grid two" style="margin-top:16px"><section class="card"><h2>Set your targets</h2><p class="sub">They always add up to 100%.</p>' +
    sliderRow('needs', 'Needs target', t.needs) + sliderRow('wants', 'Wants target', t.wants) + sliderRow('savings', 'Savings target', t.savings) +
    '<p class="muted">Tip: high rent often pushes needs above 50% — try 60/25/15 and grow savings as income rises.</p></section>';

  html += '<section class="card"><h2>What to change</h2><p class="sub">Plain-English next steps.</p>' +
    '<p>' + verdict('Needs', actual.needs, t.needs) + '</p>' +
    '<p>' + verdict('Wants', actual.wants, t.wants) + '</p>' +
    '<p>' + verdict('Savings', actual.savings, t.savings) + '</p>' +
    '<p class="muted">Needs here: housing, groceries, utilities, transport, health, kids. Wants: dining, entertainment, shopping, other.</p></section></div>';
  return html;
}

function sliderRow(key, label, value) {
  return '<label class="f" style="margin-bottom:12px">' + label + ': <strong>' + value + '%</strong>' +
    '<input type="range" min="0" max="100" step="1" value="' + value + '" data-target-slider="' + key + '"></label>';
}

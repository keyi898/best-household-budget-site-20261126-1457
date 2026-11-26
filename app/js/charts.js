// Hand-drawn SVG charts (no libraries): a donut for category share and
// grouped bars for income vs spending across recent months.
import { categoryById } from './data.js';
import { money } from './store.js';

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const [x1, y1] = polar(cx, cy, rOuter, startDeg);
  const [x2, y2] = polar(cx, cy, rOuter, endDeg);
  const [x3, y3] = polar(cx, cy, rInner, endDeg);
  const [x4, y4] = polar(cx, cy, rInner, startDeg);
  return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
    ' A' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
    ' L' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
    ' A' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) + ' Z';
}

export function donutChart(byCategory, totalSpending) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (!entries.length || totalSpending <= 0) {
    return '<p class="muted">No spending recorded this month yet.</p>';
  }
  const size = 190;
  const cx = size / 2;
  const cy = size / 2;
  let angle = 0;
  let slices = '';
  for (const [catId, amount] of entries) {
    const sweep = (amount / totalSpending) * 360;
    const cat = categoryById(catId);
    if (sweep >= 359.9) {
      slices += '<circle cx="' + cx + '" cy="' + cy + '" r="78" fill="none" stroke="' + cat.color + '" stroke-width="30"><title>' + cat.name + ': ' + money(amount) + '</title></circle>';
    } else {
      slices += '<path d="' + arcPath(cx, cy, 92, 62, angle, angle + sweep) + '" fill="' + cat.color + '"><title>' + cat.name + ': ' + money(amount) + '</title></path>';
    }
    angle += sweep;
  }
  const svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="Spending by category">' + slices +
    '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#22312e">' + money(totalSpending) + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="11" fill="#6b7a74">spent</text></svg>';
  let legend = '<ul class="legend" style="flex:1;min-width:210px">';
  for (const [catId, amount] of entries) {
    const cat = categoryById(catId);
    const pct = Math.round((amount / totalSpending) * 100);
    legend += '<li><span><span class="dot" style="background:' + cat.color + '"></span>' + cat.name + '</span><span>' + money(amount) + ' · ' + pct + '%</span></li>';
  }
  legend += '</ul>';
  return '<div class="donut-wrap">' + svg + legend + '</div>';
}

export function monthlyBars(rows) {
  // rows: [{month, income, spending, saved}]
  if (!rows.length) return '<p class="muted">No months to chart yet.</p>';
  const width = 640;
  const height = 230;
  const padLeft = 8;
  const padBottom = 26;
  const padTop = 16;
  const maxVal = Math.max(...rows.map((r) => Math.max(r.income, r.spending + r.saved)), 1);
  const chartH = height - padBottom - padTop;
  const groupW = (width - padLeft * 2) / rows.length;
  const barW = Math.min(22, groupW / 3.2);
  let bars = '';
  rows.forEach((row, i) => {
    const gx = padLeft + i * groupW + groupW / 2;
    const incomeH = (row.income / maxVal) * chartH;
    const spendH = (row.spending / maxVal) * chartH;
    const savedH = (row.saved / maxVal) * chartH;
    const baseY = height - padBottom;
    bars += '<rect x="' + (gx - barW - 2).toFixed(1) + '" y="' + (baseY - incomeH).toFixed(1) + '" width="' + barW + '" height="' + incomeH.toFixed(1) + '" rx="3" fill="#146666"><title>' + row.month + ' income ' + money(row.income) + '</title></rect>';
    bars += '<rect x="' + (gx + 2).toFixed(1) + '" y="' + (baseY - spendH - savedH).toFixed(1) + '" width="' + barW + '" height="' + spendH.toFixed(1) + '" rx="3" fill="#c25e3a"><title>' + row.month + ' spending ' + money(row.spending) + '</title></rect>';
    if (savedH > 0) {
      bars += '<rect x="' + (gx + 2).toFixed(1) + '" y="' + (baseY - savedH).toFixed(1) + '" width="' + barW + '" height="' + savedH.toFixed(1) + '" rx="3" fill="#2e7d4f"><title>' + row.month + ' saved ' + money(row.saved) + '</title></rect>';
    }
    bars += '<text x="' + gx.toFixed(1) + '" y="' + (height - 8) + '" text-anchor="middle" font-size="11" fill="#6b7a74">' + row.month.slice(5) + '</text>';
  });
  const key = '<p class="muted" style="margin-top:8px"><span class="dot" style="background:#146666"></span>Income&nbsp;&nbsp;<span class="dot" style="background:#c25e3a"></span>Spending&nbsp;&nbsp;<span class="dot" style="background:#2e7d4f"></span>Saved</p>';
  return '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" role="img" aria-label="Income versus spending by month">' + bars + '</svg>' + key;
}

export function progressBar(spent, limit) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const cls = spent > limit ? 'bar over' : pct >= 85 ? 'bar near' : 'bar';
  return '<div class="' + cls + '"><span style="width:' + pct.toFixed(1) + '%"></span></div>';
}

/* ============================================================
   js/expenses.js  —  المصاريف
   ============================================================ */

'use strict';

function addExpense() {
  var desc = $('exp-desc').value.trim();
  var amt  = parseFloat($('exp-amt').value) || 0;
  if (!desc || amt <= 0) { toast('أدخل الوصف والمبلغ ❌', 'error'); return; }

  db.expenses.push({
    id        : genId(),
    category  : $('exp-cat').value,
    desc      : desc,
    amount    : amt,
    date      : $('exp-date').value || today(),
    createdAt : nowStr()
  });
  saveDB('expenses');
  $('exp-desc').value = '';
  $('exp-amt').value  = '';
  renderExp();
  toast('مصروف: ' + fmt(amt) + ' ✅', 'success');
  autoPush();
}

/* مصروف سريع من الداشبورد */
function quickAddExpense() {
  var desc = $('qdesc').value.trim();
  var amt  = parseFloat($('qamt').value) || 0;
  var cat  = $('qcat').value;
  if (!desc || amt <= 0) { toast('أدخل الوصف والمبلغ ❌', 'error'); return; }

  db.expenses.push({
    id        : genId(),
    category  : cat,
    desc      : desc,
    amount    : amt,
    date      : today(),
    createdAt : nowStr()
  });
  saveDB('expenses');
  $('qdesc').value = '';
  $('qamt').value  = '';
  toast('💸 مصروف: ' + fmt(amt) + ' ✅', 'success');
  autoPush();
  renderDash();
}

/* ===== فلتر الأشهر ===== */
function buildExpMonthFilter() {
  var months = {}, i;
  for (i = 0; i < db.expenses.length; i++) {
    var m = db.expenses[i].date.slice(0, 7);
    months[m] = true;
  }
  var sel = $('exp-filter-month');
  if (!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">كل الأشهر</option>';
  var keys = Object.keys(months).sort().reverse();
  for (i = 0; i < keys.length; i++) {
    var lbl = keys[i].replace('-', '/');
    sel.innerHTML += '<option value="' + keys[i] + '"'
      + (keys[i] === cur ? ' selected' : '') + '>' + lbl + '</option>';
  }
}

function renderExp() {
  var td = today(), tm = today().slice(0, 7);
  var filterMonth = ($('exp-filter-month') && $('exp-filter-month').value) || '';
  buildExpMonthFilter();

  var todayAmt = 0, monthAmt = 0, i;
  for (i = 0; i < db.expenses.length; i++) {
    if (db.expenses[i].date === td)             todayAmt += db.expenses[i].amount;
    if (db.expenses[i].date.indexOf(tm) === 0)  monthAmt += db.expenses[i].amount;
  }
  $('exp-today').textContent = fmt(todayAmt);
  $('exp-month').textContent = fmt(monthAmt);

  var sorted = db.expenses.slice().reverse();
  var html   = '';
  for (i = 0; i < sorted.length; i++) {
    var e = sorted[i];
    if (filterMonth && e.date.indexOf(filterMonth) !== 0) continue;
    html += '<div class="exp-row">'
      + '<div class="exp-icon">' + (EXP_ICONS[e.category] || '💸') + '</div>'
      + '<div class="exp-info">'
      +   '<div class="exp-name">' + e.desc + '</div>'
      +   '<div class="exp-date">' + (EXP_NAMES[e.category] || e.category) + ' • ' + e.date + '</div>'
      + '</div>'
      + '<div style="text-align:left;flex-shrink:0">'
      +   '<div style="font-weight:700;color:#dc2626;font-size:13px">' + fmt(e.amount) + '</div>'
      +   '<button onclick="delExp(\'' + e.id + '\')" '
      +     'style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:11px;padding:2px">✕</button>'
      + '</div>'
      + '</div>';
  }
  $('exp-list').innerHTML = html ||
    '<div style="text-align:center;color:#9ca3af;padding:16px">'
    + 'لا توجد مصاريف' + (filterMonth ? ' في هذا الشهر' : '') + '</div>';
}

function delExp(id) {
  db.expenses = db.expenses.filter(function (e) { return e.id !== id; });
  saveDB('expenses');
  renderExp();
  autoPush();
}

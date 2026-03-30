/* ============================================================
   js/telecom.js  —  الفليكسي وبطاقات الإنترنت
   ============================================================ */

'use strict';

function switchTel(tab, el) {
  document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
  $('tel-recharge').style.display = tab === 'recharge' ? 'block' : 'none';
  $('tel-cards').style.display    = tab === 'cards'    ? 'block' : 'none';
}

function initTelecom() {
  var html = '', i;
  for (i = 0; i < CARD_TYPES.length; i++) {
    var ct = CARD_TYPES[i];
    html += '<div class="ct-btn" onclick="selCardType(\'' + ct.id + '\',this)">'
      + '<div class="ct-name">' + ct.name + '</div>'
      + '<div class="ct-price">' + ct.val + ' دج</div>'
      + '<div class="ct-profit">ربح: ' + (shopSettings.cardProfit || 50) + ' دج</div>'
      + '</div>';
  }
  $('card-btns').innerHTML = html;
}

/* ===== RECHARGE ===== */
function selOp(name, el) {
  document.querySelectorAll('.op-btn').forEach(function (b) { b.classList.remove('sel'); });
  el.classList.add('sel');
  selOperator = name;
  calcRch();
}

function calcRch() {
  var amt = parseFloat($('rch-amt').value) || 0;
  $('rch-amt-d').textContent  = fmt(amt);
  $('rch-prof-d').textContent = fmt(rechargeProfit(amt));
}

function recordRch() {
  if (!selOperator) { toast('اختر شبكة المتعامل ❌', 'error'); return; }
  var amt = parseFloat($('rch-amt').value) || 0;
  if (amt <= 0) { toast('أدخل مبلغ الشحن ❌', 'error'); return; }

  var profit = rechargeProfit(amt);
  db.telecomSales.push({
    id      : genId(),
    date    : nowStr(),
    dateStr : today(),
    type    : 'recharge',
    operator: selOperator,
    amount  : amt,
    profit  : profit
  });
  saveDB('telecomSales');

  $('rch-amt').value          = '';
  $('rch-amt-d').textContent  = '0 دج';
  $('rch-prof-d').textContent = '0 دج';
  document.querySelectorAll('.op-btn').forEach(function (b) { b.classList.remove('sel'); });
  selOperator = null;

  renderTel();
  toast('شحن ' + fmt(amt) + ' — ربح: ' + fmt(profit) + ' ✅', 'success', 3000);
  autoPush();
}

/* ===== CARDS ===== */
function selCardType(id, el) {
  document.querySelectorAll('.ct-btn').forEach(function (b) { b.classList.remove('sel'); });
  el.classList.add('sel');
  for (var i = 0; i < CARD_TYPES.length; i++) {
    if (CARD_TYPES[i].id === id) { selCard = CARD_TYPES[i]; break; }
  }
}

function recordCard() {
  if (!selCard) { toast('اختر نوع البطاقة ❌', 'error'); return; }
  var qty    = parseInt($('card-qty').value) || 1;
  var profit = (shopSettings.cardProfit || 50) * qty;

  db.telecomSales.push({
    id      : genId(),
    date    : nowStr(),
    dateStr : today(),
    type    : 'card',
    cardId  : selCard.id,
    cardName: selCard.name,
    cardVal : selCard.val,
    qty     : qty,
    amount  : selCard.price * qty,
    profit  : profit
  });
  saveDB('telecomSales');

  $('card-qty').value = '1';
  document.querySelectorAll('.ct-btn').forEach(function (b) { b.classList.remove('sel'); });
  selCard = null;

  renderTel();
  toast(qty + ' بطاقة — ربح: ' + fmt(profit) + ' ✅', 'success', 3000);
  autoPush();
}

/* ===== RENDER ===== */
function renderTel() {
  var td = today(), ts = [], i;
  for (i = 0; i < db.telecomSales.length; i++) {
    if (db.telecomSales[i].dateStr === td) ts.push(db.telecomSales[i]);
  }

  var rP = 0, cP = 0;
  for (i = 0; i < ts.length; i++) {
    if (ts[i].type === 'recharge') rP += ts[i].profit;
    else                           cP += ts[i].profit;
  }
  $('tel-day-prof').textContent = fmt(rP + cP);
  $('tel-r-p').textContent      = fmt(rP);
  $('tel-c-p').textContent      = fmt(cP);

  var OPM  = { djezzy:'🔴', mobilis:'🟢', ooredoo:'🔵' };
  var html = '';
  for (i = ts.length - 1; i >= 0; i--) {
    var s = ts[i];
    if (s.type === 'recharge') {
      html += '<div class="exp-row">'
        + '<div class="exp-icon" style="background:#faf5ff">' + (OPM[s.operator] || '📱') + '</div>'
        + '<div class="exp-info">'
        +   '<div class="exp-name">شحن ' + s.operator + ' — ' + fmt(s.amount) + '</div>'
        +   '<div class="exp-date">' + s.date + '</div>'
        + '</div>'
        + '<span class="tag tg">+' + fmt(s.profit) + '</span>'
        + '</div>';
    } else {
      html += '<div class="exp-row">'
        + '<div class="exp-icon" style="background:#f0fdf4">🃏</div>'
        + '<div class="exp-info">'
        +   '<div class="exp-name">' + s.cardName + ' ' + s.cardVal + ' × ' + s.qty + '</div>'
        +   '<div class="exp-date">' + s.date + '</div>'
        + '</div>'
        + '<span class="tag tg">+' + fmt(s.profit) + '</span>'
        + '</div>';
    }
  }
  $('tel-hist').innerHTML = html ||
    '<div style="text-align:center;color:#9ca3af;padding:16px">لا توجد عمليات اليوم</div>';
}

/* ============================================================
   js/print.js  —  خدمات الطباعة
   ============================================================ */

'use strict';

function initPrint() {
  var arr  = shopSettings.printTypes || [];
  var html = '', i;
  for (i = 0; i < arr.length; i++) {
    var pt = arr[i];
    html += '<div class="pt-btn" onclick="selPrintType(\'' + pt.id + '\',this)">'
      + '<div class="pt-icon">' + (pt.icon || '🖨️') + '</div>'
      + '<div class="pt-name">' + pt.name + '</div>'
      + '<div class="pt-price">' + pt.price + ' دج</div>'
      + '</div>';
  }
  $('print-btns').innerHTML = html;
}

function selPrintType(id, el) {
  document.querySelectorAll('.pt-btn').forEach(function (b) { b.classList.remove('sel'); });
  el.classList.add('sel');
  var arr = shopSettings.printTypes || [];
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].id === id) { selPrint = arr[i]; break; }
  }
  calcPrint();
}

function calcPrint() {
  if (!selPrint) { $('pr-total').textContent = '0 دج'; return; }
  $('pr-total').textContent = fmt(selPrint.price * (parseInt($('pr-qty').value) || 1));
}

function recordPrint() {
  if (!selPrint) { toast('اختر نوع الخدمة ❌', 'error'); return; }
  var qty   = parseInt($('pr-qty').value) || 1;
  var total = selPrint.price * qty;

  db.printSales.push({
    id          : genId(),
    date        : nowStr(),
    dateStr     : today(),
    type        : selPrint.id,
    typeName    : selPrint.name,
    icon        : selPrint.icon || '🖨️',
    qty         : qty,
    pricePerUnit: selPrint.price,
    total       : total,
    note        : $('pr-note').value
  });
  saveDB('printSales');

  $('pr-qty').value = '1';
  $('pr-note').value = '';
  $('pr-total').textContent = '0 دج';
  document.querySelectorAll('.pt-btn').forEach(function (b) { b.classList.remove('sel'); });
  selPrint = null;

  renderPrint();
  toast('تم التسجيل: ' + fmt(total) + ' ✅', 'success');
  autoPush();
}

function renderPrint() {
  var td = today(), ts = [], i;
  for (i = 0; i < db.printSales.length; i++) {
    if (db.printSales[i].dateStr === td) ts.push(db.printSales[i]);
  }
  var tot = 0;
  for (i = 0; i < ts.length; i++) tot += ts[i].total;
  $('pr-day-tot').textContent = fmt(tot);
  $('pr-ops').textContent     = ts.length;

  var html = '';
  for (i = ts.length - 1; i >= 0; i--) {
    var s = ts[i];
    html += '<div class="exp-row">'
      + '<div class="exp-icon" style="background:#ede9fe">' + (s.icon || '🖨️') + '</div>'
      + '<div class="exp-info">'
      +   '<div class="exp-name">' + s.typeName + ' × ' + s.qty + '</div>'
      +   '<div class="exp-date">' + s.date + (s.note ? ' • ' + s.note : '') + '</div>'
      + '</div>'
      + '<div style="font-weight:700;color:#7c3aed;font-size:13px">' + fmt(s.total) + '</div>'
      + '</div>';
  }
  $('pr-list').innerHTML = html ||
    '<div style="text-align:center;color:#9ca3af;padding:16px">لا توجد عمليات اليوم</div>';
}

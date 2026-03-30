/* ============================================================
   js/sales.js  —  إتمام البيع + الوصل + المرتجعات
   ============================================================ */

'use strict';

/* ===== CHECKOUT ===== */
function checkout() {
  if (!cart.length) { toast('السلة فارغة ❌', 'error'); return; }

  var method   = $('pay-method').value;
  var clientId = '';
  var disc     = parseFloat($('disc-in').value) || 0;
  var sub      = 0, i;

  for (i = 0; i < cart.length; i++) sub += cart[i].price * cart[i].qty;
  var total = Math.max(0, sub - disc);

  /* دين */
  if (method === 'debt') {
    clientId = $('sale-client').value;
    if (!clientId) { toast('اختر العميل ❌', 'error'); return; }
    var cli = null, j;
    for (j = 0; j < db.clients.length; j++) {
      if (db.clients[j].id === clientId) { cli = db.clients[j]; break; }
    }
    if (cli) {
      cli.debts = cli.debts || [];
      cli.debts.push({
        date : nowStr(),
        amount: total,
        items: cart.map(function (it) { return it.name + '×' + it.qty; }).join('، ')
      });
      var td = 0, tp = 0, jj;
      for (jj = 0; jj < cli.debts.length; jj++)             td += cli.debts[jj].amount    || 0;
      for (jj = 0; jj < (cli.payments || []).length; jj++)  tp += cli.payments[jj].amount || 0;
      cli.totalDebt = Math.max(0, td - tp);
      saveDB('clients');
    }
  }

  /* إنقاص المخزون */
  for (i = 0; i < cart.length; i++) {
    var p = null, k;
    for (k = 0; k < db.products.length; k++) {
      if (db.products[k].id === cart[i].pid) { p = db.products[k]; break; }
    }
    if (p && p.stock !== undefined) p.stock = Math.max(0, (p.stock || 0) - cart[i].qty);
  }
  saveDB('products');

  /* حفظ الفاتورة */
  var sale = {
    id       : genId(),
    date     : nowStr(),
    dateStr  : today(),
    items    : JSON.parse(JSON.stringify(cart)),
    subtotal : sub,
    discount : disc,
    total    : total,
    method   : method,
    clientId : clientId
  };
  db.sales.push(sale);
  saveDB('sales');
  lastSale = sale;

  /* إظهار الوصل */
  showReceipt(sale);

  /* تفريغ السلة */
  cart = [];
  $('disc-in').value = '0';
  $('pay-section').style.display = 'none';
  renderCartList();
  updateCartTotals();
  renderTodaySum();
  toast('تم البيع: ' + fmt(total) + ' ✅', 'success');
  autoPush();
}

/* ===== TODAY SUMMARY ===== */
function renderTodaySum() {
  var td = today(), ts = [], i;
  for (i = 0; i < db.sales.length; i++) {
    if (db.sales[i].dateStr === td) ts.push(db.sales[i]);
  }
  var tot = 0, items = 0;
  for (i = 0; i < ts.length; i++) {
    tot += ts[i].total;
    for (var j = 0; j < ts[i].items.length; j++) items += ts[i].items[j].qty;
  }
  $('today-sum').innerHTML =
    '<div class="scan-stat"><div class="scan-stat-v">' + ts.length + '</div><div class="scan-stat-l">فاتورة</div></div>' +
    '<div class="scan-stat"><div class="scan-stat-v">' + items     + '</div><div class="scan-stat-l">قطعة</div></div>'   +
    '<div class="scan-stat" style="background:#f0fdf4"><div class="scan-stat-v" style="color:#16a34a">' +
      tot.toLocaleString('ar-DZ') + '</div><div class="scan-stat-l">دج</div></div>';
}

/* ===== RECEIPT ===== */
function printLastReceipt() {
  if (lastSale) showReceipt(lastSale);
  else toast('لا يوجد وصل سابق ❌', 'error');
}

function buildReceiptLines(sale) {
  var mm = { cash:'نقداً', card:'بطاقة بنكية', debt:'دين (آجل)' };
  var lines = ['════════════════════════'];

  if (shopSettings.receiptHeader) {
    shopSettings.receiptHeader.split('\n').forEach(function (l) { lines.push('  ' + l); });
  } else {
    lines.push('    ' + shopSettings.name);
    lines.push('  '  + shopSettings.address);
  }
  lines.push('════════════════════════');
  lines.push('📅 ' + sale.date, '');
  if (shopSettings.phone) lines.push('📞 ' + shopSettings.phone);

  for (var i = 0; i < sale.items.length; i++) {
    lines.push(sale.items[i].name);
    lines.push('  ' + sale.items[i].qty + ' × ' + fmt(sale.items[i].price) +
               ' = ' + fmt(sale.items[i].price * sale.items[i].qty));
  }

  lines.push('');
  lines.push('────────────────────────');
  if (sale.discount > 0) {
    lines.push('المجموع:   ' + fmt(sale.subtotal));
    lines.push('تخفيض:     ' + fmt(sale.discount));
  }
  lines.push('الإجمالي:  ' + fmt(sale.total));
  lines.push('الدفع:     ' + (mm[sale.method] || sale.method));
  lines.push('');
  lines.push('════════════════════════');

  if (shopSettings.receiptFooter) {
    shopSettings.receiptFooter.split('\n').forEach(function (l) { lines.push('  ' + l); });
  } else {
    lines.push('     شكراً لزيارتكم!  ');
  }
  lines.push('════════════════════════');
  return lines;
}

function showReceipt(sale) {
  var lines = buildReceiptLines(sale);
  $('receipt-content').textContent = lines.join('\n');
  $('receipt-print-area').innerHTML =
    '<div style="font-family:monospace;font-size:12px;white-space:pre-line">' + lines.join('\n') + '</div>';
  openModal('m-receipt');
}

/* ===== RETURNS (مرتجعات) ===== */
function openReturnModal() {
  $('ret-search').value = '';
  $('ret-drop').style.display   = 'none';
  $('ret-sel-prod').style.display = 'none';
  $('ret-pid').value = '';
  $('ret-qty').value = '1';
  $('ret-amt').value = '';
  openModal('m-return');
  setTimeout(function () { $('ret-search').focus(); }, 100);
}

function onRetSearch(q) {
  var drop = $('ret-drop');
  if (!q || q.length < 1) { drop.style.display = 'none'; return; }
  var ql = q.toLowerCase(), html = '', cnt = 0, i;
  for (i = 0; i < db.products.length && cnt < 5; i++) {
    var p = db.products[i];
    if (p.name.toLowerCase().indexOf(ql) >= 0 ||
        (p.barcode && normalizeBC(p.barcode).indexOf(normalizeBC(q)) >= 0)) {
      html += '<div class="search-drop-item" onclick="selRetProd(\'' + p.id + '\')">'
        + p.name + ' <strong style="color:#7c3aed">(' + fmt(p.price) + ')</strong></div>';
      cnt++;
    }
  }
  drop.innerHTML = html;
  drop.style.display = cnt ? 'block' : 'none';
}

function selRetProd(id) {
  var p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) { p = db.products[i]; break; }
  }
  if (!p) return;
  $('ret-pid').value              = p.id;
  $('ret-sel-prod').innerHTML     = '✅ ' + p.name + ' — ' + fmt(p.price);
  $('ret-sel-prod').style.display = 'block';
  $('ret-drop').style.display     = 'none';
  $('ret-search').value           = '';
  $('ret-amt').value              = p.price;
}

function calcRet() {
  var pid = $('ret-pid').value;
  if (!pid) return;
  var p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === pid) { p = db.products[i]; break; }
  }
  if (!p) return;
  $('ret-amt').value = p.price * (parseInt($('ret-qty').value) || 1);
}

function confirmReturn() {
  var pid = $('ret-pid').value;
  var qty = parseInt($('ret-qty').value) || 1;
  var amt = parseFloat($('ret-amt').value) || 0;
  if (!pid || qty <= 0) { toast('اختر المنتج وحدد الكمية ❌', 'error'); return; }

  var prod = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === pid) { prod = db.products[i]; break; }
  }
  if (prod) prod.stock = (prod.stock || 0) + qty;
  saveDB('products');

  var sale = {
    id      : genId(),
    date    : nowStr(),
    dateStr : today(),
    items   : [{ pid: pid, name: '🔄 مرتجع: ' + (prod ? prod.name : ''), price: -(amt / qty), qty: qty, unit: prod ? prod.unit : 'قطعة' }],
    subtotal: -amt, discount: 0, total: -amt,
    method  : 'cash', clientId: ''
  };
  db.sales.push(sale);
  saveDB('sales');

  closeModal('m-return');
  toast('تم تسجيل المرتجع ✅', 'success', 3000);
  renderDash();
  renderInv();
  renderTodaySum();
  autoPush();
}

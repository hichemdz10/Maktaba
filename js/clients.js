/* ============================================================
   js/clients.js  —  العملاء والديون
   ============================================================ */

'use strict';

function saveClient() {
  var name = $('ac-name').value.trim();
  if (!name) { toast('أدخل اسم العميل ❌', 'error'); return; }
  var c = {
    id       : genId(),
    name     : name,
    phone    : $('ac-phone').value.trim(),
    note     : $('ac-note').value.trim(),
    totalDebt: 0,
    debts    : [],
    payments : [],
    createdAt: today()
  };
  db.clients.push(c);
  saveDB('clients');
  closeModal('m-add-client');
  $('ac-name').value = ''; $('ac-phone').value = ''; $('ac-note').value = '';
  renderClients();
  toast('تم إضافة: ' + name + ' ✅', 'success');
  autoPush();
}

function renderClients() {
  var q = ($('cli-s').value || '').toLowerCase(), html = '', cnt = 0, i;
  for (i = 0; i < db.clients.length; i++) {
    var c = db.clients[i];
    if (q && c.name.toLowerCase().indexOf(q) < 0 &&
        !(c.phone && c.phone.indexOf(q) >= 0)) continue;
    cnt++;
    html += '<div class="cli-card" onclick="showCliDetail(\'' + c.id + '\')">'
      + '<div class="cli-av">' + c.name.charAt(0) + '</div>'
      + '<div style="flex:1">'
      +   '<div class="cli-name">' + c.name + '</div>'
      +   '<div class="cli-phone">' + (c.phone || 'بدون هاتف') + '</div>'
      + '</div>'
      + (c.totalDebt > 0
          ? '<span class="tag tr">دين: ' + fmt(c.totalDebt) + '</span>'
          : '<span class="tag tg">نظيف</span>')
      + '</div>';
  }
  $('cli-cnt').textContent = cnt + ' عميل';
  $('cli-list').innerHTML  = html || '<div style="text-align:center;color:#9ca3af;padding:24px">لا يوجد عملاء</div>';
}

function showCliDetail(id) {
  var c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (!c) return;

  var dH = '', pH = '', j;
  for (j = (c.debts || []).length - 1; j >= 0; j--) {
    var d = c.debts[j];
    dH += '<div style="padding:8px 0;border-bottom:1px solid #f0f2f8;font-size:11px">'
      + '<div style="font-weight:700;color:#dc2626;font-size:14px">' + fmt(d.amount) + '</div>'
      + '<div style="color:#9ca3af">' + d.date + '</div>'
      + '<div style="color:#6b7280;font-size:10px;margin-top:2px">' + d.items + '</div>'
      + '</div>';
  }
  for (j = (c.payments || []).length - 1; j >= 0; j--) {
    var p = c.payments[j];
    pH += '<div style="padding:7px 0;border-bottom:1px solid #f0f2f8;font-size:11px">'
      + '<span style="font-weight:700;color:#16a34a;font-size:14px">+' + fmt(p.amount) + '</span> '
      + '<span style="color:#9ca3af">' + p.date + '</span>'
      + (p.note ? '<div style="color:#6b7280;font-size:10px;margin-top:2px">' + p.note + '</div>' : '')
      + '</div>';
  }

  /* رابط واتساب */
  var waBtn = c.phone
    ? '<a href="https://wa.me/213' + c.phone.replace(/^0/, '') + '" target="_blank" class="btn btn-full" '
    +   'style="background:#25D366;color:#fff;text-decoration:none;margin-top:8px;padding:11px">💬 مطالبة عبر واتساب</a>'
    : '';

  $('cli-detail').innerHTML =
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">'
    +   '<div class="cli-av" style="width:52px;height:52px;font-size:22px">' + c.name.charAt(0) + '</div>'
    +   '<div>'
    +     '<div style="font-size:17px;font-weight:800">' + c.name + '</div>'
    +     '<div style="font-size:11px;color:#9ca3af">' + (c.phone || 'بدون هاتف') + '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">'
    +   '<div style="text-align:center;padding:12px;background:#fee2e2;border-radius:12px">'
    +     '<div style="font-size:10px;color:#dc2626;font-weight:700">إجمالي الدين</div>'
    +     '<div style="font-size:18px;font-weight:900;color:#dc2626">' + fmt(c.totalDebt || 0) + '</div>'
    +   '</div>'
    +   '<div style="text-align:center;padding:12px;background:#dcfce7;border-radius:12px">'
    +     '<div style="font-size:10px;color:#16a34a;font-weight:700">عمليات الشراء</div>'
    +     '<div style="font-size:18px;font-weight:900;color:#16a34a">' + (c.debts || []).length + '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
    +   (c.totalDebt > 0
      ? '<button class="btn btn-g btn-full" style="padding:11px" onclick="openPayDebt(\'' + c.id + '\')">💰 دفعة</button>'
      : '<div></div>')
    +   '<button class="btn btn-r btn-full" style="padding:11px" onclick="openAddDebtManual(\'' + c.id + '\')">📝 دين يدوي</button>'
    + '</div>'
    + '<button class="btn btn-gray btn-full" style="padding:11px;margin-bottom:14px" onclick="printClientStatement(\'' + c.id + '\')">🖨️ كشف حساب</button>'
    + waBtn
    + '<div style="font-size:13px;font-weight:700;margin-bottom:8px;margin-top:14px">سجل الديون</div>'
    + '<div style="max-height:160px;overflow-y:auto">' + (dH || '<div style="color:#9ca3af;font-size:11px;padding:8px">لا ديون</div>') + '</div>'
    + (pH ? '<div style="font-size:13px;font-weight:700;margin:12px 0 8px">الدفعات</div><div style="max-height:120px;overflow-y:auto">' + pH + '</div>' : '')
    + '<div style="margin-top:16px">'
    +   '<button class="btn btn-out btn-full" style="border-color:#ef4444;color:#ef4444" onclick="deleteCli(\'' + c.id + '\')">🗑️ حذف العميل</button>'
    + '</div>';
}

function openPayDebt(id) {
  var c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (!c) return;
  $('pd-info').innerHTML =
    '<strong>' + c.name + '</strong> — الدين: <strong style="color:#dc2626">' + fmt(c.totalDebt) + '</strong>';
  $('pd-cid').value  = id;
  $('pd-amt').value  = '';
  $('pd-note').value = '';
  openModal('m-pay-debt');
}

function savePayDebt() {
  var id = $('pd-cid').value, c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (!c) return;
  var amt = parseFloat($('pd-amt').value) || 0;
  if (amt <= 0) { toast('أدخل المبلغ ❌', 'error'); return; }

  c.payments = c.payments || [];
  c.payments.push({ date: nowStr(), amount: amt, note: $('pd-note').value });

  var td = 0, tp = 0, j;
  for (j = 0; j < (c.debts    || []).length; j++) td += c.debts[j].amount    || 0;
  for (j = 0; j < (c.payments || []).length; j++) tp += c.payments[j].amount || 0;
  c.totalDebt = Math.max(0, td - tp);

  saveDB('clients');
  closeModal('m-pay-debt');
  renderClients();
  showCliDetail(id);
  toast('دفعة: ' + fmt(amt) + ' ✅', 'success');
  autoPush();
}

function openAddDebtManual(id) {
  var c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (!c) return;
  $('adm-info').innerHTML =
    '<strong>' + c.name + '</strong> — الدين الحالي: <strong style="color:#dc2626">' + fmt(c.totalDebt) + '</strong>';
  $('adm-cid').value  = id;
  $('adm-amt').value  = '';
  $('adm-desc').value = '';
  openModal('m-add-debt-manual');
  setTimeout(function () { $('adm-amt').focus(); }, 100);
}

function saveManualDebt() {
  var id = $('adm-cid').value, c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (!c) return;
  var amt  = parseFloat($('adm-amt').value) || 0;
  var desc = $('adm-desc').value.trim();
  if (amt <= 0)  { toast('أدخل المبلغ ❌',     'error'); return; }
  if (!desc)     { toast('أدخل بيان الدين ❌', 'error'); return; }

  c.debts = c.debts || [];
  c.debts.push({ date: nowStr(), amount: amt, items: desc });

  var td = 0, tp = 0, j;
  for (j = 0; j < (c.debts    || []).length; j++) td += c.debts[j].amount    || 0;
  for (j = 0; j < (c.payments || []).length; j++) tp += c.payments[j].amount || 0;
  c.totalDebt = Math.max(0, td - tp);

  saveDB('clients');
  closeModal('m-add-debt-manual');
  renderClients();
  showCliDetail(id);
  toast('دين ' + fmt(amt) + ' مضاف ✅', 'success');
  autoPush();
}

function deleteCli(id) {
  var c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (c && ((c.debts && c.debts.length > 0) || (c.payments && c.payments.length > 0))) {
    toast('لا يمكن حذف عميل له سجل مالي ❌', 'error', 4000);
    return;
  }
  if (!confirm('حذف العميل نهائياً؟')) return;
  db.clients = db.clients.filter(function (x) { return x.id !== id; });
  saveDB('clients');
  $('cli-detail').innerHTML =
    '<div style="text-align:center;color:#9ca3af;padding:60px 20px">' +
    '<div style="font-size:64px;opacity:.3">👤</div>' +
    '<div style="margin-top:16px;font-size:15px;font-weight:700">اختر عميلاً</div></div>';
  renderClients();
  autoPush();
}

function printClientStatement(id) {
  var c = null, i;
  for (i = 0; i < db.clients.length; i++) {
    if (db.clients[i].id === id) { c = db.clients[i]; break; }
  }
  if (!c) return;
  var lines = [];
  lines.push('════════════════════════');
  lines.push('    كشف حساب العميل');
  lines.push('════════════════════════');
  lines.push('👤 ' + c.name);
  if (c.phone) lines.push('📞 ' + c.phone);
  lines.push('📅 ' + nowStr());
  lines.push('────────────────────────');
  lines.push('📋 الديون:');
  (c.debts || []).forEach(function (d) {
    lines.push(' - ' + d.date.split(',')[0] + ' : ' + fmt(d.amount));
    if (d.items) lines.push('   (' + d.items + ')');
  });
  lines.push('────────────────────────');
  lines.push('💳 الدفعات:');
  (c.payments || []).forEach(function (p) {
    lines.push(' + ' + p.date.split(',')[0] + ' : ' + fmt(p.amount));
  });
  lines.push('════════════════════════');
  lines.push('🔴 الرصيد المتبقي:');
  lines.push('      ' + fmt(c.totalDebt));
  lines.push('════════════════════════');

  $('receipt-content').textContent = lines.join('\n');
  $('receipt-print-area').innerHTML =
    '<div style="font-family:monospace;font-size:12px;white-space:pre-line">' + lines.join('\n') + '</div>';
  openModal('m-receipt');
}

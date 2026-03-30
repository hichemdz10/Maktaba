/* ============================================================
   js/db.js  —  قراءة/كتابة localStorage
   ============================================================ */

'use strict';

function loadDB() {
  var k;
  for (k in DB_KEYS) {
    if (DB_KEYS.hasOwnProperty(k)) {
      var raw = localStorage.getItem(DB_KEYS[k]);
      if (raw) {
        try { db[k] = JSON.parse(raw); } catch (e) {}
      }
    }
  }
}

function saveDB(k) {
  localStorage.setItem(DB_KEYS[k], JSON.stringify(db[k]));
}

/* ===== BACKUP / RESTORE ===== */
function exportBackup() {
  var blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = 'hashishi_backup_' + today() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('تم التصدير بنجاح ✅', 'success');
}

function importBackup(e) {
  var file = e.target.files[0];
  if (!file) return;
  var r = new FileReader();
  r.onload = function (ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (confirm('استيراد النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.')) {
        db = d;
        var k;
        for (k in DB_KEYS) {
          if (DB_KEYS.hasOwnProperty(k)) saveDB(k);
        }
        showPage('dashboard');
        toast('تم الاستيراد بنجاح ✅', 'success');
      }
    } catch (err) {
      toast('الملف تالف أو غير مدعوم ❌', 'error');
    }
  };
  r.readAsText(file);
  e.target.value = '';
}

/* ===== CSV EXPORTS ===== */
function exportInvCSV() {
  var rows = [['الباركود','الاسم','القسم','البيع','الشراء','المخزون']], i;
  for (i = 0; i < db.products.length; i++) {
    var p = db.products[i];
    var bc = (p.barcode && p.barcode.indexOf('MANUAL') < 0) ? p.barcode : '';
    rows.push([bc, p.name, p.category || '', p.price, p.cost || 0, p.stock || 0]);
  }
  downloadCSV(rows, 'inventory_' + today() + '.csv');
}

function exportExpCSV() {
  var rows = [['التاريخ','التصنيف','الوصف','المبلغ']], i;
  for (i = 0; i < db.expenses.length; i++) {
    var e = db.expenses[i];
    rows.push([e.date, e.category, e.desc, e.amount]);
  }
  downloadCSV(rows, 'expenses_' + today() + '.csv');
}

function exportAllCSV() {
  var rows = [['النوع','التاريخ','التفاصيل','المبلغ']], i;
  for (i = 0; i < db.sales.length; i++) {
    var s = db.sales[i];
    rows.push(['مبيعات', s.dateStr,
      s.items.map(function (it) { return it.name + '×' + it.qty; }).join('|'),
      s.total]);
  }
  for (i = 0; i < db.telecomSales.length; i++) {
    var t = db.telecomSales[i];
    rows.push(['هاتف', t.dateStr,
      t.type === 'recharge' ? 'شحن ' + t.operator : 'بطاقة ' + t.cardName,
      t.profit]);
  }
  for (i = 0; i < db.printSales.length; i++) {
    var ps = db.printSales[i];
    rows.push(['طباعة', ps.dateStr, ps.typeName + '×' + ps.qty, ps.total]);
  }
  for (i = 0; i < db.expenses.length; i++) {
    var ex = db.expenses[i];
    rows.push(['مصروف', ex.date, ex.desc, -ex.amount]);
  }
  downloadCSV(rows, 'full_report_' + today() + '.csv');
}

function downloadCSV(rows, name) {
  var csv = '\ufeff' + rows.map(function (r) {
    return r.map(function (c) {
      return '"' + String(c).replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   js/cloud.js  —  مزامنة Supabase
   ============================================================ */

'use strict';

/* ===== LOW-LEVEL ===== */
function sbGet(k, cb) {
  fetch(SB_URL + '/rest/v1/app_data?key=eq.' + encodeURIComponent(k), {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  })
    .then(function (r) { return r.json(); })
    .then(function (d) { cb(d && d.length > 0 ? d[0].value : null); })
    .catch(function () { cb(null); });
}

function sbSet(k, v, cb) {
  fetch(SB_URL + '/rest/v1/app_data', {
    method: 'POST',
    headers: {
      'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ key: k, value: v })
  })
    .then(function () { if (cb) cb(true); })
    .catch(function () { if (cb) cb(false); });
}

/* ===== MERGE ===== */
function mergeArr(a1, a2) {
  var map = {}, i, k;
  for (i = 0; i < (a1 || []).length; i++) {
    if (a1[i] && a1[i].id) map[a1[i].id] = a1[i];
  }
  for (i = 0; i < (a2 || []).length; i++) {
    if (a2[i] && a2[i].id) map[a2[i].id] = a2[i];
  }
  var res = [];
  for (k in map) { if (map.hasOwnProperty(k)) res.push(map[k]); }
  return res;
}

function mergeClients(a1, a2) {
  var map = {}, i, j;
  for (i = 0; i < (a1 || []).length; i++) {
    if (a1[i] && a1[i].id) map[a1[i].id] = JSON.parse(JSON.stringify(a1[i]));
  }
  for (i = 0; i < (a2 || []).length; i++) {
    var c = a2[i];
    if (!c || !c.id) continue;
    if (map[c.id]) {
      var ex = map[c.id], dk = {}, pk = {};
      for (j = 0; j < (ex.debts || []).length; j++)
        dk[ex.debts[j].date + '|' + ex.debts[j].amount] = true;
      for (j = 0; j < (c.debts || []).length; j++) {
        var dKey = c.debts[j].date + '|' + c.debts[j].amount;
        if (!dk[dKey]) { ex.debts = ex.debts || []; ex.debts.push(c.debts[j]); }
      }
      for (j = 0; j < (ex.payments || []).length; j++)
        pk[ex.payments[j].date + '|' + ex.payments[j].amount] = true;
      for (j = 0; j < (c.payments || []).length; j++) {
        var pKey = c.payments[j].date + '|' + c.payments[j].amount;
        if (!pKey || !pk[pKey]) { ex.payments = ex.payments || []; ex.payments.push(c.payments[j]); }
      }
      var td = 0, tp = 0;
      for (j = 0; j < (ex.debts || []).length; j++)    td += (ex.debts[j].amount || 0);
      for (j = 0; j < (ex.payments || []).length; j++) tp += (ex.payments[j].amount || 0);
      ex.totalDebt = Math.max(0, td - tp);
    } else {
      var nc = JSON.parse(JSON.stringify(c)), ntd = 0, ntp = 0, j2;
      for (j2 = 0; j2 < (nc.debts || []).length; j2++)    ntd += (nc.debts[j2].amount || 0);
      for (j2 = 0; j2 < (nc.payments || []).length; j2++) ntp += (nc.payments[j2].amount || 0);
      nc.totalDebt = Math.max(0, ntd - ntp);
      map[c.id] = nc;
    }
  }
  var res = [], k2;
  for (k2 in map) { if (map.hasOwnProperty(k2)) res.push(map[k2]); }
  return res;
}

function mergeDB(local, cloud) {
  return {
    products     : mergeArr(local.products,     cloud.products),
    sales        : mergeArr(local.sales,         cloud.sales),
    printSales   : mergeArr(local.printSales,    cloud.printSales),
    telecomSales : mergeArr(local.telecomSales,  cloud.telecomSales),
    expenses     : mergeArr(local.expenses,      cloud.expenses),
    clients      : mergeClients(local.clients,   cloud.clients)
  };
}

/* ===== SYNC DOT ===== */
function setSyncDot(s) {
  var d = $('sync-dot');
  if (d) d.className = 'sync-dot ' + (s || '');
}

/* ===== PUSH ===== */
function cloudPush(silent) {
  setSyncDot('busy');
  var payload = {
    products: db.products, sales: db.sales,
    printSales: db.printSales, telecomSales: db.telecomSales,
    expenses: db.expenses, clients: db.clients,
    ts: Date.now()
  };
  sbSet(SB_KEY2, payload, function (ok) {
    if (ok) {
      lastSyncTS = Date.now();
      setSyncDot('ok');
      if (!silent) toast('تم الرفع إلى السحابة ✅', 'success');
      updateCloudStatus();
    } else {
      setSyncDot('err');
      if (!silent) toast('فشل الاتصال بالإنترنت ❌', 'error');
    }
  });
}

/* ===== PULL ===== */
function cloudPull(force, cb) {
  setSyncDot('busy');
  sbGet(SB_KEY2, function (data) {
    if (!data) {
      setSyncDot('err');
      toast('لا توجد بيانات سحابية', 'error');
      if (cb) cb(false);
      return;
    }
    if (force) {
      db.products     = data.products     || [];
      db.sales        = data.sales        || [];
      db.printSales   = data.printSales   || [];
      db.telecomSales = data.telecomSales || [];
      db.expenses     = data.expenses     || [];
      db.clients      = data.clients      || [];
    } else {
      var m = mergeDB(db, data);
      db.products     = m.products;
      db.sales        = m.sales;
      db.printSales   = m.printSales;
      db.telecomSales = m.telecomSales;
      db.expenses     = m.expenses;
      db.clients      = m.clients;
    }
    var k;
    for (k in DB_KEYS) { if (DB_KEYS.hasOwnProperty(k)) saveDB(k); }
    lastSyncTS = Date.now();
    setSyncDot('ok');
    updateCloudStatus();
    if (cb) cb(true);
  });
}

/* ===== MODAL ACTIONS ===== */
function doCloudPush() { cloudPush(false); }

function doCloudPull() {
  cloudPull(false, function (ok) {
    if (ok) {
      toast('تم الدمج بنجاح! ✅', 'success');
      var a = document.querySelector('.nav-item.active');
      if (a) showPage(a.dataset.page);
    }
  });
}

function doCloudPullForce() {
  if (!confirm('سيتم حذف البيانات المحلية واستبدالها بالسحابة. متأكد؟')) return;
  cloudPull(true, function (ok) {
    if (ok) {
      toast('تم الاستبدال الكلي ✅', 'info');
      var a = document.querySelector('.nav-item.active');
      if (a) showPage(a.dataset.page);
    }
  });
}

function toggleAutoSync() {
  autoSync = $('auto-sync-chk').checked;
  localStorage.setItem(AUTO_SYNC_KEY, autoSync ? '1' : '0');
  updateCloudStatus();
}

function autoPush() { if (autoSync) cloudPush(true); }

function updateCloudStatus() {
  var el = $('cloud-status');
  if (!el) return;
  var t = lastSyncTS ? new Date(lastSyncTS).toLocaleString('ar-DZ') : 'لم يتم بعد';
  el.innerHTML =
    '<div>⏰ آخر مزامنة: <strong>' + t + '</strong></div>' +
    '<div style="margin-top:6px">🔄 الرفع التلقائي: <strong style="color:' +
    (autoSync ? '#16a34a' : '#dc2626') + '">' +
    (autoSync ? 'مفعّل ✅' : 'معطّل ❌') + '</strong></div>' +
    '<div style="margin-top:6px">📦 ' + db.products.length +
    ' منتج | 🛒 ' + db.sales.length + ' بيعة</div>';
  if ($('auto-sync-chk')) $('auto-sync-chk').checked = autoSync;
}

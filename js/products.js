/* ============================================================
   js/products.js  —  إدارة المنتجات والمخزون
   FIX: إعادة تصميم renderInv مع table-wrap قابل للتمرير
   ============================================================ */

'use strict';

/* ===== OPEN MODALS ===== */
function openNewProdModal(bc, prefill) {
  pendingBC = bc || ('MANUAL-' + Date.now());
  $('np-bc').value    = (bc && bc.indexOf('MANUAL') < 0) ? bc : '';
  $('np-name').value  = prefill || '';
  $('np-price').value = '';
  $('np-cost').value  = '';
  $('np-stock').value = '0';
  $('np-unit').value  = 'قطعة';
  openModal('m-new-prod');
  setTimeout(function () { $('np-name').focus(); }, 100);
}

function openAddProd() { openNewProdModal(null); }

/* ===== SAVE NEW ===== */
function saveNewProd(addC) {
  var name  = $('np-name').value.trim();
  var price = parseFloat($('np-price').value) || 0;
  if (!name || price <= 0) { toast('أدخل الاسم وسعر البيع ❌', 'error'); return; }

  var manualBC = $('np-bc').value.trim();
  var finalBC  = manualBC ? normalizeBC(manualBC) : pendingBC;

  /* FIX: تحقق من تكرار الباركود */
  if (manualBC) {
    var dup = findProductByBarcode(manualBC);
    if (dup) {
      toast('هذا الباركود مسجل مسبقاً لـ: ' + dup.name + ' ❌', 'error');
      return;
    }
  }

  var p = {
    id       : genId(),
    barcode  : finalBC,
    name     : name,
    category : $('np-cat').value,
    unit     : $('np-unit').value,
    price    : price,
    cost     : parseFloat($('np-cost').value) || 0,
    stock    : parseInt($('np-stock').value)  || 0,
    createdAt: today()
  };

  db.products.push(p);
  saveDB('products');
  closeModal('m-new-prod');
  pendingBC = '';

  if (addC) { beep(); addToCart(p); }
  renderInv();
  toast('تم حفظ: ' + name + (addC ? ' ✚ سلة' : ''), 'success');
  autoPush();
}

/* ===== EDIT ===== */
function showEditProd(id) {
  var p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) { p = db.products[i]; break; }
  }
  if (!p) return;
  $('ep-id').value    = p.id;
  $('ep-name').value  = p.name;
  $('ep-cat').value   = p.category || 'متنوع';
  $('ep-unit').value  = p.unit     || 'قطعة';
  $('ep-price').value = p.price;
  $('ep-cost').value  = p.cost  || 0;
  $('ep-stock').value = p.stock || 0;
  openModal('m-edit-prod');
}

function saveEditProd() {
  var id = $('ep-id').value, p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) { p = db.products[i]; break; }
  }
  if (!p) return;
  p.name     = $('ep-name').value;
  p.category = $('ep-cat').value;
  p.unit     = $('ep-unit').value;
  p.price    = parseFloat($('ep-price').value) || 0;
  p.cost     = parseFloat($('ep-cost').value)  || 0;
  p.stock    = parseInt($('ep-stock').value)   || 0;
  saveDB('products');
  closeModal('m-edit-prod');
  renderInv();
  toast('تم التعديل ✅', 'success');
  autoPush();
}

/* ===== DELETE ===== */
function delProd(id) {
  if (!confirm('حذف المنتج نهائياً؟')) return;
  db.products = db.products.filter(function (p) { return p.id !== id; });
  saveDB('products');
  renderInv();
  toast('تم الحذف', 'info');
  autoPush();
}

/* ===== ADD TO CART FROM INVENTORY ===== */
function addToCartFromInv(id) {
  var p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) { p = db.products[i]; break; }
  }
  if (!p) return;
  beep();
  addToCart(p);
  toast('✅ ' + p.name + ' — أُضيف للسلة', 'success');
}

/* ===== QUICK CATEGORY CHANGE ===== */
function quickChangeCat(id) {
  var p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) { p = db.products[i]; break; }
  }
  if (!p) return;
  $('cc-pid').value           = id;
  $('cc-pname').textContent   = p.name;
  $('cc-cat').value           = p.category || 'متنوع';
  openModal('m-cat-change');
}

function saveChangeCategory() {
  var id = $('cc-pid').value, p = null, i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) { p = db.products[i]; break; }
  }
  if (!p) return;
  var old = p.category, nw = $('cc-cat').value;
  p.category = nw;
  saveDB('products');
  closeModal('m-cat-change');
  renderInv();
  toast('تم النقل: ' + old + ' ← ' + nw, 'success');
  autoPush();
}

/* ===== RENDER INVENTORY (إعادة تصميم جذرية + FIX تمرير عمودي) ===== */
function renderInv() {
  var s   = ($('inv-s').value   || '').toLowerCase();
  var cat = $('inv-cat').value  || '';

  var filtered = db.products.filter(function (p) {
    if (s && p.name.toLowerCase().indexOf(s) < 0 &&
        !(p.barcode && normalizeBC(p.barcode).indexOf(s) >= 0)) return false;
    if (cat && p.category !== cat) return false;
    return true;
  });

  /* إحصائيات سريعة */
  var total   = filtered.length;
  var outOf   = filtered.filter(function (p) { return p.stock <= 0; }).length;
  var low     = filtered.filter(function (p) { return p.stock > 0 && p.stock <= (shopSettings.lowStockAlert || 5); }).length;
  var healthy = total - outOf - low;

  $('inv-cnt').textContent = total + ' منتج';

  /* حقن إحصائيات صغيرة فوق الجدول */
  var statsEl = $('inv-stats-row');
  if (statsEl) {
    statsEl.innerHTML =
      '<div class="inv-stat-item"><div class="inv-stat-item-val">' + total   + '</div><div class="inv-stat-item-lbl">إجمالي</div></div>' +
      '<div class="inv-stat-item"><div class="inv-stat-item-val" style="color:#16a34a">' + healthy + '</div><div class="inv-stat-item-lbl">جيد</div></div>' +
      '<div class="inv-stat-item"><div class="inv-stat-item-val" style="color:#ea580c">' + low     + '</div><div class="inv-stat-item-lbl">منخفض</div></div>' +
      '<div class="inv-stat-item"><div class="inv-stat-item-val" style="color:#dc2626">' + outOf   + '</div><div class="inv-stat-item-lbl">نفذ</div></div>';
  }

  var html = '', i, p, sc, sl, profit, bcView;
  for (i = 0; i < filtered.length; i++) {
    p      = filtered[i];
    sc     = p.stock <= 0
      ? 'badge-out'
      : p.stock <= (shopSettings.lowStockAlert || 5)
        ? 'badge-low'
        : 'badge-ok';
    sl     = p.stock <= 0
      ? 'نفذ ⚠️'
      : p.stock <= (shopSettings.lowStockAlert || 5)
        ? p.stock + ' ↓'
        : p.stock + ' ' + (p.unit || 'قطعة');
    profit  = p.cost ? (((p.price - p.cost) / p.cost) * 100).toFixed(0) + '%' : '—';
    bcView  = (p.barcode && p.barcode.indexOf('MANUAL') < 0) ? p.barcode : '—';

    html += '<tr>'
      + '<td style="font-family:monospace;font-size:10px;color:#9ca3af;letter-spacing:.5px">' + bcView + '</td>'
      + '<td>'
      +   '<div style="font-weight:700;font-size:13px;margin-bottom:2px">' + p.name + '</div>'
      +   '<div style="font-size:10px;color:#9ca3af">' + (p.unit || '') + '</div>'
      + '</td>'
      + '<td>' + (CAT_ICONS[p.category] || '📦') + ' ' + (p.category || '—') + '</td>'
      + '<td style="font-weight:700;color:#7c3aed">' + fmt(p.price) + '</td>'
      + '<td style="color:#6b7280">' + (p.cost ? fmt(p.cost) : '—') + '</td>'
      + '<td style="color:#16a34a;font-weight:700">' + profit + '</td>'
      + '<td><span class="' + sc + '">' + sl + '</span></td>'
      + '<td style="white-space:nowrap">'
      +   '<button class="btn btn-g btn-sm" onclick="addToCartFromInv(\'' + p.id + '\')" title="سلة">🛒</button> '
      +   '<button class="btn btn-gray btn-sm" onclick="quickChangeCat(\'' + p.id + '\')" title="نقل قسم">📂</button> '
      +   '<button class="btn btn-out btn-sm" onclick="showEditProd(\'' + p.id + '\')">✏️</button> '
      +   '<button class="btn btn-r btn-sm" onclick="delProd(\'' + p.id + '\')">🗑️</button>'
      + '</td>'
      + '</tr>';
  }

  $('inv-body').innerHTML = html ||
    '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:32px;font-size:13px;font-weight:600">لا توجد منتجات</td></tr>';
}

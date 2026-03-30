/* ============================================================
   js/products.js  —  إدارة المنتجات
   تصميم حديث لجدول/بطاقات المخزون
   ============================================================ */

'use strict';

// [أبقينا على نفس دوال الإضافة والتعديل والحذف كما هي...]
function openNewProdModal(bc, prefill) { /* ...نفس الكود... */ 
  pendingBC = bc || ('MANUAL-' + Date.now());
  $('np-bc').value    = (bc && bc.indexOf('MANUAL') < 0) ? bc : '';
  $('np-name').value  = prefill || '';
  $('np-price').value = ''; $('np-cost').value  = '';
  $('np-stock').value = '0'; $('np-unit').value  = 'قطعة';
  openModal('m-new-prod');
}
function openAddProd() { openNewProdModal(null); }

function saveNewProd(addC) {
  var name  = $('np-name').value.trim();
  var price = parseFloat($('np-price').value) || 0;
  if (!name || price <= 0) { toast('أدخل الاسم وسعر البيع ❌', 'error'); return; }
  var manualBC = $('np-bc').value.trim();
  var finalBC  = manualBC ? normalizeBC(manualBC) : pendingBC;
  
  // حماية ضد التكرار (لتفادي مشكلة الماسح)
  if (manualBC) {
    for(var i=0; i<db.products.length; i++) {
      if(normalizeBC(db.products[i].barcode) === normalizeBC(manualBC)){
         toast('هذا الباركود مسجل مسبقاً! ❌', 'error'); return;
      }
    }
  }

  var p = { id: genId(), barcode: finalBC, name: name, category: $('np-cat').value, unit: $('np-unit').value, price: price, cost: parseFloat($('np-cost').value) || 0, stock: parseInt($('np-stock').value) || 0, createdAt: today() };
  db.products.push(p); saveDB('products'); closeModal('m-new-prod'); pendingBC = '';
  if (addC) { beep(); addToCart(p); }
  renderInv();
  toast('تم حفظ: ' + name, 'success'); autoPush();
}

function showEditProd(id) {
  var p = null; for(var i=0; i<db.products.length; i++){ if(db.products[i].id === id){ p=db.products[i]; break; } }
  if(!p) return;
  $('ep-id').value = p.id; $('ep-name').value = p.name; $('ep-cat').value = p.category || 'متنوع'; $('ep-unit').value = p.unit || 'قطعة'; $('ep-price').value = p.price; $('ep-cost').value = p.cost || 0; $('ep-stock').value = p.stock || 0;
  openModal('m-edit-prod');
}

function saveEditProd() {
  var id = $('ep-id').value, p = null; for(var i=0; i<db.products.length; i++){ if(db.products[i].id === id){ p=db.products[i]; break; } }
  if(!p) return;
  p.name = $('ep-name').value; p.category = $('ep-cat').value; p.unit = $('ep-unit').value; p.price = parseFloat($('ep-price').value) || 0; p.cost = parseFloat($('ep-cost').value) || 0; p.stock = parseInt($('ep-stock').value) || 0;
  saveDB('products'); closeModal('m-edit-prod'); renderInv(); toast('تم التعديل ✅', 'success'); autoPush();
}

function delProd(id) {
  if (!confirm('حذف المنتج نهائياً؟')) return;
  db.products = db.products.filter(function (p) { return p.id !== id; });
  saveDB('products'); renderInv(); toast('تم الحذف', 'info'); autoPush();
}

function addToCartFromInv(id) {
  var p = null; for(var i=0; i<db.products.length; i++){ if(db.products[i].id===id) { p=db.products[i]; break; } }
  if(!p) return; beep(); addToCart(p); toast('✅ ' + p.name + ' — أُضيف للسلة', 'success');
}

function quickChangeCat(id) {
  var p = null; for(var i=0; i<db.products.length; i++){ if(db.products[i].id===id){ p=db.products[i]; break; } }
  if(!p) return;
  $('cc-pid').value = id; $('cc-pname').textContent = p.name; $('cc-cat').value = p.category || 'متنوع'; openModal('m-cat-change');
}

function saveChangeCategory() {
  var id = $('cc-pid').value, p = null; for(var i=0; i<db.products.length; i++){ if(db.products[i].id===id){ p=db.products[i]; break; } }
  if(!p) return;
  var nw = $('cc-cat').value; p.category = nw; saveDB('products'); closeModal('m-cat-change'); renderInv(); toast('تم النقل ✅', 'success'); autoPush();
}

/* ===== MODERN RENDER ===== */
function renderInv() {
  var s   = ($('inv-s').value   || '').toLowerCase();
  var cat = $('inv-cat').value  || '';

  var filtered = db.products.filter(function (p) {
    if (s && p.name.toLowerCase().indexOf(s) < 0 && !(p.barcode && normalizeBC(p.barcode).indexOf(s) >= 0)) return false;
    if (cat && p.category !== cat) return false;
    return true;
  });

  var total = filtered.length;
  var outOf = filtered.filter(function (p) { return p.stock <= 0; }).length;
  var low   = filtered.filter(function (p) { return p.stock > 0 && p.stock <= (shopSettings.lowStockAlert || 5); }).length;
  var healthy = total - outOf - low;

  if($('inv-cnt')) $('inv-cnt').textContent = total + ' منتج';

  var html = '', i, p, sc, sl, profit, bcView;
  for (i = 0; i < filtered.length; i++) {
    p = filtered[i];
    sc = p.stock <= 0 ? 'badge-out' : p.stock <= (shopSettings.lowStockAlert || 5) ? 'badge-low' : 'badge-ok';
    sl = p.stock <= 0 ? 'نفذ تماماً ⚠️' : p.stock <= (shopSettings.lowStockAlert || 5) ? p.stock + ' (أوشك)' : p.stock + ' ' + (p.unit || '');
    profit = p.cost ? (((p.price - p.cost) / p.cost) * 100).toFixed(0) + '%' : '—';
    bcView = (p.barcode && p.barcode.indexOf('MANUAL') < 0) ? p.barcode : 'بدون باركود';

    // تم تصميم هذا الهيكل ليعمل بشكل مذهل مع الـ Grid في الـ CSS
    html += '<div class="inv-card-modern">'
      + '<div class="inv-c-top">'
      +   '<div>'
      +     '<div class="inv-c-name">' + p.name + '</div>'
      +     '<div class="inv-c-cat">' + (CAT_ICONS[p.category]||'📦') + ' ' + (p.category||'متنوع') + '</div>'
      +     '<div style="font-size:9px;color:#94a3af;margin-top:4px;font-family:monospace">' + bcView + '</div>'
      +   '</div>'
      +   '<div style="text-align:left">'
      +     '<div class="inv-c-price">' + fmt(p.price) + '</div>'
      +     '<div style="font-size:10px;color:#10b981;font-weight:700">ربح: ' + profit + '</div>'
      +   '</div>'
      + '</div>'
      + '<div class="inv-c-stock">'
      +   '<span class="' + sc + '">' + sl + '</span>'
      +   '<div class="inv-c-actions">'
      +     '<button class="btn btn-g btn-sm" onclick="addToCartFromInv(\'' + p.id + '\')">🛒</button>'
      +     '<button class="btn btn-gray btn-sm" onclick="quickChangeCat(\'' + p.id + '\')">📂</button>'
      +     '<button class="btn btn-out btn-sm" onclick="showEditProd(\'' + p.id + '\')">✏️</button>'
      +     '<button class="btn btn-r btn-sm" style="padding:4px 8px" onclick="delProd(\'' + p.id + '\')">✕</button>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  $('inv-body').innerHTML = html || '<div style="grid-column: 1 / -1; text-align:center; color:#9ca3af; padding:40px; font-size:15px; font-weight:700;">لا توجد منتجات تطابق البحث</div>';
}

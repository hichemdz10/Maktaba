/* ============================================================
   js/cart.js  —  السلة + السلات المعلّقة
   FIX: آخر منتج يظهر في الأعلى (CSS column-reverse)
   ============================================================ */

'use strict';

/* ===== CART OPERATIONS ===== */
function addToCart(prod, qty) {
  qty = qty || 1;

  /* FIX: التحقق من المخزون قبل الإضافة */
  var currentInCart = 0;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].pid === prod.id) { currentInCart = cart[i].qty; break; }
  }
  if (prod.stock !== undefined && (currentInCart + qty) > prod.stock) {
    toast('❌ المخزون لا يكفي! (متبقي: ' + (prod.stock || 0) + ')', 'error');
    return;
  }

  var found = false;
  for (var j = 0; j < cart.length; j++) {
    if (cart[j].pid === prod.id) {
      cart[j].qty += qty;
      found = true;
      break;
    }
  }
  if (!found) {
    cart.push({
      pid  : prod.id,
      name : prod.name,
      price: prod.price,
      unit : prod.unit || 'قطعة',
      qty  : qty
    });
  }

  renderCartList();
  updateCartTotals();
}

function changeQty(pid, d) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].pid === pid) {
      /* التحقق من المخزون عند الزيادة */
      if (d > 0) {
        var prod = null;
        for (var k = 0; k < db.products.length; k++) {
          if (db.products[k].id === pid) { prod = db.products[k]; break; }
        }
        if (prod && (cart[i].qty + d) > (prod.stock || 0)) {
          toast('❌ تجاوزت المخزون الفعلي!', 'error');
          return;
        }
      }
      cart[i].qty += d;
      if (cart[i].qty <= 0) cart.splice(i, 1);
      break;
    }
  }
  renderCartList();
  updateCartTotals();
}

function removeFromCart(pid) {
  cart = cart.filter(function (it) { return it.pid !== pid; });
  renderCartList();
  updateCartTotals();
}

function clearCart() {
  if (cart.length && !confirm('تفريغ السلة؟')) return;
  cart = [];
  renderCartList();
  updateCartTotals();
}

/* ===== RENDER — آخر منتج أعلى (CSS column-reverse على #cart-list) ===== */
function renderCartList() {
  var listEl = $('cart-list');
  if (!listEl) return;

  if (cart.length === 0) { listEl.innerHTML = ''; return; }

  var html = '';
  for (var i = 0; i < cart.length; i++) {
    var it    = cart[i];
    var total = it.price * it.qty;
    html += '<div class="cart-item" data-pid="' + it.pid + '">'
      + '<div class="ci-info">'
      +   '<div class="ci-name">' + it.name + '</div>'
      +   '<div class="ci-unit">' + fmt(it.price) + ' / ' + it.unit + '</div>'
      + '</div>'
      + '<div class="qty-ctrl">'
      +   '<button class="qty-btn" onclick="changeQty(\'' + it.pid + '\',-1)">−</button>'
      +   '<span class="qty-n">' + it.qty + '</span>'
      +   '<button class="qty-btn" onclick="changeQty(\'' + it.pid + '\',1)">+</button>'
      + '</div>'
      + '<div class="ci-price">' + fmt(total) + '</div>'
      + '<button onclick="removeFromCart(\'' + it.pid + '\')" '
      +   'style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:14px;padding:0 2px;flex-shrink:0">✕</button>'
      + '</div>';
  }
  listEl.innerHTML = html;
  /* column-reverse في CSS يجعل آخر عنصر يظهر أعلى */
}

/* ===== UPDATE TOTALS ===== */
function updateCartTotals() {
  var emptyEl = $('cart-empty');
  var sumEl   = $('cart-sum');
  var payBW   = $('pay-btn-wrap');
  var badge   = $('cart-badge');
  var isEmpty = cart.length === 0;

  emptyEl.style.display = isEmpty ? 'block' : 'none';
  sumEl.style.display   = isEmpty ? 'none'  : 'block';
  payBW.style.display   = isEmpty ? 'none'  : 'block';

  if (isEmpty) {
    badge.style.display = 'none';
    $('ss-items').textContent = '0';
    $('ss-total').textContent = '0';
    if ($('pay-section').style.display !== 'none') hidePay();
    return;
  }

  var totalQty = 0, sub = 0;
  for (var i = 0; i < cart.length; i++) {
    totalQty += cart[i].qty;
    sub      += cart[i].price * cart[i].qty;
  }

  badge.style.display  = 'inline-block';
  badge.textContent    = totalQty;

  var disc  = parseFloat($('disc-in').value) || 0;
  var total = Math.max(0, sub - disc);

  $('cart-cnt').textContent = cart.length + ' صنف (' + totalQty + ' وحدة)';
  $('cart-sub').textContent = fmt(sub);
  $('cart-tot').textContent = fmt(total);
  $('ss-items').textContent = totalQty;
  $('ss-total').textContent = total.toLocaleString('ar-DZ');
}

/* ===== PAY ===== */
function showPay() {
  $('pay-section').style.display  = 'block';
  $('pay-btn-wrap').style.display = 'none';

  var sel = $('sale-client');
  sel.innerHTML = '<option value="">اختر العميل...</option>';
  for (var i = 0; i < db.clients.length; i++) {
    var c = db.clients[i];
    sel.innerHTML += '<option value="' + c.id + '">'
      + c.name + (c.totalDebt ? ' — دين: ' + fmt(c.totalDebt) : '')
      + '</option>';
  }

  document.querySelectorAll('.pay-chip').forEach(function (ch) { ch.classList.remove('sel'); });
  document.querySelectorAll('.pay-chip')[0].classList.add('sel');
  $('pay-method').value = 'cash';
  $('cli-sel-wrap').style.display = 'none';
}

function hidePay() {
  $('pay-section').style.display  = 'none';
  $('pay-btn-wrap').style.display = 'block';
}

function selPay(method, el) {
  document.querySelectorAll('.pay-chip').forEach(function (ch) { ch.classList.remove('sel'); });
  el.classList.add('sel');
  $('pay-method').value = method;
  $('cli-sel-wrap').style.display = method === 'debt' ? 'block' : 'none';
}

/* ===== HOLD CART ===== */
function holdCart() {
  if (!cart.length) return;
  var name = prompt('اسم الزبون للتمييز:', 'زبون ' + (heldCarts.length + 1));
  if (name === null) return;
  heldCarts.push({ id: genId(), name: name || 'بدون اسم', items: JSON.parse(JSON.stringify(cart)) });
  localStorage.setItem(HELD_CARTS_KEY, JSON.stringify(heldCarts));
  cart = [];
  renderCartList();
  updateCartTotals();
  renderHeldCarts();
  toast('تم تعليق الفاتورة ⏱️', 'info');
}

function resumeCart(id) {
  if (cart.length && !confirm('سلتك الحالية ستُمسح. هل تريد الاسترجاع؟')) return;
  var idx = -1;
  for (var i = 0; i < heldCarts.length; i++) {
    if (heldCarts[i].id === id) { idx = i; break; }
  }
  if (idx > -1) {
    cart = heldCarts[idx].items;
    heldCarts.splice(idx, 1);
    localStorage.setItem(HELD_CARTS_KEY, JSON.stringify(heldCarts));
    renderCartList();
    updateCartTotals();
    renderHeldCarts();
    toast('تم استرجاع الفاتورة ✅', 'success');
  }
}

function renderHeldCarts() {
  var wrap = $('held-carts-wrap');
  if (!wrap) return;
  if (!heldCarts.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  var h = '';
  for (var i = 0; i < heldCarts.length; i++) {
    h += '<button class="btn btn-out btn-sm" onclick="resumeCart(\'' + heldCarts[i].id + '\')">'
      + '⏱ ' + heldCarts[i].name + '</button>';
  }
  wrap.innerHTML = h;
}

/* ===== SEARCH ===== */
function onSearch(q) {
  var drop = $('search-drop');
  if (!q || q.length < 1) { drop.style.display = 'none'; return; }

  var ql = q.toLowerCase(), html = '', cnt = 0, i;
  for (i = 0; i < db.products.length && cnt < 8; i++) {
    var p = db.products[i];
    var bcMatch = p.barcode && normalizeBC(p.barcode).indexOf(normalizeBC(q)) >= 0;
    if (p.name.toLowerCase().indexOf(ql) >= 0 || bcMatch) {
      var sc = p.stock <= 0 ? '#dc2626' : p.stock <= 5 ? '#ea580c' : '#16a34a';
      html += '<div class="search-drop-item" onclick="addProdById(\'' + p.id + '\')">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        +   '<div style="width:22px;height:22px;border-radius:50%;background:#ede9fe;color:#7c3aed;'
        +       'display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">+</div>'
        +   '<div>'
        +     '<div style="font-size:12px;font-weight:600;color:inherit">' + p.name + '</div>'
        +     '<div style="font-size:10px;color:#9ca3af">'
        +       (CAT_ICONS[p.category] || '📦') + ' ' + p.category
        +     '</div>'
        +   '</div>'
        + '</div>'
        + '<div style="text-align:left">'
        +   '<div style="font-size:13px;font-weight:700;color:#7c3aed">' + fmt(p.price) + '</div>'
        +   '<div style="font-size:10px;font-weight:600;color:' + sc + '">' + p.stock + '</div>'
        + '</div>'
        + '</div>';
      cnt++;
    }
  }
  drop.innerHTML = html;
  drop.style.display = cnt ? 'block' : 'none';
}

document.addEventListener('click', function (e) {
  if (!e.target.closest('#man-search') && !e.target.closest('#search-drop')) {
    var d = $('search-drop');
    if (d) d.style.display = 'none';
  }
});

function addProdById(id) {
  for (var i = 0; i < db.products.length; i++) {
    if (db.products[i].id === id) {
      beep();
      addToCart(db.products[i]);
      scanCount++;
      $('ss-scanned').textContent = scanCount;
      break;
    }
  }
  $('man-search').value = '';
  $('search-drop').style.display = 'none';
}

function addBySearch() {
  var q = $('man-search').value.trim();
  if (!q) return;

  /* FIX: نستخدم findProductByBarcode للبحث بالباركود */
  var byBC = findProductByBarcode(q);
  if (byBC) {
    beep();
    addToCart(byBC);
    $('man-search').value = '';
    $('search-drop').style.display = 'none';
    return;
  }

  var ql = q.toLowerCase(), res = [], i;
  for (i = 0; i < db.products.length; i++) {
    if (db.products[i].name.toLowerCase().indexOf(ql) >= 0) res.push(db.products[i]);
  }

  if (res.length === 1) {
    beep();
    addToCart(res[0]);
    $('man-search').value = '';
    $('search-drop').style.display = 'none';
  } else if (!res.length) {
    pendingBC = 'MANUAL-' + Date.now();
    openNewProdModal(null, q);
  }
}

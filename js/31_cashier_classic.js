// ── js/31_cashier_classic.js ──
// ║  CLASSIC CASHIER — شبكة منتجات + جدول السلة            ║
// ═══════════════════════════════════════════════════════════

var _ccCat = '';   // القسم النشط
var _ccSelectedRow = null; // معرف المنتج المحدد في الجدول

// ── تطبيق وضع الكاشيير — الكلاسيكي الجديد دائماً ──
function applyCashierStyle(){
  var style = 'classic'; // الكاشيير الجديد هو الوحيد المستخدم
  shopSettings.cashierStyle = 'classic';
  var pg = document.getElementById('pg-cashier');
  if(!pg) return;

  if(style === 'classic'){
    pg.classList.add('classic-mode');
    renderCCCats();
    renderCCProducts();
    renderCCCart();
  } else {
    pg.classList.remove('classic-mode');
  }

  // تحديث بصريات الإعدادات
  ['classic','normal'].forEach(function(s){
    var lbl = document.getElementById('cst-lbl-'+s);
    if(lbl) lbl.style.border = '2px solid '+(s===style?'#7c3aed':'#e5e7eb');
  });
  var activeRb = document.getElementById('cst-'+style);
  if(activeRb) activeRb.checked = true;
}

// ── رسم الأقسام ──
function renderCCCats(){
  var el = document.getElementById('cc-cat-list'); if(!el) return;
  var cats = []; var seen = {};
  db.products.forEach(function(p){
    var c = p.category || 'متنوع';
    if(!seen[c]){ seen[c]=true; cats.push(c); }
  });
  var html = '<div class="cc-cat-btn'+(_ccCat===''?' cc-cat-active':'')+'" onclick="setCCCat(\'\')">⬛ الكل</div>';
  cats.forEach(function(c){
    var icon = CAT_ICONS[c] || '📦';
    html += '<div class="cc-cat-btn'+(_ccCat===c?' cc-cat-active':'')+'" onclick="setCCCat(\''+c.replace(/'/g,"\\'")+'\')">'
      + icon + '<br>' + c + '</div>';
  });
  el.innerHTML = html;
}

function setCCCat(cat){
  _ccCat = cat;
  renderCCCats();
  renderCCProducts();
}

// ── رسم شبكة المنتجات ──
function renderCCProducts(query){
  var el = document.getElementById('cc-product-grid'); if(!el) return;
  var alertLimit = shopSettings.lowStockAlert || 5;
  var prods = db.products.filter(function(p){
    if(_ccCat && p.category !== _ccCat) return false;
    if(query){
      var q = query.toLowerCase();
      if(p.name.toLowerCase().indexOf(q) < 0 &&
         !(p.barcode && p.barcode.toLowerCase().indexOf(q) >= 0)) return false;
    }
    return true;
  });
  prods.sort(function(a,b){ return a.name.localeCompare(b.name,'ar'); });
  if(!prods.length){
    el.innerHTML = '<div style="grid-column:1/-1;padding:30px;text-align:center;color:#94a3b8;font-weight:700">لا توجد منتجات</div>';
    return;
  }
  var html = '';
  prods.forEach(function(p){
    var stk = p.stock || 0;
    var cls = stk <= 0 ? ' cc-prod-out' : stk <= alertLimit ? ' cc-prod-low' : '';
    var icon = p.image
      ? '<img src="'+p.image+'" style="width:34px;height:34px;object-fit:cover;border-radius:6px;margin-bottom:2px">'
      : '<div class="cc-prod-icon">'+(CAT_ICONS[p.category]||'📦')+'</div>';
    html += '<div class="cc-prod'+cls+'" onclick="ccAddProduct(\''+p.id+'\')">'
      + '<div class="cc-prod-stock">'+stk+'</div>'
      + icon
      + '<div class="cc-prod-name">'+p.name+'</div>'
      + '<div class="cc-prod-price">'+fmt(p.price)+'</div>'
      + '</div>';
  });
  el.innerHTML = html;
}

// ── إضافة منتج للسلة من الشبكة ──
function ccAddProduct(pid){
  var p = db.products.find(function(x){ return x.id === pid; });
  if(!p) return;
  if((p.stock||0) <= 0){ toast('نفذ المخزون ❌','error'); return; }
  addToCart(p, 1);
  _ccSelectedRow = pid;
  renderCCCart();
  updateCartTotals();
  beep();
}

// ── رسم جدول السلة الكلاسيكية ──
function renderCCCart(){
  var tbody = document.getElementById('cc-cart-body'); if(!tbody) return;
  var disc = parseFloat((document.getElementById('cc-disc')||{}).value)||0;
  var tvaRate = shopSettings.tvaRate||0;
  var sub = 0;

  if(!cart.length){
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8;font-size:13px">السلة فارغة — اضغط على منتج لإضافته</td></tr>';
    updateCCDisplay(0, 0, 0, 0);
    return;
  }

  var html = '';
  cart.forEach(function(it){
    var rowTotal = it.price * it.qty;
    sub += rowTotal;
    var isActive = _ccSelectedRow === it.pid;
    html += '<tr class="'+(isActive?'cc-active-row':'')+'" onclick="ccSelectRow(\''+it.pid+'\')">'
      + '<td><div class="cc-qty-ctrl">'
        + '<button onclick="event.stopPropagation();ccChangeQty(\''+it.pid+'\',-1)">−</button>'
        + '<span>'+it.qty+'</span>'
        + '<button onclick="event.stopPropagation();ccChangeQty(\''+it.pid+'\',1)">+</button>'
      + '</div></td>'
      + '<td>'+it.name+'</td>'
      + '<td>'+it.price.toFixed(2)+'</td>'
      + '<td>'+rowTotal.toFixed(2)+'</td>'
    + '</tr>';
  });
  tbody.innerHTML = html;

  var discValid = Math.min(disc, sub);
  var afterDisc = sub - discValid;
  var tvaAmt = tvaRate > 0 ? afterDisc * tvaRate / 100 : 0;
  var total = afterDisc + tvaAmt;

  updateCCDisplay(sub, discValid, tvaAmt, total);

  // تمرير السلة للأسفل
  var wrap = document.querySelector('.cc-table-wrap');
  if(wrap) wrap.scrollTop = wrap.scrollHeight;
}

function updateCCDisplay(sub, disc, tvaAmt, total){
  var totalEl = document.getElementById('cc-total');
  var bigEl   = document.getElementById('cc-big-amount');
  var countEl = document.getElementById('cc-big-count');
  var discEl  = document.getElementById('cc-big-disc');
  var tvaEl   = document.getElementById('cc-tva-amt');

  if(totalEl) totalEl.textContent = total.toFixed(2);
  if(bigEl)   bigEl.textContent   = total > 0 ? total.toFixed(2).replace('.', ',') : '0,00';
  if(tvaEl)   tvaEl.textContent   = tvaAmt.toFixed(2) + ' دج';

  var qty = cart.reduce(function(s,i){ return s+i.qty; }, 0);
  if(countEl) countEl.textContent = cart.length ? cart.length+' صنف • '+qty+' وحدة' : 'السلة فارغة';
  if(discEl){
    if(disc > 0){
      discEl.style.display = 'block';
      discEl.textContent   = '🏷️ تخفيض −'+disc.toFixed(2)+' دج';
    } else {
      discEl.style.display = 'none';
    }
  }
}

// ── تحديد صف في الجدول ──
function ccSelectRow(pid){
  _ccSelectedRow = pid;
  renderCCCart();
}

// ── تغيير الكمية ──
function ccChangeQty(pid, delta){
  var it = cart.find(function(x){ return x.pid === pid; });
  if(!it) return;
  it.qty = Math.max(1, it.qty + delta);
  _ccSelectedRow = pid;
  renderCCCart();
  updateCartTotals();
}

// ── مزامنة خانة الخصم مع الحقول الأخرى ──
function syncCCDiscount(){
  var val = (document.getElementById('cc-disc')||{}).value || '0';
  ['disc-in','disc-in-normal'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.value !== val) el.value = val;
  });
}

// ── البحث في الكاشيير الكلاسيكي ──
function onCCSearch(q){
  if(!q){ renderCCProducts(); return; }
  var norm = normalizeBC(q);
  var byBC = db.products.find(function(p){ return p.barcode && normalizeBC(p.barcode) === norm; });
  if(byBC){ ccAddProduct(byBC.id); document.getElementById('cc-search-input').value=''; return; }
  renderCCProducts(q);
}

function onCCSearchKey(e){
  if(e.key === 'Enter'){
    var q = e.target.value.trim();
    if(!q) return;
    var norm = normalizeBC(q);
    var byBC = db.products.find(function(p){ return p.barcode && normalizeBC(p.barcode) === norm; });
    if(byBC){ ccAddProduct(byBC.id); e.target.value=''; return; }
    // أول نتيجة
    var first = db.products.find(function(p){
      if(_ccCat && p.category !== _ccCat) return false;
      return p.name.toLowerCase().indexOf(q.toLowerCase()) >= 0;
    });
    if(first){ ccAddProduct(first.id); e.target.value=''; }
  }
}

// ── تعديل الكمية للصف المحدد ──
function openCCQtyEdit(){
  if(!_ccSelectedRow){ toast('اختر منتجاً من السلة أولاً','error'); return; }
  var it = cart.find(function(x){ return x.pid === _ccSelectedRow; });
  if(!it) return;
  var newQty = parseInt(prompt('الكمية الجديدة لـ ['+it.name+']:', it.qty));
  if(isNaN(newQty) || newQty < 1){ return; }
  it.qty = newQty;
  renderCCCart();
  updateCartTotals();
}

// ── تأكيد البيع من الكاشيير الكلاسيكي ──
function ccPay(method){
  if(!cart.length){ toast('السلة فارغة ❌','error'); return; }
  // تعيين طريقة الدفع
  var pm = document.getElementById('pay-method');
  if(pm) pm.value = method;
  // مزامنة الخصم
  syncCCDiscount();
  // تعيين sel في أزرار الدفع
  document.querySelectorAll('.pay-chip').forEach(function(ch){ ch.classList.remove('sel'); });
  // للدين: نحتاج فتح نافذة التأكيد مع اختيار العميل
  if(method === 'debt'){
    populateClientsNormal();
    var ci = document.getElementById('cli-sel-wrap-n');
    if(ci) ci.style.display = 'block';
    var cw = document.getElementById('cash-change-wrap-n');
    if(cw) cw.style.display = 'none';
    var pw = document.getElementById('partial-pay-wrap-n');
    if(pw) pw.style.display = 'none';
  } else {
    var ci = document.getElementById('cli-sel-wrap-n');
    if(ci) ci.style.display = 'none';
    var cw = document.getElementById('cash-change-wrap-n');
    if(cw) cw.style.display = method==='cash'?'block':'none';
    var pw = document.getElementById('partial-pay-wrap-n');
    if(pw) pw.style.display = 'none';
  }
  openSaleConfirm();
}

// ── ربط renderCCCart بعمليات السلة الأخرى ──
var _origUpdateCartTotals = typeof updateCartTotals === 'function' ? updateCartTotals : null;
updateCartTotals = function(){
  if(_origUpdateCartTotals) _origUpdateCartTotals();
  if(document.getElementById('pg-cashier') &&
     document.getElementById('pg-cashier').classList.contains('classic-mode')){
    renderCCCart();
  }
};

// ── حفظ وقراءة إعداد الكاشيير ──
(function(){
  var _origSave = typeof saveSettings === 'function' ? saveSettings : null;
  if(_origSave){
    // سيتم الربط بعد تعريف saveSettings
  }
})();

// ── تحديث applyCashierStyle عند فتح صفحة الكاشيير ──
var _origShowPage3 = showPage;
showPage = function(id){
  _origShowPage3(id);
  if(id === 'cashier'){
    setTimeout(function(){
      applyCashierStyle();
      if((shopSettings.cashierStyle||'normal') === 'classic'){
        renderCCCats();
        renderCCProducts();
        renderCCCart();
        var inp = document.getElementById('cc-search-input');
        if(inp) setTimeout(function(){ inp.focus(); }, 150);
      }
    }, 80);
  }
  if(id === 'settings'){
    setTimeout(function(){ applyCashierStyle(); }, 50);
  }
};

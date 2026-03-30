/* ============================================================
   js/settings.js  —  إعدادات النظام
   ============================================================ */

'use strict';

function loadSettings() {
  var raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try { Object.assign(shopSettings, JSON.parse(raw)); } catch (e) {}
  }
  if (!shopSettings.dashLayout) {
    shopSettings.dashLayout = {
      stats:true, chart:true, sales:true,
      lowStock:true, quickExp:true, categories:true
    };
  }
  /* السلات المعلقة */
  var held = localStorage.getItem(HELD_CARTS_KEY);
  if (held) { try { heldCarts = JSON.parse(held); } catch (e) {} }
}

function confirmSaveSettings() {
  if (confirm('هل أنت متأكد من حفظ الإعدادات وتطبيقها فوراً؟')) {
    saveSettings();
  }
}

function saveSettings() {
  shopSettings.name            = $('set-name').value.trim()    || 'مكتبة حشايشي';
  shopSettings.address         = $('set-addr').value.trim()    || 'مركز صالح باي • الجزائر';
  shopSettings.phone           = $('set-phone').value.trim();
  shopSettings.lowStockAlert   = parseInt($('set-low').value)  || 5;
  shopSettings.receiptHeader   = $('set-r-head').value.trim();
  shopSettings.receiptFooter   = $('set-r-foot').value.trim();
  shopSettings.flexyProfitLow  = parseFloat($('set-t-low').value)  || 10;
  shopSettings.flexyProfitHigh = parseFloat($('set-t-high').value) || 20;
  shopSettings.cardProfit      = parseFloat($('set-t-card').value) || 50;
  shopSettings.darkMode        = $('set-dark').checked;
  shopSettings.categories      = tempCategories.slice();

  shopSettings.dashLayout = {
    stats     : $('dl-stats').checked,
    chart     : $('dl-chart').checked,
    sales     : $('dl-sales').checked,
    lowStock  : $('dl-lowStock').checked,
    quickExp  : $('dl-quickExp').checked,
    categories: $('dl-categories').checked
  };

  /* أسعار الطباعة */
  var ptRaw = $('set-print-types').value.split('\n');
  var newPt = [], oldIcons = {};
  (shopSettings.printTypes || []).forEach(function (pt) {
    oldIcons[pt.name.trim()] = pt.icon;
  });
  for (var i = 0; i < ptRaw.length; i++) {
    var parts = ptRaw[i].split(':');
    if (parts.length >= 2) {
      var nName = parts[0].trim();
      newPt.push({
        id   : 'pt_' + i,
        name : nName,
        price: parseFloat(parts[1]) || 0,
        icon : oldIcons[nName] || '🖨️'
      });
    }
  }
  if (newPt.length) shopSettings.printTypes = newPt;

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(shopSettings));
  applyTheme();
  populateCategories();
  initPrint();
  renderDash();
  toast('تم حفظ الإعدادات ✅', 'success');
}

function renderSettings() {
  $('set-name').value    = shopSettings.name;
  $('set-addr').value    = shopSettings.address;
  $('set-phone').value   = shopSettings.phone   || '';
  $('set-low').value     = shopSettings.lowStockAlert || 5;
  $('set-r-head').value  = shopSettings.receiptHeader || '';
  $('set-r-foot').value  = shopSettings.receiptFooter || '';
  $('set-t-low').value   = shopSettings.flexyProfitLow  || 10;
  $('set-t-high').value  = shopSettings.flexyProfitHigh || 20;
  $('set-t-card').value  = shopSettings.cardProfit       || 50;
  $('set-dark').checked  = !!shopSettings.darkMode;

  var lay = shopSettings.dashLayout;
  $('dl-stats').checked      = lay.stats;
  $('dl-chart').checked      = lay.chart;
  $('dl-sales').checked      = lay.sales;
  $('dl-lowStock').checked   = lay.lowStock;
  $('dl-quickExp').checked   = lay.quickExp;
  $('dl-categories').checked = lay.categories;

  tempCategories = (shopSettings.categories || []).slice();
  renderCategoriesUI();

  var pts = (shopSettings.printTypes || [])
    .map(function (p) { return p.name + ':' + p.price; })
    .join('\n');
  $('set-print-types').value = pts;
}

function applyTheme() {
  if (shopSettings.darkMode) {
    document.body.classList.add('dark-mode');
    if ($('set-dark')) $('set-dark').checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    if ($('set-dark')) $('set-dark').checked = false;
  }
}

/* ===== CATEGORIES UI ===== */
function renderCategoriesUI() {
  var wrap = $('cats-list-ui');
  if (!wrap) return;
  var html = '';
  tempCategories.forEach(function (c, idx) {
    html += '<div class="cat-chip"><span>' + c + '</span>' +
            '<span class="rm-btn" onclick="removeCategoryUI(' + idx + ')">✕</span></div>';
  });
  wrap.innerHTML = html || '<div style="color:#9ca3af;font-size:12px;">لا توجد أقسام</div>';
}

function addCategoryUI() {
  var v = $('new-cat-input').value.trim();
  if (!v) return;
  if (tempCategories.indexOf(v) > -1) { toast('القسم موجود مسبقاً ❌', 'error'); return; }
  tempCategories.push(v);
  $('new-cat-input').value = '';
  renderCategoriesUI();
}

function removeCategoryUI(idx) {
  tempCategories.splice(idx, 1);
  renderCategoriesUI();
}

function populateCategories() {
  var cats = shopSettings.categories || [];
  var opts = cats.map(function (c) {
    return '<option value="' + c + '">' + c + '</option>';
  }).join('');
  if ($('np-cat'))  $('np-cat').innerHTML  = opts;
  if ($('ep-cat'))  $('ep-cat').innerHTML  = opts;
  if ($('cc-cat'))  $('cc-cat').innerHTML  = opts;
  if ($('inv-cat')) $('inv-cat').innerHTML =
    '<option value="">تصفية بكل الأقسام</option>' + opts;
}

function clearAllData() {
  if (!confirm('سيتم حذف جميع البيانات المحلية نهائياً؟')) return;
  if (!confirm('تأكيد نهائي؟')) return;
  var k;
  for (k in DB_KEYS) {
    if (DB_KEYS.hasOwnProperty(k)) localStorage.removeItem(DB_KEYS[k]);
  }
  db = { products:[], sales:[], printSales:[], telecomSales:[], expenses:[], clients:[] };
  cart = []; heldCarts = [];
  localStorage.removeItem(HELD_CARTS_KEY);
  renderCartList(); updateCartTotals(); renderHeldCarts();
  toast('تم تفريغ النظام ✅', 'info');
  showPage('dashboard');
}

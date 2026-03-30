/* ============================================================
   js/dashboard.js  —  لوحة التحكم + الشارت الأسبوعي
   FIX: حذف بطاقة صافي الأرباح من الداشبورد
   ============================================================ */

'use strict';

/* ===== مبيعات N يوم الأخيرة ===== */
function getSalesForDays(days) {
  var res = {}, todayDate = new Date();
  for (var d = days - 1; d >= 0; d--) {
    var date = new Date(todayDate);
    date.setDate(date.getDate() - d);
    res[date.toISOString().slice(0, 10)] = 0;
  }
  for (var i = 0; i < db.sales.length; i++) {
    if (res[db.sales[i].dateStr] !== undefined) {
      res[db.sales[i].dateStr] += db.sales[i].total;
    }
  }
  return res;
}

/* ===== هامش الربح من المبيعات ===== */
function calcDailyMargin(salesArr) {
  var prodMap = {}, i, j;
  for (i = 0; i < db.products.length; i++) {
    prodMap[db.products[i].id] = db.products[i];
    if (db.products[i].name)
      prodMap['name:' + db.products[i].name.trim().toLowerCase()] = db.products[i];
  }
  var margin = 0;
  for (i = 0; i < salesArr.length; i++) {
    for (j = 0; j < salesArr[i].items.length; j++) {
      var item = salesArr[i].items[j];
      var prod = null;
      if (item.pid)  prod = prodMap[item.pid];
      if (!prod && item.name) prod = prodMap['name:' + item.name.trim().toLowerCase()];
      var cost = prod ? (prod.cost || 0) : 0;
      margin += (item.price - cost) * item.qty;
    }
  }
  return margin;
}

/* ===== شارت الداشبورد (Bar بـ Canvas بدون مكتبة) ===== */
function drawDashboardChart(labels, vals) {
  var cardEl = $('dash-card-chart');
  if (cardEl && cardEl.style.display === 'none') return;

  var canvas = $('dash-mini-chart');
  if (!canvas) return;

  /* ضبط العرض الفعلي */
  canvas.width  = canvas.parentElement.clientWidth || 400;
  canvas.height = 130;

  var ctx = canvas.getContext('2d');
  drawBarChart(ctx, canvas.width, canvas.height, labels, vals, '#7c3aed');
}

/*
 * drawBarChart — شارت عمودي احترافي بـ Canvas
 * بدون مكتبات خارجية، يدعم القيم الصفرية
 */
function drawBarChart(ctx, W, H, labels, vals, color) {
  ctx.clearRect(0, 0, W, H);

  var n = labels.length;
  if (!n) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('لا توجد بيانات', W / 2, H / 2);
    return;
  }

  var max     = Math.max.apply(null, vals) || 1;
  var padL    = 8, padR = 8, padT = 20, padB = 28;
  var areaW   = W - padL - padR;
  var areaH   = H - padT - padB;
  var barW    = (areaW / n) * 0.6;
  var gap     = (areaW / n) * 0.4;
  var isDark  = document.body.classList.contains('dark-mode');

  /* خلفية ناعمة */
  ctx.fillStyle = isDark ? 'rgba(30,41,59,0.5)' : 'rgba(248,250,252,0.8)';
  ctx.fillRect(0, 0, W, H);

  /* خطوط أفقية خفية */
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  ctx.lineWidth   = 1;
  for (var g = 0; g <= 4; g++) {
    var y = padT + (areaH / 4) * g;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  }

  /* الأعمدة */
  for (var i = 0; i < n; i++) {
    var bH    = vals[i] > 0 ? Math.max(4, (vals[i] / max) * areaH) : 4;
    var x     = padL + i * (barW + gap) + gap / 2;
    var y0    = H - padB - bH;
    var isToday = (i === n - 1);

    /* تدرج اللون */
    var grad = ctx.createLinearGradient(x, y0, x, H - padB);
    grad.addColorStop(0, isToday ? color : color + 'bb');
    grad.addColorStop(1, isToday ? color + '44' : color + '22');
    ctx.fillStyle = grad;

    /* عمود مدوّر الأعلى */
    var r = Math.min(6, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y0);
    ctx.lineTo(x + barW - r, y0);
    ctx.quadraticCurveTo(x + barW, y0,     x + barW, y0 + r);
    ctx.lineTo(x + barW, H - padB);
    ctx.lineTo(x,        H - padB);
    ctx.lineTo(x,        y0 + r);
    ctx.quadraticCurveTo(x, y0, x + r, y0);
    ctx.fill();

    /* ظل خفيف */
    if (isToday) {
      ctx.shadowColor   = color + '55';
      ctx.shadowBlur    = 8;
      ctx.fill();
      ctx.shadowBlur    = 0;
      ctx.shadowColor   = 'transparent';
    }

    /* التسمية (MM/DD) */
    ctx.fillStyle  = isDark ? '#94a3b8' : '#9ca3af';
    ctx.font       = '9px Segoe UI';
    ctx.textAlign  = 'center';
    ctx.fillText(labels[i].slice(5).replace('-', '/'), x + barW / 2, H - 8);

    /* القيمة فوق العمود */
    if (vals[i] > 0) {
      ctx.fillStyle = isDark ? '#e2e8f0' : (isToday ? color : '#475569');
      ctx.font      = 'bold 9px Tahoma';
      var valStr    = vals[i] >= 1000
        ? (vals[i] / 1000).toFixed(1) + 'k'
        : vals[i].toLocaleString('ar-DZ');
      ctx.fillText(valStr, x + barW / 2, y0 - 4);
    }
  }
}

/* ===== RENDER DASHBOARD ===== */
function renderDash() {
  var td = today(), tm = today().slice(0, 7);
  var todaySales = [], monthSales = [], i;
  var weekData   = getSalesForDays(7);
  var weekRev    = 0, weekSalesCount = 0;
  var weekKeys   = Object.keys(weekData);
  weekKeys.forEach(function (k) { weekRev += weekData[k]; });

  for (i = 0; i < db.sales.length; i++) {
    if (weekData[db.sales[i].dateStr] !== undefined) weekSalesCount++;
    if (db.sales[i].dateStr === td) todaySales.push(db.sales[i]);
    if (db.sales[i].dateStr && db.sales[i].dateStr.indexOf(tm) === 0) monthSales.push(db.sales[i]);
  }

  var todayRev = 0, monthRev = 0, todayExp = 0;
  var telP = 0, printP = 0, telRch = 0, telCard = 0;

  for (i = 0; i < todaySales.length;  i++) todayRev += todaySales[i].total;
  for (i = 0; i < monthSales.length;  i++) monthRev += monthSales[i].total;
  for (i = 0; i < db.expenses.length; i++) {
    if (db.expenses[i].date === td) todayExp += db.expenses[i].amount;
  }
  for (i = 0; i < db.telecomSales.length; i++) {
    if (db.telecomSales[i].dateStr === td) {
      if (db.telecomSales[i].type === 'recharge') telRch  += db.telecomSales[i].profit;
      else                                         telCard += db.telecomSales[i].profit;
      telP += db.telecomSales[i].profit;
    }
  }
  for (i = 0; i < db.printSales.length; i++) {
    if (db.printSales[i].dateStr === td) printP += db.printSales[i].total;
  }

  var dailyMargin = calcDailyMargin(todaySales);
  var netToday    = todayRev + telP + printP - todayExp;

  /* === الصف الرئيسي: 4 بطاقات (بدون صافي الأرباح) === */
  $('dash-stats').innerHTML =
    '<div class="stat-card s-green">'
    +   '<div class="stat-icon">💰</div>'
    +   '<div class="stat-label">مبيعات اليوم</div>'
    +   '<div class="stat-val">' + fmt(todayRev) + '</div>'
    +   '<div class="stat-change" style="color:#16a34a">' + todaySales.length + ' عملية</div>'
    + '</div>'
    + '<div class="stat-card s-blue">'
    +   '<div class="stat-icon">📆</div>'
    +   '<div class="stat-label">مبيعات الأسبوع</div>'
    +   '<div class="stat-val">' + fmt(weekRev) + '</div>'
    +   '<div class="stat-change" style="color:#3b82f6">' + weekSalesCount + ' عملية</div>'
    + '</div>'
    + '<div class="stat-card s-purple">'
    +   '<div class="stat-icon">📅</div>'
    +   '<div class="stat-label">مبيعات الشهر</div>'
    +   '<div class="stat-val">' + fmt(monthRev) + '</div>'
    +   '<div class="stat-change" style="color:#7c3aed">' + monthSales.length + ' فاتورة</div>'
    + '</div>'
    + '<div class="stat-card s-orange">'
    +   '<div class="stat-icon">💸</div>'
    +   '<div class="stat-label">مصاريف اليوم</div>'
    +   '<div class="stat-val">' + fmt(todayExp) + '</div>'
    +   '<div class="stat-change" style="color:#f59e0b">صافي: ' + fmt(netToday) + '</div>'
    + '</div>';

  /* === الصف الثاني: 5 بطاقات أرباح ===
     FIX: بطاقة "صافي الأرباح عن الفترة" محذوفة من هنا أيضاً */
  $('dash-profit-row').innerHTML =
    '<div class="stat-card s-lime">'
    +   '<div class="stat-icon">💹</div>'
    +   '<div class="stat-label">هامش ربح المبيعات</div>'
    +   '<div class="stat-val" style="font-size:16px;color:#65a30d">' + fmt(dailyMargin) + '</div>'
    + '</div>'
    + '<div class="stat-card s-blue">'
    +   '<div class="stat-icon">🖨️</div>'
    +   '<div class="stat-label">أرباح الطباعة</div>'
    +   '<div class="stat-val" style="font-size:16px">' + fmt(printP) + '</div>'
    + '</div>'
    + '<div class="stat-card s-purple">'
    +   '<div class="stat-icon">📶</div>'
    +   '<div class="stat-label">أرباح الشحن</div>'
    +   '<div class="stat-val" style="font-size:16px">' + fmt(telRch) + '</div>'
    + '</div>'
    + '<div class="stat-card s-green">'
    +   '<div class="stat-icon">🃏</div>'
    +   '<div class="stat-label">أرباح البطاقات</div>'
    +   '<div class="stat-val" style="font-size:16px">' + fmt(telCard) + '</div>'
    + '</div>'
    + '<div class="stat-card s-teal">'
    +   '<div class="stat-icon">📈</div>'
    +   '<div class="stat-label">إجمالي الخدمات</div>'
    +   '<div class="stat-val" style="font-size:16px;color:#14b8a6">' + fmt(telP + printP) + '</div>'
    + '</div>';

  /* === آخر المبيعات === */
  var rH = '';
  var mm       = { cash:'💵', card:'💳', debt:'📝' };
  var mColor   = { cash:'#dcfce7', card:'#dbeafe', debt:'#fee2e2' };
  var mTxtColor= { cash:'#16a34a', card:'#2563eb', debt:'#dc2626' };
  var rSlice   = todaySales.slice().reverse().slice(0, 6);
  for (i = 0; i < rSlice.length; i++) {
    var s     = rSlice[i];
    var names = truncateItems(s.items, 2);
    rH += '<div class="sale-row">'
      + '<div class="sale-method-dot" style="background:' + (mColor[s.method] || '#f4f6fb') + '">'
      +   '<span style="color:' + (mTxtColor[s.method] || '#374151') + '">' + (mm[s.method] || '💵') + '</span>'
      + '</div>'
      + '<div class="sale-info">'
      +   '<div class="sale-name" title="' + s.items.map(function (it) { return it.name; }).join('، ') + '">' + names + '</div>'
      +   '<div class="sale-time">' + s.date + '</div>'
      + '</div>'
      + '<div class="sale-amt">' + fmt(s.total) + '</div>'
      + '</div>';
  }
  $('dash-recent').innerHTML = rH ||
    '<div style="text-align:center;color:#9ca3af;padding:20px;font-size:12px">لا توجد مبيعات اليوم</div>';
  $('dash-sales-sub').textContent = todaySales.length + ' عملية — ' + fmt(todayRev);

  /* === الأقسام === */
  var cats = {}, k;
  for (i = 0; i < db.products.length; i++) {
    var cat = db.products[i].category || 'متنوع';
    cats[cat] = (cats[cat] || 0) + 1;
  }
  var cH = '';
  for (k in cats) {
    if (cats.hasOwnProperty(k)) {
      cH += '<div style="display:flex;align-items:center;justify-content:space-between;'
          + 'padding:9px 10px;border-radius:10px;background:#f9fafb;margin-bottom:6px;'
          + 'border:1px solid #f0f2f8">'
          + '<div style="display:flex;align-items:center;gap:8px;font-weight:700">'
          +   '<span>' + (CAT_ICONS[k] || '📦') + '</span><span>' + k + '</span>'
          + '</div>'
          + '<div style="font-size:11px;color:#7c3aed;font-weight:700;background:#ede9fe;'
          +   'padding:3px 9px;border-radius:8px">' + cats[k] + ' صنف</div>'
          + '</div>';
    }
  }
  $('dash-cats').innerHTML = cH ||
    '<div style="color:#9ca3af;font-size:12px;padding:10px">لا توجد منتجات</div>';

  /* === المخزون المنخفض === */
  var threshold = shopSettings.lowStockAlert || 5;
  var low = db.products
    .filter(function (p) { return p.stock <= threshold; })
    .sort(function (a, b) { return a.stock - b.stock; })
    .slice(0, 5);
  var lH = '';
  for (i = 0; i < low.length; i++) {
    lH += '<div class="low-item">'
      + '<div>'
      +   '<div style="font-weight:700;font-size:13px">' + low[i].name + '</div>'
      +   '<div style="font-size:10px;color:#9ca3af">' + low[i].category + '</div>'
      + '</div>'
      + '<span class="tag ' + (low[i].stock <= 0 ? 'tr' : 'to') + '">'
      +   (low[i].stock <= 0 ? 'نفذ ⚠️' : low[i].stock + ' متبقي')
      + '</span>'
      + '</div>';
  }
  $('dash-low').innerHTML = lH ||
    '<div style="text-align:center;color:#16a34a;padding:14px;font-size:12px;font-weight:700">✅ كل المخزون جيد</div>';

  /* === Sparkline + شارت الداشبورد === */
  renderSidebarSparkline();
  drawDashboardChart(weekKeys, weekKeys.map(function (k2) { return weekData[k2]; }));
  applyDashboardLayout();
}

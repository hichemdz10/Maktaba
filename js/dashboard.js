/* ============================================================
   js/dashboard.js  —  لوحة التحكم
   شارت انسيابي + بطاقات متناسقة + ترتيب ذكي للمخزون المنتهي
   ============================================================ */

'use strict';

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

function calcDailyMargin(salesArr) {
  var prodMap = {}, i, j;
  for (i = 0; i < db.products.length; i++) {
    prodMap[db.products[i].id] = db.products[i];
    if (db.products[i].name) prodMap['name:' + db.products[i].name.trim().toLowerCase()] = db.products[i];
  }
  var margin = 0;
  for (i = 0; i < salesArr.length; i++) {
    for (j = 0; j < salesArr[i].items.length; j++) {
      var item = salesArr[i].items[j];
      var prod = prodMap[item.pid] || prodMap['name:' + item.name.trim().toLowerCase()];
      var cost = prod ? (prod.cost || 0) : 0;
      margin += (item.price - cost) * item.qty;
    }
  }
  return margin;
}

/* شارت خطي انسيابي متدرج (Smooth Line Chart) */
function drawSmoothLineChart(ctx, W, H, labels, vals, colorHex) {
  ctx.clearRect(0, 0, W, H);
  var n = labels.length;
  if (!n) return;

  var max = Math.max.apply(null, vals) || 1;
  var padX = 20, padT = 30, padB = 25;
  var areaW = W - padX * 2;
  var areaH = H - padT - padB;
  
  var isDark = document.body.classList.contains('dark-mode');
  
  // رسم الشبكة الأفقية
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 3; i++) {
    var yy = padT + (areaH / 3) * i;
    ctx.beginPath(); ctx.moveTo(padX, yy); ctx.lineTo(W - padX, yy); ctx.stroke();
  }

  // حساب النقاط
  var pts = [];
  for (var i = 0; i < n; i++) {
    var x = padX + (areaW / (n - 1)) * i;
    var y = padT + areaH - (vals[i] / max) * areaH;
    pts.push({x: x, y: y});
  }

  // التدرج اللوني تحت المنحنى
  var grad = ctx.createLinearGradient(0, padT, 0, H - padB);
  grad.addColorStop(0, colorHex + '88'); // نصف شفاف
  grad.addColorStop(1, colorHex + '00'); // شفاف بالكامل

  // رسم المساحة المعبأة (Fill)
  ctx.beginPath();
  ctx.moveTo(pts[0].x, H - padB);
  ctx.lineTo(pts[0].x, pts[0].y);
  for (var i = 0; i < n - 1; i++) {
    var xc = (pts[i].x + pts[i+1].x) / 2;
    var yc = (pts[i].y + pts[i+1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.quadraticCurveTo(pts[n-1].x, pts[n-1].y, pts[n-1].x, pts[n-1].y);
  ctx.lineTo(pts[n-1].x, H - padB);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // رسم الخط الانسيابي (Line)
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (var i = 0; i < n - 1; i++) {
    var xc = (pts[i].x + pts[i+1].x) / 2;
    var yc = (pts[i].y + pts[i+1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.quadraticCurveTo(pts[n-1].x, pts[n-1].y, pts[n-1].x, pts[n-1].y);
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // رسم النقاط والتواريخ فوقها
  for (var i = 0; i < n; i++) {
    var isToday = (i === n - 1);
    
    // الدائرة
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, isToday ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#1e293b' : '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colorHex;
    ctx.stroke();

    // التاريخ بالأسفل
    ctx.fillStyle = isDark ? '#94a3b8' : '#9ca3af';
    ctx.font = '9px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i].slice(5).replace('-','/'), pts[i].x, H - 8);

    // القيمة بالأعلى
    if (vals[i] > 0 || isToday) {
      ctx.fillStyle = isDark ? '#f8fafc' : '#1e1b4b';
      ctx.font = isToday ? 'bold 11px Tahoma' : 'bold 9px Tahoma';
      var vStr = vals[i] >= 1000 ? (vals[i]/1000).toFixed(1)+'k' : vals[i];
      ctx.fillText(vStr, pts[i].x, pts[i].y - 12);
    }
  }
}

function renderDash() {
  var td = today(), tm = today().slice(0, 7);
  var todaySales = [], monthSales = [], i;
  var weekData = getSalesForDays(7);
  var weekRev = 0, weekSalesCount = 0;
  var weekKeys = Object.keys(weekData);
  weekKeys.forEach(function (k) { weekRev += weekData[k]; });

  for (i = 0; i < db.sales.length; i++) {
    if (weekData[db.sales[i].dateStr] !== undefined) weekSalesCount++;
    if (db.sales[i].dateStr === td) todaySales.push(db.sales[i]);
    if (db.sales[i].dateStr && db.sales[i].dateStr.indexOf(tm) === 0) monthSales.push(db.sales[i]);
  }

  var todayRev = 0, monthRev = 0, todayExp = 0;
  var telP = 0, printP = 0, telRch = 0, telCard = 0;

  for (i = 0; i < todaySales.length; i++) todayRev += todaySales[i].total;
  for (i = 0; i < monthSales.length; i++) monthRev += monthSales[i].total;
  for (i = 0; i < db.expenses.length; i++) { if (db.expenses[i].date === td) todayExp += db.expenses[i].amount; }
  for (i = 0; i < db.telecomSales.length; i++) {
    if (db.telecomSales[i].dateStr === td) {
      if (db.telecomSales[i].type === 'recharge') telRch += db.telecomSales[i].profit;
      else telCard += db.telecomSales[i].profit;
      telP += db.telecomSales[i].profit;
    }
  }
  for (i = 0; i < db.printSales.length; i++) { if (db.printSales[i].dateStr === td) printP += db.printSales[i].total; }

  var dailyMargin = calcDailyMargin(todaySales);
  var netToday = todayRev + telP + printP - todayExp;

  $('dash-stats').innerHTML =
    '<div class="stat-card s-green"><div class="stat-icon">💰</div><div class="stat-label">مبيعات اليوم</div><div class="stat-val">' + fmt(todayRev) + '</div><div class="stat-change" style="color:#16a34a">' + todaySales.length + ' عملية</div></div>' +
    '<div class="stat-card s-blue"><div class="stat-icon">📆</div><div class="stat-label">مبيعات الأسبوع</div><div class="stat-val">' + fmt(weekRev) + '</div><div class="stat-change" style="color:#3b82f6">' + weekSalesCount + ' عملية</div></div>' +
    '<div class="stat-card s-purple"><div class="stat-icon">📅</div><div class="stat-label">مبيعات الشهر</div><div class="stat-val">' + fmt(monthRev) + '</div><div class="stat-change" style="color:#7c3aed">' + monthSales.length + ' فاتورة</div></div>' +
    '<div class="stat-card s-orange"><div class="stat-icon">💸</div><div class="stat-label">مصاريف اليوم</div><div class="stat-val">' + fmt(todayExp) + '</div><div class="stat-change" style="color:#f59e0b">صافي: ' + fmt(netToday) + '</div></div>';

  $('dash-profit-row').innerHTML =
    '<div class="stat-card s-lime"><div class="stat-icon">💹</div><div class="stat-label">هامش المبيعات</div><div class="stat-val" style="font-size:17px;color:#65a30d">' + fmt(dailyMargin) + '</div></div>' +
    '<div class="stat-card s-blue"><div class="stat-icon">🖨️</div><div class="stat-label">أرباح الطباعة</div><div class="stat-val" style="font-size:17px">' + fmt(printP) + '</div></div>' +
    '<div class="stat-card s-purple"><div class="stat-icon">📶</div><div class="stat-label">أرباح الشحن</div><div class="stat-val" style="font-size:17px">' + fmt(telRch) + '</div></div>' +
    '<div class="stat-card s-green"><div class="stat-icon">🃏</div><div class="stat-label">أرباح البطاقات</div><div class="stat-val" style="font-size:17px">' + fmt(telCard) + '</div></div>' +
    '<div class="stat-card s-teal"><div class="stat-icon">📈</div><div class="stat-label">إجمالي الخدمات</div><div class="stat-val" style="font-size:17px;color:#14b8a6">' + fmt(telP + printP) + '</div></div>';

  var rH = '', mm = { cash:'💵', card:'💳', debt:'📝' }, mColor = { cash:'#dcfce7', card:'#dbeafe', debt:'#fee2e2' }, mTxtColor = { cash:'#16a34a', card:'#2563eb', debt:'#dc2626' };
  var rSlice = todaySales.slice().reverse().slice(0, 6);
  for (i = 0; i < rSlice.length; i++) {
    var s = rSlice[i];
    rH += '<div class="sale-row"><div class="sale-method-dot" style="background:' + (mColor[s.method]||'#f4f6fb') + '"><span style="color:' + (mTxtColor[s.method]||'#374151') + '">' + (mm[s.method]||'💵') + '</span></div><div class="sale-info"><div class="sale-name">' + truncateItems(s.items,2) + '</div><div class="sale-time">' + s.date + '</div></div><div class="sale-amt">' + fmt(s.total) + '</div></div>';
  }
  $('dash-recent').innerHTML = rH || '<div style="text-align:center;color:#9ca3af;padding:20px;font-size:12px">لا توجد مبيعات اليوم</div>';
  if($('dash-sales-sub')) $('dash-sales-sub').textContent = todaySales.length + ' عملية — ' + fmt(todayRev);

  var cats = {}, k, cH = '';
  for (i = 0; i < db.products.length; i++) { var cat = db.products[i].category || 'متنوع'; cats[cat] = (cats[cat] || 0) + 1; }
  for (k in cats) {
    cH += '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border-radius:10px;background:#f9fafb;margin-bottom:6px;border:1px solid #f0f2f8"><div style="display:flex;align-items:center;gap:8px;font-weight:700"><span>' + (CAT_ICONS[k]||'📦') + '</span><span>' + k + '</span></div><div style="font-size:11px;color:#7c3aed;font-weight:700;background:#ede9fe;padding:3px 9px;border-radius:8px">' + cats[k] + ' صنف</div></div>';
  }
  $('dash-cats').innerHTML = cH || '<div style="color:#9ca3af;font-size:12px;padding:10px">لا توجد منتجات</div>';

  /* ترتيب الذكي: المنتجات المنتهية تماما (0) تظهر في الأعلى */
  var threshold = shopSettings.lowStockAlert || 5;
  var low = db.products
    .filter(function (p) { return p.stock <= threshold; })
    .sort(function (a, b) {
      if (a.stock <= 0 && b.stock > 0) return -1;
      if (b.stock <= 0 && a.stock > 0) return 1;
      return a.stock - b.stock;
    })
    .slice(0, 5);
    
  var lH = '';
  for (i = 0; i < low.length; i++) {
    lH += '<div class="low-item"><div><div style="font-weight:800;font-size:13px">' + low[i].name + '</div><div style="font-size:10px;color:#9ca3af">' + low[i].category + '</div></div><span class="tag ' + (low[i].stock <= 0 ? 'tr' : 'to') + '">' + (low[i].stock <= 0 ? 'نفذ تماماً ⚠️' : low[i].stock + ' متبقي') + '</span></div>';
  }
  $('dash-low').innerHTML = lH || '<div style="text-align:center;color:#16a34a;padding:14px;font-size:13px;font-weight:800">✅ المخزون ممتاز</div>';

  renderSidebarSparkline();
  var cv = $('dash-mini-chart');
  if (cv) {
    cv.width = cv.parentElement.clientWidth || 400;
    cv.height = 150;
    drawSmoothLineChart(cv.getContext('2d'), cv.width, cv.height, weekKeys, weekKeys.map(function(k){return weekData[k];}), '#7c3aed');
  }
  applyDashboardLayout();
}

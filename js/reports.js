/* ============================================================
   js/reports.js  —  التقارير
   ============================================================ */

'use strict';

function setPeriod(p) {
  var from = new Date(), to = new Date();
  if (p === 'week')  { from.setDate(from.getDate() - 6); }
  if (p === 'month') { from.setDate(1); }
  $('rep-from').value = from.toISOString().slice(0, 10);
  $('rep-to').value   = to.toISOString().slice(0, 10);
  genReport();
}

function genReport() {
  var from = $('rep-from').value || today();
  var to   = $('rep-to').value   || today();

  var sales = [], tel = [], print = [], exp = [], i;
  for (i = 0; i < db.sales.length; i++) { if (db.sales[i].dateStr >= from && db.sales[i].dateStr <= to) sales.push(db.sales[i]); }
  for (i = 0; i < db.telecomSales.length; i++) { if (db.telecomSales[i].dateStr >= from && db.telecomSales[i].dateStr <= to) tel.push(db.telecomSales[i]); }
  for (i = 0; i < db.printSales.length; i++) { if (db.printSales[i].dateStr >= from && db.printSales[i].dateStr <= to) print.push(db.printSales[i]); }
  for (i = 0; i < db.expenses.length; i++) { if (db.expenses[i].date >= from && db.expenses[i].date <= to) exp.push(db.expenses[i]); }

  var rev = 0, telP = 0, printP = 0, expT = 0;
  for (i = 0; i < sales.length; i++) rev += sales[i].total;
  for (i = 0; i < tel.length; i++) telP += tel[i].profit;
  for (i = 0; i < print.length; i++) printP += print[i].total;
  for (i = 0; i < exp.length; i++) expT += exp[i].amount;

  $('rep-stats').innerHTML =
    '<div class="stat-card s-green"><div class="stat-icon">💰</div><div class="stat-label">إجمالي المبيعات</div><div class="stat-val" style="font-size:18px">' + fmt(rev) + '</div><div class="stat-change" style="color:#16a34a">' + sales.length + ' فاتورة</div></div>' +
    '<div class="stat-card s-blue"><div class="stat-icon">📱</div><div class="stat-label">أرباح الخدمات</div><div class="stat-val" style="font-size:18px">' + fmt(telP + printP) + '</div><div class="stat-change" style="color:#3b82f6">طباعة + فليكسي</div></div>' +
    '<div class="stat-card s-orange"><div class="stat-icon">💸</div><div class="stat-label">المصاريف</div><div class="stat-val" style="font-size:18px">' + fmt(expT) + '</div><div class="stat-change" style="color:#f59e0b">صافي: ' + fmt(rev + telP + printP - expT) + '</div></div>';

  var sH = '';
  if (sales.length) {
    sH = '<table><thead><tr><th>التاريخ</th><th>المنتجات</th><th>الدفع</th><th>المبلغ</th></tr></thead><tbody>';
    var mm2 = { cash:'💵 نقداً', card:'💳 بطاقة', debt:'📝 دين' };
    for (i = sales.length - 1; i >= 0; i--) {
      var s = sales[i];
      sH += '<tr><td style="font-size:10px;color:#64748b">' + s.date + '</td><td style="font-size:12px;font-weight:700">' + truncateItems(s.items, 3) + '</td><td>' + (mm2[s.method]||s.method) + '</td><td style="font-weight:800;color:#7c3aed">' + fmt(s.total) + '</td></tr>';
    }
    sH += '</tbody></table>';
  } else { sH = '<div style="color:#9ca3af;padding:16px">لا توجد مبيعات</div>'; }
  $('rep-sales').innerHTML = sH;

  var rP = 0, cP = 0, rC = 0, cC = 0;
  for (i = 0; i < tel.length; i++) { if (tel[i].type === 'recharge') { rP += tel[i].profit; rC++; } else { cP += tel[i].profit; cC++; } }
  $('rep-tel').innerHTML = tel.length ? '<div style="padding:10px;background:#f5f3ff;border-radius:10px;margin-bottom:8px">فليكسي: ' + rC + ' — ربح: <strong style="color:#7c3aed">' + fmt(rP) + '</strong></div><div style="padding:10px;background:#f0fdf4;border-radius:10px">بطاقات: ' + cC + ' — ربح: <strong style="color:#16a34a">' + fmt(cP) + '</strong></div>' : '<div style="color:#9ca3af">لا توجد عمليات</div>';
  $('rep-print').innerHTML = print.length ? '<div style="padding:12px;background:#ede9fe;border-radius:10px">عمليات: <strong>' + print.length + '</strong><br>ربح: <strong style="color:#7c3aed;font-size:16px">' + fmt(printP) + '</strong></div>' : '<div style="color:#9ca3af">لا توجد عمليات</div>';

  setTimeout(function () { drawReportCharts(sales, rev, telP, printP); }, 60);
}

function drawReportCharts(salesData, rev, telP, printP) {
  var dayMap = {};
  for (var i = 0; i < salesData.length; i++) { dayMap[salesData[i].dateStr] = (dayMap[salesData[i].dateStr] || 0) + salesData[i].total; }
  var labels = Object.keys(dayMap).sort();
  var vals   = labels.map(function (l) { return dayMap[l]; });

  var cvSales = $('chart-sales');
  if (cvSales) {
    cvSales.width = cvSales.parentElement.clientWidth || 400;
    cvSales.height = 200;
    // تم استخدام الشارت الخطي الانسيابي الجديد هنا بدلاً من الأعمدة
    drawSmoothLineChart(cvSales.getContext('2d'), cvSales.width, cvSales.height, labels, vals, '#7c3aed');
  }

  var cvPie = $('chart-pie');
  if (cvPie) {
    cvPie.width = cvPie.parentElement.clientWidth || 400;
    cvPie.height = 200;
    drawDonutChart(cvPie.getContext('2d'), cvPie.width, cvPie.height, ['مبيعات', 'طباعة', 'فليكسي'], [rev, printP, telP], ['#7c3aed', '#3b82f6', '#16a34a']);
  }
}

// أبقيت على الدونات الرائع كما هو في الكود السابق...
function drawDonutChart(ctx, W, H, labels, vals, colors) {
  ctx.clearRect(0, 0, W, H);
  var total = 0, i;
  for (i = 0; i < vals.length; i++) total += vals[i];
  if (!total) { ctx.fillStyle = '#9ca3af'; ctx.font = '13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('لا توجد بيانات', W / 2, H / 2); return; }
  var isDark = document.body.classList.contains('dark-mode'), cx = H / 2, cy = H / 2, outerR = H / 2 - 12, innerR = outerR * 0.55, start = -Math.PI / 2;
  for (i = 0; i < vals.length; i++) {
    if (!vals[i]) continue;
    var slice = (vals[i] / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, outerR, start, start + slice); ctx.closePath();
    ctx.fillStyle = colors[i]; ctx.fill(); ctx.strokeStyle = isDark ? '#0f172a' : '#fff'; ctx.lineWidth = 3; ctx.stroke();
    start += slice;
  }
  ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2); ctx.fillStyle = isDark ? '#1e293b' : '#fff'; ctx.fill();
  ctx.fillStyle = isDark ? '#f8fafc' : '#1e1b4b'; ctx.font = 'bold 11px Tahoma'; ctx.textAlign = 'center'; ctx.fillText('الإجمالي', cx, cy - 7);
  ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 10px Tahoma'; ctx.fillText(total.toLocaleString('ar-DZ'), cx, cy + 8);
  var lx = H + 16, ly = 28;
  for (i = 0; i < labels.length; i++) {
    if (!vals[i]) continue;
    var pct = ((vals[i] / total) * 100).toFixed(1) + '%';
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, ly - 10, 13, 13, 3) : ctx.rect(lx, ly - 10, 13, 13); ctx.fill();
    ctx.fillStyle = isDark ? '#cbd5e1' : '#374151'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(labels[i] + ' — ' + pct, lx + 18, ly);
    ctx.fillStyle = colors[i]; ctx.font = 'bold 11px Tahoma'; ctx.fillText(fmt(vals[i]), lx + 18, ly + 14);
    ly += 36;
  }
}

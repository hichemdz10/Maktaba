// ── js/21_reports.js ──
// ║  Reports                                                 ║
// ═══════════════════════════════════════════════════════════
function setPeriod(p){
  var now = new Date(); var from = today(), to = today();
  if(p==='week'){ var d = new Date(); d.setDate(d.getDate()-7); from = d.toISOString().slice(0,10); }
  else if(p==='month'){ var m = new Date(); m.setMonth(m.getMonth()-1); from = m.toISOString().slice(0,10); }
  $('rep-from').value = from; $('rep-to').value = to; genReport();
}
function genReport(){
  var from = $('rep-from').value || today(), to = $('rep-to').value || today();
  var sales = db.sales.filter(function(s){ return s.dateStr>=from && s.dateStr<=to; });
  var returns = db.returns.filter(function(r){ return r.dateStr>=from && r.dateStr<=to; });
  var tel = db.telecomSales.filter(function(t){ return t.dateStr>=from && t.dateStr<=to; });
  var print = db.printSales.filter(function(p){ return p.dateStr>=from && p.dateStr<=to; });
  var exp = db.expenses.filter(function(e){ return e.date>=from && e.date<=to; });
  var rev = 0, margin = calcDailyMargin(sales, returns), telP = 0, printP = 0, expT = 0, retT=0;
  sales.forEach(function(s){ rev += s.total; });
  tel.forEach(function(t){ telP += t.profit||0; });
  print.forEach(function(p){ printP += p.total||0; });
  exp.forEach(function(e){ expT += e.amount||0; });
  returns.forEach(function(r){ retT += r.amount||0; });
  var net = margin + telP + printP - expT;

  // ── صافي التدفق النقدي
  var cashIn = 0, cardIn = 0, debtIn = 0;
  sales.forEach(function(s){ if(s.method==='cash')cashIn+=s.total; else if(s.method==='card')cardIn+=s.total; else debtIn+=s.total; });
  var clientPaymentsIn = 0;
  db.clients.forEach(function(c){ (c.payments||[]).forEach(function(p){ if(p.dateStr&&p.dateStr>=from&&p.dateStr<=to) clientPaymentsIn+=(p.amount||0); }); });
  var cashFlow = cashIn + cardIn + clientPaymentsIn - expT;

  var statsHtml = '<div class="dash-combo-card dcc-green"><div class="dcc-top"><div class="dcc-label">المبيعات</div><div class="dcc-val">'+fmt(rev)+'</div></div></div>'+
    '<div class="dash-combo-card dcc-blue"><div class="dcc-top"><div class="dcc-label">هامش الربح</div><div class="dcc-val">'+fmt(margin)+'</div></div></div>'+
    '<div class="dash-combo-card dcc-purple"><div class="dcc-top"><div class="dcc-label">صافي الفترة</div><div class="dcc-val" style="color:'+(net>=0?'#16a34a':'#dc2626')+'">'+fmt(net)+'</div></div></div>';
  if($('rep-stats')) $('rep-stats').innerHTML = statsHtml;

  // ── قيمة المخزون الحالية
  var stockVal=0, stockCost=0, stockItems=0;
  db.products.forEach(function(p){ var s=p.stock||0; stockVal+=s*(p.price||0); stockCost+=s*(p.cost||0); stockItems+=s; });
  var invHtml='<div class="dash-combo-card dcc-teal"><div class="dcc-top"><div class="dcc-icon">📦</div><div class="dcc-label">قيمة المخزون (بيع)</div><div class="dcc-val" style="color:#0d9488">'+fmt(stockVal)+'</div><div class="dcc-sub">'+stockItems+' وحدة / '+db.products.length+' صنف</div></div></div>'+
    '<div class="dash-combo-card dcc-blue"><div class="dcc-top"><div class="dcc-icon">💰</div><div class="dcc-label">تكلفة المخزون (شراء)</div><div class="dcc-val">'+fmt(stockCost)+'</div><div class="dcc-sub">هامش محتمل: '+fmt(stockVal-stockCost)+'</div></div></div>'+
    '<div class="dash-combo-card dcc-orange"><div class="dcc-top"><div class="dcc-icon">💧</div><div class="dcc-label">التدفق النقدي (الفترة)</div><div class="dcc-val" style="color:'+(cashFlow>=0?'#16a34a':'#dc2626')+'">'+fmt(cashFlow)+'</div><div class="dcc-sub">نقد+بطاقة−مصاريف</div></div></div>';
  if($('rep-inv-val')) $('rep-inv-val').innerHTML=invHtml;

  // ── مبيعات حسب القسم
  var catMap={};
  sales.forEach(function(s){
    var sub=0;
    s.items.forEach(function(it){sub+=(it.price||0)*it.qty;});
    var discRatio=(sub>0&&(s.discount||0)>0)?Math.min(1,(s.discount||0)/sub):0;
    s.items.forEach(function(it){
      var p=db.products.find(function(x){return x.id===it.pid;});
      var cat=(p&&p.category)||'متنوع';
      if(!catMap[cat])catMap[cat]={rev:0,qty:0,profit:0};
      var sp=it.price||(p?p.price:0);
      var effSP=sp*(1-discRatio);
      catMap[cat].rev+=effSP*it.qty;
      catMap[cat].qty+=it.qty;
      if(p)catMap[cat].profit+=(effSP-(p.cost||0))*it.qty;
    });
  });
  var catArr=Object.keys(catMap).map(function(k){return{cat:k,rev:catMap[k].rev,qty:catMap[k].qty,profit:catMap[k].profit};}).sort(function(a,b){return b.rev-a.rev;});
  var catSumHtml='';
  if(catArr.length){
    catSumHtml='<div class="card" style="margin-bottom:8px"><div class="card-title" style="margin-bottom:12px">📂 المبيعات حسب القسم</div>'+
      '<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#f8fafc"><th style="padding:8px;text-align:right;border-bottom:2px solid #e5e7eb">القسم</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">الكمية</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">الإيراد</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">الربح</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">الهامش%</th></tr></thead><tbody>';
    catArr.forEach(function(r){
      var pct=r.rev>0?Math.round(r.profit/r.rev*100):0;
      var pctColor=pct>=30?'#16a34a':pct>=15?'#d97706':'#dc2626';
      catSumHtml+='<tr style="border-bottom:1px solid #f1f5f9">'+
        '<td style="padding:8px;font-weight:700">'+r.cat+'</td>'+
        '<td style="padding:8px;text-align:center">'+r.qty+'</td>'+
        '<td style="padding:8px;text-align:center;font-weight:800;color:#7c3aed">'+fmt(r.rev)+'</td>'+
        '<td style="padding:8px;text-align:center;font-weight:800;color:#16a34a">'+fmt(r.profit)+'</td>'+
        '<td style="padding:8px;text-align:center;font-weight:800;color:'+pctColor+'">'+pct+'%</td>'+
      '</tr>';
    });
    catSumHtml+='</tbody></table></div>';
  }
  if($('rep-returns-summary')) $('rep-returns-summary').innerHTML=catSumHtml;

  var mm2 = { cash:'💵 نقداً', card:'💳 بطاقة', debt:'📝 دين' };
  _repSalesCache = sales.slice();
  if($('rep-sales')) $('rep-sales').innerHTML = buildSalesTable(sales, mm2);
  renderProdProfit(sales);

  var telHtml='<div style="display:flex;justify-content:space-between;padding:4px 0"><span>📱 أرباح الهاتف</span><span style="font-weight:800">'+fmt(telP)+'</span></div>';
  telHtml+='<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:#64748b"><span>مدفوعات عملاء واردة</span><span style="font-weight:700;color:#16a34a">+'+fmt(clientPaymentsIn)+'</span></div>';
  if($('rep-tel')) $('rep-tel').innerHTML = telHtml;
  if($('rep-print')) $('rep-print').innerHTML = '<div style="display:flex;justify-content:space-between"><span>🖨️ مداخيل الطباعة</span><span style="font-weight:800">'+fmt(printP)+'</span></div>';
  var returnsHtml = '';
  returns.slice().reverse().forEach(function(r){ returnsHtml += '<div style="padding:6px 0;border-bottom:1px solid #f0f2f8">'+r.productName+' ×'+r.quantity+' — '+fmt(r.amount)+'</div>'; });
  if($('rep-returns-list')) $('rep-returns-list').innerHTML = returnsHtml || '<div style="color:#9ca3af">لا توجد مرتجعات</div>';
  // ── تقرير المديونيات المتأخرة (+30 يوم)
  var todayD2=new Date(); todayD2.setHours(0,0,0,0);
  var agedRows=[];
  (db.clients||[]).forEach(function(c){
    if(!(c.totalDebt>0))return;
    (c.debts||[]).forEach(function(d){
      if(!d.dateStr)return;
      var dd=new Date(d.dateStr); dd.setHours(0,0,0,0);
      var days=Math.floor((todayD2-dd)/86400000);
      if(days>=30) agedRows.push({client:c.name,desc:d.desc||'—',amount:d.amount,days:days});
    });
  });
  agedRows.sort(function(a,b){return b.days-a.days;});
  var agedHtml='';
  if(!agedRows.length){
    agedHtml='<div style="color:#9ca3af;font-size:12px;padding:12px;text-align:center">✅ لا توجد ديون متأخرة +30 يوم</div>';
  } else {
    agedHtml='<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#fff7ed"><th style="padding:7px;text-align:right;border-bottom:2px solid #fed7aa">العميل</th><th style="padding:7px;text-align:right;border-bottom:2px solid #fed7aa">البيان</th><th style="padding:7px;text-align:center;border-bottom:2px solid #fed7aa">المبلغ</th><th style="padding:7px;text-align:center;border-bottom:2px solid #fed7aa">منذ (يوم)</th></tr></thead><tbody>';
    agedRows.forEach(function(r){
      var ageCls=r.days>=90?'#dc2626':r.days>=60?'#ea580c':'#d97706';
      agedHtml+='<tr style="border-bottom:1px solid #fef3c7">'+
        '<td style="padding:7px;font-weight:700">'+r.client+'</td>'+
        '<td style="padding:7px;font-size:11px;color:#64748b">'+r.desc+'</td>'+
        '<td style="padding:7px;text-align:center;font-weight:800;color:#dc2626">'+fmt(r.amount)+'</td>'+
        '<td style="padding:7px;text-align:center;font-weight:900;color:'+ageCls+'">'+r.days+'</td>'+
      '</tr>';
    });
    agedHtml+='</tbody></table>';
  }
  if($('rep-aged-debts')) $('rep-aged-debts').innerHTML=agedHtml;

  setTimeout(function(){
    drawSalesChart(sales, from, to);
    drawPieChart(sales, tel, print);
  }, 50);
}
function buildSalesTable(sales, mm2){
  if(!sales.length) return '<div style="color:#9ca3af;font-size:12px;padding:16px">لا توجد مبيعات</div>';
  var showCashier=AUTH.isAdmin();
  var html = '<table style="width:100%;border-collapse:collapse;min-width:600px"><thead><tr>'+
    '<th>رقم الفاتورة</th><th>التاريخ</th><th>المنتجات</th>'+
    (showCashier?'<th>الكاشير</th>':'')+
    '<th>الدفع</th><th>المبلغ</th>'+(showCashier?'<th>حذف</th>':'')+
    '</tr></thead><tbody>';
  for(var i=sales.length-1; i>=0; i--){
    var sv = sales[i];
    var cashierName = sv.cashierName || sv.cashierUser || '—';
    html += '<tr><td style="padding:10px 12px;">#'+sv.invoiceNum+'</td>'+
      '<td>'+sv.date+'</td>'+
      '<td>'+truncateItems(sv.items,3)+'</td>'+
      (showCashier?'<td style="font-size:11px;color:#64748b">'+cashierName+'</td>':'')+
      '<td>'+(mm2[sv.method]||sv.method)+'</td>'+
      '<td style="font-weight:800;color:#7c3aed">'+fmt(sv.total)+'</td>';
    if(showCashier) html += '<td><button onclick="deleteSaleFromReport(\''+sv.id+'\')" style="background:#fee2e2;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;color:#dc2626">🗑</button></td>';
    html += '</tr>';
  }
  return html + '</tbody></table>';
}
async function deleteSaleFromReport(id){
  var sv = db.sales.find(function(s){ return s.id===id; });
  if(!sv) return;
  if(!confirm('حذف هذه المبيعة نهائياً؟\n'+truncateItems(sv.items,3)+'\n'+fmt(sv.total))) return;
  for(var i=0; i<sv.items.length; i++){
    var p = db.products.find(function(x){ return x.id===sv.items[i].pid; });
    if(p) p.stock = (p.stock||0) + sv.items[i].qty;
  }
  await saveDB('products');
  db.sales = db.sales.filter(function(s){ return s.id!==id; });
  await saveDB('sales');
  toast('تم الحذف وإعادة المخزون ✅','info');
  genReport(); autoPush();
}
function filterRepSales(){
  var q = ($('rep-sales-search')?$('rep-sales-search').value.trim().toLowerCase():'');
  if(!_repSalesCache.length) return;
  var mm2 = { cash:'💵 نقداً', card:'💳 بطاقة', debt:'📝 دين' };
  var filtered = q ? _repSalesCache.filter(function(sv){
    return sv.items.some(function(it){ return it.name.toLowerCase().indexOf(q)>=0; }) || (mm2[sv.method]||'').indexOf(q)>=0 || sv.date.indexOf(q)>=0 || String(sv.total).indexOf(q)>=0;
  }) : _repSalesCache;
  $('rep-sales').innerHTML = buildSalesTable(filtered, mm2);
}
function printReports(){
  var from=$('rep-from').value||today(),to=$('rep-to').value||today();
  var sales=db.sales.filter(function(s){return s.dateStr>=from&&s.dateStr<=to;});
  var returns=db.returns.filter(function(r){return r.dateStr>=from&&r.dateStr<=to;});
  var tel=db.telecomSales.filter(function(t){return t.dateStr>=from&&t.dateStr<=to;});
  var print=db.printSales.filter(function(p){return p.dateStr>=from&&p.dateStr<=to;});
  var exp=db.expenses.filter(function(e){return e.date>=from&&e.date<=to;});
  var totalSales=0,telP=0,printP=0,expT=0;
  sales.forEach(function(s){totalSales+=s.total;});
  tel.forEach(function(t){telP+=t.profit||0;});
  print.forEach(function(p){printP+=p.total||0;});
  exp.forEach(function(e){expT+=e.amount||0;});
  var margin=calcDailyMargin(sales,returns);
  var net=margin+telP+printP-expT;
  var w=window.open('','_blank','width=900,height=700');
  if(!w){toast('السماح بالنوافذ المنبثقة ❌','error');return;}
  var css='body{font-family:Arial;direction:rtl;padding:24px;color:#1e1b4b}h1{color:#7c3aed;margin-bottom:4px}h2{color:#475569;font-size:15px;margin:20px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{background:#7c3aed;color:#fff;padding:9px 10px;text-align:right}td{padding:8px 10px;border-bottom:1px solid #f0f2f8;font-size:13px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}.sum-card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center}.sum-lbl{font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:4px}.sum-val{font-size:20px;font-weight:900}@media print{button{display:none}}';
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير '+shopSettings.name+'</title><style>'+css+'</style></head><body>');
  w.document.write('<h1>📊 '+shopSettings.name+' — تقرير شامل</h1><p style="color:#9ca3af;font-size:12px">من: '+from+' | إلى: '+to+'</p>');
  w.document.write('<div class="summary">'+
    '<div class="sum-card"><div class="sum-lbl">إجمالي المبيعات</div><div class="sum-val" style="color:#7c3aed">'+fmt(totalSales)+'</div></div>'+
    '<div class="sum-card"><div class="sum-lbl">هامش الربح</div><div class="sum-val" style="color:#16a34a">'+fmt(margin)+'</div></div>'+
    '<div class="sum-card"><div class="sum-lbl">صافي الفترة</div><div class="sum-val" style="color:'+(net>=0?'#16a34a':'#dc2626')+'">'+fmt(net)+'</div></div>'+
    '<div class="sum-card"><div class="sum-lbl">أرباح الهاتف</div><div class="sum-val" style="color:#0891b2">'+fmt(telP)+'</div></div>'+
    '<div class="sum-card"><div class="sum-lbl">مداخيل الطباعة</div><div class="sum-val" style="color:#f59e0b">'+fmt(printP)+'</div></div>'+
    '<div class="sum-card"><div class="sum-lbl">المصاريف</div><div class="sum-val" style="color:#ef4444">'+fmt(expT)+'</div></div>'+
    '</div>');
  var mm2={cash:'نقداً',card:'بطاقة',debt:'دين'};
  w.document.write('<h2>🛒 المبيعات ('+sales.length+' عملية)</h2>');
  if(sales.length){
    w.document.write('<table><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>المنتجات</th><th>الدفع</th><th>المبلغ</th></tr></thead><tbody>');
    sales.forEach(function(sv){w.document.write('<tr><td>#'+sv.invoiceNum+'</td><td>'+sv.date+'</td><td>'+truncateItems(sv.items,5)+'</td><td>'+(mm2[sv.method]||sv.method)+'</td><td style="font-weight:800;color:#7c3aed">'+fmt(sv.total)+'</td></tr>');});
    w.document.write('</tbody></table>');
  }else{w.document.write('<p style="color:#9ca3af">لا توجد مبيعات في هذه الفترة</p>');}
  w.document.write('<h2>🔄 المرتجعات ('+returns.length+' عملية)</h2>');
  if(returns.length){
    w.document.write('<table><thead><tr><th>التاريخ</th><th>المنتج</th><th>الكمية</th><th>المبلغ المسترجع</th><th>ملاحظة</th></tr></thead><tbody>');
    returns.forEach(function(r){w.document.write('<tr><td>'+r.date+'</td><td>'+r.productName+'</td><td>'+r.quantity+'</td><td style="font-weight:800;color:#dc2626">'+fmt(r.amount)+'</td><td style="color:#9ca3af;font-size:11px">'+(r.note||'—')+'</td></tr>');});
    w.document.write('</tbody></table>');
  }else{w.document.write('<p style="color:#9ca3af">لا توجد مرتجعات في هذه الفترة</p>');}
  w.document.write('<br><button onclick="window.print()" style="background:#7c3aed;color:#fff;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ طباعة</button>');
  w.document.write('</body></html>');w.document.close();
}
// ═══════════════════════════════════════════════════════════
// ║  HELPERS (unique — duplicates removed)                   ║
// ═══════════════════════════════════════════════════════════
function quickChangeCat(id){var p=db.products.find(function(x){return x.id===id;});if(!p)return;$('cc-pid').value=id;$('cc-pname').textContent=p.name;$('cc-cat').value=p.category||'متنوع';openModal('m-cat-change');}
async function saveChangeCategory(){var id=$('cc-pid').value,p=db.products.find(function(x){return x.id===id;});if(!p)return;var old=p.category,nw=$('cc-cat').value;p.category=nw;await saveDB('products');closeModal('m-cat-change');renderInv();toast('تم النقل: '+old+' ← '+nw,'success');autoPush();}

// ═══════════════════════════════════════════════════════════
// ║  startApp — called after successful auth                 ║
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// ║  QUICK ACCESS — منتجات سريعة بدون باركود                ║
// ═══════════════════════════════════════════════════════════
var QA_KEY='hch_quick_access';
var _qaIds=[];

function loadQuickAccess(){try{var r=localStorage.getItem(QA_KEY);if(r)_qaIds=JSON.parse(r);}catch(e){_qaIds=[];}}
function saveQuickAccess(){localStorage.setItem(QA_KEY,JSON.stringify(_qaIds));}

// ✅ فتح modal تأكيد البيع
function openSaleConfirm(){
  if(!cart.length){toast('السلة فارغة ❌','error');return;}
  var sub=0;cart.forEach(function(it){sub+=it.price*it.qty;});
  var disc=parseFloat(($('disc-in')||{}).value)||0;
  var total=Math.max(0,sub-disc);
  var method=($('pay-method')||{}).value||'cash';
  var mm={cash:'💵 نقداً',card:'💳 بطاقة',debt:'📝 دين'};
  // بناء قائمة المنتجات
  var html='';
  cart.forEach(function(it){
    html+='<div style="display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #f0f2f8">'+
      '<div style="font-weight:600;font-size:13px">'+it.name+' <span style="color:#9ca3af">×'+it.qty+'</span></div>'+
      '<div style="font-weight:700;color:#7c3aed;font-size:13px">'+fmt(it.price*it.qty)+'</div></div>';
  });
  if($('sc-items'))$('sc-items').innerHTML=html;
  if($('sc-total'))$('sc-total').textContent=fmt(total);
  if($('sc-method'))$('sc-method').textContent=mm[method]||method;
  var dr=$('sc-disc-row');
  if(dr){dr.style.display=disc>0?'block':'none';dr.textContent='🏷️ تخفيض: '+fmt(disc);}
  openModal('m-sale-confirm');
  // Focus على زر التأكيد لدعم Enter
  setTimeout(function(){var b=$('sc-confirm-btn');if(b)b.focus();},100);
}

function doConfirmedCheckout(){
  closeModal('m-sale-confirm');
  checkout();
}

function addQuickProd(id){
  var p=db.products.find(function(x){return x.id===id;});
  if(p)addToCart(p);
}

function openQuickAccessManager(){
  renderQAList();
  $('qa-search').value='';$('qa-drop').style.display='none';
  openModal('m-quick-access');
  setTimeout(function(){$('qa-search').focus();},100);
}

function renderQAList(){
  var el=$('qa-list');if(!el)return;
  if(!_qaIds.length){el.innerHTML='<div style="color:#9ca3af;font-size:13px;padding:16px;text-align:center">لا توجد منتجات بعد — ابحث أعلاه لإضافة منتج</div>';return;}
  el.innerHTML=_qaIds.map(function(id){
    var p=db.products.find(function(x){return x.id===id;});if(!p)return'';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e5e7eb">'+
      '<span style="font-size:18px">'+(CAT_ICONS[p.category]||'📦')+'</span>'+
      '<div style="flex:1"><div style="font-weight:700;font-size:13px">'+p.name+'</div>'+
      '<div style="font-size:11px;color:#9ca3af">'+fmt(p.price)+' • مخزون: '+(p.stock||0)+'</div></div>'+
      '<button onclick="removeFromQA(\''+id+'\')" style="background:#fee2e2;border:none;border-radius:8px;width:28px;height:28px;cursor:pointer;color:#dc2626;font-size:14px;font-family:inherit">✕</button>'+
      '</div>';
  }).join('');
}

function addToQA(id){
  if(_qaIds.indexOf(id)>-1){toast('موجود مسبقاً ✅','info');return;}
  if(_qaIds.length>=16){toast('الحد الأقصى 16 منتج ❌','error');return;}
  _qaIds.push(id);saveQuickAccess();renderQAList();renderQuickAccess();
  toast('تم الإضافة ⚡','success');
}
function removeFromQA(id){
  _qaIds=_qaIds.filter(function(x){return x!==id;});
  saveQuickAccess();renderQAList();renderQuickAccess();
}
function onQASearch(q){
  var drop=$('qa-drop');
  if(!q||q.length<1){drop.style.display='none';return;}
  var ql=q.toLowerCase(),html='',cnt=0;
  for(var i=0;i<db.products.length&&cnt<8;i++){
    var p=db.products[i];
    if(p.name.toLowerCase().indexOf(ql)>=0||( p.category&&p.category.toLowerCase().indexOf(ql)>=0)){
      html+='<div class="search-drop-item" onclick="addToQA(\''+p.id+'\');$(\'qa-search\').value=\'\';$(\'qa-drop\').style.display=\'none\'" style="display:flex;align-items:center;gap:10px">'+
        '<span>'+(CAT_ICONS[p.category]||'📦')+'</span>'+
        '<div style="flex:1"><div style="font-weight:700;font-size:12px">'+p.name+'</div><div style="font-size:10px;color:#9ca3af">'+fmt(p.price)+'</div></div>'+
        '<div style="font-size:10px;color:'+(p.stock<=0?'#dc2626':'#16a34a')+';font-weight:700">'+(p.stock||0)+'</div></div>';
      cnt++;
    }
  }
  drop.innerHTML=html||'<div style="padding:12px;text-align:center;color:#9ca3af;font-size:12px">لا نتائج</div>';
  drop.style.display='block';
}

// ✅ فتح صفحات الشاشة الخارجية بمسار صحيح على GitHub Pages / PWA
function openExtPage(file){
  var base=new URL('./',location.href).href;
  window.open(base+file,'_blank');
}

// ═══════════════════════════════════════════════════════════

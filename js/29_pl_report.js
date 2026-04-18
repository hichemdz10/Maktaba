// ── js/29_pl_report.js ──
// ║  P&L REPORT MODULE                                      ║
// ═══════════════════════════════════════════════════════════
var _plFrom='', _plTo='';

function openPLModal(){
  var now=new Date();
  _plFrom=now.toISOString().slice(0,7)+'-01';
  _plTo=now.toISOString().slice(0,10);
  document.getElementById('pl-from').value=_plFrom;
  document.getElementById('pl-to').value=_plTo;
  renderPLReport();
  openModal('m-pl-report');
}
function setPLPeriod(p, btn){
  document.querySelectorAll('.pl-period-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  var now=new Date(), y=now.getFullYear(), m=now.getMonth();
  if(p==='month'){
    _plFrom=y+'-'+String(m+1).padStart(2,'0')+'-01';
    _plTo=now.toISOString().slice(0,10);
  } else if(p==='quarter'){
    var qStart=new Date(y,Math.floor(m/3)*3,1);
    _plFrom=qStart.toISOString().slice(0,10);
    _plTo=now.toISOString().slice(0,10);
  } else if(p==='year'){
    _plFrom=y+'-01-01';
    _plTo=now.toISOString().slice(0,10);
  }
  document.getElementById('pl-from').value=_plFrom;
  document.getElementById('pl-to').value=_plTo;
  renderPLReport();
}
function renderPLReport(){
  var from=document.getElementById('pl-from').value||_plFrom;
  var to=document.getElementById('pl-to').value||_plTo;
  // ── Revenue ──
  var sales=db.sales.filter(function(s){return s.date>=from&&s.date<=to;});
  var salesRevenue=sales.reduce(function(a,s){return a+(s.total||0);},0);
  var cashSales=sales.filter(function(s){return s.pay==='cash'||s.payMethod==='cash';}).reduce(function(a,s){return a+(s.total||0);},0);
  var cardSales=sales.filter(function(s){return s.pay==='card'||s.payMethod==='card';}).reduce(function(a,s){return a+(s.total||0);},0);
  var debtSales=sales.filter(function(s){return s.pay==='debt'||s.payMethod==='debt';}).reduce(function(a,s){return a+(s.total||0);},0);
  var printRev=db.printSales.filter(function(s){return s.date>=from&&s.date<=to;}).reduce(function(a,s){return a+(s.total||0);},0);
  var telecomRev=db.telecomSales.filter(function(s){return s.date>=from&&s.date<=to;}).reduce(function(a,s){return a+(s.total||0);},0);
  var totalRevenue=salesRevenue+printRev+telecomRev;
  // ── Cost of Goods ──
  var cogs=0;
  sales.forEach(function(sale){
    (sale.items||[]).forEach(function(item){
      var p=db.products.find(function(x){return x.id===item.pid||x.name===item.name;});
      if(p&&p.cost)cogs+=(p.cost||0)*(item.qty||1);
    });
  });
  var grossProfit=salesRevenue-cogs;
  // ── Expenses ──
  var exps=db.expenses.filter(function(e){return e.date>=from&&e.date<=to;});
  var totalExpenses=exps.reduce(function(a,e){return a+(e.amount||0);},0);
  var expByCategory={};
  exps.forEach(function(e){
    var cat=e.category||'other';
    expByCategory[cat]=(expByCategory[cat]||0)+(e.amount||0);
  });
  // ── Returns ──
  var returns=db.returns.filter(function(r){return r.date>=from&&r.date<=to;});
  var totalReturns=returns.reduce(function(a,r){return a+(r.total||0);},0);
  // ── Purchases (COGS from purchases) ──
  var purchases=db.purchases.filter(function(p){return p.date>=from&&p.date<=to;});
  var totalPurchases=purchases.reduce(function(a,p){return a+(p.total||0);},0);
  // ── Net Profit ──
  var netProfit=grossProfit+printRev+telecomRev-totalExpenses-totalReturns;
  var margin=totalRevenue>0?((netProfit/totalRevenue)*100):0;
  // ── KPIs ──
  var kpiEl=document.getElementById('pl-kpis');
  if(kpiEl) kpiEl.innerHTML=
    '<div class="pl-kpi"><div class="pl-kpi-icon">💰</div><div class="pl-kpi-val" style="color:#10b981">'+fmtK(totalRevenue)+'</div><div class="pl-kpi-lbl">إجمالي الإيرادات</div></div>'
    +'<div class="pl-kpi"><div class="pl-kpi-icon">📦</div><div class="pl-kpi-val" style="color:#ef4444">'+fmtK(cogs)+'</div><div class="pl-kpi-lbl">تكلفة البضاعة</div></div>'
    +'<div class="pl-kpi"><div class="pl-kpi-icon">📈</div><div class="pl-kpi-val" style="color:'+(netProfit>=0?'#10b981':'#ef4444')+'">'+fmtK(netProfit)+'</div><div class="pl-kpi-lbl">صافي الربح</div></div>'
    +'<div class="pl-kpi"><div class="pl-kpi-icon">📊</div><div class="pl-kpi-val" style="color:'+(margin>=0?'#6366f1':'#ef4444')+'">'+margin.toFixed(1)+'%</div><div class="pl-kpi-lbl">هامش الربح</div></div>';
  // ── Statement ──
  var EXP_N=window.EXP_NAMES||{rent:'إيجار',supply:'بضاعة',electricity:'كهرباء/ماء',transport:'مواصلات',salary:'رواتب',maintenance:'صيانة',other:'متنوع'};
  var expRows=Object.keys(expByCategory).map(function(cat){
    return '<div class="pl-row pl-sub"><span class="pl-label">'+(EXP_N[cat]||cat)+'</span><span class="pl-value negative">- '+fmtK(expByCategory[cat])+'</span></div>';
  }).join('');
  var stmtEl=document.getElementById('pl-statement');
  if(!stmtEl)return;
  stmtEl.innerHTML=
    // REVENUE SECTION
    '<div class="pl-section">'
      +'<div class="pl-section-title"><span>الإيرادات</span><span>'+fmtK(totalRevenue)+'</span></div>'
      +'<div class="pl-row pl-sub"><span class="pl-label">مبيعات نقدية</span><span class="pl-value positive">'+fmtK(cashSales)+'</span></div>'
      +'<div class="pl-row pl-sub"><span class="pl-label">مبيعات بالبطاقة</span><span class="pl-value positive">'+fmtK(cardSales)+'</span></div>'
      +'<div class="pl-row pl-sub"><span class="pl-label">مبيعات بالدين</span><span class="pl-value" style="color:#f59e0b">'+fmtK(debtSales)+'</span></div>'
      +(printRev>0?'<div class="pl-row pl-sub"><span class="pl-label">إيرادات الطباعة</span><span class="pl-value positive">'+fmtK(printRev)+'</span></div>':'')
      +(telecomRev>0?'<div class="pl-row pl-sub"><span class="pl-label">إيرادات الهاتف</span><span class="pl-value positive">'+fmtK(telecomRev)+'</span></div>':'')
      +(totalReturns>0?'<div class="pl-row pl-sub"><span class="pl-label">المرتجعات</span><span class="pl-value negative">- '+fmtK(totalReturns)+'</span></div>':'')
      +'<div class="pl-row pl-total"><span class="pl-label">إجمالي الإيرادات</span><span class="pl-value positive">'+fmtK(totalRevenue-totalReturns)+'</span></div>'
    +'</div>'
    // COGS SECTION
    +'<div class="pl-section">'
      +'<div class="pl-section-title"><span>تكلفة البضاعة المباعة</span><span>'+fmtK(cogs)+'</span></div>'
      +'<div class="pl-row pl-sub"><span class="pl-label">تكلفة البضاعة</span><span class="pl-value negative">- '+fmtK(cogs)+'</span></div>'
      +'<div class="pl-row pl-total"><span class="pl-label">مجمل الربح</span><span class="pl-value '+(grossProfit>=0?'positive':'negative')+'">'+fmtK(grossProfit)+'</span></div>'
    +'</div>'
    // EXPENSES SECTION
    +'<div class="pl-section">'
      +'<div class="pl-section-title"><span>المصاريف التشغيلية</span><span>'+fmtK(totalExpenses)+'</span></div>'
      +expRows
      +'<div class="pl-row pl-total"><span class="pl-label">إجمالي المصاريف</span><span class="pl-value negative">- '+fmtK(totalExpenses)+'</span></div>'
    +'</div>'
    // NET PROFIT
    +'<div class="pl-section">'
      +'<div class="pl-row '+(netProfit>=0?'pl-net-positive':'pl-net-negative')+'">'
        +'<span class="pl-label" style="font-size:16px">💰 صافي الربح / الخسارة</span>'
        +'<span class="pl-value '+(netProfit>=0?'positive':'negative')+'" style="font-size:20px">'+fmtK(netProfit)+'</span>'
      +'</div>'
    +'</div>';
}
function printPLReport(){
  var content=document.getElementById('pl-statement');if(!content)return;
  var kpis=document.getElementById('pl-kpis');
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">'
    +'<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Tajawal,Arial,sans-serif;padding:24px;background:#fff;color:#0f172a;}'
    +'h1{font-size:22px;font-weight:900;margin-bottom:4px;}h2{font-size:12px;color:#64748b;margin-bottom:20px;}'
    +'.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}'
    +'.kpi{background:#f8fafc;border-radius:10px;padding:14px;text-align:center;}'
    +'.kpi-val{font-size:20px;font-weight:900;}.kpi-lbl{font-size:10px;color:#64748b;font-weight:700;margin-top:4px;}'
    +'.pl-section{margin-bottom:12px;border:1px solid rgba(99,102,241,0.12);border-radius:10px;overflow:hidden;}'
    +'.pl-section-title{padding:10px 16px;background:rgba(99,102,241,0.06);font-size:11px;font-weight:900;color:#6366f1;text-transform:uppercase;display:flex;justify-content:space-between;}'
    +'.pl-row{display:grid;grid-template-columns:1fr auto;padding:8px 16px;border-bottom:1px solid rgba(99,102,241,0.05);font-size:12px;}'
    +'.pl-row.pl-sub{padding-right:28px;color:#475569;}'
    +'.pl-row.pl-total{background:rgba(99,102,241,0.04);font-weight:900;font-size:13px;}'
    +'.pl-row.pl-net-positive{background:#ecfdf5;font-weight:900;font-size:15px;padding:14px 16px;}'
    +'.pl-row.pl-net-negative{background:#fef2f2;font-weight:900;font-size:15px;padding:14px 16px;}'
    +'.positive{color:#10b981;}.negative{color:#ef4444;}'
    +'@media print{button{display:none!important}}</style></head><body>'
    +'<h1>📈 تقرير الأرباح والخسائر</h1>'
    +'<h2>'+shopSettings.name+' | من '+_plFrom+' إلى '+_plTo+'</h2>');
  if(kpis)w.document.write('<div class="kpis">'+kpis.innerHTML+'</div>');
  w.document.write(content.outerHTML);
  w.document.write('<br><button onclick="window.print()" style="background:#6366f1;color:#fff;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-family:Tajawal,Arial">🖨️ طباعة</button></body></html>');
  w.document.close();setTimeout(function(){w.print();},600);
}
function exportPLCSV(){
  var rows=[['بند','المبلغ (دج)']];
  var st=document.getElementById('pl-statement');
  if(st){
    st.querySelectorAll('.pl-row').forEach(function(row){
      var cells=row.querySelectorAll('.pl-label,.pl-value');
      if(cells.length>=2)rows.push([cells[0].textContent.trim(),cells[1].textContent.trim()]);
    });
  }
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download='PL_Report_'+today()+'.csv';a.click();
}


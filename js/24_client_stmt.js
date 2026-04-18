// ── js/24_client_stmt.js ──
// ═══════════════════════════════════════════════════════════
// ║  Print Client Statement — كشف حساب العميل               ║
// ═══════════════════════════════════════════════════════════
function printClientStatement(id){
  var client=db.clients.find(function(c){return c.id===id;}); if(!client)return;
  var transactions=[];
  (client.debts||[]).forEach(function(d){transactions.push({type:'debt',amount:d.amount,desc:d.desc,date:d.date,dateStr:d.dateStr||''});});
  (client.payments||[]).forEach(function(p){transactions.push({type:'payment',amount:p.amount,desc:p.note||'تسديد',date:p.date,dateStr:p.dateStr||''});});
  transactions.sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
  var totalDebt=0,totalPaid=0;
  (client.debts||[]).forEach(function(d){totalDebt+=d.amount||0;});
  (client.payments||[]).forEach(function(p){totalPaid+=p.amount||0;});
  var balance=Math.max(0,totalDebt-totalPaid);
  var w=window.open('','_blank','width=700,height=800'); if(!w)return;
  var rows='';
  var running=0;
  transactions.forEach(function(t,i){
    if(t.type==='debt') running+=t.amount;
    else running=Math.max(0,running-t.amount);
    rows+='<tr>'+
      '<td style="padding:9px 10px;border-bottom:1px solid #f0f2f8;color:#64748b;font-size:11px">'+(i+1)+'</td>'+
      '<td style="padding:9px 10px;border-bottom:1px solid #f0f2f8;font-size:12px">'+t.date+'</td>'+
      '<td style="padding:9px 10px;border-bottom:1px solid #f0f2f8;font-weight:600">'+t.desc+'</td>'+
      '<td style="padding:9px 10px;border-bottom:1px solid #f0f2f8;text-align:center;font-weight:800;color:'+(t.type==='debt'?'#dc2626':'#16a34a')+'">'+(t.type==='debt'?fmt(t.amount):'—')+'</td>'+
      '<td style="padding:9px 10px;border-bottom:1px solid #f0f2f8;text-align:center;font-weight:800;color:'+(t.type==='payment'?'#16a34a':'#dc2626')+'">'+(t.type==='payment'?fmt(t.amount):'—')+'</td>'+
      '<td style="padding:9px 10px;border-bottom:1px solid #f0f2f8;text-align:center;font-weight:900;color:'+(running>0?'#dc2626':'#16a34a')+'">'+fmt(running)+'</td>'+
    '</tr>';
  });
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب - '+client.name+'</title>'+
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;direction:rtl;padding:28px;color:#1e1b4b;font-size:13px}'+
    '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #7c3aed;padding-bottom:16px}'+
    '.shop-name{font-size:20px;font-weight:900;color:#7c3aed}.shop-sub{font-size:11px;color:#9ca3af;margin-top:3px}'+
    '.client-box{background:#f8fafc;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}'+
    '.client-name{font-size:17px;font-weight:900}.client-phone{font-size:12px;color:#9ca3af}'+
    'table{width:100%;border-collapse:collapse}th{background:#7c3aed;color:#fff;padding:10px;text-align:right;font-size:12px}'+
    '.balance-row{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-radius:12px;margin-top:20px;font-size:15px;font-weight:900}'+
    '@media print{button{display:none!important}}</style></head><body>');
  w.document.write('<div class="header"><div><div class="shop-name">'+shopSettings.name+'</div>'+(shopSettings.address?'<div class="shop-sub">'+shopSettings.address+'</div>':'')+'</div><div style="text-align:left;font-size:11px;color:#9ca3af">كشف حساب<br>'+nowStr()+'</div></div>');
  w.document.write('<div class="client-box"><div><div class="client-name">'+client.name+'</div><div class="client-phone">'+(client.phone||'بدون هاتف')+'</div></div>'+
    '<div style="text-align:center"><div style="font-size:11px;color:#9ca3af;font-weight:700">الرصيد الحالي</div><div style="font-size:22px;font-weight:900;color:'+(balance>0?'#dc2626':'#16a34a')+'">'+fmt(balance)+'</div></div></div>');
  if(transactions.length){
    w.document.write('<table><thead><tr><th>#</th><th>التاريخ</th><th>البيان</th><th style="text-align:center">دين</th><th style="text-align:center">دفع</th><th style="text-align:center">الرصيد</th></tr></thead><tbody>'+rows+'</tbody></table>');
  } else {
    w.document.write('<div style="text-align:center;color:#9ca3af;padding:40px">لا توجد عمليات مسجلة</div>');
  }
  w.document.write('<div class="balance-row" style="background:'+(balance>0?'#fff1f2':'#f0fdf4')+';border:2px solid '+(balance>0?'#fecaca':'#bbf7d0')+'">'+
    '<span>الرصيد المستحق:</span><span style="color:'+(balance>0?'#dc2626':'#16a34a')+'">'+fmt(balance)+(balance===0?' (مسدد بالكامل)':'')+'</span></div>');
  w.document.write('<div style="text-align:center;margin-top:24px"><button onclick="window.print()" style="background:#7c3aed;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:14px;cursor:pointer;font-weight:700">🖨️ طباعة</button></div>');
  w.document.write('</body></html>'); w.document.close();
}

// ═══════════════════════════════════════════════════════════
// ║  Product Profit Report                                   ║
// ═══════════════════════════════════════════════════════════
var _ppSort = 'profit';
function setProdProfitSort(mode, btn){
  _ppSort = mode;
  document.querySelectorAll('#pp-sort-profit,#pp-sort-qty,#pp-sort-rev').forEach(function(b){
    b.style.background=''; b.style.color=''; b.style.borderColor='';
  });
  if(btn){btn.style.background='#7c3aed';btn.style.color='#fff';btn.style.borderColor='#7c3aed';}
  renderProdProfit(_ppSalesCache || []);
}
var _ppSalesCache = [];
function renderProdProfit(sales){
  _ppSalesCache = sales;
  var el = $('rep-prod-profit'); if(!el) return;
  var map = {};
  sales.forEach(function(s){
    var sub=0;
    s.items.forEach(function(it){var p=db.products.find(function(x){return x.id===it.pid;});sub+=(it.price||(p?p.price:0))*it.qty;});
    var discRatio=(sub>0&&(s.discount||0)>0)?Math.min(1,(s.discount||0)/sub):0;
    s.items.forEach(function(it){
      if(!map[it.pid||it.name]) map[it.pid||it.name] = {name:it.name, qty:0, rev:0, profit:0};
      var p = db.products.find(function(x){return x.id===it.pid;});
      var cost = p ? (p.cost||0) : 0;
      var sp = it.price || (p?p.price:0);
      var effSP = sp*(1-discRatio);
      map[it.pid||it.name].qty  += it.qty;
      map[it.pid||it.name].rev  += effSP * it.qty;
      map[it.pid||it.name].profit += (effSP - cost) * it.qty;
    });
  });
  var arr = Object.values(map);
  arr.sort(function(a,b){ return b[_ppSort] - a[_ppSort]; });
  if(!arr.length){ el.innerHTML='<div style="color:#9ca3af;padding:16px">لا توجد مبيعات في هذه الفترة</div>'; return; }
  var maxP = arr[0][_ppSort] || 1;
  var html = '<table style="width:100%;border-collapse:collapse;min-width:500px"><thead><tr>'+
    '<th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0">#</th>'+
    '<th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0">المنتج</th>'+
    '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0">كمية</th>'+
    '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0">إيراد</th>'+
    '<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0">ربح</th>'+
    '<th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0;width:120px">شريط</th>'+
    '</tr></thead><tbody>';
  arr.slice(0,30).forEach(function(r, i){
    var pct = Math.max(4, Math.round((r[_ppSort]/maxP)*100));
    var barColor = r.profit>=0 ? '#7c3aed' : '#ef4444';
    html += '<tr>'+
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:11px">'+(i+1)+'</td>'+
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;font-weight:700">'+r.name+'</td>'+
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700">'+r.qty+'</td>'+
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#3b82f6;font-weight:700">'+fmt(r.rev)+'</td>'+
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:900;color:'+(r.profit>=0?'#16a34a':'#ef4444')+'">'+fmt(r.profit)+'</td>'+
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9"><div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+barColor+';border-radius:4px"></div></div></td>'+
    '</tr>';
  });
  html += '</tbody></table>';
  if(arr.length>30) html+='<div style="color:#9ca3af;font-size:11px;padding:8px 12px">يُعرض أعلى 30 منتجاً</div>';
  el.innerHTML = html;
}

function populatePartialClients(){
  var sel=$('partial-client'); if(!sel)return;
  sel.innerHTML='<option value="">اختر العميل...</option>';
  db.clients.forEach(function(cl){ sel.innerHTML+='<option value="'+cl.id+'">'+cl.name+(cl.totalDebt?' — دين: '+fmt(cl.totalDebt):'')+' </option>'; });
}
function calcPartial(){
  var paid=parseFloat($('partial-paid').value)||0;
  var tot=parseFloat(($('cart-tot')||{}).textContent)||0;
  // read total from cart
  var sub=0; cart.forEach(function(it){sub+=it.price*it.qty;});
  var disc=parseFloat(($('disc-in')||{}).value)||0;
  var total=Math.max(0,sub-disc);
  var rem=total-paid;
  var el=$('partial-remaining'); if(!el)return;
  if(paid>0&&rem>0){el.style.display='block';el.textContent='المتبقي كدين: '+fmt(rem);}
  else if(paid>=total){el.style.display='block';el.style.color='#dc2626';el.textContent='⚠️ المبلغ يساوي أو يتجاوز الإجمالي';}
  else{el.style.display='none';}
}


// ── js/26_invoice.js ──
// ═══════════════════════════════════════════════════════════
// ║  FORMAL INVOICE SYSTEM                                  ║
// ═══════════════════════════════════════════════════════════
var _fiSaleData = null;
var _fiInvoiceNum = 1;

function openFormalInvoiceFromCart() {
  var items = cart.map(function(ci) {
    var p = db.products.find(function(x){return x.id===ci.pid;}) || {};
    return {name:p.name||ci.name, qty:ci.qty, price:ci.price, total:ci.qty*ci.price};
  });
  var total = items.reduce(function(s,i){return s+i.total;},0);
  var disc = parseFloat(document.getElementById('disc-amt')?document.getElementById('disc-amt').value:0)||0;
  var clientId = document.getElementById('sel-client')?document.getElementById('sel-client').value:'';
  var client = db.clients.find(function(c){return c.id===clientId;})||null;
  _fiSaleData = {
    items: items,
    total: total,
    discount: disc,
    netTotal: Math.max(0, total - disc),
    client: client,
    date: new Date().toLocaleDateString('ar-DZ'),
    num: ++_fiInvoiceNum
  };
  rebuildInvoicePreview();
  openModal('m-formal-invoice');
}

function openFormalInvoiceFromSale(sale) {
  _fiSaleData = {
    items: (sale.items||[]).map(function(i){return {name:i.name,qty:i.qty,price:i.price,total:(i.qty||1)*(i.price||0)};}) ,
    total: sale.total||0,
    discount: sale.discount||0,
    netTotal: sale.total||0,
    client: db.clients.find(function(c){return c.id===(sale.clientId||'');})||null,
    date: new Date(sale.date||sale.ts||Date.now()).toLocaleDateString('ar-DZ'),
    num: sale.invoiceNum || ('INV-'+(sale.id||'').slice(-6).toUpperCase())
  };
  rebuildInvoicePreview();
  openModal('m-formal-invoice');
}

function rebuildInvoicePreview() {
  var d = _fiSaleData; if(!d) return;
  var status = document.getElementById('fi-status') ? document.getElementById('fi-status').value : 'paid';
  var statusBadge = status==='paid'
    ? '<span class="a4-status-badge a4-status-paid">✅ مدفوعة</span>'
    : status==='debt'
    ? '<span class="a4-status-badge a4-status-debt">📝 دين</span>'
    : '<span class="a4-status-badge a4-status-partial">🔶 جزئي</span>';
  var shop = shopSettings;
  var rowsHtml = d.items.map(function(it,idx){
    return '<tr>'
      +'<td style="color:#94a3b8;font-size:11px">'+(idx+1)+'</td>'
      +'<td style="font-weight:700">'+it.name+'</td>'
      +'<td style="text-align:center">'+it.qty+'</td>'
      +'<td style="text-align:left;direction:ltr">'+Number(it.price).toFixed(2)+' دج</td>'
      +'<td style="text-align:left;direction:ltr;font-weight:800;color:#6366f1">'+Number(it.total).toFixed(2)+' دج</td>'
      +'</tr>';
  }).join('');
  var discRow = d.discount>0
    ? '<div class="a4-tot-row"><span class="a4-tot-label">التخفيض</span><span class="a4-tot-val" style="color:#ef4444">- '+Number(d.discount).toFixed(2)+' دج</span></div>' : '';
  var tvaRate = shopSettings.tvaRate||0;
  var netBeforeTVA = Math.max(0, d.total - (d.discount||0));
  var tvaAmt = tvaRate>0 ? netBeforeTVA * tvaRate/100 : 0;
  var grandTotal = netBeforeTVA + tvaAmt;
  var tvaRow = tvaRate>0
    ? '<div class="a4-tot-row"><span class="a4-tot-label">TVA '+tvaRate+'%</span><span class="a4-tot-val" style="color:#f59e0b">+ '+tvaAmt.toFixed(2)+' دج</span></div>' : '';
  // update stored netTotal with TVA
  d.netTotal = grandTotal;
  var html = '<div class="a4-invoice">'
    +'<div class="a4-header">'
      +'<div class="a4-logo-side">'
        +'<div class="a4-shop-name">'+shop.name+'</div>'
        +'<div class="a4-shop-sub">'+(shop.address||'')+'</div>'
        +(shop.phone?'<div class="a4-shop-sub">📞 '+shop.phone+'</div>':'')
      +'</div>'
      +'<div class="a4-inv-meta">'
        +'<div class="a4-inv-label">رقم الفاتورة</div>'
        +'<div class="a4-inv-num">#'+String(d.num).padStart(5,'0')+'</div>'
        +'<div class="a4-inv-label" style="margin-top:8px">التاريخ</div>'
        +'<div style="font-size:13px;font-weight:700">'+d.date+'</div>'
      +'</div>'
    +'</div>'
    +'<div class="a4-body">'
      +'<div class="a4-parties">'
        +'<div class="a4-party-box">'
          +'<div class="a4-party-title">من</div>'
          +'<div class="a4-party-name">'+shop.name+'</div>'
          +'<div class="a4-party-sub">'+(shop.address||'')+'</div>'
        +'</div>'
        +'<div class="a4-party-box">'
          +'<div class="a4-party-title">إلى</div>'
          +(d.client
            ? '<div class="a4-party-name">'+d.client.name+'</div><div class="a4-party-sub">'+(d.client.phone||'')+'</div>'
            : '<div class="a4-party-name" style="color:#94a3b8">زبون عام</div>')
        +'</div>'
      +'</div>'
      +'<table class="a4-items-table">'
        +'<thead><tr>'
          +'<th style="width:36px">#</th>'
          +'<th>البيان</th>'
          +'<th style="width:60px;text-align:center">الكمية</th>'
          +'<th style="width:100px;text-align:left">سعر الوحدة</th>'
          +'<th style="width:110px;text-align:left">الإجمالي</th>'
        +'</tr></thead>'
        +'<tbody>'+rowsHtml+'</tbody>'
      +'</table>'
      +'<div class="a4-totals">'
        +'<div class="a4-tot-row"><span class="a4-tot-label">المجموع الفرعي</span><span class="a4-tot-val">'+Number(d.total).toFixed(2)+' دج</span></div>'
        +discRow
        +tvaRow
        +'<div class="a4-tot-row grand"><span class="a4-tot-label">الإجمالي الكلي</span><span class="a4-tot-val">'+grandTotal.toFixed(2)+' دج</span></div>'
      +'</div>'
    +'</div>'
    +'<div class="a4-footer">'
      +'<div class="a4-footer-msg">'+(shop.receiptFooter||'شكراً لتعاملكم معنا')+'</div>'
      +statusBadge
    +'</div>'
  +'</div>';
  var prev = document.getElementById('fi-preview');
  if(prev) prev.innerHTML = html;
}

function printFormalInvoice() {
  var content = document.getElementById('fi-preview');
  if(!content) return;
  var w = window.open('','_blank','width=900,height=700');
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">'
    +'<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">'
    +'<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Tajawal,Arial,sans-serif;padding:20px;background:#fff;}'
    +'.a4-invoice{max-width:800px;margin:0 auto;font-size:13px;}'
    +'.a4-header{background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;padding:28px 32px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:flex-start;}'
    +'.a4-shop-name{font-size:22px;font-weight:900;}.a4-shop-sub{font-size:11px;opacity:.75;}'
    +'.a4-inv-meta{text-align:left;font-size:12px;}.a4-inv-num{font-size:18px;font-weight:900;direction:ltr;}'
    +'.a4-inv-label{opacity:.75;font-size:10px;text-transform:uppercase;letter-spacing:1px;}'
    +'.a4-body{padding:24px 32px;}.a4-parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}'
    +'.a4-party-box{background:rgba(99,102,241,0.05);border-radius:10px;padding:14px 16px;border:1px solid rgba(99,102,241,0.1);}'
    +'.a4-party-title{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#6366f1;margin-bottom:8px;}'
    +'.a4-party-name{font-size:15px;font-weight:800;}.a4-party-sub{font-size:11px;color:#64748b;margin-top:2px;}'
    +'.a4-items-table{width:100%;border-collapse:collapse;margin-bottom:20px;}'
    +'.a4-items-table th{background:rgba(99,102,241,0.08);padding:10px 14px;font-size:10px;font-weight:900;color:#6366f1;text-align:right;border-bottom:2px solid rgba(99,102,241,0.15);}'
    +'.a4-items-table td{padding:10px 14px;font-size:12.5px;border-bottom:1px solid rgba(99,102,241,0.06);}'
    +'.a4-totals{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-bottom:20px;}'
    +'.a4-tot-row{display:flex;justify-content:space-between;width:260px;padding:6px 0;font-size:12px;font-weight:600;border-bottom:1px solid rgba(99,102,241,0.08);}'
    +'.a4-tot-row.grand{border-bottom:none;border-top:2px solid #6366f1;padding-top:10px;}'
    +'.a4-tot-val{font-weight:800;}.a4-tot-label{color:#64748b;}.a4-tot-row.grand .a4-tot-val{font-size:18px;font-weight:900;color:#6366f1;}'
    +'.a4-footer{background:rgba(99,102,241,0.04);border-top:2px solid rgba(99,102,241,0.1);padding:16px 32px;border-radius:0 0 10px 10px;display:flex;justify-content:space-between;align-items:center;}'
    +'.a4-footer-msg{font-size:11px;color:#64748b;max-width:380px;line-height:1.7;}'
    +'.a4-status-badge{padding:6px 14px;border-radius:20px;font-size:11px;font-weight:900;}'
    +'.a4-status-paid{background:#d1fae5;color:#065f46;}.a4-status-debt{background:#fee2e2;color:#7f1d1d;}.a4-status-partial{background:#fef3c7;color:#78350f;}'
    +'@media print{button{display:none!important}}</style></head><body>');
  w.document.write(content.innerHTML);
  w.document.write('<br><div style="text-align:center"><button onclick="window.print()" style="background:#6366f1;color:#fff;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-family:Tajawal,Arial">🖨️ طباعة</button></div>');
  w.document.write('</body></html>');
  w.document.close();
  setTimeout(function(){w.print();},600);
}

// ═══════════════════════════════════════════════════════════

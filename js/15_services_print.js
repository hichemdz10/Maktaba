// ── js/15_services_print.js ──
// ║  Print Services                                          ║
// ═══════════════════════════════════════════════════════════
function initPrint(){
  var grid = $('print-btns'); if(!grid) return;
  var types = shopSettings.printTypes || [];
  var html = '';
  types.forEach(function(pt){
    html += '<div class="pt-btn" onclick="selPrintType(\''+pt.id+'\',this)"><span class="pt-icon">'+(pt.icon||'🖨️')+'</span><div class="pt-name">'+pt.name+'</div><div class="pt-price">'+fmt(pt.price)+'</div></div>';
  });
  grid.innerHTML = html;
  selPrint = null; calcPrint();
}
function selPrintType(id, el){
  document.querySelectorAll('.pt-btn').forEach(function(b){ b.classList.remove('sel'); });
  el.classList.add('sel');
  var types = shopSettings.printTypes || [];
  selPrint = types.find(function(t){ return t.id === id; });
  calcPrint();
}
function calcPrint(){
  var qty = parseInt($('pr-qty').value)||1;
  if(!selPrint){ $('pr-total').textContent = '0 دج'; return; }
  var total = selPrint.price * qty;
  $('pr-total').textContent = fmt(total);
}
async function recordPrint(){
  if(!selPrint){ toast('اختر نوع الخدمة ❌','error'); return; }
  var qty = parseInt($('pr-qty').value)||1;
  if(qty <= 0){ toast('الكمية غير صالحة ❌','error'); return; }
  var total = selPrint.price * qty;
  var note = $('pr-note').value.trim();
  var sale = { id: genId(), typeId: selPrint.id, typeName: selPrint.name, qty: qty, price: selPrint.price, total: total, note: note||'', date: nowStr(), dateStr: today() };
  db.printSales.push(sale);
  await saveDB('printSales');
  // ✅ 5 — تأكيد بصري
  $('pc-type-name').textContent = selPrint.name;
  $('pc-qty-val').textContent = qty;
  $('pc-price-val').textContent = fmt(selPrint.price);
  $('pc-total-val').textContent = fmt(total);
  var nw=$('pc-note-wrap'),nv=$('pc-note-val');
  if(note&&nw&&nv){nw.style.display='block';nv.textContent=note;}else if(nw){nw.style.display='none';}
  // حفظ آخر عملية للطباعة لاحقاً
  window._lastPrintSale=sale;
  $('pr-qty').value = 1; $('pr-note').value = '';
  selPrint = null;
  document.querySelectorAll('.pt-btn').forEach(function(b){ b.classList.remove('sel'); });
  renderPrint(); autoPush(); beep();
  openModal('m-print-confirm');
}

function printPrintReceipt(){
  var s=window._lastPrintSale;if(!s)return;
  var w=window.open('','_blank','width=380,height=320');if(!w)return;
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;direction:rtl;padding:20px;text-align:center;font-size:13px}h3{color:#7c3aed;margin:0 0 12px}.line{border-top:1px dashed #ccc;margin:8px 0}.total{font-size:22px;font-weight:900;color:#7c3aed;margin:10px 0}@media print{button{display:none}}</style></head><body>');
  w.document.write('<h3>🖨️ '+shopSettings.name+'</h3>');
  w.document.write('<div>'+nowStr()+'</div><div class="line"></div>');
  w.document.write('<div style="font-size:15px;font-weight:800;margin:8px 0">'+s.typeName+'</div>');
  w.document.write('<div>'+s.qty+' × '+fmt(s.price)+'</div>');
  if(s.note)w.document.write('<div style="color:#64748b;font-size:11px">'+s.note+'</div>');
  w.document.write('<div class="line"></div><div class="total">'+fmt(s.total)+'</div>');
  w.document.write('<button onclick="window.print()" style="background:#7c3aed;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;margin-top:10px">🖨️ طباعة</button>');
  w.document.write('</body></html>');w.document.close();
}
function renderPrint(){
  var todayStr = today();
  var daySales = db.printSales.filter(function(s){ return s.dateStr === todayStr; });
  var total = 0, ops = daySales.length;
  daySales.forEach(function(s){ total += s.total; });
  if($('pr-day-tot')) $('pr-day-tot').textContent = fmt(total);
  if($('pr-ops')) $('pr-ops').textContent = ops;
  var listEl = $('pr-list');
  if(!listEl) return;
  if(!daySales.length){ listEl.innerHTML = '<div style="color:#9ca3af;font-size:12px;padding:12px">لا توجد عمليات اليوم</div>'; return; }
  var html = '';
  daySales.slice().reverse().forEach(function(s){
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f2f8"><div><span style="font-weight:700">'+s.typeName+'</span> ×'+s.qty+(s.note?' <span style="font-size:10px;color:#9ca3af">('+s.note+')</span>':'')+'</div><div style="font-weight:800;color:#7c3aed">'+fmt(s.total)+'</div></div>';
  });
  listEl.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════

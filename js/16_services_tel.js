// ── js/16_services_tel.js ──
// ║  Telecom Services                                        ║
// ═══════════════════════════════════════════════════════════
function initTelecom(){
  var grid = $('card-btns'); if(!grid) return;
  var html = '';
  CARD_TYPES.forEach(function(c){
    html += '<div class="ct-btn" onclick="onSelCard(\''+c.id+'\',this)"><div class="ct-name">'+c.name+' '+c.val+' دج</div><div class="ct-price">'+fmt(c.price)+'</div><div class="ct-profit">ربح '+fmt(shopSettings.cardProfit)+'</div></div>';
  });
  grid.innerHTML = html;
  selCard = null;
}
function switchService(tab, btn){
  document.querySelectorAll('#pg-services > .tabs .tab-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  var sp=$('svc-print'), st=$('svc-telecom');
  if(sp) sp.style.display = tab==='print' ? '' : 'none';
  if(st) st.style.display = tab==='telecom' ? '' : 'none';
  if(tab==='telecom') initTelecom();
  if(tab==='print') initPrint();
}
function switchTel(tab, btn){
  document.querySelectorAll('#svc-telecom .tab-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  $('tel-recharge').style.display = tab==='recharge'?'block':'none';
  $('tel-cards').style.display = tab==='cards'?'block':'none';
  if(tab==='cards') initTelecom();
}
function selOp(op, el){
  document.querySelectorAll('.op-btn').forEach(function(b){ b.classList.remove('sel'); });
  el.classList.add('sel');
  selOperator = op;
  calcRch();
}
function calcRch(){
  var amt = parseFloat($('rch-amt').value)||0;
  var profit = amt ? rechargeProfit(amt) : 0;
  $('rch-amt-d').textContent = fmt(amt);
  $('rch-prof-d').textContent = fmt(profit);
}
async function recordRch(){
  if(!selOperator){ toast('اختر المتعامل ❌','error'); return; }
  var amt = parseFloat($('rch-amt').value)||0;
  if(amt <= 0){ toast('أدخل مبلغاً صحيحاً ❌','error'); return; }
  var profit = rechargeProfit(amt);
  var opNames = { ooredoo:'Ooredoo', mobilis:'Mobilis', djezzy:'Djezzy' };
  var sale = { id: genId(), type:'recharge', operator: selOperator, operatorName: opNames[selOperator]||selOperator, amount: amt, profit: profit, date: nowStr(), dateStr: today() };
  db.telecomSales.push(sale);
  await saveDB('telecomSales');
  toast('تم تسجيل الشحن ✅','success');
  selOperator = null;
  document.querySelectorAll('.op-btn').forEach(function(b){ b.classList.remove('sel'); });
  $('rch-amt').value = ''; calcRch(); renderTel(); autoPush(); beep();
}
function onSelCard(id, el){
  document.querySelectorAll('.ct-btn').forEach(function(b){ b.classList.remove('sel'); });
  el.classList.add('sel');
  selCard = CARD_TYPES.find(function(c){ return c.id === id; });
}
async function recordCard(){
  if(!selCard){ toast('اختر نوع البطاقة ❌','error'); return; }
  var qty = parseInt($('card-qty').value)||1;
  if(qty <= 0){ toast('الكمية غير صالحة ❌','error'); return; }
  var profit = shopSettings.cardProfit * qty;
  var sale = { id: genId(), type:'card', cardId: selCard.id, cardName: selCard.name+' '+selCard.val+' دج', price: selCard.price, qty: qty, profit: profit, date: nowStr(), dateStr: today() };
  db.telecomSales.push(sale);
  await saveDB('telecomSales');
  toast('تم تسجيل بيع '+qty+' بطاقة ✅','success');
  selCard = null;
  document.querySelectorAll('.ct-btn').forEach(function(b){ b.classList.remove('sel'); });
  $('card-qty').value = 1; renderTel(); autoPush(); beep();
}
function renderTel(){
  var todayStr = today();
  var daySales = db.telecomSales.filter(function(s){ return s.dateStr === todayStr; });
  var totalProf = 0, rProf = 0, cProf = 0;
  daySales.forEach(function(s){ totalProf += s.profit||0; if(s.type==='recharge') rProf += s.profit||0; else cProf += s.profit||0; });
  if($('tel-day-prof')) $('tel-day-prof').textContent = fmt(totalProf);
  if($('tel-r-p')) $('tel-r-p').textContent = fmt(rProf);
  if($('tel-c-p')) $('tel-c-p').textContent = fmt(cProf);
  var histEl = $('tel-hist'); if(!histEl) return;
  if(!daySales.length){ histEl.innerHTML = '<div style="color:#9ca3af;font-size:12px;padding:12px">لا توجد عمليات اليوم</div>'; return; }
  var html = '';
  daySales.slice().reverse().forEach(function(s){
    if(s.type==='recharge') html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f2f8"><span>📱 شحن '+s.operatorName+' - '+fmt(s.amount)+'</span><span style="font-weight:800;color:#10b981">+'+fmt(s.profit)+'</span></div>';
    else html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f2f8"><span>🃏 '+s.cardName+' ×'+s.qty+'</span><span style="font-weight:800;color:#10b981">+'+fmt(s.profit)+'</span></div>';
  });
  histEl.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════

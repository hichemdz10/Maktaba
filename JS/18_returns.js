// ── js/18_returns.js ──
// ║  Returns                                                 ║
// ═══════════════════════════════════════════════════════════
function openReturnModal(){ $('ret-search').value = ''; $('ret-sel-prod').style.display = 'none'; $('ret-drop').style.display = 'none'; openModal('m-return'); setTimeout(function(){ $('ret-search').focus(); }, 100); }
function onRetSearch(q){
  var drop = $('ret-drop');
  if(!q || q.length<1){ drop.style.display = 'none'; return; }
  var ql = q.toLowerCase(), html = '', cnt = 0;
  for(var i=0; i<db.products.length && cnt<8; i++){
    var p = db.products[i];
    if(p.name.toLowerCase().indexOf(ql)>=0 || (p.barcode && normalizeBC(p.barcode).indexOf(normalizeBC(q))>=0)){
      html += '<div class="search-drop-item" onclick="selectReturnProduct(\''+p.id+'\')">'+p.name+' ('+(p.stock||0)+')</div>'; cnt++;
    }
  }
  drop.innerHTML = html || '<div style="padding:12px;text-align:center;color:#9ca3af">لا توجد نتائج</div>';
  drop.style.display = 'block';
}
function selectReturnProduct(id){
  var p = db.products.find(function(x){ return x.id===id; });
  if(!p) return;
  $('ret-pid').value = p.id;
  $('ret-sel-prod').innerHTML = '📦 '+p.name+' — السعر: '+fmt(p.price)+' | المخزون الحالي: '+(p.stock||0)+' (سيزيد بعد الإرجاع)';
  $('ret-sel-prod').style.display = 'block';
  $('ret-search').value = ''; $('ret-drop').style.display = 'none';
  $('ret-qty').value = 1; calcRet();
}
function calcRet(){
  var pid = $('ret-pid').value; if(!pid) return;
  var p = db.products.find(function(x){ return x.id===pid; }); if(!p) return;
  var qty = Math.max(1, parseInt($('ret-qty').value)||1);
  $('ret-qty').value = qty;
  $('ret-amt').value = (p.price * qty).toFixed(2);
}
async function confirmReturn(){
  var pid = $('ret-pid').value; if(!pid){ toast('اختر منتجاً ❌','error'); return; }
  var p = db.products.find(function(x){ return x.id===pid; }); if(!p) return;
  var qty = parseInt($('ret-qty').value)||1;
  if(qty <= 0){ toast('الكمية غير صالحة ❌','error'); return; }
  var amount = parseFloat($('ret-amt').value)||(p.price*qty);
  if(amount <= 0){ toast('المبلغ غير صالح ❌','error'); return; }
  var note = $('ret-note').value.trim() || 'مرتجع';
  // ✅ إصلاح: المرتجع يُعيد البضاعة للمخزون (زيادة لا خصم)
  var oldRetS=p.stock||0;
  p.stock = (p.stock||0) + qty;
  await saveDB('products');
  logStockChange(p.id, p.name, oldRetS, p.stock, 'مرتجع', AUTH.currentUser?AUTH.currentUser.username:'—');
  var ret = { id: genId(), productId: p.id, productName: p.name, quantity: qty, amount: amount, returnCost: (p.cost||0)*qty, note: note, date: nowStr(), dateStr: today() };
  db.returns.push(ret);
  await saveDB('returns');
  closeModal('m-return');
  toast('تم تسجيل المرتجع ✅ — أُعيد '+qty+' للمخزون','info',3500);
  if($('pg-inventory').classList.contains('active')) renderInv();
  autoPush(); beep('warning');
}

// ═══════════════════════════════════════════════════════════

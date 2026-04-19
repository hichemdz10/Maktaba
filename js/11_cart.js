// ── js/11_cart.js ──
// ║  CART                                                    ║
// ═══════════════════════════════════════════════════════════
function addToCart(prod,qty){
  qty=qty||1;
  var totalAlreadyReserved=getTotalReservedQty(prod.id);
  if(prod.stock!==undefined&&(totalAlreadyReserved+qty)>prod.stock){
    beep('error');
    var heldQty=totalAlreadyReserved;for(var ci=0;ci<cart.length;ci++){if(cart[ci].pid===prod.id)heldQty-=cart[ci].qty;}
    var msg='❌ المخزون لا يكفي! (متوفر: '+(prod.stock||0)+')';
    if(heldQty>0)msg+=' — '+heldQty+' محجوز في سلة معلقة';
    toast(msg,'error',3000);return;
  }
  beep();
  var found=false;
  for(var j=0;j<cart.length;j++){if(cart[j].pid===prod.id){cart[j].qty+=qty;found=true;break;}}
  if(!found)cart.push({pid:prod.id,name:prod.name,price:prod.price,unit:prod.unit||'قطعة',qty:qty});
  var newTotal=getTotalReservedQty(prod.id);
  if(prod.stock!==undefined&&prod.stock>0&&newTotal>=prod.stock){beep('warning');setTimeout(function(){toast('⚠️ آخر وحدة من: '+prod.name,'info',3500);},300);}
  renderCartList();updateCartTotals();pushDisplayCart();
}
function changeQty(pid,d){
  for(var i=0;i<cart.length;i++){
    if(cart[i].pid===pid){
      if(d>0){var prod=null;for(var k=0;k<db.products.length;k++){if(db.products[k].id===pid){prod=db.products[k];break;}}if(prod){var totalRes=getTotalReservedQty(pid);if((totalRes+d)>(prod.stock||0)){beep('error');toast('❌ تجاوزت المخزون الفعلي!','error');return;}}}
      cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);break;
    }
  }
  renderCartList();updateCartTotals();pushDisplayCart();
}
function removeFromCart(pid){cart=cart.filter(function(it){return it.pid!==pid;});renderCartList();updateCartTotals();pushDisplayCart();}
function clearCart(){clearCartSafe();}
function clampDiscount(){
  var inp=$('disc-in');if(!inp)return;
  var sub=0;for(var i=0;i<cart.length;i++)sub+=cart[i].price*cart[i].qty;
  var v=parseFloat(inp.value)||0;
  if(v<0){inp.value=0;}
  else if(v>sub&&sub>0){inp.value=sub.toFixed(2);}
}

// ══════════════════════════════════════════════
var _bundles=[];var _bundleLines=[];
function loadBundles(){try{var b=localStorage.getItem(BUNDLES_KEY);_bundles=b?JSON.parse(b):[];}catch(e){_bundles=[];}}
function saveBundlesLocal(){try{localStorage.setItem(BUNDLES_KEY,JSON.stringify(_bundles));}catch(e){}}
function $$(id){return document.getElementById(id);}

function openBundlesModal(){loadBundles();if($$('bundle-create-form'))$$('bundle-create-form').style.display='none';renderBundlesList();openModal('m-bundles');}
function openCreateBundle(){_bundleLines=[];if($$('bundle-name'))$$('bundle-name').value='';if($$('bundle-lines'))$$('bundle-lines').innerHTML='';if($$('bundle-create-form'))$$('bundle-create-form').style.display='block';if($$('bundle-name'))$$('bundle-name').focus();addBundleLine();}
function addBundleLine(){
  var idx=_bundleLines.length;
  _bundleLines.push({pid:'',name:'',qty:1});
  var el=document.createElement('div');
  el.style.cssText='display:grid;grid-template-columns:1fr 64px 32px;gap:6px;margin-bottom:6px;align-items:center';
  el.id='bline-'+idx;
  // بناء العناصر مباشرة بدون تداخل الاقتباسات
  var wrap=document.createElement('div'); wrap.style.position='relative';
  var inp=document.createElement('input');
  inp.className='input'; inp.style.cssText='font-size:12px;padding:7px 10px';
  inp.placeholder='ابحث عن منتج...';
  inp.setAttribute('oninput','onBundleLineSearch(this,'+idx+')');
  inp.setAttribute('onblur','hideBdrop('+idx+')');
  var drop=document.createElement('div');
  drop.id='bdrop-'+idx; drop.className='search-drop';
  drop.style.cssText='display:none;max-height:150px;overflow-y:auto';
  wrap.appendChild(inp); wrap.appendChild(drop);
  var qtyInp=document.createElement('input');
  qtyInp.type='number'; qtyInp.className='input';
  qtyInp.style.cssText='font-size:12px;padding:7px 4px;text-align:center';
  qtyInp.value='1'; qtyInp.min='1';
  qtyInp.setAttribute('oninput','_bundleLines['+idx+'].qty=Math.max(1,parseInt(this.value)||1)');
  var delBtn=document.createElement('button');
  delBtn.style.cssText='background:#fee2e2;border:none;border-radius:7px;width:30px;height:32px;cursor:pointer;color:#dc2626;font-size:13px;font-family:inherit';
  delBtn.textContent='✕';
  delBtn.setAttribute('onclick','removeBundleLine('+idx+')');
  el.appendChild(wrap); el.appendChild(qtyInp); el.appendChild(delBtn);
  var container=document.getElementById('bundle-lines');
  if(container) container.appendChild(el);
}
function hideBdrop(idx){
  setTimeout(function(){var d=document.getElementById('bdrop-'+idx);if(d)d.style.display='none';},200);
}
function removeBundleLine(idx){_bundleLines[idx]=null;var el=$$('bline-'+idx);if(el)el.style.display='none';}
function onBundleLineSearch(inp,idx){
  var q=inp.value.trim().toLowerCase();if(_bundleLines[idx])_bundleLines[idx].name=inp.value;
  var drop=document.getElementById('bdrop-'+idx);if(!drop)return;if(!q){drop.style.display='none';return;}
  var html='',cnt=0;
  for(var i=0;i<db.products.length&&cnt<7;i++){var p=db.products[i];if(p.name.toLowerCase().indexOf(q)>=0){html+='<div class="search-drop-item" onmousedown="selectBundleProd('+idx+',\''+p.id+'\',\''+p.name.replace(/'/g,"\\'")+'\')">'+p.name+'<span style="font-size:10px;color:#9ca3af;margin-right:6px">×'+p.stock+'</span></div>';cnt++;}}
  drop.innerHTML=html||'<div style="padding:8px;color:#9ca3af;font-size:11px">لا نتائج</div>';drop.style.display='block';
}
function selectBundleProd(idx,pid,name){
  if(_bundleLines[idx]){_bundleLines[idx].pid=pid;_bundleLines[idx].name=name;}
  var el=$$('bline-'+idx);if(el){var inp=el.querySelector('input:not([type="number"])');if(inp)inp.value=name;}
  var drop=$$('bdrop-'+idx);if(drop)drop.style.display='none';
}
function saveBundle(){
  var name=$$('bundle-name')&&$$('bundle-name').value.trim();
  if(!name){toast('أدخل اسم الباقة ❌','error');return;}
  var lines=_bundleLines.filter(function(l){return l&&(l.pid||l.name.trim());});
  if(!lines.length){toast('أضف صنفاً واحداً ❌','error');return;}
  _bundles.push({id:genId(),name:name,items:lines.map(function(l){return{pid:l.pid,name:l.name,qty:l.qty||1};})});
  saveBundlesLocal();if($$('bundle-create-form'))$$('bundle-create-form').style.display='none';
  renderBundlesList();renderBundlesSidebar();toast('تم حفظ الباقة ✅','success');
}
function renderBundlesList(){
  var el=document.getElementById('bundles-list');if(!el)return;
  if(!_bundles.length){el.innerHTML='<div style="text-align:center;color:#9ca3af;padding:40px;font-size:13px">لا توجد باقات بعد</div>';return;}
  var html='';
  _bundles.forEach(function(b){
    var total=0;b.items.forEach(function(it){var p=db.products.find(function(x){return x.id===it.pid;});if(p)total+=p.price*(it.qty||1);});
    html+='<div style="background:#f8fafc;border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid #e5e7eb"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-weight:800">🎒 '+b.name+'</div><div style="display:flex;gap:6px;align-items:center"><span style="font-weight:900;color:#7c3aed">'+fmt(total)+'</span><button onclick="addBundleToCart(\''+b.id+'\')" class="btn btn-p btn-sm" style="padding:4px 10px">🛒 للسلة</button><button onclick="deleteBundle(\''+b.id+'\')" style="background:#fee2e2;border:none;border-radius:7px;padding:4px 8px;cursor:pointer;color:#dc2626;font-size:12px">🗑️</button></div></div><div style="font-size:11px;color:#64748b">'+b.items.map(function(it){return(it.name);}).join(' • ')+'</div></div>';
  });
  el.innerHTML=html;
}
function addBundleToCart(bid){
  var b=_bundles.find(function(x){return x.id===bid;});if(!b)return;
  var added=0,missing=[];
  b.items.forEach(function(it){var prod=null;if(it.pid)prod=db.products.find(function(p){return p.id===it.pid;});if(!prod&&it.name)prod=db.products.find(function(p){return p.name===it.name;});if(prod){addToCart(prod,it.qty||1);added++;}else missing.push(it.name);});
  closeModal('m-bundles');showPage('cashier');
  toast('تمت إضافة الباقة ('+added+' صنف)'+(missing.length?' — غير موجود: '+missing.join('، '):''),'success',3500);
}
function addBundleToCartInline(bid){
  var b=_bundles.find(function(x){return x.id===bid;});if(!b)return;
  var added=0;
  b.items.forEach(function(it){var prod=null;if(it.pid)prod=db.products.find(function(p){return p.id===it.pid;});if(!prod&&it.name)prod=db.products.find(function(p){return p.name===it.name;});if(prod){addToCart(prod,it.qty||1);added++;}});
  toast('تمت إضافة الباقة ('+added+' صنف) 🎒','success',2500);
}
function deleteBundle(bid){if(!confirm('حذف هذه الباقة؟'))return;_bundles=_bundles.filter(function(b){return b.id!==bid;});saveBundlesLocal();renderBundlesList();renderBundlesSidebar();toast('تم الحذف','info');}
// ══ Z-Report ══
function printZReport(){
  var t=today(),sales=db.sales.filter(function(s){return s.dateStr===t;}),rets=db.returns.filter(function(r){return r.dateStr===t;}),tel=db.telecomSales.filter(function(s){return s.dateStr===t;}),prnt=db.printSales.filter(function(s){return s.dateStr===t;}),exp=db.expenses.filter(function(e){return e.date===t;});
  var totalSales=0,cashS=0,cardS=0,debtS=0,telP=0,printP=0,expT=0,retT=0;
  sales.forEach(function(s){totalSales+=s.total;if(s.method==='cash')cashS+=s.total;else if(s.method==='card')cardS+=s.total;else debtS+=s.total;});
  tel.forEach(function(s){telP+=s.profit||0;});prnt.forEach(function(s){printP+=s.total||0;});exp.forEach(function(e){expT+=e.amount||0;});rets.forEach(function(r){retT+=r.amount||0;});
  var margin=calcDailyMargin(sales,rets),net=margin+telP+printP-expT;
  var w=window.open('','_blank','width=420,height=660');if(!w){toast('السماح بالنوافذ ❌','error');return;}
  var css='*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;direction:rtl;width:80mm;margin:0 auto;padding:10px;font-size:12px}.sep{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between;padding:3px 0}.total{font-size:15px;font-weight:900;border-top:2px solid #000;margin-top:4px;padding-top:6px}.green{color:#16a34a}.red{color:#dc2626}@media print{button{display:none}}';
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>'+css+'</style></head><body><div style="text-align:center;font-weight:900;font-size:15px">'+shopSettings.name+'</div><div style="text-align:center;font-size:10px;color:#555">Z-Report — '+t+' | '+new Date().toLocaleTimeString('ar-DZ')+'</div><div class="sep"></div><div class="row"><span>عدد الفواتير</span><span><b>'+sales.length+'</b></span></div><div class="row"><span>💵 نقداً</span><span>'+fmt(cashS)+'</span></div><div class="row"><span>💳 بطاقة</span><span>'+fmt(cardS)+'</span></div><div class="row"><span>📝 دين</span><span class="red">'+fmt(debtS)+'</span></div><div class="sep"></div><div class="row"><span>⚡ الخدمات</span><span class="green">'+fmt(telP+printP)+'</span></div><div class="row"><span>🔄 المرتجعات</span><span class="red">−'+fmt(retT)+'</span></div><div class="row"><span>💸 المصاريف</span><span class="red">−'+fmt(expT)+'</span></div><div class="sep"></div><div class="row total"><span>صافي اليوم</span><span class="'+(net>=0?'green':'red')+'">'+fmt(net)+'</span></div><div class="row"><span>ربح المبيعات</span><span>'+fmt(margin)+'</span></div><div class="sep"></div><div style="text-align:center;font-size:10px;color:#888">'+shopSettings.receiptFooter+'</div><br><div style="text-align:center"><button onclick="window.print()" style="background:#5b21b6;color:#fff;padding:8px 20px;border:none;border-radius:8px;cursor:pointer">🖨️ طباعة</button></div></body></html>');
  w.document.close();
}

// ══ Supplier due date alerts ══
function checkSupplierDueDates(){
  var td=today(),soon=new Date();soon.setDate(soon.getDate()+3);var soonStr=soon.toISOString().slice(0,10);
  (db.purchases||[]).forEach(function(p){
    if((p.remaining||0)<=0||!p.dueDate)return;
    if(p.dueDate<=td)toast('🔴 تأخر سداد: '+p.supplier+' — '+fmt(p.remaining),'error',6000);
    else if(p.dueDate<=soonStr){var d=Math.round((new Date(p.dueDate)-new Date(td))/86400000);toast('🟡 موعد السداد بعد '+d+' يوم: '+p.supplier+' — '+fmt(p.remaining),'info',5000);}
  });
}

function updateCartTotals(){
  renderBundlesSidebar();
  var emptyEl=$('cart-empty'),sumEl=$('cart-sum-section'),badge=$('cp-cart-badge'),payEmpty=$('pay-empty-msg');
  var isEmpty=cart.length===0;
  if(emptyEl)emptyEl.style.display=isEmpty?'block':'none';
  if(sumEl)sumEl.style.display=isEmpty?'none':'block';
  if(payEmpty)payEmpty.style.display=isEmpty?'block':'none';
  if(isEmpty){if(badge)badge.style.display='none';if($('cash-given'))$('cash-given').value='';if($('change-display'))$('change-display').style.display='none';if($('change-warn'))$('change-warn').style.display='none';renderCartListNormal();return;}
  var totalQty=0,sub=0,cartProfit=0;
  for(var i=0;i<cart.length;i++){
    totalQty+=cart[i].qty;sub+=cart[i].price*cart[i].qty;
    var p=db.products.find(function(x){return x.id===cart[i].pid;});
    if(p)cartProfit+=(cart[i].price-(p.cost||0))*cart[i].qty;
  }
  if(badge){badge.style.display='inline-block';badge.textContent=totalQty;}
  var disc=parseFloat(($('disc-in')||{}).value)||0,total=Math.max(0,sub-disc);
  cartProfit=Math.max(0,cartProfit-disc);
  var margin=total>0?Math.round(cartProfit/total*100):0;
  var marginColor=margin>=30?'#16a34a':margin>=15?'#d97706':'#dc2626';
  if($('cart-cnt'))$('cart-cnt').textContent=cart.length+' صنف ('+totalQty+' وحدة)';
  if($('cart-sub'))$('cart-sub').textContent=fmt(sub);
  if($('cart-tot'))$('cart-tot').textContent=fmt(total);
  if($('cart-tot-sub'))$('cart-tot-sub').textContent=cart.length+' صنف / '+totalQty+' وحدة';
  var profitEl=$('cart-profit-display');
  if(profitEl){profitEl.innerHTML='<span style="color:#6b7280;font-weight:600">الربح المتوقع:</span> <span style="font-weight:900;color:'+marginColor+'">'+fmt(cartProfit)+'</span> <span style="font-size:10px;background:'+marginColor+'22;color:'+marginColor+';padding:1px 6px;border-radius:8px;font-weight:800">'+margin+'%</span>';}
  calcChange();
  renderCartListNormal();
}
function showPay(){
  // ── تهيئة الكاشيير الاحترافي
  var sel=$('sale-client');if(sel){sel.innerHTML='<option value="">اختر العميل...</option>';for(var i=0;i<db.clients.length;i++){var c=db.clients[i];sel.innerHTML+='<option value="'+c.id+'">'+c.name+(c.totalDebt?' — دين: '+fmt(c.totalDebt):'')+' </option>';}}
  document.querySelectorAll('.pay-chip').forEach(function(ch){ch.classList.remove('sel');});
  var first=document.querySelectorAll('.pay-chip')[0];if(first)first.classList.add('sel');
  var pm=$('pay-method');if(pm)pm.value='cash';
  var ci=$('cli-sel-wrap');if(ci)ci.style.display='none';
  var pw=$('partial-pay-wrap');if(pw)pw.style.display='none';
  var cw=$('cash-change-wrap');if(cw)cw.style.display='block';
  var dw=$('cli-debt-warn');if(dw)dw.style.display='none';
  // ── تهيئة الكاشيير العادي
  var ciN=$('cli-sel-wrap-n');if(ciN)ciN.style.display='none';
  var pwN=$('partial-pay-wrap-n');if(pwN)pwN.style.display='none';
  var cwN=$('cash-change-wrap-n');if(cwN)cwN.style.display='block';
  populateClientsNormal();
}
// ── هل التخطيط الاحترافي نشط؟
function _isProLayout(){return !!(document.getElementById('pro-cashier-layout')&&document.getElementById('pro-cashier-layout').offsetParent!==null);}

function selPay(method,el){
  document.querySelectorAll('.pay-chip').forEach(function(ch){ch.classList.remove('sel');});
  if(el)el.classList.add('sel');
  var pm=$('pay-method');if(pm)pm.value=method;

  // ── التخطيط الاحترافي ──
  var cw=$('cash-change-wrap');if(cw)cw.style.display=method==='cash'?'block':'none';
  var ci=$('cli-sel-wrap');if(ci)ci.style.display=method==='debt'?'block':'none';
  var pw=$('partial-pay-wrap');if(pw)pw.style.display=method==='partial'?'block':'none';
  var dw=$('cli-debt-warn');if(dw&&method!=='debt')dw.style.display='none';
  if(method==='partial'){populatePartialClients();}
  if($('cash-given')){$('cash-given').value='';calcChange();}
  if($('change-display'))$('change-display').style.display='none';
  if($('change-warn'))$('change-warn').style.display='none';

  // ── الكاشيير العادي ──
  var cwN=$('cash-change-wrap-n');if(cwN)cwN.style.display=method==='cash'?'block':'none';
  var ciN=$('cli-sel-wrap-n');if(ciN)ciN.style.display=method==='debt'?'block':'none';
  var pwN=$('partial-pay-wrap-n');if(pwN)pwN.style.display=method==='partial'?'block':'none';
  var dwN=$('cli-debt-warn-n');if(dwN&&method!=='debt')dwN.style.display='none';
  if(method==='partial'){populateClientsNormal();}
  if(method==='debt'){populateClientsNormal();}
  if($('cash-given-n')){$('cash-given-n').value='';calcChangeN();}
  if($('change-display-n'))$('change-display-n').style.display='none';
  if($('change-warn-n'))$('change-warn-n').style.display='none';

  pushDisplayCart();
}
// ── حاسبة الباقي - الكاشيير العادي ──
function calcChangeN(){
  var given=parseFloat(($('cash-given-n')||{}).value)||0;
  var sub=0;for(var i=0;i<cart.length;i++)sub+=cart[i].price*cart[i].qty;
  var disc=parseFloat(($('disc-in-normal')||$('disc-in')||{}).value)||0;
  var total=Math.max(0,sub-disc);
  if(!given){if($('change-display-n'))$('change-display-n').style.display='none';if($('change-warn-n'))$('change-warn-n').style.display='none';return;}
  var change=given-total;
  if(change<0){if($('change-display-n'))$('change-display-n').style.display='none';if($('change-warn-n'))$('change-warn-n').style.display='block';}
  else{if($('change-warn-n'))$('change-warn-n').style.display='none';if($('change-display-n'))$('change-display-n').style.display='block';if($('change-amount-n')){$('change-amount-n').textContent=change.toFixed(2)+' دج';$('change-amount-n').style.color=change===0?'#6b7280':'#16a34a';}}
}
// ── ملء قائمة العملاء للكاشيير العادي ──
function populateClientsNormal(){
  ['sale-client-n','partial-client-n'].forEach(function(sid){
    var sel=$(sid);if(!sel)return;
    sel.innerHTML='<option value="">اختر العميل...</option>';
    db.clients.forEach(function(cl){sel.innerHTML+='<option value="'+cl.id+'">'+cl.name+(cl.totalDebt?' — دين: '+fmt(cl.totalDebt):'')+' </option>';});
  });
}
function onSaleClientChangeN(){
  var id=($('sale-client-n')||{}).value;
  var warnEl=$('cli-debt-warn-n');
  if(warnEl){
    if(id){var cliW=db.clients.find(function(c){return c.id===id;});if(cliW&&(cliW.totalDebt||0)>0){warnEl.innerHTML='⚠️ لديه دين سابق: <strong>'+fmt(cliW.totalDebt)+'</strong>';warnEl.style.display='block';}else{warnEl.style.display='none';}}
    else{warnEl.style.display='none';}
  }
}
function calcPartialN(){
  var paid=parseFloat(($('partial-paid-n')||{}).value)||0;
  var sub=0;cart.forEach(function(it){sub+=it.price*it.qty;});
  var disc=parseFloat(($('disc-in-normal')||$('disc-in')||{}).value)||0;
  var total=Math.max(0,sub-disc);
  var el=$('partial-remain-n');if(!el)return;
  var rem=total-paid;
  if(paid>0&&rem>0){el.style.display='block';el.style.color='#d97706';el.textContent='المتبقي كدين: '+fmt(rem);}
  else if(paid>=total&&paid>0){el.style.display='block';el.style.color='#dc2626';el.textContent='⚠️ يساوي أو يتجاوز الإجمالي';}
  else{el.style.display='none';}
}
function calcChange(){var given=parseFloat(($('cash-given')||{}).value)||0;var sub=0;for(var i=0;i<cart.length;i++)sub+=cart[i].price*cart[i].qty;var disc=parseFloat(($('disc-in')||{}).value)||0,total=Math.max(0,sub-disc);if(!given){if($('change-display'))$('change-display').style.display='none';if($('change-warn'))$('change-warn').style.display='none';return;}var change=given-total;if(change<0){if($('change-display'))$('change-display').style.display='none';if($('change-warn'))$('change-warn').style.display='block';}else{if($('change-warn'))$('change-warn').style.display='none';if($('change-display'))$('change-display').style.display='block';if($('change-amount')){$('change-amount').textContent=change.toFixed(2)+' دج';$('change-amount').style.color=change===0?'#6b7280':'#16a34a';}}}
function setGiven(val){var gi=$('cash-given');if(gi){gi.value=val;calcChange();}}
function holdCart(){holdCartSafe();}
function resumeCart(id){if(cart.length&&!confirm('سلتك الحالية ستُمسح. هل تريد الاسترجاع؟'))return;var idx=-1;for(var i=0;i<heldCarts.length;i++){if(heldCarts[i].id===id){idx=i;break;}}if(idx>-1){cart=heldCarts[idx].items;heldCarts.splice(idx,1);localStorage.setItem(HELD_CARTS_KEY,JSON.stringify(heldCarts));renderCartList();updateCartTotals();renderHeldCarts();pushDisplayCart();toast('تم استرجاع الفاتورة ✅','success');}}
function renderHeldCarts(){var wrap=$('held-carts-wrap');if(!wrap)return;if(!heldCarts.length){wrap.style.display='none';return;}wrap.style.display='flex';var h='';for(var i=0;i<heldCarts.length;i++){h+='<button class="btn btn-out btn-sm" onclick="resumeCart(\''+heldCarts[i].id+'\')">⏱ '+heldCarts[i].name+'</button>';}wrap.innerHTML=h;}

// ═══════════════════════════════════════════════════════════

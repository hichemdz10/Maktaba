// ── js/07_settings.js ──
// ║  SETTINGS                                                ║
// ═══════════════════════════════════════════════════════════
function loadSettings(){
  var raw=localStorage.getItem(SETTINGS_KEY);if(raw){try{Object.assign(shopSettings,JSON.parse(raw));}catch(e){}}
  if(!shopSettings.dashLayout)shopSettings.dashLayout={stats:true,chart:true,sales:true,lowStock:true,quickExp:true,categories:true};
  var held=localStorage.getItem(HELD_CARTS_KEY);if(held){try{heldCarts=JSON.parse(held);}catch(e){}}
}
function confirmSaveSettings(){if(confirm('هل أنت متأكد من حفظ الإعدادات؟'))saveSettings();}
function saveSettings(){
  shopSettings.name=$('set-name').value.trim()||'مكتبة حشايشي';shopSettings.address=$('set-addr').value.trim()||'';shopSettings.phone=$('set-phone').value.trim();
  if($('set-tva'))shopSettings.tvaRate=parseFloat($('set-tva').value)||0;
  shopSettings.expiryAlert=parseInt($('set-expiry-alert').value)||30;shopSettings.lowStockAlert=parseInt($('set-low').value)||5;shopSettings.receiptHeader=$('set-r-head').value.trim();shopSettings.receiptFooter=$('set-r-foot').value.trim();shopSettings.receiptColor=$('set-r-color')?$('set-r-color').value:'#7c3aed';shopSettings.receiptFontSize=parseInt($('set-r-font')?$('set-r-font').value:13)||13;shopSettings.receiptShowUnit=$('set-r-showunit')?$('set-r-showunit').checked:true;shopSettings.receiptShowChange=$('set-r-showchange')?$('set-r-showchange').checked:false;
  shopSettings.flexyProfitLow=parseFloat($('set-t-low').value)||10;shopSettings.flexyProfitHigh=parseFloat($('set-t-high').value)||20;shopSettings.cardProfit=parseFloat($('set-t-card').value)||50;
  var rm=document.querySelector('input[name="receipt-mode"]:checked');shopSettings.receiptMode=rm?rm.value:'show';
  shopSettings.categories=tempCategories.slice();
  shopSettings.dashLayout={stats:$('dl-stats').checked,chart:$('dl-chart').checked,sales:$('dl-sales').checked,lowStock:$('dl-lowStock').checked,quickExp:$('dl-quickExp').checked,categories:$('dl-categories').checked};
  var ptRaw=$('set-print-types').value.split('\n'),newPt=[],oldIcons={};
  (shopSettings.printTypes||[]).forEach(function(pt){oldIcons[pt.name.trim()]=pt.icon;});
  for(var i=0;i<ptRaw.length;i++){var parts=ptRaw[i].split(':');if(parts.length>=2){var nName=parts[0].trim();newPt.push({id:'pt_'+i,name:nName,price:parseFloat(parts[1])||0,icon:oldIcons[nName]||'🖨️'});}}
  if(newPt.length)shopSettings.printTypes=newPt;
  // ── الطابعة الحرارية
  if($('set-thermal-width'))shopSettings.thermalWidth=parseInt($('set-thermal-width').value)||58;
  if($('set-thermal-charset'))shopSettings.thermalCharset=$('set-thermal-charset').value||'arabic';
  if($('set-thermal-autocut'))shopSettings.thermalAutoCut=$('set-thermal-autocut').checked;
  // ── نقاط الولاء
  if($('set-loyalty-enabled'))shopSettings.loyaltyEnabled=$('set-loyalty-enabled').checked;
  if($('set-loyalty-rate'))shopSettings.loyaltyRate=parseFloat($('set-loyalty-rate').value)||100;
  if($('set-loyalty-value'))shopSettings.loyaltyValue=parseFloat($('set-loyalty-value').value)||1;
  if($('set-loyalty-min'))shopSettings.loyaltyMin=parseInt($('set-loyalty-min').value)||50;
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(shopSettings));
  populateCategories();initPrint();renderDash();updateReceiptModeUI();initCashierDarkPref();
  try{var _sc=localStorage.getItem(ACTIVE_CART_KEY);if(_sc){var _sv=JSON.parse(_sc);if(Array.isArray(_sv)&&_sv.length>0){cart=_sv;renderCartList();updateCartTotals();toast('تم استعادة السلة ('+cart.length+' صنف) 🛒','info',3000);}}}catch(e){}
  loadBundles();setTimeout(checkSupplierDueDates,2500);
  toast('تم حفظ الإعدادات ✅','success');
}
function renderSettings(){
  $('set-name').value=shopSettings.name;$('set-addr').value=shopSettings.address;$('set-phone').value=shopSettings.phone||'';
  if($('set-tva'))$('set-tva').value=shopSettings.tvaRate||0;updateTvaPreview();
  $('set-low').value=shopSettings.lowStockAlert||5;if($('set-expiry-alert'))$('set-expiry-alert').value=shopSettings.expiryAlert||30;$('set-r-head').value=shopSettings.receiptHeader||'';$('set-r-foot').value=shopSettings.receiptFooter||'';if($('set-r-color'))$('set-r-color').value=shopSettings.receiptColor||'#7c3aed';if($('set-r-font'))$('set-r-font').value=shopSettings.receiptFontSize||13;if($('set-r-showunit'))$('set-r-showunit').checked=shopSettings.receiptShowUnit!==false;if($('set-r-showchange'))$('set-r-showchange').checked=!!shopSettings.receiptShowChange;
  $('set-t-low').value=shopSettings.flexyProfitLow||10;$('set-t-high').value=shopSettings.flexyProfitHigh||20;$('set-t-card').value=shopSettings.cardProfit||50;
  var lay=shopSettings.dashLayout;
  $('dl-stats').checked=lay.stats;$('dl-chart').checked=lay.chart;$('dl-sales').checked=lay.sales;$('dl-lowStock').checked=lay.lowStock;$('dl-quickExp').checked=lay.quickExp;$('dl-categories').checked=lay.categories;
  var mode=shopSettings.receiptMode||'show';var rmEl=$('rm-'+mode);if(rmEl)rmEl.checked=true;
  updateReceiptModeUI();tempCategories=(shopSettings.categories||[]).slice();renderCategoriesUI();
  var pts=(shopSettings.printTypes||[]).map(function(p){return p.name+':'+p.price;}).join('\n');$('set-print-types').value=pts;
  // ── الطابعة الحرارية
  if($('set-thermal-width'))$('set-thermal-width').value=shopSettings.thermalWidth||58;
  if($('set-thermal-charset'))$('set-thermal-charset').value=shopSettings.thermalCharset||'arabic';
  if($('set-thermal-autocut'))$('set-thermal-autocut').checked=shopSettings.thermalAutoCut!==false;
  // ── نقاط الولاء
  if($('set-loyalty-enabled'))$('set-loyalty-enabled').checked=!!shopSettings.loyaltyEnabled;
  if($('set-loyalty-rate'))$('set-loyalty-rate').value=shopSettings.loyaltyRate||100;
  if($('set-loyalty-value'))$('set-loyalty-value').value=shopSettings.loyaltyValue||1;
  if($('set-loyalty-min'))$('set-loyalty-min').value=shopSettings.loyaltyMin||50;
  updateLoyaltyUI();renderLoyaltyClientsSummary();
  renderPermissions();
}
function switchSettings(tabId,btn){
  document.querySelectorAll('#pg-settings .tab-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');
  document.querySelectorAll('.set-content').forEach(function(c){c.classList.remove('active');});$('set-tab-'+tabId).classList.add('active');
}
function updateTvaPreview(){
  var rate=parseFloat(($('set-tva')||{}).value)||0;
  var pv=$('tva-preview');if(!pv)return;
  if(rate<=0){pv.style.display='none';return;}
  pv.style.display='block';
  var ex=1000;
  pv.innerHTML='مثال: فاتورة بـ '+ex+' دج → TVA '+rate+'% = <strong>'+(ex*rate/100).toFixed(2)+' دج</strong> → الإجمالي <strong>'+(ex*(1+rate/100)).toFixed(2)+' دج</strong>';
}
function updateReceiptModeUI(){
  var mode=shopSettings.receiptMode||'show';
  ['hide','show','auto'].forEach(function(m){var lbl=$('rm-lbl-'+m);if(lbl)lbl.style.border='2px solid '+(m===mode?'#7c3aed':'#e5e7eb');});
}

// ── الطابعة الحرارية
function testThermalPrint(){
  var w=window.open('','_blank','width=400,height=500');
  if(!w){toast('السماح بالنوافذ المنبثقة ❌','error');return;}
  var width=shopSettings.thermalWidth||58;
  var sep=Array(width===80?48:32).join('-');
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">'+
    '<title>طباعة تجريبية</title>'+
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;direction:rtl;width:'+(width==='80'||width===80?'80mm':'58mm')+';padding:8px;font-size:12px}'+
    '.center{text-align:center}.bold{font-weight:bold}.sep{border-top:1px dashed #000;margin:6px 0}'+
    '@media print{body{margin:0}button{display:none!important}}</style></head><body>'+
    '<div class="center bold" style="font-size:16px">'+shopSettings.name+'</div>'+
    '<div class="center" style="font-size:10px">'+(shopSettings.address||'')+'</div>'+
    '<div class="sep"></div>'+
    '<div class="center bold">🖨️ طباعة تجريبية</div>'+
    '<div class="center" style="font-size:10px">عرض الورق: '+width+'mm</div>'+
    '<div class="sep"></div>'+
    '<div style="display:flex;justify-content:space-between"><span>منتج تجريبي × 2</span><span>200 دج</span></div>'+
    '<div style="display:flex;justify-content:space-between"><span>منتج آخر × 1</span><span>150 دج</span></div>'+
    '<div class="sep"></div>'+
    '<div style="display:flex;justify-content:space-between" class="bold"><span>الإجمالي</span><span>350 دج</span></div>'+
    '<div class="sep"></div>'+
    '<div class="center" style="font-size:10px">'+shopSettings.receiptFooter+'</div>'+
    (shopSettings.thermalAutoCut?'<div class="sep"></div>':'')+'<br>'+
    '<div class="center"><button onclick="window.print();setTimeout(()=>window.close(),500)" style="background:#7c3aed;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer">🖨️ طباعة</button></div>'+
    '</body></html>');
  w.document.close();
}

// ── نقاط الولاء — UI
function updateLoyaltyUI(){
  var enabled=$('set-loyalty-enabled')&&$('set-loyalty-enabled').checked;
  var body=$('loyalty-settings-body');
  var lbl=$('loyalty-toggle-lbl');
  var summary=$('loyalty-clients-summary');
  if(body)body.style.display=enabled?'block':'none';
  if(lbl)lbl.style.border='2px solid '+(enabled?'#7c3aed':'#e5e7eb');
  if(summary)summary.style.display=enabled?'block':'none';
  if(enabled){previewLoyalty();renderLoyaltyClientsSummary();}
}

function previewLoyalty(){
  var rate=parseFloat(($('set-loyalty-rate')||{}).value)||100;
  var val=parseFloat(($('set-loyalty-value')||{}).value)||1;
  var min=parseInt(($('set-loyalty-min')||{}).value)||50;
  var el=$('loyalty-preview-text');
  if(!el)return;
  el.innerHTML=
    'كل <strong>'+rate+' دج</strong> تساوي <strong>نقطة واحدة</strong><br>'+
    'النقطة الواحدة تساوي <strong>'+val+' دج خصم</strong><br>'+
    'الحد الأدنى للاستبدال: <strong>'+min+' نقطة</strong><br>'+
    '<span style="color:#7c3aed">مثال: زبون اشترى 1000 دج → يكسب '+Math.floor(1000/rate)+' نقطة → تساوي '+Math.floor(1000/rate)*val+' دج خصم</span>';
}

function renderLoyaltyClientsSummary(){
  var el=$('loyalty-clients-list');if(!el)return;
  var clients=(db.clients||[]).filter(function(c){return(c.loyaltyPoints||0)>0;});
  if(!clients.length){el.innerHTML='<div style="color:#9ca3af;padding:8px;font-size:12px">لا توجد نقاط مسجّلة بعد</div>';return;}
  var html='';
  clients.slice().sort(function(a,b){return (b.loyaltyPoints||0)-(a.loyaltyPoints||0);}).forEach(function(c){
    var pts=c.loyaltyPoints||0;
    var val=Math.floor(pts*(shopSettings.loyaltyValue||1));
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f2f8">'+
      '<span style="font-weight:700">'+c.name+'</span>'+
      '<span style="font-weight:900;color:#7c3aed">'+pts+' نقطة <span style="font-size:10px;color:#16a34a;font-weight:700">('+val+' دج)</span></span></div>';
  });
  el.innerHTML=html;
}

// ── منح النقاط عند البيع
function awardLoyaltyPoints(clientId, saleTotal){
  if(!shopSettings.loyaltyEnabled||!clientId)return;
  var client=db.clients.find(function(c){return c.id===clientId;});
  if(!client)return;
  var pts=Math.floor(saleTotal/(shopSettings.loyaltyRate||100));
  if(pts<=0)return;
  client.loyaltyPoints=(client.loyaltyPoints||0)+pts;
  saveDB('clients');
  toast('🎁 أُضيفت '+pts+' نقطة لـ '+client.name,'info',3000);
}

// ── استبدال النقاط في الدفع
function onSaleClientChange(){
  var id=($('sale-client')||{}).value;
  // تحذير الدين الحالي
  var warnEl=$('cli-debt-warn');
  if(warnEl){
    if(id){
      var cliW=db.clients.find(function(c){return c.id===id;});
      if(cliW&&(cliW.totalDebt||0)>0){
        warnEl.innerHTML='⚠️ هذا العميل لديه دين سابق: <strong>'+fmt(cliW.totalDebt)+'</strong><br><span style="font-size:10px;color:#f87171">سيُضاف الدين الجديد إلى الرصيد القائم</span>';
        warnEl.style.display='block';
      } else {
        warnEl.style.display='none';
      }
    } else {
      warnEl.style.display='none';
    }
  }
  if(!shopSettings.loyaltyEnabled){var w=$('loyalty-redeem-wrap');if(w)w.style.display='none';return;}
  var wrap=$('loyalty-redeem-wrap');
  var lrc=$('loyalty-redeem-check');
  if(lrc)lrc.checked=false;
  if(!id){if(wrap)wrap.style.display='none';return;}
  var client=db.clients.find(function(c){return c.id===id;});
  var pts=client?(client.loyaltyPoints||0):0;
  var minPts=shopSettings.loyaltyMin||50;
  if(pts>=minPts){
    if(wrap)wrap.style.display='block';
    var val=Math.floor(pts*(shopSettings.loyaltyValue||1));
    if($('loyalty-balance-display'))$('loyalty-balance-display').textContent=pts+' نقطة';
    if($('loyalty-redeem-amount'))$('loyalty-redeem-amount').textContent='= '+val+' دج خصم';
  } else {
    if(wrap)wrap.style.display='block';
    if($('loyalty-balance-display'))$('loyalty-balance-display').textContent=pts+' نقطة';
    if($('loyalty-redeem-amount'))$('loyalty-redeem-amount').textContent='(يلزم '+minPts+')';
    if($('loyalty-redeem-check'))$('loyalty-redeem-check').disabled=pts<minPts;
  }
}

function applyLoyaltyRedeem(){
  var checked=$('loyalty-redeem-check')&&$('loyalty-redeem-check').checked;
  var id=($('sale-client')||{}).value;
  if(!checked||!id){var di=$('disc-in');if(di&&di.dataset.loyaltyDisc){di.value=0;delete di.dataset.loyaltyDisc;updateCartTotals();}return;}
  var client=db.clients.find(function(c){return c.id===id;});
  var pts=client?(client.loyaltyPoints||0):0;
  var val=Math.floor(pts*(shopSettings.loyaltyValue||1));
  var di=$('disc-in');
  if(di){di.value=val;di.dataset.loyaltyDisc='1';clampDiscount();updateCartTotals();}
  toast('تم تطبيق '+val+' دج خصم من النقاط 🎁','success');
}

// ── طرح النقاط بعد الاستبدال وإضافة النقاط الجديدة
async function settleLoyaltyAfterSale(clientId, saleTotal, redeemed){
  if(!shopSettings.loyaltyEnabled||!clientId)return;
  var client=db.clients.find(function(c){return c.id===clientId;});
  if(!client)return;
  if(redeemed){client.loyaltyPoints=0;} // استُبدلت كل النقاط
  var pts=Math.floor(saleTotal/(shopSettings.loyaltyRate||100));
  if(pts>0){client.loyaltyPoints=(client.loyaltyPoints||0)+pts;toast('🎁 +'+pts+' نقطة لـ '+client.name,'info',2500);}
  await saveDB('clients');
}
// ══ Cashier Pro Layout ══
var _cashierDark=false;
var _cashierFS=false;
function initCashierDarkPref(){var p=localStorage.getItem('hch_cashier_dark');if(p==='1')_cashierDark=true;}

function toggleCashierFullscreen(){
  var pg=document.getElementById('pg-cashier');
  var proLayout=document.getElementById('pro-cashier-layout');
  var nh=document.getElementById('cashier-normal-header');
  var nv=document.getElementById('cashier-normal-view');
  _cashierFS=!_cashierFS;
  var sidebar=document.querySelector('.sidebar');
  var topbar=document.querySelector('.topbar');
  var main=document.querySelector('.main');
  if(_cashierFS){
    pg.classList.add('cashier-fullscreen','cashier-dark');
    if(proLayout)proLayout.style.display='flex';
    if(nh)nh.style.display='none';
    if(nv)nv.style.display='none';
    if(sidebar)sidebar.style.display='none';
    if(topbar)topbar.style.display='none';
    if(main){main.style.overflow='visible';main.style.padding='0';}
    document.body.style.overflow='hidden';
    var el=document.documentElement;
    if(el.requestFullscreen){el.requestFullscreen().catch(function(){});}
    else if(el.webkitRequestFullscreen){el.webkitRequestFullscreen();}
    setTimeout(function(){
      var s=document.getElementById('man-search');if(s)s.focus();
      renderQuickAccess();renderBundlesSidebar();
    },300);
  } else {
    pg.classList.remove('cashier-fullscreen','cashier-dark');
    if(proLayout)proLayout.style.display='none';
    if(nh)nh.style.display='';
    if(nv)nv.style.display='';
    if(sidebar)sidebar.style.display='';
    if(topbar)topbar.style.display='';
    if(main){main.style.overflow='';main.style.padding='';}
    document.body.style.overflow='';
    if(document.exitFullscreen&&document.fullscreenElement){document.exitFullscreen().catch(function(){});}
    else if(document.webkitExitFullscreen&&document.webkitFullscreenElement){document.webkitExitFullscreen();}
    renderCartListNormal();updateCartTotals();
  }
}
document.addEventListener('fullscreenchange',function(){
  if(!document.fullscreenElement&&_cashierFS){
    _cashierFS=false;
    var pg=document.getElementById('pg-cashier');
    var proLayout=document.getElementById('pro-cashier-layout');
    var nh=document.getElementById('cashier-normal-header');
    var nv=document.getElementById('cashier-normal-view');
    pg.classList.remove('cashier-fullscreen','cashier-dark');
    if(proLayout)proLayout.style.display='none';
    if(nh)nh.style.display='';
    if(nv)nv.style.display='';
    var s=document.querySelector('.sidebar');var t=document.querySelector('.topbar');var m=document.querySelector('.main');
    if(s)s.style.display='';if(t)t.style.display='';
    if(m){m.style.overflow='';m.style.padding='';}
    document.body.style.overflow='';
    renderCartListNormal();updateCartTotals();
  }
});

// ── السلة في الوضع العادي ──
function renderCartListNormal(){
  var listEl=document.getElementById('cart-list-normal');
  var emptyEl=document.getElementById('cart-empty-normal');
  var sumEl=document.getElementById('cart-sum-section-normal');
  var payEmpty=document.getElementById('pay-empty-normal');
  var badge=document.getElementById('cart-badge-normal');
  var totEl=document.getElementById('cart-tot-normal');
  if(!listEl)return;
  if(!cart.length){
    listEl.innerHTML='';
    if(emptyEl)emptyEl.style.display='block';
    if(sumEl)sumEl.style.display='none';
    if(payEmpty)payEmpty.style.display='block';
    if(badge)badge.style.display='none';
    return;
  }
  if(emptyEl)emptyEl.style.display='none';
  if(sumEl)sumEl.style.display='block';
  if(payEmpty)payEmpty.style.display='none';
  var html='',totalQty=0,sub=0;
  for(var i=0;i<cart.length;i++){
    var it=cart[i],total=it.price*it.qty; sub+=total; totalQty+=it.qty;
    var prod=null;
    for(var k=0;k<db.products.length;k++){if(db.products[k].id===it.pid){prod=db.products[k];break;}}
    var stk=prod?(prod.stock||0):999;
    var overStock=it.qty>stk;
    html+='<div class="cart-item" style="'+(overStock?'border-right:3px solid #dc2626;':'')+'">'+
      '<div class="ci-info"><div class="ci-name">'+it.name+'</div><div class="ci-unit">'+fmt(it.price)+' / '+it.unit+'</div>'+
      (overStock?'<div style="font-size:10px;color:#dc2626;font-weight:800">⚠️ تجاوز المخزون</div>':'')+
      '</div>'+
      '<div class="qty-ctrl">'+
        '<button class="qty-btn" onclick="changeQty(\''+it.pid+'\',-1)">−</button>'+
        '<span class="qty-n">'+it.qty+'</span>'+
        '<button class="qty-btn" onclick="changeQty(\''+it.pid+'\',1)">+</button>'+
      '</div>'+
      '<div class="ci-price">'+fmt(total)+'</div>'+
      '<button onclick="removeFromCart(\''+it.pid+'\')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:16px;padding:0 4px;flex-shrink:0">✕</button>'+
    '</div>';
  }
  listEl.innerHTML=html;
  if(badge){badge.style.display='inline-block';badge.textContent=totalQty;}
  var disc=parseFloat((document.getElementById('disc-in')||{}).value)||0;
  if(totEl)totEl.textContent=fmt(Math.max(0,sub-disc));
}

// مزامنة التخفيض بين الوضعين
function syncDiscount(src){
  var other=src.id==='disc-in'?document.getElementById('disc-in-normal'):document.getElementById('disc-in');
  if(other&&other.value!==src.value)other.value=src.value;
}

// holdCart/clearCart بدون تغيير الصفحة
function holdCartSafe(){
  if(!cart.length)return;
  var name=prompt('اسم الزبون للتمييز:','زبون '+(heldCarts.length+1));
  if(name===null)return;
  heldCarts.push({id:genId(),name:name||'بدون اسم',items:JSON.parse(JSON.stringify(cart))});
  localStorage.setItem(HELD_CARTS_KEY,JSON.stringify(heldCarts));
  cart=[];renderCartList();renderCartListNormal();updateCartTotals();renderHeldCarts();
  if(typeof pushDisplayCart==='function')pushDisplayCart();
  toast('تم تعليق الفاتورة ⏱️','info');
}
function clearCartSafe(){
  if(!cart.length)return;
  if(!confirm('تفريغ السلة؟'))return;
  cart=[];renderCartList();renderCartListNormal();updateCartTotals();
  if(typeof pushDisplayCart==='function')pushDisplayCart();
}

// البحث في الوضع العادي (يمرر للبحث الرئيسي)
function addBySearchNormal(){
  var inp=document.getElementById('man-search-normal');
  var qtyInp=document.getElementById('search-qty-normal');
  var ms=document.getElementById('man-search');
  var sq=document.getElementById('search-qty');
  if(ms&&inp){ms.value=inp.value;}
  if(sq&&qtyInp){sq.value=qtyInp.value;}
  addBySearch();
  if(inp)inp.value='';
}

// ── switchProTab ──
function switchProTab(tab,btn){
  var btns=document.querySelectorAll('.cp-tab-btn');
  for(var i=0;i<btns.length;i++) btns[i].classList.remove('active');
  btn.classList.add('active');
  var qa=document.getElementById('quick-qa-grid');
  var bu=document.getElementById('quick-bundles-grid');
  if(qa)qa.style.display=tab==='quick'?'grid':'none';
  if(bu)bu.style.display=tab==='bundles'?'grid':'none';
}

// ── Numpad (مع دعم الكيبورد) ──
var _npActivePid=null;
function openQtyNumpad(pid){
  _npActivePid=pid;
  var item=null;
  for(var i=0;i<cart.length;i++){if(cart[i].pid===pid){item=cart[i];break;}}
  if(!item)return;
  var nm=document.getElementById('np-item-name');
  var sc=document.getElementById('np-screen');
  if(nm)nm.innerText='تعديل كمية: '+item.name;
  if(sc)sc.innerText=item.qty;
  var modal=document.getElementById('numpad-modal');
  if(modal)modal.style.display='flex';
  document.addEventListener('keydown',_npKeyHandler);
}
function openQtyNumpadForAdd(pid){
  _npActivePid='__add__'+pid;
  var prod=null;
  for(var i=0;i<db.products.length;i++){if(db.products[i].id===pid){prod=db.products[i];break;}}
  var nm=document.getElementById('np-item-name');
  var sc=document.getElementById('np-screen');
  if(nm)nm.innerText='كمية: '+(prod?prod.name:'');
  if(sc)sc.innerText='1';
  var modal=document.getElementById('numpad-modal');
  if(modal)modal.style.display='flex';
  document.addEventListener('keydown',_npKeyHandler);
}
function _npKeyHandler(e){
  var modal=document.getElementById('numpad-modal');
  if(!modal||modal.style.display==='none'){document.removeEventListener('keydown',_npKeyHandler);return;}
  var key=e.key;
  if(key>='0'&&key<='9'){e.preventDefault();npPress(key);}
  else if(key==='Backspace'){e.preventDefault();npPress('DEL');}
  else if(key==='Delete'){e.preventDefault();npPress('C');}
  else if(key==='Escape'){e.preventDefault();closeNumpad();}
  else if(key==='Enter'){e.preventDefault();npConfirm();}
}
function closeNumpad(){
  var modal=document.getElementById('numpad-modal');
  if(modal)modal.style.display='none';
  _npActivePid=null;
  document.removeEventListener('keydown',_npKeyHandler);
}
function npPress(val){
  var sc=document.getElementById('np-screen');if(!sc)return;
  var cur=sc.innerText;
  if(val==='C'){sc.innerText='0';}
  else if(val==='DEL'){sc.innerText=cur.length>1?cur.slice(0,-1):'0';}
  else{sc.innerText=cur==='0'?val:cur+val;}
  if(parseInt(sc.innerText)>9999)sc.innerText='9999';
}
function npConfirm(){
  var sc=document.getElementById('np-screen');
  var val=sc?parseInt(sc.innerText)||0:0;
  if(!_npActivePid)return;
  if(_npActivePid.indexOf('__add__')===0){
    var pid=_npActivePid.replace('__add__','');
    var prod=null;
    for(var i=0;i<db.products.length;i++){if(db.products[i].id===pid){prod=db.products[i];break;}}
    if(prod&&val>0)addToCart(prod,val);
    closeNumpad();renderCartList();renderCartListNormal();updateCartTotals();
    if(typeof pushDisplayCart==='function')pushDisplayCart();
    return;
  }
  if(val<=0){
    var nc=[];for(var j=0;j<cart.length;j++){if(cart[j].pid!==_npActivePid)nc.push(cart[j]);}cart=nc;
  } else {
    for(var k=0;k<cart.length;k++){if(cart[k].pid===_npActivePid){cart[k].qty=val;break;}}
  }
  closeNumpad();renderCartList();renderCartListNormal();updateCartTotals();
  if(typeof pushDisplayCart==='function')pushDisplayCart();
}

// ── رسم السلة Pro ──
function renderCartList(){
  try{localStorage.setItem(ACTIVE_CART_KEY,JSON.stringify(cart));}catch(e){}
  var listEl=$('cart-list-desktop');
  if(!listEl){renderCartListNormal();return;}
  if(!cart.length){
    listEl.innerHTML='<div class="cp-cart-empty"><div class="cp-cart-empty-icon">🛒</div>'+
      '<div style="font-size:16px;font-weight:800;color:#334155">السلة فارغة</div>'+
      '<div style="font-size:12px;margin-top:6px;color:#4b5563">مرر الباركود أو ابحث عن منتج</div></div>';
    renderCartListNormal();return;
  }
  var html='';
  for(var i=0;i<cart.length;i++){
    var it=cart[i],total=it.price*it.qty;
    var prod=null;
    for(var k=0;k<db.products.length;k++){if(db.products[k].id===it.pid){prod=db.products[k];break;}}
    var stk=prod?(prod.stock||0):999;
    var overStock=it.qty>stk,atLimit=!overStock&&stk>0&&it.qty>=stk;
    var itemProfit=prod?((it.price-(prod.cost||0))*it.qty):null;
    var stockWarn=overStock?'<span style="color:#ef4444;font-size:10px;background:rgba(239,68,68,0.1);padding:2px 5px;border-radius:4px;">⚠️ تجاوز ('+stk+')</span>':
      atLimit?'<span style="color:#f59e0b;font-size:10px">⚠️ آخر وحدة</span>':'';
    var profitBadge=itemProfit!==null?'<div style="font-size:10px;color:'+(itemProfit>=0?'#059669':'#ef4444')+';font-weight:700">'+(itemProfit>=0?'+':'')+fmt(itemProfit)+'</div>':'';
    html+='<div class="cp-cart-row"'+(overStock?' style="background:rgba(239,68,68,0.05);"':'')+'>'+
      '<div style="flex:1;min-width:0"><div class="cp-c-name">'+it.name+' '+stockWarn+'</div>'+
        '<div class="cp-c-unit" style="display:flex;align-items:center;gap:5px">'+fmt(it.price)+' / '+it.unit+
        ' <button onclick="openCartPriceEdit(\''+it.pid+'\')" title="تعديل السعر" style="background:rgba(124,58,237,0.1);border:1px solid #ddd6fe;border-radius:5px;padding:1px 5px;font-size:9px;color:#7c3aed;cursor:pointer;font-family:inherit;font-weight:700">✏️ سعر</button></div>'+profitBadge+'</div>'+
      '<div class="cp-qty-ctrl">'+
        '<button class="cp-qty-btn" onclick="changeQty(\''+it.pid+'\',-1)">−</button>'+
        '<span class="cp-qty-val"'+(overStock?' style="color:#ef4444"':'')+'>'+it.qty+'</span>'+
        '<button class="cp-qty-btn" onclick="changeQty(\''+it.pid+'\',1)">+</button>'+
        '<button class="cp-qty-calc-btn" onclick="openQtyNumpad(\''+it.pid+'\')" title="⌨️">⌨️</button>'+
      '</div>'+
      '<div class="cp-c-total">'+fmt(total)+'</div>'+
      '<button class="cp-del-btn" onclick="removeFromCart(\''+it.pid+'\')">✕</button>'+
    '</div>';
  }
  listEl.innerHTML=html;
  renderCartListNormal();
}

// ── تعديل سعر صنف في السلة ──
function openCartPriceEdit(pid){
  if(!AUTH.can('edit_price')){toast('لا تملك صلاحية تعديل السعر ❌','error');return;}
  var it=null;for(var i=0;i<cart.length;i++){if(cart[i].pid===pid){it=cart[i];break;}}
  if(!it)return;
  var prod=db.products.find(function(x){return x.id===pid;});
  $('cpe-pid').value=pid;
  $('cpe-name').textContent=it.name;
  $('cpe-orig').textContent='السعر الأصلي: '+fmt(prod?prod.price:it.price);
  $('cpe-price').value=it.price;
  updateCpeProfitPreview();
  openModal('m-cart-price-edit');
  setTimeout(function(){$('cpe-price').focus();$('cpe-price').select();},120);
}
function updateCpeProfitPreview(){
  var pid=$('cpe-pid')&&$('cpe-pid').value;
  var np=parseFloat(($('cpe-price')||{}).value)||0;
  var prod=db.products.find(function(x){return x.id===pid;});
  var prev=$('cpe-profit-preview');
  if(!prev)return;
  if(prod&&np>0){
    var margin=np-(prod.cost||0);
    var pct=np>0?Math.round(margin/np*100):0;
    var col=margin>=0?'#059669':'#ef4444';
    prev.style.display='block';
    prev.style.borderColor=margin>=0?'#bbf7d0':'#fca5a5';
    prev.style.background=margin>=0?'#f0fdf4':'#fff5f5';
    prev.style.color=col;
    prev.innerHTML='هامش الربح: <strong>'+fmt(margin)+'</strong> ('+pct+'%)';
  } else { prev.style.display='none'; }
}
function saveCartPriceEdit(){
  var pid=$('cpe-pid').value;
  var np=parseFloat($('cpe-price').value);
  if(isNaN(np)||np<0){toast('سعر غير صالح ❌','error');return;}
  for(var i=0;i<cart.length;i++){if(cart[i].pid===pid){cart[i].price=np;break;}}
  closeModal('m-cart-price-edit');
  renderCartList();updateCartTotals();
  toast('تم تعديل السعر إلى '+fmt(np)+' ✅','success',2000);
}
function renderQuickAccess(){
  var grid=$('quick-qa-grid');
  if(!grid)return;
  var prods=_qaIds.map(function(id){return db.products.find(function(p){return p.id===id;});}).filter(Boolean);
  if(!prods.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:20px;color:#4b5563;font-size:12px">لم تقم بإضافة منتجات سريعة — اضغط <strong style="color:#818cf8">+ تعديل</strong></div>';
    return;
  }
  grid.innerHTML=prods.map(function(p){
    var stk=p.stock||0;
    var sc=stk<=0?'#ef4444':stk<=3?'#f59e0b':'#10b981';
    var stkLabel=stk<=0?'نفذ':stk<=5?stk+' متبقي':'';
    return '<div class="cp-item-card'+(stk<=0?' cp-item-out':'')+'">'+
      '<div onclick="addQuickProd(\''+p.id+'\')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;width:100%">'+
        '<div style="margin-bottom:2px">'+renderProductIcon(p,36)+'</div>'+
        '<div class="cp-item-name">'+p.name+'</div>'+
        '<div class="cp-item-price">'+fmt(p.price).replace(' دج','')+'دج</div>'+
        (stkLabel?'<div style="font-size:9px;font-weight:800;color:'+sc+'">'+stkLabel+'</div>':'')+
      '</div>'+
      '<button onclick="event.stopPropagation();openQtyNumpadForAdd(\''+p.id+'\')" title="تحديد الكمية" '+
        'style="width:22px;height:22px;border-radius:5px;border:1px solid #252545;background:#0f0f1e;color:#6b7280;font-size:11px;cursor:pointer;margin-top:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:inherit">⌨️</button>'+
    '</div>';
  }).join('');
}

// ── رسم الباقات ──
function renderBundlesSidebar(){
  loadBundles();
  var list=$('bundles-sidebar-list');
  if(list){
    if(!_bundles||!_bundles.length){
      list.innerHTML='<div style="font-size:11px;color:#6b7280;padding:4px 0">لا توجد باقات — <span style="color:#818cf8;cursor:pointer;text-decoration:underline" onclick="openBundlesModal()">أنشئ الآن</span></div>';
    } else {
      var lhtml='';
      for(var b=0;b<_bundles.length;b++){
        var bun=_bundles[b],tot=0;
        for(var bi=0;bi<bun.items.length;bi++){var pr=db.products.find(function(x){return x.id===bun.items[bi].pid;});if(pr)tot+=pr.price*(bun.items[bi].qty||1);}
        lhtml+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:#13131f;border-radius:8px;margin-bottom:5px;border:1px solid #1e1e3a">'+
          '<div><div style="font-size:11px;font-weight:800;color:#a5b4fc">🎒 '+bun.name+'</div><div style="font-size:10px;color:#6b7280">'+fmt(tot)+'</div></div>'+
          '<button onclick="addBundleToCartInline(\''+bun.id+'\')" style="background:rgba(99,102,241,.15);border:1px solid #4338ca;border-radius:7px;padding:4px 8px;font-size:11px;color:#818cf8;cursor:pointer;font-family:inherit">للسلة</button></div>';
      }
      list.innerHTML=lhtml;
    }
  }
  var grid=$('quick-bundles-grid');
  if(!grid)return;
  if(!_bundles||!_bundles.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:20px;color:#4b5563;font-size:12px">لا توجد باقات جاهزة</div>';
    return;
  }
  var html='';
  for(var c=0;c<_bundles.length;c++){
    var bun2=_bundles[c],tot2=0;
    for(var ci=0;ci<bun2.items.length;ci++){var pr2=db.products.find(function(x){return x.id===bun2.items[ci].pid;});if(pr2)tot2+=pr2.price*(bun2.items[ci].qty||1);}
    html+='<div class="cp-item-card cp-bundle-card" onclick="addBundleToCartInline(\''+bun2.id+'\')">'+
      '<div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:2px;box-shadow:0 2px 6px rgba(99,102,241,0.4)">🎒</div>'+
      '<div class="cp-item-name">'+bun2.name+'</div>'+
      '<div class="cp-item-price">'+fmt(tot2)+'</div></div>';
  }
  grid.innerHTML=html;
}

// ── showPage override (بدون auto-fullscreen) ──
var _origShowPage=showPage;
showPage=function(id){
  _origShowPage(id);
  if(id==='cashier'){
    setTimeout(function(){renderCartListNormal();},60);
  }
};

function toggleTheme(){shopSettings.darkMode=!shopSettings.darkMode;localStorage.setItem(SETTINGS_KEY,JSON.stringify(shopSettings));applyTheme();}
function applyTheme(){
  var btn=$('theme-btn'),btnM=$('theme-btn-m');
  if(shopSettings.darkMode){document.body.classList.add('dark-mode');if(btn)btn.textContent='☀️';if(btnM)btnM.textContent='☀️';}
  else{document.body.classList.remove('dark-mode');if(btn)btn.textContent='🌙';if(btnM)btnM.textContent='🌙';}
  // إعادة رسم المخططات بعد تغيير الثيم
  setTimeout(function(){
    if($('pg-dashboard').classList.contains('active')){drawMiniChart();drawTopProdsChart();drawRevVsExpChart();}
    if($('pg-reports').classList.contains('active')){drawMonthlyChart();genReport();}
  },100);
}
function renderCategoriesUI(){var wrap=$('cats-list-ui');if(!wrap)return;var html='';tempCategories.forEach(function(c,idx){html+='<div class="cat-chip"><span>'+c+'</span><span class="rm-btn" onclick="removeCategoryUI('+idx+')">✕</span></div>';});wrap.innerHTML=html||'<div style="color:#9ca3af;font-size:12px;">لا توجد أقسام</div>';}
function addCategoryUI(){var v=$('new-cat-input').value.trim();if(!v)return;if(tempCategories.indexOf(v)>-1){toast('القسم موجود مسبقاً ❌','error');return;}tempCategories.push(v);$('new-cat-input').value='';renderCategoriesUI();}
function removeCategoryUI(idx){tempCategories.splice(idx,1);renderCategoriesUI();}
function populateCategories(){var cats=shopSettings.categories||[];var opts=cats.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('');if($('np-cat'))$('np-cat').innerHTML=opts;if($('ep-cat'))$('ep-cat').innerHTML=opts;if($('cc-cat'))$('cc-cat').innerHTML=opts;if($('inv-cat'))$('inv-cat').innerHTML='<option value="">تصفية بكل الأقسام</option>'+opts;}
function openHTMLReceipt(){
  if(!lastSale)return;
  var sub=0;lastSale.items.forEach(function(it){sub+=it.price*it.qty;});
  var w=window.open('','_blank','width=500,height=700');
  if(!w){toast('السماح بالنوافذ المنبثقة ❌','error');return;}
  w.document.write(generateReceiptHTML(lastSale,sub,lastSale.discount||0));
  w.document.close();
}
function printLastReceiptFromSettings(){
  if(!lastSale)return toast('لا توجد مبيعة سابقة','info');
  openHTMLReceipt();
}

// ═══════════════════════════════════════════════════════════

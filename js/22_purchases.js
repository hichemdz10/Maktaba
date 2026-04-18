// ── js/22_purchases.js ──
// ║  PURCHASES — فواتير الداخلة                              ║
// ═══════════════════════════════════════════════════════════
var _purchaseLines=[];

function renderPurchases(){
  var search=($('pur-search')?$('pur-search').value.toLowerCase():'');
  var statusFilter=($('pur-filter')?$('pur-filter').value:'');
  var all=(db.purchases||[]).slice().sort(function(a,b){return (b.dateStr||'').localeCompare(a.dateStr||'');});
  var filtered=all.filter(function(p){
    if(statusFilter&&p.status!==statusFilter)return false;
    if(search&&(p.supplier||'').toLowerCase().indexOf(search)<0&&String(p.invoiceNum||'').toLowerCase().indexOf(search)<0)return false;
    return true;
  });
  // ── إحصائيات
  var todayStr=today(),monthStr=todayStr.slice(0,7);
  var totalMonth=0,totalDebt=0;
  all.forEach(function(p){
    if(p.dateStr&&p.dateStr.slice(0,7)===monthStr)totalMonth+=(p.total||0);
    totalDebt+=(p.remaining||0);
  });
  var suppliers=new Set(all.map(function(p){return p.supplier;})).size;
  var statsEl=$('pur-stat-row');
  if(statsEl)statsEl.innerHTML=
    '<div class="dash-combo-card dcc-blue"><div class="dcc-top"><div class="dcc-icon">📥</div><div class="dcc-label">مشتريات الشهر</div><div class="dcc-val">'+fmt(totalMonth)+'</div><div class="dcc-sub">'+all.filter(function(p){return p.dateStr&&p.dateStr.slice(0,7)===monthStr;}).length+' فاتورة</div></div></div>'+
    '<div class="dash-combo-card dcc-red"><div class="dcc-top"><div class="dcc-icon">⏳</div><div class="dcc-label">ديون للموردين</div><div class="dcc-val">'+fmt(totalDebt)+'</div><div class="dcc-sub">'+all.filter(function(p){return(p.remaining||0)>0;}).length+' فاتورة معلقة</div></div></div>'+
    '<div class="dash-combo-card dcc-teal"><div class="dcc-top"><div class="dcc-icon">🏭</div><div class="dcc-label">الموردون</div><div class="dcc-val">'+suppliers+'</div><div class="dcc-sub">مورد مختلف</div></div></div>';
  // ── القائمة
  var listEl=$('pur-list');if(!listEl)return;
  if(!filtered.length){listEl.innerHTML='<div style="text-align:center;padding:50px;color:#9ca3af;font-size:13px">لا توجد فواتير بعد<br><span style="font-size:11px">اضغط "فاتورة جديدة" لتسجيل أول فاتورة شراء</span></div>';return;}
  var sBadge={
    paid:'<span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800">✅ مدفوعة</span>',
    partial:'<span style="background:#fef3c7;color:#d97706;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800">🔶 جزئية</span>',
    unpaid:'<span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800">⏳ غير مدفوعة</span>'
  };
  var html='';
  filtered.forEach(function(p){
    html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f2f8;transition:.15s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">'+
          '<span style="font-weight:800;font-size:14px">'+p.supplier+'</span>'+
          (p.invoiceNum?'<span style="font-size:10px;color:#9ca3af;background:#f4f6fb;padding:2px 8px;border-radius:10px;font-family:monospace">#'+p.invoiceNum+'</span>':'')+
          (sBadge[p.status]||'')+
        '</div>'+
        '<div style="font-size:11px;color:#9ca3af">'+p.dateStr+' • '+(p.items||[]).length+' صنف'+(p.note?' • '+p.note:'')+' </div>'+
      '</div>'+
      '<div style="text-align:left;flex-shrink:0;margin:0 16px">'+
        '<div style="font-weight:900;color:#7c3aed;font-size:15px">'+fmt(p.total)+'</div>'+
        ((p.remaining||0)>0?'<div style="font-size:10px;color:#dc2626;font-weight:700">متبقي: '+fmt(p.remaining)+'</div>':
         '<div style="font-size:10px;color:#16a34a;font-weight:700">مسدّدة بالكامل ✓</div>')+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-shrink:0">'+
        ((p.remaining||0)>0?'<button class="action-btn-circle cart" onclick="openPaySupplierModal(\''+p.id+'\')" title="تسجيل دفعة">💰</button>':'')+
        '<button class="action-btn-circle edit" onclick="openEditPurchaseModal(\''+p.id+'\')" title="تعديل">✏️</button>'+
        '<button class="action-btn-circle" onclick="showPurchaseDetail(\''+p.id+'\')" title="التفاصيل" style="background:#ede9fe;color:#7c3aed;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px">👁️</button>'+
        '<button class="action-btn-circle del" onclick="deletePurchase(\''+p.id+'\')" title="حذف">🗑️</button>'+
      '</div>'+
    '</div>';
  });
  listEl.innerHTML=html;
}

function openNewPurchaseModal(){
  _purchaseLines=[];
  $('pur-supplier').value='';
  $('pur-inv-num').value='';
  $('pur-date').value=today();
  $('pur-due-date').value='';
  $('pur-note').value='';
  $('pur-paid-amt').value='';
  $('pur-bc-input').value='';
  $('pur-remaining-display').style.display='none';
  renderPurchaseLines();
  openModal('m-new-purchase');
  stopPurCamera('new');
  setTimeout(function(){$('pur-supplier').focus();},100);
}

function addPurchaseLine(){
  _purchaseLines.push({pid:'',name:'',qty:1,cost:0,price:0});
  renderPurchaseLines();
  setTimeout(function(){
    var inputs=document.querySelectorAll('#pur-lines input[data-role="name"]');
    if(inputs.length)inputs[inputs.length-1].focus();
  },60);
}

function removePurchaseLine(idx){
  _purchaseLines.splice(idx,1);
  renderPurchaseLines();
}

function updatePurLine(idx,field,val){
  if(!_purchaseLines[idx])return;
  if(field==='qty')_purchaseLines[idx].qty=Math.max(1,parseInt(val)||1);
  if(field==='cost')_purchaseLines[idx].cost=parseFloat(val)||0;
  if(field==='price')_purchaseLines[idx].price=parseFloat(val)||0;
  updatePurchaseTotal();
}

function onPurLineSearch(inp,idx){
  var q=inp.value.trim();
  if(_purchaseLines[idx].name!==q) _purchaseLines[idx].pid='';
  _purchaseLines[idx].name=q;
  var drop=$('pur-drop-'+idx);if(!drop)return;
  if(!q||q.length<1){drop.style.display='none';return;}
  var ql=q.toLowerCase(),html='',cnt=0;
  for(var i=0;i<db.products.length&&cnt<8;i++){
    var p=db.products[i];
    var nameMatch=p.name.toLowerCase().indexOf(ql)>=0;
    var bcMatch=p.barcode&&normalizeBC(p.barcode).indexOf(normalizeBC(q))>=0;
    if(nameMatch||bcMatch){
      html+='<div class="search-drop-item" onmousedown="selectPurProduct('+idx+',\''+p.id+'\',\''+p.name.replace(/\'/g,'\\\'').replace(/\"/g,'&quot;')+'\','+(p.cost||0)+','+(p.price||0)+')">'+
        '<span>'+(CAT_ICONS[p.category]||'📦')+'</span>'+
        '<div style="flex:1"><div style="font-weight:700;font-size:12px">'+p.name+(bcMatch&&!nameMatch?' <span style="font-size:10px;color:#16a34a;background:#dcfce7;padding:1px 5px;border-radius:4px">BC</span>':'')+'</div>'+
        '<div style="font-size:10px;color:#9ca3af">مخزون: '+p.stock+' • شراء: '+fmt(p.cost||0)+' • بيع: '+fmt(p.price||0)+'</div></div>'+
        '</div>';
      cnt++;
    }
  }
  drop.innerHTML=html||'<div style="padding:10px;color:#9ca3af;font-size:11px;text-align:center">لا نتائج — سيُضاف كصنف جديد مؤقتاً</div>';
  drop.style.display='block';
}

function selectPurProduct(idx,pid,name,cost,price){
  _purchaseLines[idx].pid=pid;
  _purchaseLines[idx].name=name;
  _purchaseLines[idx].cost=cost;
  _purchaseLines[idx].price=price||0;
  var nameInputs=document.querySelectorAll('#pur-lines input[data-role="name"]');
  if(nameInputs[idx]) nameInputs[idx].value=name;
  var drop=$('pur-drop-'+idx); if(drop) drop.style.display='none';
  var allRows=document.querySelectorAll('#pur-lines > div');
  if(allRows[idx]){
    var nums=allRows[idx].querySelectorAll('input[type="number"]');
    if(nums[1]&&cost>0) nums[1].value=cost;
    if(nums[2]&&price>0) nums[2].value=price;
  }
  updatePurchaseTotal();
}

function onPurLineBlur(idx,inp){
  setTimeout(function(){
    var drop=$('pur-drop-'+idx);if(drop)drop.style.display='none';
    if(inp&&_purchaseLines[idx])_purchaseLines[idx].name=inp.value;
  },200);
}

function renderPurchaseLines(){
  var el=$('pur-lines');if(!el)return;
  var cntEl=$('pur-lines-count');
  if(_purchaseLines.length&&cntEl) cntEl.textContent=_purchaseLines.length+' صنف';
  else if(cntEl) cntEl.textContent='';
  if(!_purchaseLines.length){
    el.innerHTML='<div style="color:#9ca3af;text-align:center;padding:24px;font-size:12px;border:1.5px dashed #e5e7eb;border-radius:10px;margin:8px 0">لا توجد أصناف — امسح الباركود أو اضغط "➕ يدوياً"</div>';
    updatePurchaseTotal();return;
  }
  var html='';
  _purchaseLines.forEach(function(line,idx){
    html+='<div style="display:grid;grid-template-columns:1fr 60px 90px 90px 32px;gap:6px;align-items:start;padding:8px 4px;border-bottom:1px solid #f0f2f8">'+
      '<div style="position:relative">'+
        '<input class="input" style="font-size:12px;padding:8px 10px'+(line.fromBC?';border-color:#86efac':'')+'" data-role="name" placeholder="ابحث أو اكتب اسم الصنف..." value="'+(line.name||'')+'" '+
        'oninput="onPurLineSearch(this,'+idx+')" onblur="onPurLineBlur('+idx+',this)">'+
        (line.fromBC?'<span style="position:absolute;top:50%;transform:translateY(-50%);left:8px;font-size:9px;background:#dcfce7;color:#16a34a;padding:1px 5px;border-radius:5px;font-weight:700">BC</span>':'')+
        '<div id="pur-drop-'+idx+'" class="search-drop" style="display:none;max-height:180px;overflow-y:auto"></div>'+
      '</div>'+
      '<input type="number" class="input" style="font-size:12px;padding:8px 4px;text-align:center" min="1" value="'+(line.qty||1)+'" '+
      'oninput="updatePurLine('+idx+',\'qty\',this.value)">'+
      '<input type="number" class="input" style="font-size:12px;padding:8px 4px;text-align:center;border-color:#fca5a5" placeholder="0.00" min="0" step="0.01" value="'+(line.cost||'')+'" '+
      'oninput="updatePurLine('+idx+',\'cost\',this.value)" title="سعر الشراء">'+
      '<input type="number" class="input" style="font-size:12px;padding:8px 4px;text-align:center;border-color:#86efac" placeholder="0.00" min="0" step="0.01" value="'+(line.price||'')+'" '+
      'oninput="updatePurLine('+idx+',\'price\',this.value)" title="سعر البيع">'+
      '<button onclick="removePurchaseLine('+idx+')" style="background:#fee2e2;border:none;border-radius:8px;width:32px;height:36px;cursor:pointer;color:#dc2626;font-size:14px;font-family:inherit">✕</button>'+
    '</div>';
  });
  el.innerHTML=html;
  updatePurchaseTotal();
}

function updatePurchaseTotal(){
  var total=0;
  _purchaseLines.forEach(function(l){total+=(l.qty||0)*(l.cost||0);});
  var el=$('pur-total-display');if(el)el.textContent=fmt(total);
  var paid=parseFloat(($('pur-paid-amt')||{}).value)||0;
  var rem=Math.max(0,total-paid);
  var remEl=$('pur-remaining-display');
  if(remEl){
    if(paid>0&&rem>0){remEl.style.display='block';remEl.textContent='⚠️ المتبقي للمورد: '+fmt(rem);}
    else if(paid>0&&rem<=0){remEl.style.display='block';remEl.style.background='#f0fdf4';remEl.style.borderColor='#bbf7d0';remEl.style.color='#16a34a';remEl.textContent='✅ الفاتورة مدفوعة بالكامل';}
    else{remEl.style.display='none';}
  }
}

async function savePurchase(){
  var supplier=($('pur-supplier')||{}).value.trim();
  if(!supplier){toast('اسم المورد مطلوب ❌','error');return;}
  if(!_purchaseLines.length){toast('أضف صنفاً واحداً على الأقل ❌','error');return;}
  for(var i=0;i<_purchaseLines.length;i++){
    if(!(_purchaseLines[i].name||'').trim()){toast('الصنف رقم '+(i+1)+' بدون اسم ❌','error');return;}
    if(!_purchaseLines[i].qty||_purchaseLines[i].qty<=0){toast('كمية غير صالحة في الصنف '+(i+1)+' ❌','error');return;}
  }
  var total=0;
  _purchaseLines.forEach(function(l){total+=(l.qty||0)*(l.cost||0);});
  var paid=Math.min(parseFloat(($('pur-paid-amt')||{}).value)||0,total);
  var remaining=Math.max(0,total-paid);
  var status=remaining<=0?'paid':(paid>0?'partial':'unpaid');
  // تحديث المخزون وسعر التكلفة — مع إنشاء المنتجات الجديدة تلقائياً
  var stockChanged=false;
  var newProdsCount=0;
  for(var pi=0;pi<_purchaseLines.length;pi++){
    var l=_purchaseLines[pi];
    var prod=null;
    if(l.pid) prod=db.products.find(function(x){return x.id===l.pid;});
    if(!prod&&(l.name||'').trim()) prod=db.products.find(function(x){return x.name===(l.name||'').trim();});
    if(prod){
      var oldPS=prod.stock||0;
      prod.stock=(prod.stock||0)+l.qty;
      if(l.cost>0)prod.cost=l.cost;
      if(l.price>0)prod.price=l.price;
      l.pid=prod.id;
      stockChanged=true;
      logStockChange(prod.id, prod.name, oldPS, prod.stock, 'استلام بضاعة ('+supplier+')', AUTH.currentUser?AUTH.currentUser.username:'—');
    } else if((l.name||'').trim()){
      // المنتج غير موجود — إنشاء تلقائي
      var newProd={id:genId(),name:l.name.trim(),category:'other',price:l.price>0?l.price:(l.cost>0?Math.round(l.cost*1.2*100)/100:0),cost:l.cost||0,stock:l.qty,barcodes:[],image:'',createdAt:nowStr()};
      db.products.push(newProd);
      l.pid=newProd.id;
      stockChanged=true;
      newProdsCount++;
    }
  }
  if(stockChanged)await saveDB('products');
  var purchase={
    id:genId(),
    invoiceNum:($('pur-inv-num')||{}).value.trim()||'',
    supplier:supplier,
    date:($('pur-date')||{}).value||today(),
    dateStr:($('pur-date')||{}).value||today(),
    items:JSON.parse(JSON.stringify(_purchaseLines)),
    total:total,paid:paid,remaining:remaining,status:status,
    payments:paid>0?[{amount:paid,note:'دفعة أولى',date:nowStr(),dateStr:today()}]:[],
    note:($('pur-note')||{}).value.trim()||'',
    dueDate:($('pur-due-date')||{}).value||'',
    createdAt:nowStr()
  };
  if(!db.purchases)db.purchases=[];
  db.purchases.push(purchase);
  await saveDB('purchases');
  stopPurCamera('new');
  closeModal('m-new-purchase');
  _purchaseLines=[];
  renderPurchases();
  var toastMsg='تم حفظ الفاتورة';
  if(newProdsCount>0) toastMsg+=' وإنشاء '+newProdsCount+' منتج جديد';
  if(stockChanged) toastMsg+=' وتحديث المخزون ✅';
  else toastMsg+=' ✅';
  toast(toastMsg,'success',3500);
  beep();autoPush();
}

function openPaySupplierModal(id){
  var pur=(db.purchases||[]).find(function(p){return p.id===id;});if(!pur)return;
  $('paysup-pid').value=id;
  $('paysup-amt').value='';
  $('paysup-note').value='';
  $('paysup-info').innerHTML=
    '<div style="font-weight:800;font-size:15px;margin-bottom:6px">'+pur.supplier+(pur.invoiceNum?' <span style="font-size:11px;color:#9ca3af;font-weight:400">#'+pur.invoiceNum+'</span>':'')+'</div>'+
    '<div style="display:flex;justify-content:space-between"><span>إجمالي الفاتورة</span><strong style="color:#7c3aed">'+fmt(pur.total)+'</strong></div>'+
    '<div style="display:flex;justify-content:space-between"><span>المدفوع حتى الآن</span><strong style="color:#16a34a">'+fmt(pur.paid)+'</strong></div>'+
    '<div style="display:flex;justify-content:space-between;border-top:1px dashed #e5e7eb;padding-top:6px;margin-top:4px"><span style="font-weight:700">المتبقي</span><strong style="color:#dc2626;font-size:16px">'+fmt(pur.remaining)+'</strong></div>';
  openModal('m-pay-supplier');
  setTimeout(function(){$('paysup-amt').focus();},100);
}

async function saveSupplierPayment(){
  var id=$('paysup-pid').value;
  var pur=(db.purchases||[]).find(function(p){return p.id===id;});if(!pur)return;
  var amt=parseFloat($('paysup-amt').value)||0;
  if(amt<=0){toast('أدخل مبلغاً صحيحاً ❌','error');return;}
  if(amt>(pur.remaining||0)+0.01){toast('المبلغ أكبر من المتبقي ❌','error');return;}
  pur.payments=pur.payments||[];
  pur.payments.push({amount:amt,note:$('paysup-note').value.trim()||'دفعة',date:nowStr(),dateStr:today()});
  // ✅ إصلاح: احتساب paid من مجموع payments لتجنب تراكم أخطاء الفاصلة العائمة
  var totalPaid=0;
  pur.payments.forEach(function(pmt){totalPaid+=pmt.amount||0;});
  pur.paid=Math.round(totalPaid*100)/100;
  pur.remaining=Math.max(0,Math.round((pur.total-pur.paid)*100)/100);
  pur.status=pur.remaining<=0?'paid':'partial';
  await saveDB('purchases');
  closeModal('m-pay-supplier');
  renderPurchases();
  toast('تم تسجيل الدفعة ✅','success');
  autoPush();
}

function showPurchaseDetail(id){
  var pur=(db.purchases||[]).find(function(p){return p.id===id;});if(!pur)return;
  var sLabel={paid:'✅ مدفوعة بالكامل',partial:'🔶 مدفوعة جزئياً',unpaid:'⏳ غير مدفوعة'};
  var sColor={paid:'#16a34a',partial:'#d97706',unpaid:'#dc2626'};
  var itemsHtml='';
  (pur.items||[]).forEach(function(it){
    itemsHtml+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f2f8">'+
      '<div><div style="font-weight:600;font-size:13px">'+it.name+'</div>'+
      '<div style="font-size:11px;color:#9ca3af">'+it.qty+' × '+fmt(it.cost||0)+'</div></div>'+
      '<div style="font-weight:700;color:#7c3aed">'+fmt((it.cost||0)*it.qty)+'</div></div>';
  });
  var paymentsHtml='';
  (pur.payments||[]).forEach(function(pay){
    paymentsHtml+='<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0f2f8">'+
      '<span style="color:#16a34a">💰 '+pay.note+' <span style="color:#9ca3af;font-size:10px">'+pay.date+'</span></span>'+
      '<span style="font-weight:700">'+fmt(pay.amount)+'</span></div>';
  });
  var base=new URL('./',location.href).href;
  var w=window.open('','_blank','width=520,height=640');if(!w){toast('السماح بالنوافذ المنبثقة ❌','error');return;}
  w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة شراء</title>'+
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;direction:rtl;padding:24px;background:#fff;color:#1e1b4b}'+
    'h2{color:#7c3aed;font-size:20px;margin-bottom:8px}.badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:16px}'+
    '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f8fafc;border-radius:12px;padding:14px;margin:12px 0;font-size:13px}'+
    '.section-title{font-weight:800;font-size:12px;color:#64748b;margin:16px 0 8px;text-transform:uppercase}'+
    '.totals{background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:12px;padding:14px;margin-top:16px;border:1px solid #ddd6fe}'+
    '.t-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}'+
    '.t-final{font-size:19px;font-weight:900;color:#7c3aed;border-top:2px solid #ddd6fe;padding-top:10px;margin-top:6px}'+
    '@media print{.no-print{display:none!important}}</style></head><body>');
  w.document.write('<h2>📥 فاتورة شراء</h2>');
  w.document.write('<span class="badge" style="background:'+(sColor[pur.status]||'#64748b')+'22;color:'+(sColor[pur.status]||'#64748b')+'">'+(sLabel[pur.status]||pur.status)+'</span>');
  w.document.write('<div class="info-grid">'+
    '<div><div style="font-size:10px;color:#9ca3af;font-weight:700">المورد</div><div style="font-weight:800;font-size:15px">'+pur.supplier+'</div></div>'+
    '<div><div style="font-size:10px;color:#9ca3af;font-weight:700">رقم الفاتورة</div><div style="font-weight:700;font-family:monospace">'+(pur.invoiceNum||'—')+'</div></div>'+
    '<div><div style="font-size:10px;color:#9ca3af;font-weight:700">التاريخ</div><div>'+pur.dateStr+'</div></div>'+
    '<div><div style="font-size:10px;color:#9ca3af;font-weight:700">عدد الأصناف</div><div>'+(pur.items||[]).length+' صنف</div></div>'+
    (pur.note?'<div style="grid-column:1/-1"><div style="font-size:10px;color:#9ca3af;font-weight:700">ملاحظة</div><div>'+pur.note+'</div></div>':'')+
    '</div>');
  w.document.write('<div class="section-title">الأصناف</div>'+itemsHtml);
  w.document.write('<div class="totals">'+
    '<div class="t-row t-final"><span>الإجمالي</span><span>'+fmt(pur.total)+'</span></div>'+
    '<div class="t-row" style="color:#16a34a"><span>المدفوع</span><span>'+fmt(pur.paid)+'</span></div>'+
    ((pur.remaining||0)>0?'<div class="t-row" style="color:#dc2626;font-weight:700"><span>المتبقي</span><span>'+fmt(pur.remaining)+'</span></div>':'')+
    '</div>');
  if(pur.payments&&pur.payments.length){
    w.document.write('<div class="section-title">سجل الدفعات</div>'+paymentsHtml);
  }
  w.document.write('<div class="no-print" style="text-align:center;margin-top:24px">'+
    '<button onclick="window.print()" style="background:#7c3aed;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:14px;cursor:pointer;font-weight:700">🖨️ طباعة</button></div>');
  w.document.write('</body></html>');w.document.close();
}

async function deletePurchase(id){
  var pur=(db.purchases||[]).find(function(p){return p.id===id;});if(!pur)return;
  if(!confirm('حذف فاتورة '+pur.supplier+' — '+fmt(pur.total)+'؟\n\n⚠️ سيتم طرح الكميات من المخزون تلقائياً.'))return;
  // عكس تأثير المخزون
  var stockChanged=false;
  (pur.items||[]).forEach(function(it){
    var prod=null;
    if(it.pid) prod=db.products.find(function(x){return x.id===it.pid;});
    if(!prod&&(it.name||'').trim()) prod=db.products.find(function(x){return x.name===(it.name||'').trim();});
    if(prod){
      prod.stock=Math.max(0,(prod.stock||0)-it.qty);
      stockChanged=true;
    }
  });
  if(stockChanged)await saveDB('products');
  db.purchases=db.purchases.filter(function(p){return p.id!==id;});
  await saveDB('purchases');
  renderPurchases();
  toast('تم الحذف'+(stockChanged?' وتعديل المخزون ✅':''),'info');
  autoPush();
}


// ═══════════════════════════════════════════════════════════

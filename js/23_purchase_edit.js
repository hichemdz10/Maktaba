// ── js/23_purchase_edit.js ──
// ║  EDIT PURCHASE — تعديل فاتورة الشراء                     ║
// ═══════════════════════════════════════════════════════════
var _editPurchaseLines=[];
var _editPurchaseOldLines=[];

function openEditPurchaseModal(id){
  var pur=(db.purchases||[]).find(function(p){return p.id===id;});if(!pur)return;
  $('edit-pur-id').value=id;
  $('edit-pur-supplier').value=pur.supplier||'';
  $('edit-pur-inv-num').value=pur.invoiceNum||'';
  $('edit-pur-date').value=pur.dateStr||today();
  $('edit-pur-due-date').value=pur.dueDate||'';
  $('edit-pur-note').value=pur.note||'';
  $('edit-pur-bc-input').value='';
  var remEl=$('edit-pur-remaining-display');
  if(remEl){remEl.style.display='none';}
  _editPurchaseLines=JSON.parse(JSON.stringify(pur.items||[]));
  _editPurchaseOldLines=JSON.parse(JSON.stringify(pur.items||[]));
  renderEditPurchaseLines();
  openModal('m-edit-purchase');
  stopPurCamera('edit');
  setTimeout(function(){$('edit-pur-supplier').focus();},100);
}

function addEditPurchaseLine(){
  _editPurchaseLines.push({pid:'',name:'',qty:1,cost:0,price:0});
  renderEditPurchaseLines();
  setTimeout(function(){
    var inputs=document.querySelectorAll('#edit-pur-lines input[data-role="ename"]');
    if(inputs.length)inputs[inputs.length-1].focus();
  },60);
}

function removeEditPurchaseLine(idx){
  _editPurchaseLines.splice(idx,1);
  renderEditPurchaseLines();
}

function updateEditPurLine(idx,field,val){
  if(!_editPurchaseLines[idx])return;
  if(field==='qty')_editPurchaseLines[idx].qty=Math.max(1,parseInt(val)||1);
  if(field==='cost')_editPurchaseLines[idx].cost=parseFloat(val)||0;
  if(field==='price')_editPurchaseLines[idx].price=parseFloat(val)||0;
  updateEditPurchaseTotal();
}

function onEditPurLineSearch(inp,idx){
  var q=inp.value.trim();
  if(_editPurchaseLines[idx].name!==q)_editPurchaseLines[idx].pid='';
  _editPurchaseLines[idx].name=q;
  var drop=$('edit-pur-drop-'+idx);if(!drop)return;
  if(!q){drop.style.display='none';return;}
  var ql=q.toLowerCase(),html='',cnt=0;
  for(var i=0;i<db.products.length&&cnt<8;i++){
    var p=db.products[i];
    var nameMatch=p.name.toLowerCase().indexOf(ql)>=0;
    var bcMatch=p.barcode&&normalizeBC(p.barcode).indexOf(normalizeBC(q))>=0;
    if(nameMatch||bcMatch){
      html+='<div class="search-drop-item" onmousedown="selectEditPurProduct('+idx+',\''+p.id+'\',\''+p.name.replace(/\'/g,'\\\'').replace(/\"/g,'&quot;')+'\','+(p.cost||0)+','+(p.price||0)+')">'+
        '<span>'+(CAT_ICONS[p.category]||'📦')+'</span>'+
        '<div style="flex:1"><div style="font-weight:700;font-size:12px">'+p.name+(bcMatch&&!nameMatch?' <span style="font-size:10px;color:#16a34a;background:#dcfce7;padding:1px 5px;border-radius:4px">BC</span>':'')+'</div>'+
        '<div style="font-size:10px;color:#9ca3af">مخزون: '+p.stock+' • شراء: '+fmt(p.cost||0)+' • بيع: '+fmt(p.price||0)+'</div></div></div>';
      cnt++;
    }
  }
  drop.innerHTML=html||'<div style="padding:10px;color:#9ca3af;font-size:11px;text-align:center">لا نتائج — سيُضاف كصنف جديد</div>';
  drop.style.display='block';
}

function selectEditPurProduct(idx,pid,name,cost,price){
  _editPurchaseLines[idx].pid=pid;
  _editPurchaseLines[idx].name=name;
  _editPurchaseLines[idx].cost=cost;
  _editPurchaseLines[idx].price=price||0;
  var nameInputs=document.querySelectorAll('#edit-pur-lines input[data-role="ename"]');
  if(nameInputs[idx])nameInputs[idx].value=name;
  var drop=$('edit-pur-drop-'+idx);if(drop)drop.style.display='none';
  var allRows=document.querySelectorAll('#edit-pur-lines > div');
  if(allRows[idx]){
    var nums=allRows[idx].querySelectorAll('input[type="number"]');
    if(nums[1]&&cost>0)nums[1].value=cost;
    if(nums[2]&&price>0)nums[2].value=price;
  }
  updateEditPurchaseTotal();
}

function onEditPurLineBlur(idx,inp){
  setTimeout(function(){
    var drop=$('edit-pur-drop-'+idx);if(drop)drop.style.display='none';
    if(inp&&_editPurchaseLines[idx])_editPurchaseLines[idx].name=inp.value;
  },200);
}

function renderEditPurchaseLines(){
  var el=$('edit-pur-lines');if(!el)return;
  var cntEl=$('edit-pur-lines-count');
  if(_editPurchaseLines.length&&cntEl) cntEl.textContent=_editPurchaseLines.length+' صنف';
  else if(cntEl) cntEl.textContent='';
  if(!_editPurchaseLines.length){
    el.innerHTML='<div style="color:#9ca3af;text-align:center;padding:24px;font-size:12px;border:1.5px dashed #e5e7eb;border-radius:10px;margin:8px 0">لا توجد أصناف — امسح الباركود أو اضغط "➕ يدوياً"</div>';
    updateEditPurchaseTotal();return;
  }
  var html='';
  _editPurchaseLines.forEach(function(line,idx){
    html+='<div style="display:grid;grid-template-columns:1fr 60px 90px 90px 32px;gap:6px;align-items:start;padding:8px 4px;border-bottom:1px solid #f0f2f8">'+
      '<div style="position:relative">'+
        '<input class="input" style="font-size:12px;padding:8px 10px'+(line.fromBC?';border-color:#86efac':'')+'" data-role="ename" placeholder="ابحث أو اكتب اسم الصنف..." value="'+(line.name||'')+'" '+
        'oninput="onEditPurLineSearch(this,'+idx+')" onblur="onEditPurLineBlur('+idx+',this)">'+
        (line.fromBC?'<span style="position:absolute;top:50%;transform:translateY(-50%);left:8px;font-size:9px;background:#dcfce7;color:#16a34a;padding:1px 5px;border-radius:5px;font-weight:700">BC</span>':'')+
        '<div id="edit-pur-drop-'+idx+'" class="search-drop" style="display:none;max-height:180px;overflow-y:auto"></div>'+
      '</div>'+
      '<input type="number" class="input" style="font-size:12px;padding:8px 4px;text-align:center" min="1" value="'+(line.qty||1)+'" '+
      'oninput="updateEditPurLine('+idx+',\'qty\',this.value)">'+
      '<input type="number" class="input" style="font-size:12px;padding:8px 4px;text-align:center;border-color:#fca5a5" placeholder="0.00" min="0" step="0.01" value="'+(line.cost||'')+'" '+
      'oninput="updateEditPurLine('+idx+',\'cost\',this.value)" title="سعر الشراء">'+
      '<input type="number" class="input" style="font-size:12px;padding:8px 4px;text-align:center;border-color:#86efac" placeholder="0.00" min="0" step="0.01" value="'+(line.price||'')+'" '+
      'oninput="updateEditPurLine('+idx+',\'price\',this.value)" title="سعر البيع">'+
      '<button onclick="removeEditPurchaseLine('+idx+')" style="background:#fee2e2;border:none;border-radius:8px;width:32px;height:36px;cursor:pointer;color:#dc2626;font-size:14px;font-family:inherit">✕</button>'+
    '</div>';
  });
  el.innerHTML=html;
  updateEditPurchaseTotal();
}

function updateEditPurchaseTotal(){
  var total=0;
  _editPurchaseLines.forEach(function(l){total+=(l.qty||0)*(l.cost||0);});
  var el=$('edit-pur-total-display');if(el)el.textContent=fmt(total);
  var id=($('edit-pur-id')||{}).value;
  var pur=id?(db.purchases||[]).find(function(p){return p.id===id;}):null;
  var paid=pur?((pur.paid)||0):0;
  var rem=Math.max(0,total-paid);
  var remEl=$('edit-pur-remaining-display');
  if(remEl){
    if(rem>0&&paid>0){remEl.style.display='block';remEl.style.background='#fffbeb';remEl.style.borderColor='#fde68a';remEl.style.color='#d97706';remEl.textContent='⚠️ المتبقي للمورد: '+fmt(rem);}
    else if(rem<=0&&paid>0){remEl.style.display='block';remEl.style.background='#f0fdf4';remEl.style.borderColor='#bbf7d0';remEl.style.color='#16a34a';remEl.textContent='✅ الفاتورة مدفوعة بالكامل';}
    else{remEl.style.display='none';}
  }
}

async function saveEditPurchase(){
  var id=$('edit-pur-id').value;
  var pur=(db.purchases||[]).find(function(p){return p.id===id;});if(!pur)return;
  var supplier=($('edit-pur-supplier')||{}).value.trim();
  if(!supplier){toast('اسم المورد مطلوب ❌','error');return;}
  if(!_editPurchaseLines.length){toast('أضف صنفاً واحداً على الأقل ❌','error');return;}
  for(var i=0;i<_editPurchaseLines.length;i++){
    if(!(_editPurchaseLines[i].name||'').trim()){toast('الصنف رقم '+(i+1)+' بدون اسم ❌','error');return;}
    if(!_editPurchaseLines[i].qty||_editPurchaseLines[i].qty<=0){toast('كمية غير صالحة ❌','error');return;}
  }
  // ── 1. طرح الكميات القديمة من المخزون
  _editPurchaseOldLines.forEach(function(it){
    var prod=null;
    if(it.pid) prod=db.products.find(function(x){return x.id===it.pid;});
    if(!prod&&(it.name||'').trim()) prod=db.products.find(function(x){return x.name===(it.name||'').trim();});
    if(prod) prod.stock=Math.max(0,(prod.stock||0)-it.qty);
  });
  // ── 2. إضافة الكميات الجديدة (مع إنشاء منتجات جديدة إن لزم)
  var newProdsCount=0;
  for(var pi=0;pi<_editPurchaseLines.length;pi++){
    var l=_editPurchaseLines[pi];
    var prod=null;
    if(l.pid) prod=db.products.find(function(x){return x.id===l.pid;});
    if(!prod&&(l.name||'').trim()) prod=db.products.find(function(x){return x.name===(l.name||'').trim();});
    if(prod){
      prod.stock=(prod.stock||0)+l.qty;
      if(l.cost>0)prod.cost=l.cost;
      if(l.price>0)prod.price=l.price;
      l.pid=prod.id;
    } else if((l.name||'').trim()){
      var newProd={id:genId(),name:l.name.trim(),category:'other',price:l.price>0?l.price:(l.cost>0?Math.round(l.cost*1.2*100)/100:0),cost:l.cost||0,stock:l.qty,barcodes:[],image:'',createdAt:nowStr()};
      db.products.push(newProd);
      l.pid=newProd.id;
      newProdsCount++;
    }
  }
  await saveDB('products');
  // ── 3. تحديث بيانات الفاتورة
  var newTotal=0;
  _editPurchaseLines.forEach(function(l){newTotal+=(l.qty||0)*(l.cost||0);});
  pur.supplier=supplier;
  pur.invoiceNum=($('edit-pur-inv-num')||{}).value.trim()||'';
  pur.dateStr=($('edit-pur-date')||{}).value||today();
  pur.date=pur.dateStr;
  pur.dueDate=($('edit-pur-due-date')||{}).value||'';
  pur.note=($('edit-pur-note')||{}).value.trim()||'';
  pur.items=JSON.parse(JSON.stringify(_editPurchaseLines));
  var diff=newTotal-pur.total;
  pur.total=newTotal;
  pur.remaining=Math.max(0,(pur.remaining||0)+diff);
  pur.paid=Math.max(0,newTotal-pur.remaining);
  pur.status=pur.remaining<=0?'paid':(pur.paid>0?'partial':'unpaid');
  await saveDB('purchases');
  stopPurCamera('edit');
  closeModal('m-edit-purchase');
  _editPurchaseLines=[];_editPurchaseOldLines=[];
  renderPurchases();
  var msg='تم حفظ التعديلات وتحديث المخزون ✅';
  if(newProdsCount>0)msg+=' ('+newProdsCount+' منتج جديد)';
  toast(msg,'success',3500);
  beep();autoPush();
}


// ═══════════════════════════════════════════════════════════
// ║  PURCHASE BARCODE SCANNER                                ║
// ═══════════════════════════════════════════════════════════
var _purCamStream={new:null,edit:null};
var _purCamRAF={new:null,edit:null};
var _purBcLastCode={new:'',edit:''};
var _purBcLastTime={new:0,edit:0};

// إضافة صنف عبر الباركود (مسح أو كتابة)
function addPurLineByBarcode(code, mode){
  code=normalizeBC(code);
  if(!code||code.length<2)return;
  var isNew=(mode!=='edit');
  var lines=isNew?_purchaseLines:_editPurchaseLines;
  // البحث عن المنتج بالباركود
  var prod=findProductByBarcode(code);
  if(prod){
    // تحقق إذا كان موجوداً في القائمة — إذاً زد الكمية
    var existing=null;
    for(var i=0;i<lines.length;i++){if(lines[i].pid===prod.id){existing=lines[i];break;}}
    if(existing){
      existing.qty=(existing.qty||1)+1;
      toast('➕ '+prod.name+' × '+existing.qty,'success',1500);
    } else {
      lines.push({pid:prod.id,name:prod.name,qty:1,cost:prod.cost||0,price:prod.price||0,fromBC:true});
      toast('✅ '+prod.name,'success',1500);
    }
  } else {
    // باركود غير مسجل — أضف سطراً جديداً فارغاً مع الباركود كاسم مبدئي
    lines.push({pid:'',name:code,qty:1,cost:0,price:0,fromBC:true});
    toast('📦 باركود جديد: '+code+' — أدخل الاسم والسعر','info',3000);
  }
  if(isNew) renderPurchaseLines(); else renderEditPurchaseLines();
  beep();
  // مسح حقل الباركود
  var inp=$(isNew?'pur-bc-input':'edit-pur-bc-input');
  if(inp){inp.value='';inp.focus();}
}

// حدث Enter في حقل الباركود
function onPurBarcodeKey(e, mode){
  if(e.key==='Enter'){
    e.preventDefault();
    var inp=e.target;
    var code=(inp.value||'').trim();
    if(code) addPurLineByBarcode(code, mode);
  }
}

// تشغيل كاميرا الفاتورة
function startPurCamera(mode){
  if(!('BarcodeDetector' in window)){toast('الكاميرا تحتاج Chrome أو Edge ❌','error',3500);return;}
  if(_purCamStream[mode])return; // شغالة مسبقاً
  var videoId=(mode==='new')?'pur-cam-video':'edit-pur-cam-video';
  var wrapId=(mode==='new')?'pur-cam-wrap':'edit-pur-cam-wrap';
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}})
    .catch(function(){return navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});})
    .then(function(stream){
      _purCamStream[mode]=stream;
      var v=$(videoId),wrap=$(wrapId);
      if(!v){stopPurCamera(mode);return;}
      v.srcObject=stream;
      v.play();
      if(wrap)wrap.style.display='block';
      var det=new BarcodeDetector({formats:['ean_13','ean_8','code_128','code_39','code_93','upc_a','upc_e','itf','codabar']});
      function scan(){
        if(!_purCamStream[mode])return;
        _purCamRAF[mode]=requestAnimationFrame(scan);
        if(v.readyState<2)return;
        det.detect(v).then(function(codes){
          if(!codes.length)return;
          var code=normalizeBC(codes[0].rawValue),now=Date.now();
          if(code.length<2)return;
          if(code===_purBcLastCode[mode]&&(now-_purBcLastTime[mode])<2000)return;
          _purBcLastCode[mode]=code;
          _purBcLastTime[mode]=now;
          addPurLineByBarcode(code, mode);
        }).catch(function(){});
      }
      scan();
    })
    .catch(function(err){toast('لا يمكن الوصول للكاميرا: '+err.message,'error');});
}

// إيقاف كاميرا الفاتورة
function stopPurCamera(mode){
  if(_purCamRAF[mode]){cancelAnimationFrame(_purCamRAF[mode]);_purCamRAF[mode]=null;}
  if(_purCamStream[mode]){_purCamStream[mode].getTracks().forEach(function(t){t.stop();});_purCamStream[mode]=null;}
  _purBcLastCode[mode]='';_purBcLastTime[mode]=0;
  var videoId=(mode==='new')?'pur-cam-video':'edit-pur-cam-video';
  var wrapId=(mode==='new')?'pur-cam-wrap':'edit-pur-cam-wrap';
  var v=$(videoId);if(v)v.srcObject=null;
  var wrap=$(wrapId);if(wrap)wrap.style.display='none';
}
var _cashSession = null;

function loadCashSession(){
  try{ var r=localStorage.getItem(CASH_SESSION_KEY); _cashSession=r?JSON.parse(r):null; }catch(e){ _cashSession=null; }
}
function saveCashSession(){
  if(_cashSession) localStorage.setItem(CASH_SESSION_KEY,JSON.stringify(_cashSession));
  else localStorage.removeItem(CASH_SESSION_KEY);
}
function renderSessionStrip(){
  var wrap=$('session-strip-wrap'); if(!wrap)return;
  loadCashSession();
  if(!_cashSession||_cashSession.status==='closed'){
    wrap.innerHTML='<div class="session-strip closed">'+
      '<div class="ss-info"><div class="ss-dot closed"></div><div><div class="ss-label">الصندوق مغلق</div><div class="ss-sub">افتح الصندوق لبدء العمل</div></div></div>'+
      '<button class="btn btn-g btn-sm" onclick="openModal(\'m-open-session\');$(\'os-amount\').value=\'\';$(\'os-note\').value=\'\'">🟢 فتح الصندوق</button>'+
    '</div>';
  } else {
    var cashToday=0;
    db.sales.forEach(function(s){if(s.method==='cash'&&s.date>=_cashSession.openTime)cashToday+=s.total;});
    var expected=(_cashSession.openAmount||0)+cashToday;
    wrap.innerHTML='<div class="session-strip open">'+
      '<div class="ss-info"><div class="ss-dot open"></div>'+
      '<div><div class="ss-label">الصندوق مفتوح — منذ '+_cashSession.openTime.split(' ')[1]+'</div>'+
      '<div class="ss-sub">رصيد البداية: '+fmt(_cashSession.openAmount)+' | مبيعات نقدية: '+fmt(cashToday)+' | المتوقع: '+fmt(expected)+'</div></div></div>'+
      '<button class="btn btn-r btn-sm" onclick="prepareCloseSession()">🔴 إغلاق الصندوق</button>'+
    '</div>';
  }
}
function openSession(){
  var amt=parseFloat($('os-amount').value)||0;
  var note=$('os-note').value.trim();
  _cashSession={id:genId(),date:today(),openTime:nowStr(),openAmount:amt,note:note,status:'open',closeTime:null,closeAmount:null,closeDiff:null};
  saveCashSession();
  closeModal('m-open-session');
  renderSessionStrip();
  toast('تم فتح الصندوق برصيد '+fmt(amt)+' ✅','success');
}
function prepareCloseSession(){
  if(!_cashSession||_cashSession.status!=='open')return;
  var cashToday=0;
  db.sales.forEach(function(s){if(s.method==='cash'&&s.date>=_cashSession.openTime)cashToday+=s.total;});
  var expected=(_cashSession.openAmount||0)+cashToday;
  $('cs-summary').innerHTML=
    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f2f8"><span style="color:#64748b;font-weight:600">رصيد البداية</span><span style="font-weight:800">'+fmt(_cashSession.openAmount)+'</span></div>'+
    '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f2f8"><span style="color:#64748b;font-weight:600">مبيعات نقدية خلال الوردية</span><span style="font-weight:800;color:#7c3aed">'+fmt(cashToday)+'</span></div>'+
    '<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="font-weight:700">المبلغ المتوقع في الصندوق</span><span style="font-weight:900;font-size:16px;color:#16a34a">'+fmt(expected)+'</span></div>';
  $('cs-actual').value=''; $('cs-note').value='';
  $('cs-diff-wrap').style.display='none';
  openModal('m-close-session');
}
function calcCloseDiff(){
  var actual=parseFloat($('cs-actual').value)||0;
  var cashToday=0;
  db.sales.forEach(function(s){if(_cashSession&&s.method==='cash'&&s.date>=_cashSession.openTime)cashToday+=s.total;});
  var expected=(_cashSession.openAmount||0)+cashToday;
  var diff=actual-expected;
  var wrap=$('cs-diff-wrap');
  if(!$('cs-actual').value){wrap.style.display='none';return;}
  wrap.style.display='block';
  if(Math.abs(diff)<0.01){wrap.style.background='#f0fdf4';wrap.style.color='#16a34a';wrap.textContent='✅ الصندوق متطابق تماماً';}
  else if(diff>0){wrap.style.background='#f0fdf4';wrap.style.color='#16a34a';wrap.textContent='↑ زيادة: '+fmt(diff);}
  else{wrap.style.background='#fff1f2';wrap.style.color='#dc2626';wrap.textContent='↓ عجز: '+fmt(Math.abs(diff));}
}
function closeSession(){
  if(!_cashSession||_cashSession.status!=='open')return;
  var actual=parseFloat($('cs-actual').value)||0;
  var cashToday=0;
  db.sales.forEach(function(s){if(s.method==='cash'&&s.date>=_cashSession.openTime)cashToday+=s.total;});
  var expected=(_cashSession.openAmount||0)+cashToday;
  _cashSession.status='closed';
  _cashSession.closeTime=nowStr();
  _cashSession.closeAmount=actual;
  _cashSession.closeDiff=actual-expected;
  _cashSession.closeNote=$('cs-note').value.trim();
  saveCashSession();
  closeModal('m-close-session');
  renderSessionStrip();
  var diffTxt=Math.abs(_cashSession.closeDiff)<0.01?'متطابق':(_cashSession.closeDiff>0?'زيادة '+fmt(_cashSession.closeDiff):'عجز '+fmt(Math.abs(_cashSession.closeDiff)));
  toast('تم إغلاق الصندوق — '+diffTxt,'info',4000);
}


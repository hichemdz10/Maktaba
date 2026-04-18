// ── js/27_suppliers.js ──
// ║  SUPPLIERS MODULE                                       ║
// ═══════════════════════════════════════════════════════════
if(!db.suppliers) db.suppliers = [];
if(!db.supplierPayments) db.supplierPayments = [];

function renderSuppliers() {
  var s = (document.getElementById('sup-search')||{}).value || '';
  var sort = (document.getElementById('sup-sort')||{}).value || 'debt';
  var suppliers = db.suppliers.filter(function(sup){
    if(!s) return true;
    return sup.name.toLowerCase().indexOf(s.toLowerCase())>=0 || (sup.phone&&sup.phone.indexOf(s)>=0);
  });
  // Calculate debt for each
  suppliers = suppliers.map(function(sup){
    var totalPurchased = db.purchases.filter(function(p){return p.supplier===sup.name||p.supplierId===sup.id;}).reduce(function(a,p){return a+(p.total||0);},0);
    var totalPaid = db.supplierPayments.filter(function(py){return py.supplierId===sup.id;}).reduce(function(a,py){return a+(py.amount||0);},0);
    var paidViaInvoices = db.purchases.filter(function(p){return (p.supplierId===sup.id||p.supplier===sup.name)&&p.paidAmount;}).reduce(function(a,p){return a+(p.paidAmount||0);},0);
    sup._debt = Math.max(0, totalPurchased - totalPaid - paidViaInvoices);
    sup._totalPurchased = totalPurchased;
    sup._invoiceCount = db.purchases.filter(function(p){return p.supplierId===sup.id||p.supplier===sup.name;}).length;
    return sup;
  });
  // Sort
  if(sort==='debt') suppliers.sort(function(a,b){return b._debt-a._debt;});
  else if(sort==='purchases') suppliers.sort(function(a,b){return b._totalPurchased-a._totalPurchased;});
  else if(sort==='name') suppliers.sort(function(a,b){return a.name.localeCompare(b.name,'ar');});
  // Stats hero
  var totalDebt = suppliers.reduce(function(s,sup){return s+sup._debt;},0);
  var totalPurchased = suppliers.reduce(function(s,sup){return s+sup._totalPurchased;},0);
  var monthPurchased = db.purchases.filter(function(p){
    var m=new Date(); return p.date&&p.date.slice(0,7)===m.toISOString().slice(0,7);
  }).reduce(function(a,p){return a+(p.total||0);},0);
  var heroEl = document.getElementById('sup-hero-row');
  if(heroEl) heroEl.innerHTML =
    '<div class="sup-stat ss-total"><div class="sup-stat-icon">🏭</div><div class="sup-stat-val">'+suppliers.length+'</div><div class="sup-stat-lbl">إجمالي الموردون</div></div>'
    +'<div class="sup-stat ss-debt"><div class="sup-stat-icon">💸</div><div class="sup-stat-val">'+fmtK(totalDebt)+'</div><div class="sup-stat-lbl">إجمالي الديون المستحقة</div></div>'
    +'<div class="sup-stat ss-paid"><div class="sup-stat-icon">📦</div><div class="sup-stat-val">'+fmtK(totalPurchased)+'</div><div class="sup-stat-lbl">إجمالي المشتريات</div></div>'
    +'<div class="sup-stat ss-month"><div class="sup-stat-icon">📅</div><div class="sup-stat-val">'+fmtK(monthPurchased)+'</div><div class="sup-stat-lbl">مشتريات هذا الشهر</div></div>';
  // Cards
  var grid = document.getElementById('sup-grid');
  if(!grid) return;
  if(!suppliers.length){
    grid.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;font-weight:700;grid-column:1/-1">🏭 لا يوجد موردون مضافون بعد<br><button class="inv-act-btn iab-add" onclick="openAddSupplier()" style="margin-top:14px">➕ إضافة مورد</button></div>';
    return;
  }
  grid.innerHTML = suppliers.map(function(sup){
    var debtPct = sup._totalPurchased>0?Math.min(100,(sup._debt/sup._totalPurchased)*100):0;
    var initials = sup.name.split(' ').slice(0,2).map(function(w){return w[0]||'';}).join('');
    return '<div class="sup-card">'
      +'<div class="sup-card-header">'
        +'<div class="sup-avatar">'+initials+'</div>'
        +'<div><div class="sup-name">'+sup.name+'</div><div class="sup-phone">'+(sup.phone||'بدون هاتف')+'</div></div>'
      +'</div>'
      +'<div class="sup-card-body">'
        +'<div class="sup-metrics">'
          +'<div class="sup-metric"><div class="sup-metric-val" style="color:#ef4444">'+fmtK(sup._debt)+'</div><div class="sup-metric-lbl">المتبقي</div></div>'
          +'<div class="sup-metric"><div class="sup-metric-val" style="color:#6366f1">'+fmtK(sup._totalPurchased)+'</div><div class="sup-metric-lbl">إجمالي</div></div>'
          +'<div class="sup-metric"><div class="sup-metric-val" style="color:#0f172a">'+sup._invoiceCount+'</div><div class="sup-metric-lbl">فاتورة</div></div>'
        +'</div>'
        +(sup._debt>0?'<div class="sup-debt-bar"><div class="sup-debt-fill" style="width:'+debtPct+'%"></div></div>':'')
        +(sup.note?'<div style="font-size:11px;color:#94a3b8;font-weight:600;margin-top:4px">'+sup.note+'</div>':'')
      +'</div>'
      +'<div class="sup-card-footer">'
        +(sup._debt>0?'<button class="sup-btn sup-btn-pay" onclick="openSupplierPayment(\''+sup.id+'\')">💳 تسجيل دفعة</button>':'')
        +'<button class="sup-btn sup-btn-view" onclick="openEditSupplier(\''+sup.id+'\')">✏️ تعديل</button>'
        +'<button class="sup-btn sup-btn-del" onclick="deleteSupplier(\''+sup.id+'\')">🗑️</button>'
      +'</div>'
    +'</div>';
  }).join('');
  // Nav badge
  var nbSup = document.getElementById('nb-sup');
  var withDebt = suppliers.filter(function(s){return s._debt>0;}).length;
  if(nbSup){nbSup.textContent=withDebt||'';nbSup.style.display=withDebt?'':'none';}
}

function fmtK(v){return v>=1000000?(v/1000000).toFixed(1)+'م دج':v>=1000?(v/1000).toFixed(1)+'ك':Math.round(v).toFixed(0)+' دج';}

function openAddSupplier(){
  document.getElementById('sup-modal-title').textContent='🏭 مورد جديد';
  document.getElementById('sup-edit-id').value='';
  ['name','phone','email','addr','note'].forEach(function(f){var el=document.getElementById('sup-'+f+'-inp');if(el)el.value='';});
  document.getElementById('sup-credit-days-inp').value='30';
  openModal('m-add-supplier');
}
function openEditSupplier(id){
  var sup=db.suppliers.find(function(s){return s.id===id;});if(!sup)return;
  document.getElementById('sup-modal-title').textContent='✏️ تعديل المورد';
  document.getElementById('sup-edit-id').value=id;
  document.getElementById('sup-name-inp').value=sup.name||'';
  document.getElementById('sup-phone-inp').value=sup.phone||'';
  document.getElementById('sup-email-inp').value=sup.email||'';
  document.getElementById('sup-addr-inp').value=sup.address||'';
  document.getElementById('sup-note-inp').value=sup.note||'';
  document.getElementById('sup-credit-days-inp').value=sup.creditDays||30;
  openModal('m-add-supplier');
}
function saveSupplier(){
  var name=(document.getElementById('sup-name-inp').value||'').trim();
  if(!name){toast('اسم المورد مطلوب ❌','error');return;}
  var editId=document.getElementById('sup-edit-id').value;
  var sup={
    id:editId||genId(),
    name:name,
    phone:(document.getElementById('sup-phone-inp').value||'').trim(),
    email:(document.getElementById('sup-email-inp').value||'').trim(),
    address:(document.getElementById('sup-addr-inp').value||'').trim(),
    note:(document.getElementById('sup-note-inp').value||'').trim(),
    creditDays:parseInt(document.getElementById('sup-credit-days-inp').value)||30,
    createdAt:editId?(db.suppliers.find(function(s){return s.id===editId;})||{}).createdAt||today():today()
  };
  if(editId){var idx=db.suppliers.findIndex(function(s){return s.id===editId;});if(idx>-1)db.suppliers[idx]=sup;}
  else db.suppliers.push(sup);
  saveDB('suppliers');
  closeModal('m-add-supplier');
  renderSuppliers();
  toast((editId?'تم تعديل':'تم إضافة')+' المورد ✅','success');
}
function deleteSupplier(id){
  if(!confirm('حذف هذا المورد؟'))return;
  db.suppliers=db.suppliers.filter(function(s){return s.id!==id;});
  saveDB('suppliers');renderSuppliers();toast('تم حذف المورد','info');
}
function openSupplierPayment(supId){
  var sup=db.suppliers.find(function(s){return s.id===supId;});if(!sup)return;
  document.getElementById('spp-sup-id').value=supId;
  var totalPurchased=db.purchases.filter(function(p){return p.supplierId===supId||p.supplier===sup.name;}).reduce(function(a,p){return a+(p.total||0);},0);
  var totalPaid=(db.supplierPayments||[]).filter(function(py){return py.supplierId===supId;}).reduce(function(a,py){return a+(py.amount||0);},0);
  var paidViaInv=db.purchases.filter(function(p){return (p.supplierId===supId||p.supplier===sup.name)&&p.paidAmount;}).reduce(function(a,p){return a+(p.paidAmount||0);},0);
  var debt=Math.max(0,totalPurchased-totalPaid-paidViaInv);
  document.getElementById('spp-debt-info').innerHTML='المبلغ المستحق لـ <b>'+sup.name+'</b>: <span style="font-size:20px">'+Number(debt).toFixed(2)+' دج</span>';
  document.getElementById('spp-amount').value='';document.getElementById('spp-note').value='';
  openModal('m-sup-payment');
}
function saveSupplierPayment(){
  var supId=document.getElementById('spp-sup-id').value;
  var amount=parseFloat(document.getElementById('spp-amount').value)||0;
  if(!amount||amount<=0){toast('أدخل مبلغاً صحيحاً ❌','error');return;}
  var payment={
    id:genId(),supplierId:supId,
    amount:amount,
    method:(document.getElementById('spp-method').value||'cash'),
    note:(document.getElementById('spp-note').value||'').trim(),
    date:today(),ts:Date.now()
  };
  if(!db.supplierPayments)db.supplierPayments=[];
  db.supplierPayments.push(payment);
  saveDB('supplierPayments');
  closeModal('m-sup-payment');renderSuppliers();
  toast('تم تسجيل الدفعة: '+Number(amount).toFixed(2)+' دج ✅','success');
}

// ═══════════════════════════════════════════════════════════

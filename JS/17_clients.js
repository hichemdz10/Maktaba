// ── js/17_clients.js ──
// ║  Clients & Debts                                         ║
// ═══════════════════════════════════════════════════════════
async function saveClient(){
  var name = $('ac-name').value.trim();
  if(!name){ toast('اسم العميل مطلوب ❌','error'); return; }
  var credit = parseFloat($('ac-credit').value)||0;
  var client = { id: genId(), name: name, phone: $('ac-phone').value.trim()||'', note: $('ac-note').value.trim()||'', creditLimit: credit>0?credit:0, debts:[], payments:[], totalDebt:0, createdAt: nowStr() };
  db.clients.push(client);
  await saveDB('clients');
  closeModal('m-add-client');
  if($('pg-clients').classList.contains('active')) renderClients();
  if($('pg-cashier').classList.contains('active')) showPay();
  toast('تم إضافة العميل ✅','success'); autoPush();
}
function openEditClient(id){
  var c=db.clients.find(function(x){return x.id===id;}); if(!c)return;
  $('ec-id').value=c.id;
  $('ec-name').value=c.name||'';
  $('ec-phone').value=c.phone||'';
  $('ec-credit').value=c.creditLimit||0;
  $('ec-note').value=c.note||'';
  openModal('m-edit-client');
}
async function saveEditClient(){
  var id=$('ec-id').value;
  var c=db.clients.find(function(x){return x.id===id;}); if(!c)return;
  var name=$('ec-name').value.trim();
  if(!name){toast('الاسم مطلوب ❌','error');return;}
  c.name=name;
  c.phone=$('ec-phone').value.trim()||'';
  c.creditLimit=parseFloat($('ec-credit').value)||0;
  c.note=$('ec-note').value.trim()||'';
  await saveDB('clients');
  closeModal('m-edit-client');
  renderClients();
  showClientDetail(id);
  autoPush();
  toast('تم تحديث بيانات العميل ✅','success');
}
function renderClients(){
  var search = ($('cli-s')?$('cli-s').value.toLowerCase():'');
  var filtered = db.clients.filter(function(c){
    if(!search) return true;
    return c.name.toLowerCase().indexOf(search)>=0 || (c.phone && c.phone.indexOf(search)>=0);
  });
  var totalAllDebt = 0;
  filtered.forEach(function(c){ totalAllDebt += c.totalDebt||0; });
  if($('cli-cnt')) $('cli-cnt').textContent = filtered.length + ' عميل';
  if($('cli-total-all-debt')) $('cli-total-all-debt').innerHTML = '<div class="cli-total-debt-lbl">إجمالي الديون</div><div class="cli-total-debt-val">'+fmt(totalAllDebt)+'</div>';
  var listEl = $('cli-list'); if(!listEl) return;
  if(!filtered.length){ listEl.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:40px">لا يوجد عملاء</div>'; return; }
  var html = '';
  filtered.forEach(function(c){
    html += '<div class="cli-card" onclick="showClientDetail(\''+c.id+'\')">'+
      '<div class="cli-card-right"><div class="cli-av">'+c.name.charAt(0)+'</div><div><div class="cli-name">'+c.name+'</div><div class="cli-phone">'+(c.phone||'بدون هاتف')+'</div>'+
      (shopSettings.loyaltyEnabled&&(c.loyaltyPoints||0)>0?'<div style="font-size:10px;color:#7c3aed;font-weight:700;margin-top:2px">🎁 '+(c.loyaltyPoints||0)+' نقطة</div>':'')+
      '</div></div>'+
      '<div class="cli-card-left"><div style="font-size:15px;font-weight:900;color:'+(c.totalDebt>0?'#dc2626':'#16a34a')+'">'+fmt(c.totalDebt)+'</div><div style="font-size:10px;color:#9ca3af">الدين الحالي</div></div></div>';
  });
  listEl.innerHTML = html;
}
function showClientDetail(id){
  var client = db.clients.find(function(c){ return c.id===id; });
  if(!client) return;
  var detailEl = $('cli-detail');
  // حساب تقادم الديون
  var todayD=new Date(); todayD.setHours(0,0,0,0);
  var agedDebts=[]; 
  (client.debts||[]).forEach(function(d){
    if(!d.dateStr)return;
    var dd=new Date(d.dateStr); dd.setHours(0,0,0,0);
    var days=Math.floor((todayD-dd)/86400000);
    if(days>=30){ agedDebts.push({desc:d.desc,amount:d.amount,days:days}); }
  });
  // حد الائتمان
  var creditLimit=client.creditLimit||0;
  var creditWarnHtml='';
  if(creditLimit>0){
    var usedPct=Math.min(100,Math.round(client.totalDebt/creditLimit*100));
    var barColor=usedPct>=100?'#dc2626':usedPct>=75?'#f59e0b':'#16a34a';
    creditWarnHtml='<div style="background:#f8fafc;border-radius:12px;padding:12px 14px;margin-bottom:10px;border:1px solid #e5e7eb">'+
      '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:6px">'+
        '<span style="color:#64748b">🏦 حد الائتمان</span>'+
        '<span style="color:'+barColor+'">'+fmt(client.totalDebt)+' / '+fmt(creditLimit)+'</span>'+
      '</div>'+
      '<div style="background:#e5e7eb;border-radius:20px;height:7px;overflow:hidden">'+
        '<div style="width:'+usedPct+'%;height:100%;background:'+barColor+';border-radius:20px"></div>'+
      '</div>'+
      (usedPct>=100?'<div style="font-size:10px;color:#dc2626;font-weight:800;margin-top:5px">⛔ تجاوز الحد المسموح!</div>':
       usedPct>=75?'<div style="font-size:10px;color:#f59e0b;font-weight:700;margin-top:5px">⚠️ اقترب من الحد ('+usedPct+'%)</div>':'')+
    '</div>';
  }
  // تنبيه الديون المتقادمة
  var agedHtml='';
  if(agedDebts.length){
    agedHtml='<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:10px 14px;margin-bottom:10px">'+
      '<div style="font-size:11px;font-weight:800;color:#ea580c;margin-bottom:6px">⏰ ديون تجاوزت 30 يوم ('+agedDebts.length+')</div>';
    agedDebts.forEach(function(ad){
      agedHtml+='<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dashed #fed7aa">'+
        '<span>'+ad.desc+'</span>'+
        '<span style="font-weight:800;color:#dc2626">'+fmt(ad.amount)+' <span style="font-size:10px;color:#9ca3af">('+ad.days+' يوم)</span></span>'+
      '</div>';
    });
    agedHtml+='</div>';
  }
  var html='<div style="margin-bottom:20px">'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">'+
      '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#c084fc,#db2777);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:24px;flex-shrink:0">'+client.name.charAt(0)+'</div>'+
      '<div style="flex:1"><div style="font-size:17px;font-weight:900">'+client.name+'</div>'+
        '<div style="font-size:12px;color:#9ca3af">'+(client.phone?'📞 '+client.phone:'لا يوجد هاتف')+'</div>'+
        (shopSettings.loyaltyEnabled&&(client.loyaltyPoints||0)>0?'<div style="font-size:11px;color:#7c3aed;font-weight:700;margin-top:2px">🎁 '+(client.loyaltyPoints||0)+' نقطة ولاء</div>':'')+
      '</div>'+
      '<button onclick="openEditClient(\''+client.id+'\')" style="background:#f4f6fb;border:1px solid #e5e7eb;border-radius:10px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:700;color:#374151;font-family:inherit;flex-shrink:0">✏️ تعديل</button>'+
    '</div>'+
    creditWarnHtml+agedHtml+
    '<div style="background:#f8fafc;border-radius:14px;padding:14px 18px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">'+
      '<span style="font-weight:700">الدين الإجمالي</span>'+
      '<span style="font-size:22px;font-weight:900;color:'+(client.totalDebt>0?'#dc2626':'#16a34a')+'">'+fmt(client.totalDebt)+'</span>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:8px">'+
      '<button class="btn btn-g btn-full" onclick="openModal(\'m-pay-debt\');preparePayDebt(\''+client.id+'\')">💰 تسديد دين</button>'+
      '<button class="btn btn-out btn-full" style="border-color:#ef4444;color:#ef4444" onclick="openModal(\'m-add-debt-manual\');prepareManualDebt(\''+client.id+'\')">📝 دين يدوي</button>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+
      '<button class="btn btn-gray btn-full btn-sm" onclick="printClientStatement(\''+client.id+'\')">🖨️ كشف الحساب</button>'+
      '<button class="btn btn-full btn-sm" style="background:'+(client.totalDebt>0?'#f1f5f9':'#fee2e2')+';color:'+(client.totalDebt>0?'#94a3b8':'#dc2626')+';border:1px solid '+(client.totalDebt>0?'#e2e8f0':'#fca5a5')+';border-radius:10px;padding:8px;font-size:12px;font-weight:800;cursor:'+(client.totalDebt>0?'not-allowed':'pointer')+';font-family:inherit" onclick="deleteClient(\''+client.id+'\')" title="'+(client.totalDebt>0?'يوجد دين':'حذف العميل')+'">🗑️ '+(client.totalDebt>0?'يوجد دين':'حذف')+'</button>'+
    '</div>'+
    '<div><div style="font-weight:700;margin-bottom:8px">📋 سجل العمليات</div>'+
    '<div style="max-height:240px;overflow-y:auto">';
  var transactions=[];
  (client.debts||[]).forEach(function(d){ transactions.push({type:'debt',amount:d.amount,desc:d.desc,date:d.date}); });
  (client.payments||[]).forEach(function(p){ transactions.push({type:'payment',amount:p.amount,desc:p.note,date:p.date}); });
  transactions.sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });
  if(!transactions.length){ html+='<div style="color:#9ca3af;padding:12px;text-align:center">لا توجد عمليات بعد</div>'; }
  else{
    var running=0;
    transactions.forEach(function(t){
      if(t.type==='debt') running+=t.amount;
      else running=Math.max(0,running-t.amount);
      html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f2f8">'+
        '<div style="flex:1;min-width:0"><span style="font-weight:700;color:'+(t.type==='debt'?'#dc2626':'#16a34a')+'">'+(t.type==='debt'?'📝 دين':'💰 تسديد')+'</span> '+(t.desc||'')+
        '<div style="font-size:9px;color:#9ca3af">'+t.date+'</div></div>'+
        '<div style="text-align:left;flex-shrink:0">'+
          '<div style="font-weight:800;font-size:13px">'+fmt(t.amount)+'</div>'+
          '<div style="font-size:10px;color:'+(running>0?'#dc2626':'#16a34a')+';font-weight:700">رصيد: '+fmt(running)+'</div>'+
        '</div></div>';
    });
  }
  html+='</div></div></div>';
  detailEl.innerHTML=html;
}

async function deleteClient(id){
  var client = db.clients.find(function(c){ return c.id===id; });
  if(!client) return;
  if((client.totalDebt||0)>0){
    toast('❌ لا يمكن حذف '+client.name+' — لديه دين غير مسدّد: '+fmt(client.totalDebt),'error',4000);
    return;
  }
  if(!confirm('حذف العميل: '+client.name+'؟\nهذا الإجراء لا يمكن التراجع عنه.')) return;
  db.clients = db.clients.filter(function(c){ return c.id!==id; });
  await saveDB('clients');
  var detailEl = $('cli-detail');
  if(detailEl) detailEl.innerHTML = '<div style="color:#9ca3af;padding:24px;text-align:center">اختر عميلاً من القائمة</div>';
  renderClients();
  toast('تم حذف '+client.name+' ✅','info');
  autoPush();
}
function preparePayDebt(id){
  var client = db.clients.find(function(c){ return c.id===id; });
  if(!client) return;
  $('pd-info').innerHTML = '<strong>'+client.name+'</strong><br>الدين الحالي: '+fmt(client.totalDebt);
  $('pd-cid').value = id; $('pd-amt').value = ''; $('pd-note').value = '';
}
async function savePayDebt(){
  var id = $('pd-cid').value;
  var client = db.clients.find(function(c){ return c.id===id; });
  if(!client) return;
  var amt = parseFloat($('pd-amt').value)||0;
  if(amt <= 0){ toast('أدخل مبلغاً صحيحاً ❌','error'); return; }
  if(amt > client.totalDebt){ toast('المبلغ أكبر من الدين الحالي ❌','error'); return; }
  client.payments = client.payments || [];
  client.payments.push({ amount: amt, note: $('pd-note').value.trim()||'تسديد', date: nowStr(), dateStr: today() });
  var totalPaid = 0, totalDebt = 0;
  client.payments.forEach(function(p){ totalPaid += p.amount||0; });
  client.debts.forEach(function(d){ totalDebt += d.amount||0; });
  client.totalDebt = Math.max(0, totalDebt - totalPaid);
  await saveDB('clients');
  closeModal('m-pay-debt');
  renderClients();
  if($('cli-detail') && $('cli-detail').innerHTML.indexOf(client.name)>=0) showClientDetail(id);
  toast('تم تسجيل الدفعة ✅','success'); autoPush();
}
function prepareManualDebt(id){
  var client = db.clients.find(function(c){ return c.id===id; });
  if(!client) return;
  $('adm-info').innerHTML = '<strong>'+client.name+'</strong><br>الدين الحالي: '+fmt(client.totalDebt);
  $('adm-cid').value = id; $('adm-amt').value = ''; $('adm-desc').value = '';
}
async function saveManualDebt(){
  var id = $('adm-cid').value;
  var client = db.clients.find(function(c){ return c.id===id; });
  if(!client) return;
  var amt = parseFloat($('adm-amt').value)||0;
  var desc = $('adm-desc').value.trim();
  if(amt <= 0){ toast('أدخل مبلغاً صحيحاً ❌','error'); return; }
  if(!desc){ toast('أدخل بيان الدين ❌','error'); return; }
  client.debts = client.debts || [];
  client.debts.push({ amount: amt, desc: desc, date: nowStr(), dateStr: today() });
  var totalPaid = 0, totalDebt = 0;
  client.payments.forEach(function(p){ totalPaid += p.amount||0; });
  client.debts.forEach(function(d){ totalDebt += d.amount||0; });
  client.totalDebt = Math.max(0, totalDebt - totalPaid);
  await saveDB('clients');
  closeModal('m-add-debt-manual');
  renderClients();
  if($('cli-detail') && $('cli-detail').innerHTML.indexOf(client.name)>=0) showClientDetail(id);
  toast('تم إضافة الدين ✅','success'); autoPush();
}

// ═══════════════════════════════════════════════════════════

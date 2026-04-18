// ── js/19_expenses.js ──
// ║  Expenses                                                ║
// ═══════════════════════════════════════════════════════════
async function addExpense(){
  var cat = $('exp-cat').value;
  var desc = $('exp-desc').value.trim();
  var amt = parseFloat($('exp-amt').value)||0;
  var date = $('exp-date').value || today();
  var recurring = $('exp-recurring') ? $('exp-recurring').checked : false;
  if(!desc){ toast('الوصف مطلوب ❌','error'); return; }
  if(amt <= 0){ toast('المبلغ غير صالح ❌','error'); return; }
  var exp = { id: genId(), category: cat, desc: desc, amount: amt, date: date, recurring: recurring, createdAt: nowStr() };
  db.expenses.push(exp);
  await saveDB('expenses');
  toast('تم تسجيل المصروف ✅','success');
  $('exp-desc').value = ''; $('exp-amt').value = '';
  if($('exp-recurring'))$('exp-recurring').checked=false;
  renderExp(); autoPush();
}
function openEditExpense(id){
  var e=db.expenses.find(function(x){return x.id===id;}); if(!e)return;
  $('ee-id').value=e.id;
  $('ee-cat').value=e.category||'other';
  $('ee-desc').value=e.desc||'';
  $('ee-amt').value=e.amount||0;
  $('ee-date').value=e.date||today();
  if($('ee-recurring'))$('ee-recurring').checked=!!e.recurring;
  openModal('m-edit-expense');
}
async function saveEditExpense(){
  var id=$('ee-id').value;
  var e=db.expenses.find(function(x){return x.id===id;}); if(!e)return;
  var desc=$('ee-desc').value.trim();
  var amt=parseFloat($('ee-amt').value)||0;
  if(!desc){toast('الوصف مطلوب ❌','error');return;}
  if(amt<=0){toast('المبلغ غير صالح ❌','error');return;}
  e.category=$('ee-cat').value;
  e.desc=desc;
  e.amount=amt;
  e.date=$('ee-date').value||today();
  e.recurring=$('ee-recurring')?$('ee-recurring').checked:false;
  await saveDB('expenses');
  closeModal('m-edit-expense');
  renderExp();
  if($('pg-dashboard').classList.contains('active'))renderDash();
  autoPush();
  toast('تم تعديل المصروف ✅','success');
}
async function deleteExpense(id){
  var e=db.expenses.find(function(x){return x.id===id;}); if(!e)return;
  if(!confirm('حذف هذا المصروف؟\n'+e.desc+' — '+fmt(e.amount)))return;
  db.expenses=db.expenses.filter(function(x){return x.id!==id;});
  await saveDB('expenses');
  renderExp();
  if($('pg-dashboard').classList.contains('active'))renderDash();
  autoPush();
  toast('تم حذف المصروف','info');
}
// دالة مساعدة للمصروف السريع من أي مكان
async function saveQuickExpense(desc, amt, cat){
  if(!desc||amt<=0)return;
  var exp={id:genId(),category:cat||'other',desc:desc,amount:amt,date:today(),createdAt:nowStr()};
  db.expenses.push(exp);
  await saveDB('expenses');
  toast('تم تسجيل المصروف ✅','success');
  if($('pg-dashboard').classList.contains('active'))renderDash();
  if($('pg-expenses').classList.contains('active'))renderExp();
  autoPush();
}
function renderExp(){
  var todayStr = today(), monthStr = todayStr.slice(0,7);
  var filterMonth = $('exp-filter-month') ? $('exp-filter-month').value : '';
  var filtered = db.expenses.filter(function(e){
    if(filterMonth && e.date.slice(0,7) !== filterMonth) return false;
    return true;
  });
  var todayTotal = 0, monthTotal = 0;
  db.expenses.forEach(function(e){ if(e.date===todayStr) todayTotal+=e.amount; if(e.date.slice(0,7)===monthStr) monthTotal+=e.amount; });
  if($('exp-today')) $('exp-today').textContent = fmt(todayTotal);
  if($('exp-month')) $('exp-month').textContent = fmt(monthTotal);
  var months = new Set();
  db.expenses.forEach(function(e){ months.add(e.date.slice(0,7)); });
  var monthSelect = $('exp-filter-month');
  if(monthSelect){
    var opts = '<option value="">كل الأشهر</option>';
    Array.from(months).sort().reverse().forEach(function(m){ opts += '<option value="'+m+'"'+(filterMonth===m?' selected':'')+'>'+m+'</option>'; });
    monthSelect.innerHTML = opts;
  }
  var listEl = $('exp-list'); if(!listEl) return;
  if(!filtered.length){ listEl.innerHTML = '<div style="color:#9ca3af;font-size:12px;padding:16px;text-align:center">لا توجد مصاريف</div>'; return; }
  var html = '';
  filtered.sort(function(a,b){ return b.date.localeCompare(a.date); }).forEach(function(e){
    var isRecurring = e.recurring ? '<span style="font-size:9px;background:#ede9fe;color:#7c3aed;padding:1px 6px;border-radius:8px;font-weight:800;margin-right:4px">🔁 متكرر</span>' : '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #f0f2f8">'+
      '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">'+
        '<span style="font-size:20px;flex-shrink:0">'+(EXP_ICONS[e.category]||'📌')+'</span>'+
        '<div style="min-width:0"><div style="font-weight:700;display:flex;align-items:center;gap:4px;flex-wrap:wrap">'+e.desc+isRecurring+'</div>'+
        '<div style="font-size:10px;color:#9ca3af">'+(EXP_NAMES[e.category]||e.category)+' • '+e.date+'</div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">'+
        '<div style="font-weight:900;color:#ef4444">'+fmt(e.amount)+'</div>'+
        '<button onclick="openEditExpense(\''+e.id+'\')" style="background:#f4f6fb;border:1px solid #e5e7eb;border-radius:7px;padding:4px 8px;cursor:pointer;font-size:11px;color:#374151;font-family:inherit">✏️</button>'+
        '<button onclick="deleteExpense(\''+e.id+'\')" style="background:#fee2e2;border:1px solid #fca5a5;border-radius:7px;padding:4px 8px;cursor:pointer;font-size:11px;color:#dc2626;font-family:inherit">🗑</button>'+
      '</div>'+
    '</div>';
  });
  listEl.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════

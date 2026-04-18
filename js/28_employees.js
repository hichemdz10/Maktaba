// ── js/28_employees.js ──
// ║  EMPLOYEES MODULE                                       ║
// ═══════════════════════════════════════════════════════════
if(!db.employees) db.employees = [];
if(!db.activityLog) db.activityLog = [];

function renderEmployees(){
  var s=(document.getElementById('emp-search')||{}).value||'';
  var roleF=(document.getElementById('emp-filter-role')||{}).value||'';
  var emps=db.employees.filter(function(e){
    if(roleF&&e.role!==roleF)return false;
    if(!s)return true;
    return (e.fullname||'').toLowerCase().indexOf(s.toLowerCase())>=0||(e.username||'').toLowerCase().indexOf(s.toLowerCase())>=0;
  });
  var heroEl=document.getElementById('emp-hero-row');
  if(heroEl){
    var admins=db.employees.filter(function(e){return e.role==='admin';}).length;
    var cashiers=db.employees.filter(function(e){return e.role==='cashier';}).length;
    var active=db.employees.filter(function(e){return e.active!==false;}).length;
    heroEl.innerHTML=
      '<div class="sup-stat ss-total"><div class="sup-stat-icon">👥</div><div class="sup-stat-val">'+db.employees.length+'</div><div class="sup-stat-lbl">إجمالي الموظفين</div></div>'
      +'<div class="sup-stat ss-paid"><div class="sup-stat-icon">✅</div><div class="sup-stat-val">'+active+'</div><div class="sup-stat-lbl">حسابات مفعّلة</div></div>'
      +'<div class="sup-stat ss-month"><div class="sup-stat-icon">👔</div><div class="sup-stat-val">'+admins+' / '+cashiers+'</div><div class="sup-stat-lbl">مدير / كاشيير</div></div>';
  }
  var rtxt=document.getElementById('emp-result-txt');
  if(rtxt)rtxt.textContent=emps.length+' موظف';
  var grid=document.getElementById('emp-grid');if(!grid)return;
  if(!emps.length){
    grid.innerHTML='<div style="text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;font-weight:700;grid-column:1/-1">👤 لا يوجد موظفون مضافون<br><button class="inv-act-btn iab-add" onclick="openAddEmployee()" style="margin-top:14px">➕ إضافة موظف</button></div>';
    return;
  }
  var today_=new Date().toDateString();
  grid.innerHTML=emps.map(function(emp){
    var todaySales=db.sales.filter(function(s){return s.cashier===emp.username&&new Date(s.ts||s.date).toDateString()===today_;}).length;
    var totalSales=db.sales.filter(function(s){return s.cashier===emp.username;}).length;
    var perms=emp.permissions||{};
    return '<div class="emp-card">'
      +'<div class="emp-card-top">'
        +'<div class="emp-avatar '+(emp.role||'cashier')+'">'+((emp.fullname||'م')[0])+'</div>'
        +'<div>'
          +'<div class="emp-name">'+emp.fullname+'</div>'
          +'<span class="emp-role-badge emp-role-'+(emp.role||'cashier')+'">'+(emp.role==='admin'?'👔 مدير':'🛒 كاشيير')+'</span>'
          +(emp.active===false?'<span style="margin-right:4px;font-size:9px;background:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:6px;font-weight:700">معطّل</span>':'')
        +'</div>'
      +'</div>'
      +'<div class="emp-card-body">'
        +'<div class="emp-stat-row"><span class="emp-stat-lbl">اسم المستخدم</span><span class="emp-stat-val" style="font-family:monospace;direction:ltr;text-align:left;color:#6366f1">'+emp.username+'</span></div>'
        +'<div class="emp-stat-row"><span class="emp-stat-lbl">مبيعات اليوم</span><span class="emp-stat-val">'+todaySales+' عملية</span></div>'
        +'<div class="emp-stat-row"><span class="emp-stat-lbl">إجمالي المبيعات</span><span class="emp-stat-val">'+totalSales+' عملية</span></div>'
        +'<div class="emp-stat-row"><span class="emp-stat-lbl">الهاتف</span><span class="emp-stat-val">'+(emp.phone||'—')+'</span></div>'
      +'</div>'
      +'<div class="emp-card-footer">'
        +'<button class="sup-btn sup-btn-view" onclick="openEditEmployee(\''+emp.id+'\')">✏️ تعديل</button>'
        +'<button class="sup-btn" onclick="toggleEmployeeActive(\''+emp.id+'\')" style="background:rgba(99,102,241,0.08);color:#6366f1;border:1.5px solid rgba(99,102,241,0.2)">'+(emp.active===false?'✅ تفعيل':'⏸ تعطيل')+'</button>'
        +'<button class="sup-btn sup-btn-del" onclick="deleteEmployee(\''+emp.id+'\')">🗑️</button>'
      +'</div>'
    +'</div>';
  }).join('');
  renderEmpActivityLog();
}

function openAddEmployee(){
  document.getElementById('emp-modal-title').textContent='👤 موظف جديد';
  document.getElementById('emp-edit-id').value='';
  document.getElementById('emp-fullname-inp').value='';
  document.getElementById('emp-username-inp').value='';
  document.getElementById('emp-phone-inp').value='';
  document.getElementById('emp-pass-inp').value='';
  document.getElementById('emp-pass2-inp').value='';
  document.getElementById('emp-role-inp').value='cashier';
  document.getElementById('emp-active-inp').checked=true;
  ['inventory','reports','clients','expenses','purchases','settings'].forEach(function(p){
    var el=document.getElementById('ep-'+p);if(el)el.checked=(p==='inventory');
  });
  openModal('m-add-employee');
}
function openEditEmployee(id){
  var emp=db.employees.find(function(e){return e.id===id;});if(!emp)return;
  document.getElementById('emp-modal-title').textContent='✏️ تعديل الموظف';
  document.getElementById('emp-edit-id').value=id;
  document.getElementById('emp-fullname-inp').value=emp.fullname||'';
  document.getElementById('emp-username-inp').value=emp.username||'';
  document.getElementById('emp-phone-inp').value=emp.phone||'';
  document.getElementById('emp-pass-inp').value='';
  document.getElementById('emp-pass2-inp').value='';
  document.getElementById('emp-role-inp').value=emp.role||'cashier';
  document.getElementById('emp-active-inp').checked=emp.active!==false;
  var perms=emp.permissions||{};
  ['inventory','reports','clients','expenses','purchases','settings'].forEach(function(p){
    var el=document.getElementById('ep-'+p);if(el)el.checked=!!perms[p];
  });
  openModal('m-add-employee');
}
function saveEmployee(){
  var fn=(document.getElementById('emp-fullname-inp').value||'').trim();
  var un=(document.getElementById('emp-username-inp').value||'').trim();
  var pass=document.getElementById('emp-pass-inp').value;
  var pass2=document.getElementById('emp-pass2-inp').value;
  var editId=document.getElementById('emp-edit-id').value;
  if(!fn||!un){toast('الاسم واسم المستخدم مطلوبان ❌','error');return;}
  if(!editId&&!pass){toast('كلمة المرور مطلوبة ❌','error');return;}
  if(pass&&pass!==pass2){toast('كلمات المرور غير متطابقة ❌','error');return;}
  if(pass&&pass.length<4){toast('كلمة المرور يجب أن تكون 4 أحرف على الأقل ❌','error');return;}
  var existing=db.employees.find(function(e){return e.username===un&&e.id!==editId;});
  if(existing){toast('اسم المستخدم محجوز ❌','error');return;}
  var perms={};
  ['inventory','reports','clients','expenses','purchases','settings'].forEach(function(p){
    var el=document.getElementById('ep-'+p);perms[p]=el?el.checked:false;
  });
  var doSave=function(hashedPass){
    var emp={
      id:editId||genId(),
      fullname:fn,username:un,
      phone:(document.getElementById('emp-phone-inp').value||'').trim(),
      role:(document.getElementById('emp-role-inp').value||'cashier'),
      active:document.getElementById('emp-active-inp').checked,
      permissions:perms,
      createdAt:editId?(db.employees.find(function(e){return e.id===editId;})||{}).createdAt||today():today()
    };
    if(hashedPass)emp.passHash=hashedPass;
    else if(editId){var old=db.employees.find(function(e){return e.id===editId;});if(old&&old.passHash)emp.passHash=old.passHash;}
    if(editId){var idx=db.employees.findIndex(function(e){return e.id===editId;});if(idx>-1)db.employees[idx]=emp;}
    else db.employees.push(emp);
    saveDB('employees');closeModal('m-add-employee');renderEmployees();
    toast((editId?'تم تعديل':'تم إضافة')+' الموظف ✅','success');
  };
  if(pass){
    hashPass(pass).then(function(h){doSave('sha256:'+h);});
  } else {doSave(null);}
}
function toggleEmployeeActive(id){
  var emp=db.employees.find(function(e){return e.id===id;});if(!emp)return;
  emp.active=emp.active===false?true:false;
  saveDB('employees');renderEmployees();
  toast(emp.active?'تم تفعيل الحساب ✅':'تم تعطيل الحساب','info');
}
function deleteEmployee(id){
  if(!confirm('حذف هذا الموظف؟'))return;
  db.employees=db.employees.filter(function(e){return e.id!==id;});
  saveDB('employees');renderEmployees();toast('تم حذف الموظف','info');
}
function renderEmpActivityLog(){
  var el=document.getElementById('emp-activity-log');if(!el)return;
  var log=(db.activityLog||[]).slice(-50).reverse();
  if(!log.length){el.innerHTML='<div style="text-align:center;padding:20px;color:#94a3b8">لا يوجد نشاط مسجّل بعد</div>';return;}
  el.innerHTML='<table style="width:100%;border-collapse:collapse">'
    +'<tr style="background:rgba(99,102,241,0.05);"><th style="padding:8px 14px;text-align:right;font-size:10px;color:#6366f1;font-weight:900">الموظف</th><th style="padding:8px 14px;text-align:right;font-size:10px;color:#6366f1;font-weight:900">الإجراء</th><th style="padding:8px 14px;text-align:right;font-size:10px;color:#6366f1;font-weight:900">التفاصيل</th><th style="padding:8px 14px;text-align:right;font-size:10px;color:#6366f1;font-weight:900">الوقت</th></tr>'
    +log.map(function(entry){
      return '<tr style="border-bottom:1px solid rgba(99,102,241,0.05)">'
        +'<td style="padding:7px 14px;font-weight:700;color:#6366f1">'+( entry.user||'—')+'</td>'
        +'<td style="padding:7px 14px;font-weight:600">'+entry.action+'</td>'
        +'<td style="padding:7px 14px;color:#64748b;font-size:11px">'+( entry.detail||'')+'</td>'
        +'<td style="padding:7px 14px;color:#94a3b8;font-size:11px;direction:ltr;text-align:left">'+new Date(entry.ts||Date.now()).toLocaleString('ar-DZ')+'</td>'
        +'</tr>';
    }).join('')
    +'</table>';
}
function logActivity(action, detail){
  if(!db.activityLog)db.activityLog=[];
  db.activityLog.push({
    id:genId(),
    user:AUTH.currentUser?AUTH.currentUser.username||AUTH.currentUser.name:'—',
    action:action,detail:detail||'',ts:Date.now()
  });
  if(db.activityLog.length>500)db.activityLog=db.activityLog.slice(-400);
  saveDB('activityLog');
}

// ═══════════════════════════════════════════════════════════

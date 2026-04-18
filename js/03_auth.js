// ── js/03_auth.js ──
// ║  AUTH SYSTEM                                             ║
// ═══════════════════════════════════════════════════════════
var AUTH=(function(){
  var _user=null;

  // ── تشفير كلمة المرور بـ SHA-256 (غير قابل للعكس) ──
  function hashPass(pass){
    var data=new TextEncoder().encode(String(pass));
    return crypto.subtle.digest('SHA-256',data).then(function(buf){
      return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
    });
  }

  // ── استرجاع المستخدمين (يدعم كلمات مرور نصية قديمة للتوافق) ──
  function getUsers(){
    var r=localStorage.getItem(AUTH_USERS_KEY);
    if(r)try{return JSON.parse(r);}catch(e){}
    return{admin:'1234',cashier:'0000'};
  }
  function saveUsers(u){localStorage.setItem(AUTH_USERS_KEY,JSON.stringify(u));}

  // ── مقارنة كلمة مرور مُدخلة بقيمة مخزنة (نصية أو مُشفّرة) ──
  function checkPass(stored, inputPass){
    if(!stored) return Promise.resolve(false);
    // كلمة مرور قديمة نصية غير مُشفّرة — نقبلها مؤقتاً وترقيتها عند أول تسجيل دخول
    if(!stored.startsWith('sha256:')){
      return Promise.resolve(stored === inputPass);
    }
    var storedHash = stored.slice(7);
    return hashPass(inputPass).then(function(h){ return h === storedHash; });
  }

  return{
    get currentUser(){return _user;},
    isAdmin:function(){return _user&&_user.role==='admin';},
    isCashier:function(){return _user&&_user.role==='cashier';},
    // ── صلاحيات تفصيلية: admin دائماً يملك كل شيء ──
    can:function(perm){
      if(!_user)return false;
      if(_user.role==='admin')return true;
      var perms=_user.permissions||{};
      return !!perms[perm];
    },
    init:function(){
      var raw=localStorage.getItem(AUTH_SESSION_KEY);
      if(raw)try{var sess=JSON.parse(raw);if(Date.now()-sess.ts<12*3600000){_user=sess.user;}}catch(e){}
    },
    login:function(role, pass, cb){
      var users=getUsers();
      var stored=users[role];
      checkPass(stored, pass).then(function(ok){
        if(!ok){cb(false);return;}
        if(stored && !stored.startsWith('sha256:')){
          hashPass(pass).then(function(h){
            users[role]='sha256:'+h; saveUsers(users);
          });
        }
        // تحميل الصلاحيات المخصصة من التخزين
        var savedPerms={};
        try{var rp=localStorage.getItem('hch_perms_'+role);if(rp)savedPerms=JSON.parse(rp);}catch(e){}
        _user={role:role,name:role==='admin'?'المدير 👔':'الكاشيير 🛒',permissions:savedPerms};
        localStorage.setItem(AUTH_SESSION_KEY,JSON.stringify({user:_user,ts:Date.now()}));
        cb(true);
      });
    },
    logout:function(){_user=null;localStorage.removeItem(AUTH_SESSION_KEY);},
    changePass:function(role,newPass,cb){
      hashPass(newPass).then(function(h){
        var u=getUsers(); u[role]='sha256:'+h; saveUsers(u);
        if(cb)cb();
      });
    },
    savePermissions:function(role,perms){
      try{localStorage.setItem('hch_perms_'+role,JSON.stringify(perms));}catch(e){}
    },
    getPermissions:function(role){
      try{var r=localStorage.getItem('hch_perms_'+role);if(r)return JSON.parse(r);}catch(e){}
      return {};
    }
  };
})();

function showLoginScreen(){
  var old=$('login-screen');if(old)old.remove();
  var ov=document.createElement('div');ov.id='login-screen';
  ov.style.cssText='position:fixed;inset:0;z-index:999999;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%);display:flex;align-items:center;justify-content:center;';
  ov.innerHTML=
    '<div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.15);border-radius:24px;padding:40px 36px;width:100%;max-width:400px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.5)">'+
    '<div style="font-size:56px;margin-bottom:12px">📚</div>'+
    '<div style="color:#fff;font-size:22px;font-weight:900;margin-bottom:4px">مكتبة حشايشي</div>'+
    '<div style="color:#a5b4fc;font-size:13px;font-weight:600;margin-bottom:32px">نظام نقطة البيع V7</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">'+
    '<button id="role-admin" onclick="selectLoginRole(\'admin\')" style="background:rgba(124,58,237,0.15);border:2px solid rgba(124,58,237,0.35);border-radius:16px;padding:20px 12px;cursor:pointer;color:#fff;transition:all .2s;font-family:inherit">'+
    '<div style="font-size:34px">👔</div><div style="font-weight:800;font-size:14px;margin-top:8px">المدير</div><div style="font-size:11px;color:#c4b5fd;margin-top:3px">وصول كامل</div></button>'+
    '<button id="role-cashier" onclick="selectLoginRole(\'cashier\')" style="background:rgba(8,145,178,0.12);border:2px solid rgba(8,145,178,0.25);border-radius:16px;padding:20px 12px;cursor:pointer;color:#fff;transition:all .2s;font-family:inherit">'+
    '<div style="font-size:34px">🛒</div><div style="font-weight:800;font-size:14px;margin-top:8px">الكاشيير</div><div style="font-size:11px;color:#67e8f9;margin-top:3px">كاشيير فقط</div></button>'+
    '</div>'+
    '<div id="login-pass-wrap" style="display:none">'+
    '<input id="login-pass" type="password" placeholder="كلمة المرور..." onkeydown="if(event.key===\'Enter\')doLogin()" style="width:100%;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);border-radius:12px;padding:14px 16px;color:#fff;font-size:18px;font-family:inherit;outline:none;text-align:center;letter-spacing:6px;margin-bottom:12px;box-sizing:border-box">'+
    '<button onclick="doLogin()" style="width:100%;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;border-radius:12px;padding:15px;color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit">دخول ←</button>'+
    '<div id="login-err" style="color:#f87171;font-size:13px;margin-top:10px;display:none">❌ كلمة المرور غير صحيحة</div>'+
    '</div>'+
    '<div style="color:#6366f1;font-size:12px;margin-top:24px">V7</div>'+
    '</div>';
  document.body.appendChild(ov);
  window._loginSelRole=null;
}
function selectLoginRole(role){
  window._loginSelRole=role;
  var styles={
    admin:{sel:'rgba(124,58,237,0.45)','selBorder':'#7c3aed',unsel:'rgba(124,58,237,0.12)',unselBorder:'rgba(124,58,237,0.3)'},
    cashier:{sel:'rgba(8,145,178,0.4)','selBorder':'#0891b2',unsel:'rgba(8,145,178,0.1)',unselBorder:'rgba(8,145,178,0.2)'}
  };
  ['admin','cashier'].forEach(function(r){
    var btn=document.getElementById('role-'+r);if(!btn)return;
    var s=styles[r];
    if(r===role){btn.style.background=s.sel;btn.style.borderColor=s.selBorder;btn.style.transform='scale(1.04)';}
    else{btn.style.background=s.unsel;btn.style.borderColor=s.unselBorder;btn.style.transform='scale(1)';}
  });
  var pw=$('login-pass-wrap');if(pw)pw.style.display='block';
  var inp=$('login-pass');if(inp){inp.value='';inp.focus();}
  var err=$('login-err');if(err)err.style.display='none';
}
function doLogin(){
  var role=window._loginSelRole;
  if(!role){return;}
  var pass=($('login-pass')||{}).value||'';
  // ✅ AUTH.login أصبح async — يستخدم callback
  AUTH.login(role, pass, function(ok){
    if(!ok){
      var err=$('login-err');if(err)err.style.display='block';
      var inp=$('login-pass');if(inp){inp.value='';inp.focus();}
      return;
    }
    var scr=$('login-screen');if(scr)scr.remove();
    startApp();
  });
}
function lockScreen(){
  AUTH.logout();
  document.querySelectorAll('.nav-item').forEach(function(el){el.style.display='flex';});
  showLoginScreen();
}
function applyRoleUI(){
  var cfg={admin:['dashboard','cashier','inventory','services','clients','expenses','purchases','suppliers','reports','employees','settings'],cashier:['cashier','inventory']};
  // الكاشيير يرى العملاء إذا مُنح الصلاحية
  if(!AUTH.isAdmin()&&AUTH.can('view_clients'))cfg.cashier.push('clients');
  if(!AUTH.isAdmin()&&AUTH.can('add_expense'))cfg.cashier.push('expenses');
  if(!AUTH.isAdmin()&&AUTH.can('view_purchases'))cfg.cashier.push('purchases');
  if(!AUTH.isAdmin()&&AUTH.can('view_reports'))cfg.cashier.push('reports');
  var pages=AUTH.isAdmin()?cfg.admin:cfg.cashier;
  document.querySelectorAll('.nav-item').forEach(function(el){
    var pg=el.getAttribute('data-page');if(!pg)return;
    el.style.display=pages.indexOf(pg)>-1?'flex':'none';
  });
  // topbar badge
  var rb=$('role-badge');
  if(rb){rb.textContent=AUTH.currentUser?AUTH.currentUser.name:'—';rb.style.color=AUTH.isAdmin()?'#7c3aed':'#0891b2';}
  // ① sidebar user card
  var isAdmin=AUTH.isAdmin();
  var avatar=$('sidebar-user-avatar');
  var uname=$('sidebar-user-name');
  var greeting=$('sidebar-user-greeting');
  if(avatar)avatar.textContent=isAdmin?'👔':'🛒';
  if(avatar)avatar.style.background=isAdmin?'linear-gradient(135deg,#a78bfa,#818cf8)':'linear-gradient(135deg,#38bdf8,#0ea5e9)';
  if(uname)uname.textContent=isAdmin?'المدير':'الكاشيير';
  if(greeting){
    var hr=new Date().getHours();
    var g=hr<12?'صباح الخير ☀️':hr<17?'مساء الخير 🌤️':'مساء النور 🌙';
    greeting.textContent=g;
  }
  // إخفاء/إظهار إعدادات كلمة المرور
  var authCard=$('auth-settings-card');
  if(authCard)authCard.style.display=AUTH.isAdmin()?'':'none';
  // ── حراسة الصلاحيات التفصيلية ──
  var canDisc=AUTH.can('apply_discount');
  ['disc-in','disc-in-normal'].forEach(function(id){
    var el=$(id);if(!el)return;
    el.disabled=!canDisc;
    el.style.opacity=canDisc?'1':'0.4';
    el.title=canDisc?'':'لا تملك صلاحية الخصم';
  });
  var canEditP=AUTH.can('edit_price');
  document.querySelectorAll('.iln-price-edit,.cpe-edit-btn').forEach(function(el){
    el.style.display=canEditP?'':'none';
  });
  var canDelP=AUTH.can('delete_product');
  document.querySelectorAll('[onclick*="delProd"]').forEach(function(el){
    el.style.display=canDelP?'':'none';
  });
  var canAddP=AUTH.can('add_product');
  document.querySelectorAll('[onclick*="openAddProd"],[onclick*="openNewProdModal"]').forEach(function(el){
    el.style.display=canAddP?'':'none';
  });
  var canReturn=AUTH.can('open_return');
  document.querySelectorAll('[onclick*="openReturnModal"]').forEach(function(el){
    el.style.display=canReturn?'':'none';
  });
}
function savePasswords(){
  if(!AUTH.isAdmin()){toast('المدير فقط يمكنه تغيير كلمات المرور ❌','error');return;}
  var ap=($('set-admin-pass')||{}).value||'';
  var cp=($('set-cashier-pass')||{}).value||'';
  if(!ap||!cp){toast('أدخل كلا كلمتي المرور ❌','error');return;}
  if(ap.length<4||cp.length<4){toast('كلمة المرور يجب أن تكون 4 أحرف على الأقل ❌','error');return;}
  // ✅ AUTH.changePass أصبح async — ننتظر انتهاء الاثنتين
  AUTH.changePass('admin', ap, function(){
    AUTH.changePass('cashier', cp, function(){
      $('set-admin-pass').value='';$('set-cashier-pass').value='';
      toast('تم حفظ كلمات المرور بأمان 🔐 ✅','success');
    });
  });
}

// ── الصلاحيات التفصيلية للكاشيير ──
var PERM_DEFS=[
  {id:'view_reports',  label:'📊 عرض التقارير',       desc:'الوصول إلى صفحة التقارير'},
  {id:'apply_discount',label:'🏷️ تطبيق خصم',          desc:'تغيير قيمة الخصم عند البيع'},
  {id:'edit_price',    label:'✏️ تعديل السعر بالسلة',  desc:'تغيير سعر منتج مؤقتاً'},
  {id:'view_cost',     label:'💰 رؤية سعر الشراء',    desc:'عرض التكلفة في المخزون'},
  {id:'delete_product',label:'🗑️ حذف منتج',          desc:'حذف منتجات من المخزون'},
  {id:'add_product',   label:'➕ إضافة منتج',         desc:'إضافة منتجات جديدة'},
  {id:'view_clients',  label:'👥 عرض العملاء',         desc:'الوصول لقائمة العملاء'},
  {id:'add_expense',   label:'💸 تسجيل مصروف',        desc:'إضافة مصاريف جديدة'},
  {id:'open_return',   label:'🔄 إجراء مرتجع',         desc:'إرجاع المنتجات للمخزون'},
  {id:'view_purchases',label:'📥 الفواتير الداخلة',   desc:'الوصول لفواتير الشراء'},
];
function renderPermissions(){
  var card=document.getElementById('perm-card');
  if(!card)return;
  card.style.display=AUTH.isAdmin()?'':'none';
  var list=$('perm-list');if(!list)return;
  var saved=AUTH.getPermissions('cashier');
  list.innerHTML=PERM_DEFS.map(function(p){
    var chk=saved[p.id]?'checked':'';
    return '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:9px 12px;border-radius:10px;border:1.5px solid #e5e7eb;transition:.15s">'+
      '<input type="checkbox" id="perm_'+p.id+'" '+chk+' style="margin-top:3px;accent-color:#7c3aed;width:16px;height:16px;flex-shrink:0">'+
      '<div><div style="font-weight:700;font-size:13px">'+p.label+'</div><div style="font-size:11px;color:#94a3b8">'+p.desc+'</div></div>'+
    '</label>';
  }).join('');
}
function savePermissions(){
  var perms={};
  PERM_DEFS.forEach(function(p){var el=document.getElementById('perm_'+p.id);if(el)perms[p.id]=el.checked;});
  AUTH.savePermissions('cashier',perms);
  toast('تم حفظ صلاحيات الكاشيير ✅','success');
}

// ═══════════════════════════════════════════════════════════

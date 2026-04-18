// ── js/02_db.js ──
// ║  IndexedDB LAYER                                         ║
// ═══════════════════════════════════════════════════════════
var IDB_NAME='hashishi_db';
var IDB_VERSION=4;
var IDB_STORES=['products','sales','returns','printSales','telecomSales','expenses','clients','purchases','stockLog','suppliers','supplierPayments','employees','activityLog'];
var _idb=null;

function openIDB(){
  return new Promise(function(resolve,reject){
    if(_idb){resolve(_idb);return;}
    if(!window.indexedDB){reject(new Error('IndexedDB غير مدعوم'));return;}
    var req=indexedDB.open(IDB_NAME,IDB_VERSION);
    req.onupgradeneeded=function(e){
      var idbInst=e.target.result;
      IDB_STORES.forEach(function(s){if(!idbInst.objectStoreNames.contains(s))idbInst.createObjectStore(s,{keyPath:'id'});});
    };
    req.onsuccess=function(e){_idb=e.target.result;resolve(_idb);};
    req.onerror=function(e){reject(e.target.error);};
    req.onblocked=function(){reject(new Error('IDB blocked'));};
  });
}
function idbGetAll(storeName){
  return openIDB().then(function(inst){return new Promise(function(resolve,reject){
    var tx=inst.transaction(storeName,'readonly');
    var req=tx.objectStore(storeName).getAll();
    req.onsuccess=function(){resolve(req.result||[]);};
    req.onerror=function(){reject(req.error);};
  });});
}
function idbSaveAll(storeName,items){
  return openIDB().then(function(inst){return new Promise(function(resolve,reject){
    var tx=inst.transaction(storeName,'readwrite');
    var store=tx.objectStore(storeName);
    store.clear();
    (items||[]).forEach(function(item){if(item&&item.id)store.put(item);});
    tx.oncomplete=function(){resolve();};
    tx.onerror=function(){reject(tx.error);};
  });});
}
function idbClearAll(){
  return openIDB().then(function(inst){return Promise.all(IDB_STORES.map(function(s){
    return new Promise(function(resolve,reject){
      var tx=inst.transaction(s,'readwrite');tx.objectStore(s).clear();
      tx.oncomplete=function(){resolve();};tx.onerror=function(){reject(tx.error);};
    });
  }));});
}
function loadDB(){return Promise.all(IDB_STORES.map(function(k){return idbGetAll(k).then(function(items){db[k]=items;});}));}

// saveDB returns a Promise (for async/await usage)
var _dbStatusTimer=null;
function saveDB(k){
  showDBStatus();
  return idbSaveAll(k,db[k]||[]).catch(function(e){console.error('IDB saveDB error ['+k+']:',e);toast('خطأ في حفظ البيانات ❌','error');});
}
function showDBStatus(){
  var el=$('db-status');if(!el)return;
  el.classList.add('show');clearTimeout(_dbStatusTimer);
  _dbStatusTimer=setTimeout(function(){el.classList.remove('show');},1200);
}

// IDB object wrapper (for compatibility with file2 init)
var IDB={open:function(){return openIDB();}};

// Migration from localStorage
var LS_LEGACY_KEYS={products:'hch_p',sales:'hch_s',returns:'hch_rt',printSales:'hch_ps',telecomSales:'hch_ts',expenses:'hch_ex',clients:'hch_cl'};
function migrateFromLocalStorage(){
  return idbGetAll('products').then(function(existing){
    if(existing.length>0)return false;
    var hasOld=false,k;
    for(k in LS_LEGACY_KEYS){if(localStorage.getItem(LS_LEGACY_KEYS[k]))hasOld=true;}
    if(!hasOld)return false;
    var promises=[];
    for(k in LS_LEGACY_KEYS){(function(key,lsKey){
      var raw=localStorage.getItem(lsKey);if(!raw)return;
      try{var items=JSON.parse(raw);if(Array.isArray(items)&&items.length>0){db[key]=items;promises.push(idbSaveAll(key,items));}}catch(e){}
    })(k,LS_LEGACY_KEYS[k]);}
    return Promise.all(promises).then(function(){return true;});
  });
}
function ensureDefaultUsers(){return Promise.resolve();}
function loadSettingsFromIDB(){return Promise.resolve();}

function showIDBInfo(){
  var el=$('idb-info');if(!el)return;
  el.innerHTML='⏳ جارٍ الحساب...';
  Promise.all(IDB_STORES.map(function(s){return idbGetAll(s).then(function(items){return{store:s,count:items.length};});}))
  .then(function(results){
    var names={products:'📦 منتجات',sales:'🛒 مبيعات',returns:'🔄 مرتجعات',printSales:'🖨️ طباعة',telecomSales:'📱 هاتف',expenses:'💸 مصاريف',clients:'👥 عملاء'};
    var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
    results.forEach(function(r){html+='<div style="background:#f8fafc;padding:8px 10px;border-radius:8px;border:1px solid #e5e7eb;"><span style="font-weight:700">'+(names[r.store]||r.store)+'</span><span style="float:left;color:#7c3aed;font-weight:900">'+r.count+'</span></div>';});
    html+='</div><div style="margin-top:10px;padding:8px 12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;color:#065f46;font-weight:700;">✅ IndexedDB — '+IDB_NAME+' v'+IDB_VERSION+'</div>';
    el.innerHTML=html;
  });
}

// ═══════════════════════════════════════════════════════════

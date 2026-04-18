// ── js/13_inventory.js ──
// ║  Inventory CRUD                                         ║
// ═══════════════════════════════════════════════════════════
function openNewProdModal(bc, prefill){
  pendingBC = bc || ('MANUAL-'+Date.now());
  $('np-bc').value = (bc && bc.indexOf('MANUAL')<0) ? bc : '';
  $('np-name').value = prefill || '';
  $('np-price').value = ''; $('np-cost').value = ''; $('np-stock').value = '0';
  $('np-unit').value = 'قطعة'; $('np-expiry').value = '';
  openModal('m-new-prod');
  setTimeout(function(){ $('np-name').focus(); }, 100);
}
function openAddProd(){ openNewProdModal(null); }

function previewImg(prefix){
  var file = $(prefix+'-img-input').files[0];
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    // ضغط الصورة عبر canvas قبل التخزين
    var img = new Image();
    img.onload = function(){
      var MAX = 600;
      var w = img.width, h = img.height;
      if(w > MAX || h > MAX){
        if(w > h){ h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var compressed = canvas.toDataURL('image/jpeg', 0.75);
      $(prefix+'-img-data').value = compressed;
      $(prefix+'-img-preview').src = compressed;
      $(prefix+'-img-preview').style.display = 'block';
      $(prefix+'-img-placeholder').style.display = 'none';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveNewProd(addC){
  var name = $('np-name').value.trim(), price = parseFloat($('np-price').value)||0;
  if(!name || price<=0){ toast('أدخل الاسم وسعر البيع ❌','error'); return; }
  var manualBC = $('np-bc').value.trim(), finalBC = manualBC ? normalizeBC(manualBC) : pendingBC;
  if(manualBC){
    var bcList = manualBC.split(',').map(function(b){ return normalizeBC(b.trim()); }).filter(Boolean);
    for(var bi=0; bi<bcList.length; bi++){
      var dup = findProductByBarcode(bcList[bi]);
      if(dup){ toast('الباركود مسجل مسبقاً لـ: '+dup.name+' ❌','error'); return; }
    }
    finalBC = bcList.join(',');
  }
  var imgData = $('np-img-data').value || '';
  var p = {
    id: genId(), barcode: finalBC, name: name, category: $('np-cat').value,
    unit: $('np-unit').value, price: price, cost: parseFloat($('np-cost').value)||0,
    wholesalePrice: parseFloat($('np-wprice').value)||0,
    stock: parseInt($('np-stock').value)||0, image: imgData,
    expiry: $('np-expiry').value||'', createdAt: today()
  };
  db.products.push(p); await saveDB('products');
  closeModal('m-new-prod'); pendingBC = ''; $('np-img-data').value = '';
  $('np-img-preview').style.display = 'none'; $('np-img-placeholder').style.display = 'block';
  if(addC) addToCart(p);
  renderInv(); toast('تم حفظ: '+name+(addC?' ✚ سلة':''),'success'); autoPush();
}

function showEditProd(id){
  var p = db.products.find(function(x){ return x.id === id; });
  if(!p) return;
  $('ep-id').value = p.id; $('ep-name').value = p.name;
  $('ep-cat').value = p.category || 'متنوع'; $('ep-unit').value = p.unit || 'قطعة';
  $('ep-price').value = p.price; $('ep-cost').value = p.cost || 0;
  if($('ep-wprice'))$('ep-wprice').value = p.wholesalePrice || '';
  $('ep-stock').value = p.stock || 0; $('ep-expiry').value = p.expiry || '';
  var bcVal = (p.barcode && p.barcode.indexOf('MANUAL')<0) ? p.barcode : '';
  $('ep-bc').value = bcVal;
  if(p.image){
    $('ep-img-data').value = p.image; $('ep-img-preview').src = p.image;
    $('ep-img-preview').style.display = 'block'; $('ep-img-placeholder').style.display = 'none';
  } else {
    $('ep-img-data').value = ''; $('ep-img-preview').style.display = 'none';
    $('ep-img-placeholder').style.display = 'block';
  }
  openModal('m-edit-prod');
}

async function saveEditProd(){
  var id = $('ep-id').value, p = db.products.find(function(x){ return x.id === id; });
  if(!p) return;
  p.name = $('ep-name').value; p.category = $('ep-cat').value; p.unit = $('ep-unit').value;
  p.price = parseFloat($('ep-price').value)||0; p.cost = parseFloat($('ep-cost').value)||0;
  p.wholesalePrice = parseFloat($('ep-wprice').value)||0;
  p.stock = parseInt($('ep-stock').value)||0; p.expiry = $('ep-expiry').value||'';
  var newBC = $('ep-bc').value.trim();
  if(newBC){ var bcList = newBC.split(',').map(function(b){ return normalizeBC(b.trim()); }).filter(Boolean); p.barcode = bcList.join(','); }
  var imgData = $('ep-img-data').value; if(imgData) p.image = imgData;
  await saveDB('products');
  closeModal('m-edit-prod'); renderInv(); toast('تم التعديل ✅','success'); autoPush();
}

async function delProd(id){
  if(!AUTH.can('delete_product')){toast('لا تملك صلاحية حذف المنتجات ❌','error');return;}
  if(!confirm('حذف المنتج نهائياً؟')) return;
  db.products = db.products.filter(function(p){ return p.id !== id; });
  await saveDB('products');
  renderInv(); toast('تم الحذف','info'); autoPush();
}

function addToCartFromInv(id){
  var p = db.products.find(function(x){ return x.id === id; });
  if(p) addToCart(p);
}

async function editStockPrompt(id){
  openStockEditModal(id);
}
function openStockEditModal(id){
  var p=db.products.find(function(x){return x.id===id;});if(!p)return;
  $('se-pid').value=id;
  $('se-prod-name').textContent=p.name;
  $('se-qty').value=p.stock||0;
  openModal('m-stock-edit');
  setTimeout(function(){$('se-qty').focus();$('se-qty').select();},120);
}
function seAdjust(d){
  var inp=$('se-qty');if(!inp)return;
  var v=(parseInt(inp.value)||0)+d;
  inp.value=Math.max(0,v);
}
async function saveStockEdit(){
  var id=$('se-pid').value;
  var p=db.products.find(function(x){return x.id===id;});if(!p)return;
  var num=parseInt($('se-qty').value);
  if(isNaN(num)||num<0){toast('كمية غير صالحة ❌','error');return;}
  var old=p.stock||0;
  p.stock=num;
  await saveDB('products');
  logStockChange(id, p.name, old, num, 'تعديل يدوي', AUTH.currentUser?AUTH.currentUser.username:'—');
  closeModal('m-stock-edit');
  renderInv();autoPush();
  var diff=num-old;
  var diffStr=diff>0?'↑ +'+diff:diff<0?'↓ '+diff:'= بدون تغيير';
  toast('تم تحديث المخزون ✅ ('+old+' → '+num+' '+diffStr+')','success',3000);
}

// ═══════════════════════════════════════════════════════════
// ║  STOCK LOG                                               ║
// ═══════════════════════════════════════════════════════════
async function logStockChange(pid, pname, oldQty, newQty, reason, user){
  var entry={id:genId(),pid:pid,name:pname,oldQty:oldQty,newQty:newQty,diff:newQty-oldQty,reason:reason||'—',user:user||'—',date:nowStr(),dateStr:today()};
  if(!db.stockLog)db.stockLog=[];
  db.stockLog.push(entry);
  // احتفظ بآخر 500 سجل فقط لتوفير المساحة
  if(db.stockLog.length>500)db.stockLog=db.stockLog.slice(-500);
  await saveDB('stockLog');
}
function openStockLog(pid){
  var p=db.products.find(function(x){return x.id===pid;});
  var logs=(db.stockLog||[]).filter(function(l){return l.pid===pid;}).slice().reverse().slice(0,30);
  var name=p?p.name:'المنتج';
  var html='';
  if(!logs.length){ html='<div style="color:#9ca3af;text-align:center;padding:24px;font-size:12px">لا يوجد سجل حركات لهذا المنتج بعد</div>'; }
  else {
    html='<table style="width:100%;border-collapse:collapse;font-size:12px">'+
      '<thead><tr style="background:#f8fafc"><th style="padding:8px;text-align:right;border-bottom:2px solid #e5e7eb">التاريخ</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">قبل</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">بعد</th><th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb">الفرق</th><th style="padding:8px;text-align:right;border-bottom:2px solid #e5e7eb">السبب</th></tr></thead><tbody>';
    logs.forEach(function(l){
      var diffColor=l.diff>0?'#16a34a':l.diff<0?'#dc2626':'#64748b';
      var diffSign=l.diff>0?'+':'';
      html+='<tr style="border-bottom:1px solid #f1f5f9">'+
        '<td style="padding:8px;color:#64748b;font-size:11px">'+l.date+'</td>'+
        '<td style="padding:8px;text-align:center;font-weight:700">'+l.oldQty+'</td>'+
        '<td style="padding:8px;text-align:center;font-weight:700">'+l.newQty+'</td>'+
        '<td style="padding:8px;text-align:center;font-weight:900;color:'+diffColor+'">'+diffSign+l.diff+'</td>'+
        '<td style="padding:8px;font-size:11px">'+l.reason+(l.user&&l.user!=='—'?' ('+l.user+')':'')+'</td>'+
      '</tr>';
    });
    html+='</tbody></table>';
  }
  $('slg-title').textContent='📦 سجل حركة: '+name;
  $('slg-body').innerHTML=html;
  openModal('m-stock-log');
}

// ✅ 4 — إعادة ضبط الفلتر تلقائياً عند الكتابة في البحث
function onInvSearch(val){
  _invPage=1;
  if(val&&val.trim()&&invFilter!=='all'){
    invFilter='all';
    document.querySelectorAll('.inv-stat-card').forEach(function(el){el.classList.remove('active-filter');});
    var btn=document.querySelector('.inv-stat-card[data-filter="all"]');
    if(btn)btn.classList.add('active-filter');
  }
  renderInv();
}
function setInvFilter(f){
  invFilter = f; _invPage = 1;
  document.querySelectorAll('.inv-stat-card').forEach(function(el){ el.classList.remove('active-filter'); });
  var btn = document.querySelector('.inv-stat-card[data-filter="'+f+'"]');
  if(btn) btn.classList.add('active-filter');
  renderInv();
}

var _invPage = 1;
var INV_PAGE_SIZE = 24;
var _invView = localStorage.getItem('hch_inv_view') || 'grid';
var _invCat = '';

/* ── category accent colors ── */
var CAT_COLORS={
  'كراريس':     {c:'#6366f1',bg:'#eef2ff'},
  'قرطاسية':    {c:'#f59e0b',bg:'#fffbeb'},
  'كتب':        {c:'#10b981',bg:'#ecfdf5'},
  'حقائب':      {c:'#ec4899',bg:'#fdf2f8'},
  'أدوات رسم':  {c:'#f97316',bg:'#fff7ed'},
  'إلكترونيات': {c:'#3b82f6',bg:'#eff6ff'},
  'ألعاب':      {c:'#a855f7',bg:'#faf5ff'},
  'عطور و هدايا':{c:'#f43f5e',bg:'#fff1f2'},
  'مستلزمات دينية':{c:'#14b8a6',bg:'#f0fdfa'},
  'متنوع':      {c:'#64748b',bg:'#f8fafc'},
};
function getCatColor(cat){return CAT_COLORS[cat]||{c:'#64748b',bg:'#f8fafc'};}

function setInvView(v){
  _invView=v; localStorage.setItem('hch_inv_view',v);
  var gb=$('inv-vbtn-grid'),lb=$('inv-vbtn-list');
  if(gb)gb.classList.toggle('on',v==='grid');
  if(lb)lb.classList.toggle('on',v==='list');
  var gw=$('inv-grid-wrap'),lw=$('inv-list-wrap');
  if(gw)gw.style.display=v==='grid'?'':'none';
  if(lw)lw.style.display=v==='list'?'':'none';
}

function clearInvSearch(){
  var s=$('inv-s');if(s)s.value='';
  var c=$('inv-s-clear');if(c)c.style.display='none';
  _invPage=1;renderInv();
}

/* quick +/- stock edit from card */
function qtyDelta(pid, delta){
  var p=db.products.find(function(x){return x.id===pid;});
  if(!p)return;
  var ns=Math.max(0,(p.stock||0)+delta);
  var old=p.stock||0;
  p.stock=ns;
  saveDB('products');
  logStockChange(p.id,p.name,old,ns,(delta>0?'إضافة':'خصم')+' سريع',AUTH.currentUser?AUTH.currentUser.username:'—');
  renderInv();
  toast((delta>0?'➕':'➖')+' '+p.name+' → '+ns,'info',1400);
}

function renderInv(){
  var s=($('inv-s')?$('inv-s').value.trim():'').toLowerCase(),
      sortKey=($('inv-sort')?$('inv-sort').value:'status'),
      alertLimit=shopSettings.lowStockAlert||5;

  var clr=$('inv-s-clear');if(clr)clr.style.display=s?'':'none';
  setInvView(_invView);

  /* ── filter ── */
  var allProds=db.products.filter(function(p){
    if(_invCat&&p.category!==_invCat)return false;
    if(!s)return true;
    if(p.name.toLowerCase().indexOf(s)>=0)return true;
    if(p.barcode&&p.barcode.toLowerCase().indexOf(s)>=0)return true;
    var words=s.split(' ').filter(Boolean);
    return words.every(function(w){return p.name.toLowerCase().indexOf(w)>=0;});
  });

  var total=allProds.length,
      outOf=allProds.filter(function(p){return p.stock<=0;}).length,
      low=allProds.filter(function(p){return p.stock>0&&p.stock<=alertLimit;}).length,
      healthy=total-outOf-low;
  var invValue=0;
  allProds.forEach(function(p){invValue+=(p.cost||0)*(p.stock||0);});
  var invRevValue=0;
  allProds.forEach(function(p){invRevValue+=(p.price||0)*(p.stock||0);});

  /* ── HERO STATS ── */
  var heroEl=$('inv-hero-row');
  if(heroEl){
    var fmtBig=function(v){return v>=1000000?(v/1000000).toFixed(1)+'م':v>=1000?(v/1000).toFixed(1)+'ك':Math.round(v).toLocaleString();};
    var totalUnits=0; allProds.forEach(function(p){totalUnits+=(p.stock||0);});
    heroEl.innerHTML=
      '<div class="inv-hero-card ihc-all'+(invFilter==='all'?' active-filter':'')+'" data-filter="all" onclick="setInvFilter(\'all\')">'+
        '<span class="ihc-icon">📦</span>'+
        '<div class="ihc-num">'+total+'</div><div class="ihc-lbl">إجمالي المنتجات</div>'+
        '<div class="ihc-bar"></div></div>'+
      '<div class="inv-hero-card ihc-ok'+(invFilter==='ok'?' active-filter':'')+'" data-filter="ok" onclick="setInvFilter(\'ok\')">'+
        '<span class="ihc-icon">✅</span>'+
        '<div class="ihc-num">'+healthy+'</div><div class="ihc-lbl">مخزون جيد</div>'+
        '<div class="ihc-bar"></div></div>'+
      '<div class="inv-hero-card ihc-low'+(invFilter==='low'?' active-filter':'')+'" data-filter="low" onclick="setInvFilter(\'low\')">'+
        '<span class="ihc-icon">⚠️</span>'+
        '<div class="ihc-num">'+low+'</div><div class="ihc-lbl">يحتاج تزويد</div>'+
        '<div class="ihc-bar"></div></div>'+
      '<div class="inv-hero-card ihc-out'+(invFilter==='out'?' active-filter':'')+'" data-filter="out" onclick="setInvFilter(\'out\')">'+
        '<span class="ihc-icon">❌</span>'+
        '<div class="ihc-num">'+outOf+'</div><div class="ihc-lbl">نفذ من المخزون</div>'+
        '<div class="ihc-bar"></div></div>'+
      '<div class="inv-hero-card ihc-val">'+
        '<span class="ihc-icon">💰</span>'+
        '<div class="ihc-num" style="font-size:22px">'+fmtBig(invValue)+'<span style="font-size:11px;opacity:.7;margin-right:2px;font-weight:600"> دج</span></div>'+
        '<div class="ihc-lbl">تكلفة المخزون · قيمة البيع: '+fmtBig(invRevValue)+' دج</div>'+
        '<div class="ihc-bar"></div></div>';
  }

  /* ── CATEGORY CHIPS ── */
  var chipsEl=$('inv-cat-chips');
  if(chipsEl){
    var cats=[]; var catCounts={};
    db.products.forEach(function(p){
      var c=p.category||'متنوع';
      if(!catCounts[c])catCounts[c]=0;
      catCounts[c]++;
      if(cats.indexOf(c)<0)cats.push(c);
    });
    cats.sort();
    var ch='<span class="inv-chip'+(_invCat===''?' active':'')+'" onclick="setInvCat(\'\')">الكل <b>'+db.products.length+'</b></span>';
    cats.forEach(function(c){
      var cc=getCatColor(c);
      ch+='<span class="inv-chip'+(_invCat===c?' active':'')+'" onclick="setInvCat(\''+c.replace(/\'/g,'\\\'')+'\')" style="'+(_invCat===c?'background:'+cc.c+';color:#fff;border-color:'+cc.c:'')+'">'+(CAT_ICONS[c]||'📦')+' '+c+' <b>'+catCounts[c]+'</b></span>';
    });
    chipsEl.innerHTML=ch;
  }

  /* ── apply status filter ── */
  var filtered=allProds.filter(function(p){
    if(invFilter==='ok') return p.stock>alertLimit;
    if(invFilter==='low')return p.stock>0&&p.stock<=alertLimit;
    if(invFilter==='out')return p.stock<=0;
    return true;
  });

  /* ── sort ── */
  filtered.sort(function(a,b){
    var rank=function(p){return p.stock<=0?0:p.stock<=alertLimit?1:2;};
    if(sortKey==='name')    return a.name.localeCompare(b.name,'ar');
    if(sortKey==='price_h') return (b.price||0)-(a.price||0);
    if(sortKey==='price_l') return (a.price||0)-(b.price||0);
    if(sortKey==='stock_h') return (b.stock||0)-(a.stock||0);
    if(sortKey==='stock_l') return (a.stock||0)-(b.stock||0);
    if(sortKey==='profit')  return ((b.price||0)-(b.cost||0))-((a.price||0)-(a.cost||0));
    return rank(a)-rank(b)||a.name.localeCompare(b.name,'ar');
  });

  /* ── paginate ── */
  var totalPages=Math.max(1,Math.ceil(filtered.length/INV_PAGE_SIZE));
  if(_invPage>totalPages)_invPage=totalPages;
  var start=(_invPage-1)*INV_PAGE_SIZE;
  var pageItems=filtered.slice(start,start+INV_PAGE_SIZE);

  /* ── info row ── */
  var rtxt=$('inv-result-txt');
  if(rtxt){
    var f2=filtered.length?start+1:0,t2=Math.min(start+INV_PAGE_SIZE,filtered.length);
    rtxt.textContent='عرض '+(f2)+'–'+(t2)+' من '+filtered.length+' منتج'+(s?' · بحث: "'+s+'"':'');
  }
  var cbw=$('inv-clear-btn-wrap');
  if(cbw)cbw.innerHTML=s?'<button onclick="clearInvSearch()" style="background:#fee2e2;border:none;border-radius:8px;padding:5px 12px;font-size:11px;color:#dc2626;font-weight:800;cursor:pointer;font-family:inherit">✕ مسح البحث</button>':'';

  /* ── highlight helper ── */
  function hl(text){
    if(!s)return text;
    var re=new RegExp('('+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return text.replace(re,'<mark style="background:#fef08a;border-radius:3px;padding:0 2px">$1</mark>');
  }

  /* ── EMPTY STATE ── */
  if(!pageItems.length){
    var em='<div class="inv-empty-state">'+
      '<div class="ies-icon">📦</div>'+
      '<div class="ies-title">لا توجد منتجات مطابقة</div>'+
      '<div class="ies-sub">جرّب تغيير فلتر البحث، أو أضف منتجاً جديداً من خلال الزر أدناه</div>'+
      '<button class="inv-act-btn iab-add" onclick="openAddProd()" style="margin-top:12px;font-size:13px;padding:12px 20px">➕ إضافة منتج جديد</button>'+
    '</div>';
    if($('inv-cards-grid'))$('inv-cards-grid').innerHTML=em;
    if($('inv-list-body'))$('inv-list-body').innerHTML=em;
    renderInvPagination(totalPages);return;
  }

  /* ════════════════════════════════
     GRID VIEW — NEXUS CARDS
     ════════════════════════════════ */
  var gridHtml='';
  for(var i=0;i<pageItems.length;i++){
    var p=pageItems[i];
    var al=alertLimit;
    var sCls=p.stock<=0?'s-out':(p.stock<=al?'s-low':'s-ok');
    var pbCls=p.stock<=0?'pb-out':(p.stock<=al?'pb-low':'pb-ok');
    var bfCls=p.stock<=0?'stock-fill-out':(p.stock<=al?'stock-fill-low':'stock-fill-ok');
    var stockPct=Math.min(100,Math.max(0,al>0?(p.stock/(al*4))*100:0));
    var badgeTxt=p.stock<=0?'❌ نفذ':(p.stock<=al?'⚠️ '+p.stock+' فقط':'✅ '+p.stock);
    var profitAmt=p.cost?(p.price-p.cost):null;
    var profitPct=profitAmt!==null&&p.cost>0?Math.round((profitAmt/p.cost)*100):null;
    var profitBarW=profitPct!==null?Math.min(100,Math.max(0,profitPct)):0;
    var profitColor=profitAmt>0?'#10b981':'#ef4444';
    var bcRaw=p.barcode&&p.barcode.indexOf('MANUAL')<0?p.barcode.split(',')[0]:'';
    var expBadge=expiryBadge(p.expiry);
    var cc=getCatColor(p.category);
    /* card header */
    var headBg=p.image?''
      :'background:linear-gradient(145deg,'+cc.bg+',rgba(255,255,255,0.8));';
    var headContent=p.image
      ?'<img class="pcard-head-img" src="'+p.image+'" loading="lazy">'
      :'<div class="pcard-head-icon">'+
          '<span class="pcard-head-emoji">'+(CAT_ICONS[p.category]||'📦')+'</span>'+
          '<span class="pcard-head-cat-lbl" style="color:'+cc.c+'">'+(p.category||'')+'</span>'+
        '</div>';
    /* stagger animation delay */
    var delay=(i%INV_PAGE_SIZE)*0.045;
    /* stock ring color */
    var ringColor=p.stock<=0?'var(--inv-out)':(p.stock<=al?'var(--inv-low)':'var(--inv-ok)');

    gridHtml+=
    '<div class="pcard '+sCls+'" style="animation-delay:'+delay+'s">'+
      '<div class="pcard-head" style="'+headBg+'">'+
        headContent+
        '<span class="pcard-badge-tl badge-pro '+pbCls+'">'+badgeTxt+'</span>'+
        (expBadge?'<span class="pcard-badge-tr">'+expBadge+'</span>':'')+
        (bcRaw?'<span class="pcard-bc-badge">'+bcRaw+'</span>':'')+
      '</div>'+
      '<div class="pcard-body">'+
        '<div class="pcard-name">'+hl(p.name)+'</div>'+
        '<div class="pcard-cat-chip" style="background:'+cc.bg+';color:'+cc.c+';border:1px solid '+cc.c+'22">'+(CAT_ICONS[p.category]||'📦')+' '+(p.category||'غير محدد')+'</div>'+
        /* price + profit */
        '<div class="pcard-price-row">'+
          '<div>'+
            '<div style="font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:2px">سعر البيع</div>'+
            '<div class="pcard-price">'+fmt(p.price)+'<span style="font-size:11px;font-weight:600;opacity:.7;margin-right:2px;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent"> دج</span></div>'+
            (AUTH.isAdmin()&&p.wholesalePrice>0?'<div style="font-size:10px;color:#059669;font-weight:700;margin-top:2px">🏭 جملة: '+fmt(p.wholesalePrice)+'</div>':'')+
          '</div>'+
          (AUTH.can('view_cost')&&profitAmt!==null?
            '<div class="pcard-profit-wrap">'+
              '<div style="font-size:9.5px;color:#94a3b8;font-weight:600;margin-bottom:2px;text-align:left">هامش الربح</div>'+
              '<span class="pcard-profit-amt" style="color:'+profitColor+';text-align:left">'+(profitAmt>0?'+':'')+fmt(profitAmt)+'</span>'+
              '<div class="pcard-profit-bar-wrap"><div class="pcard-profit-bar" style="width:'+profitBarW+'%;background:'+(profitAmt>0?'linear-gradient(90deg,#34d399,#10b981)':'#ef4444')+'"></div></div>'+
              '<span class="pcard-profit-pct">'+(profitPct!==null?profitPct+'%':'')+' ربح</span>'+
            '</div>':'')+
        '</div>'+
        /* stock + quick controls */
        '<div class="pcard-stock-wrap">'+
          '<div class="pcard-stock-row">'+
            '<div style="display:flex;align-items:baseline;gap:2px">'+
              '<span class="pcard-stock-num" style="color:'+ringColor+'">'+(p.stock||0)+'</span>'+
              '<span class="pcard-stock-unit">'+(p.unit||'قطعة')+' متوفرة</span>'+
            '</div>'+
            (AUTH.isAdmin()?
              '<div class="pcard-qty-ctrl">'+
                '<button class="pcard-qty-btn" onclick="qtyDelta(\''+p.id+'\',-1)" title="خصم واحد">−</button>'+
                '<span class="pcard-qty-val">'+(p.stock||0)+'</span>'+
                '<button class="pcard-qty-btn" onclick="qtyDelta(\''+p.id+'\',1)" title="إضافة واحد">+</button>'+
              '</div>':'')+
          '</div>'+
          '<div class="stock-bar-bg"><div class="stock-bar-fill '+bfCls+'" style="width:'+stockPct+'%"></div></div>'+
        '</div>'+
      '</div>'+
      '<div class="pcard-div"></div>'+
      '<div class="pcard-actions" style="padding:0 12px 12px;gap:5px">'+
        '<button class="pab pab-cart" onclick="addToCartFromInv(\''+p.id+'\')" title="إضافة للسلة">🛒</button>'+
        (AUTH.isAdmin()?'<button class="pab pab-edit" onclick="showEditProd(\''+p.id+'\')" title="تعديل">✏️</button>':'')+
        '<button class="pab pab-bc" onclick="printBarcodeLabel(\''+p.id+'\')" title="طباعة الباركود">🏷️</button>'+
        '<button class="pab pab-log" onclick="openStockLog(\''+p.id+'\')" title="سجل الحركة">📋</button>'+
        (AUTH.isAdmin()?'<button class="pab pab-del" onclick="delProd(\''+p.id+'\')" title="حذف">🗑️</button>':'')+
      '</div>'+
    '</div>';
  }
  if($('inv-cards-grid'))$('inv-cards-grid').innerHTML=gridHtml;

  /* ════════════════════════════════
     LIST VIEW — EDITORIAL TABLE
     ════════════════════════════════ */
  var listHtml='';
  for(var j=0;j<pageItems.length;j++){
    var q=pageItems[j];
    var qBfCls=q.stock<=0?'stock-fill-out':(q.stock<=alertLimit?'stock-fill-low':'stock-fill-ok');
    var qSpct=Math.min(100,Math.max(0,alertLimit>0?(q.stock/(alertLimit*4))*100:0));
    var qPA=q.cost?(q.price-q.cost):null;
    var qPP=qPA!==null&&q.cost>0?Math.round((qPA/q.cost)*100):null;
    var qBc=q.barcode&&q.barcode.indexOf('MANUAL')<0?q.barcode.split(',')[0]:'—';
    var qCC=getCatColor(q.category);
    var qStatusTxt=q.stock<=0?'نفذ':q.stock<=alertLimit?'منخفض':'جيد';
    var qStatusGrad=q.stock<=0?'linear-gradient(135deg,#fca5a5,#ef4444)':q.stock<=alertLimit?'linear-gradient(135deg,#fcd34d,#f59e0b)':'linear-gradient(135deg,#6ee7b7,#10b981)';
    var qStatusTxtCol=q.stock<=0?'#7f1d1d':q.stock<=alertLimit?'#78350f':'#065f46';
    listHtml+=
    '<div class="iln-row">'+
      '<div class="iln-thumb" style="background:'+qCC.bg+';border:1.5px solid '+qCC.c+'22">'+
        (q.image?'<img src="'+q.image+'" style="width:100%;height:100%;object-fit:cover;border-radius:14px" loading="lazy">':'<span>'+(CAT_ICONS[q.category]||'📦')+'</span>')+
      '</div>'+
      '<div>'+
        '<div class="iln-name">'+hl(q.name)+'</div>'+
        '<div class="iln-cat" style="color:'+qCC.c+'">'+
          (CAT_ICONS[q.category]||'')+'&nbsp;'+(q.category||'—')+
        '</div>'+
      '</div>'+
      '<div><span class="iln-bc">'+qBc+'</span></div>'+
      '<div class="iln-price">'+fmt(q.price)+'<span style="font-size:9px;opacity:.5;margin-right:2px"> دج</span></div>'+
      (AUTH.isAdmin()?
        '<div class="iln-profit" style="color:'+(qPA>0?'#10b981':'#ef4444')+'">'+
          (qPA!==null?(qPA>0?'+':'')+fmt(qPA):'—')+
          (qPP!==null?'<br><span style="font-size:9px;color:#94a3b8">'+qPP+'%</span>':'')+
        '</div>':
        '<div></div>')+
      '<div class="iln-stock-cell">'+
        '<div class="iln-stock-info">'+
          '<span class="iln-stock-num">'+(q.stock||0)+' '+(q.unit||'ق')+'</span>'+
          '<span style="font-size:9.5px;font-weight:900;background:'+qStatusGrad+';color:'+qStatusTxtCol+';padding:2px 8px;border-radius:20px;letter-spacing:.3px">'+qStatusTxt+'</span>'+
        '</div>'+
        '<div class="stock-bar-bg" style="margin-top:5px"><div class="stock-bar-fill '+qBfCls+'" style="width:'+qSpct+'%"></div></div>'+
      '</div>'+
      '<div class="iln-actions">'+
        '<button class="action-btn-circle cart" onclick="addToCartFromInv(\''+q.id+'\')" title="إضافة للسلة">🛒</button>'+
        (AUTH.isAdmin()?'<button class="action-btn-circle edit" onclick="showEditProd(\''+q.id+'\')" title="تعديل">✏️</button>':'')+
        '<button class="action-btn-circle bc" onclick="printBarcodeLabel(\''+q.id+'\')" title="باركود">🏷️</button>'+
        '<button class="action-btn-circle" onclick="openStockLog(\''+q.id+'\')" style="background:#f0f9ff;color:#0284c7;border:1px solid #bae6fd" title="السجل">📋</button>'+
        (AUTH.isAdmin()?'<button class="action-btn-circle del" onclick="delProd(\''+q.id+'\')" title="حذف">🗑️</button>':'')+
      '</div>'+
    '</div>';
  }
  if($('inv-list-body'))$('inv-list-body').innerHTML=listHtml;

  renderInvPagination(totalPages);
}

function setInvCat(cat){
  _invCat=cat; _invPage=1; renderInv();
}

function renderInvPagination(totalPages){
  var el=$('inv-pagination');if(!el)return;
  if(totalPages<=1){el.innerHTML='';return;}
  var h='<button class="ipb" onclick="_invPage=1;renderInv()" '+((_invPage===1)?'disabled':'')+'>«</button>';
  h+='<button class="ipb" onclick="if(_invPage>1){_invPage--;renderInv()}" '+((_invPage===1)?'disabled':'')+'>‹</button>';
  var from=Math.max(1,_invPage-2),to=Math.min(totalPages,from+4);
  from=Math.max(1,to-4);
  for(var pg=from;pg<=to;pg++){
    h+='<button class="ipb'+(pg===_invPage?' cur':'')+'" onclick="_invPage='+pg+';renderInv()">'+pg+'</button>';
  }
  h+='<button class="ipb" onclick="if(_invPage<'+totalPages+'){_invPage++;renderInv()}" '+((_invPage===totalPages)?'disabled':'')+'>›</button>';
  h+='<button class="ipb" onclick="_invPage='+totalPages+';renderInv()" '+((_invPage===totalPages)?'disabled':'')+'>»</button>';
  el.innerHTML=h;
}


// ═══════════════════════════════════════════════════════════

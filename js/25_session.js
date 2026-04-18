// ── js/25_session.js ──
// ═══════════════════════════════════════════════════════════
// ║  DASHBOARD — Goal, Session Clock, Quick Actions, Layout  ║
// ═══════════════════════════════════════════════════════════

var DASH_GOAL_KEY='hch_dash_goal';
var DASH_LAYOUT_KEY='hch_dash_layout_v2';
var _goalAlertFired=false;
var _sessionClockTimer=null;

function saveGoalTarget(){
  var inp=$('dg-target');if(!inp)return;
  var v=parseFloat(inp.value)||0;
  if(v>0){
    localStorage.setItem(DASH_GOAL_KEY,v);
    // حفظ في الإعدادات لمزامنة بين الأجهزة
    shopSettings.dailyGoal=v;
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(shopSettings));
  }
}

function loadGoalTarget(){
  // أولوية: shopSettings → localStorage → القيمة الافتراضية
  var v=shopSettings.dailyGoal||parseFloat(localStorage.getItem(DASH_GOAL_KEY))||10000;
  var inp=$('dg-target');if(inp)inp.value=v;
  return v;
}

function updateGoalBar(salesOverride){
  var target=loadGoalTarget();
  var todayStr=today();
  var sales=salesOverride;
  if(sales===undefined){
    sales=0;
    db.sales.filter(function(s){return s.dateStr===todayStr;}).forEach(function(s){sales+=s.total;});
  }
  var pct=target>0?Math.min(100,Math.round(sales/target*100)):0;
  var bar=$('dg-bar');
  var barWrap=$('dg-bar-wrap');
  var pctEl=$('dg-pct');
  if(bar){
    bar.style.width=pct+'%';
    if(pct>=100){bar.style.background='linear-gradient(90deg,#16a34a,#10b981)';}
    else if(pct>=70){bar.style.background='linear-gradient(90deg,#7c3aed,#06b6d4)';}
    else{bar.style.background='linear-gradient(90deg,#7c3aed,#a78bfa)';}
  }
  if(pctEl){
    pctEl.textContent=pct+'%';
    pctEl.style.color=pct>=100?'#16a34a':pct>=70?'#7c3aed':'#64748b';
  }
  if(barWrap){
    if(pct>=100){
      barWrap.classList.add('goal-reached');
      // صوت الإنجاز — مرة واحدة فقط
      if(!_goalAlertFired){
        _goalAlertFired=true;
        beep('checkout');
        toast('🎉 تم بلوغ الهدف اليومي! '+fmt(target),'success',5000);
        setTimeout(function(){_goalAlertFired=false;},3*3600*1000);
      }
    } else {
      barWrap.classList.remove('goal-reached');
    }
  }
}

function updateSessionClock(){
  var infoEl=$('dg-session-info');if(!infoEl)return;
  if(_cashSession&&_cashSession.status==='open'){
    var openTs=new Date(_cashSession.openTime).getTime();
    var elapsed=Date.now()-openTs;
    if(isNaN(elapsed)||elapsed<0){infoEl.innerHTML='<span class="dg-session-dot"></span> صندوق مفتوح';return;}
    var hrs=Math.floor(elapsed/3600000);
    var mins=Math.floor((elapsed%3600000)/60000);
    var todayStr=today();
    var ops=db.sales.filter(function(s){return s.dateStr===todayStr;}).length;
    infoEl.innerHTML='<span class="dg-session-dot"></span> '+
      (hrs>0?hrs+'س ':'')+mins+'د — '+ops+' عملية';
  } else {
    infoEl.innerHTML='<span style="color:#9ca3af;font-size:11px">الصندوق مغلق</span>';
  }
}

// ── حفظ واستعادة ترتيب السحب
function saveDashLayout(){
  var order={};
  ['ds-r1','ds-r2','ds-r3','ds-r4'].forEach(function(rowId){
    var row=document.getElementById(rowId);if(!row)return;
    order[rowId]=Array.from(row.children).map(function(el){return el.id||el.className;});
  });
  try{localStorage.setItem(DASH_LAYOUT_KEY,JSON.stringify(order));}catch(e){}
}

function loadDashLayout(){
  try{
    var raw=localStorage.getItem(DASH_LAYOUT_KEY);if(!raw)return;
    var order=JSON.parse(raw);
    Object.keys(order).forEach(function(rowId){
      var row=document.getElementById(rowId);if(!row)return;
      var ids=order[rowId];
      ids.forEach(function(idOrClass){
        var el=document.getElementById(idOrClass)||row.querySelector('.'+idOrClass.split(' ')[0]);
        if(el&&el.parentElement===row)row.appendChild(el);
      });
    });
  }catch(e){}
}

// ── مصروف سريع من لوحة التحكم
function openQuickExpenseModal(){
  var inp=$('qe-desc');if(inp)inp.value='';
  var amt=$('qe-amt');if(amt)amt.value='';
  openModal('m-quick-exp');
  setTimeout(function(){if($('qe-desc'))$('qe-desc').focus();},100);
}

async function saveQuickExpFromDash(){
  var desc=($('qe-desc')||{}).value&&$('qe-desc').value.trim();
  var amt=parseFloat(($('qe-amt')||{}).value)||0;
  var cat=($('qe-cat')||{}).value||'other';
  if(!desc){toast('الوصف مطلوب ❌','error');return;}
  if(amt<=0){toast('المبلغ غير صالح ❌','error');return;}
  await saveQuickExpense(desc,amt,cat);
  closeModal('m-quick-exp');
  renderDash();
}

// ── تهيئة Sortable مع حفظ الترتيب
function initDashSortable(){
  if(!window.Sortable||window.innerWidth<=768)return;
  loadDashLayout();
  ['ds-r1','ds-r2','ds-r3','ds-r4'].forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    Sortable.create(el,{
      animation:200,
      ghostClass:'sortable-ghost',
      chosenClass:'sortable-chosen',
      dragClass:'sortable-drag',
      handle:'.dh',
      delay:80,
      delayOnTouchOnly:true,
      onEnd:function(){
        saveDashLayout();
        setTimeout(function(){
          drawMiniChart();
          drawTopProdsChart();
          drawRevVsExpChart();
          drawHeatmap();
        },250);
      }
    });
  });
}

function startApp(){
  setInterval(updateClock,1000);updateClock();
  populateCategories();initPrint();initTelecom();
  loadQuickAccess();renderQuickAccess();
  renderSidebarSparkline();
  var syncRaw=localStorage.getItem(AUTO_SYNC_KEY);autoSync=syncRaw==='1';
  updateCloudStatus();
  if(autoSync)cloudPull(false,null);
  if(typeof requestIdleCallback==='function'){requestIdleCallback(function(){initScanner();},{timeout:2000});}else{setTimeout(initScanner,500);}
  applyRoleUI();
  // ── مؤقت دقيقة واحد: ساعة الجلسة + الهدف + نسخ احتياطي كل 10 دقائق
  var _minTick=0;
  _sessionClockTimer=setInterval(function(){
    _minTick++;
    updateSessionClock();updateGoalBar();
    if(_minTick%10===0)doAutoBackup();
  },60000);
  setTimeout(doAutoBackup,5000);
  setTimeout(checkLowStockOnStartup,1800);
  loadCashSession();renderSessionStrip();
  setTimeout(initDashSortable,700);
  loadGoalTarget();
  setTimeout(updateNavBadges,1000);
  setTimeout(checkRecurringExpenses,3000);
  setTimeout(checkCreditLimitAlerts,4000);
  if(AUTH.isCashier())showPage('cashier');
  else{renderDash();showPage('dashboard');}
}


function doAutoBackup(){
  try{
    var snap=JSON.stringify({date:nowStr(),db:db});
    localStorage.setItem('hch_auto_backup',snap);
    var el=$('backup-dot');
    if(el){el.style.opacity='1';setTimeout(function(){el.style.opacity='0';},2000);}
  }catch(e){console.warn('Auto-backup failed:',e);}
}

// ✅ 3 — تنبيه المخزون عند بدء التطبيق
function checkLowStockOnStartup(){
  var limit=shopSettings.lowStockAlert||5;
  var expiryDays=shopSettings.expiryAlert||30;
  var todayD=new Date(); todayD.setHours(0,0,0,0);
  var outOf=db.products.filter(function(p){return p.stock<=0;});
  var low=db.products.filter(function(p){return p.stock>0&&p.stock<=limit;});
  var expiringSoon=db.products.filter(function(p){
    if(!p.expiry)return false;
    var d=new Date(p.expiry); d.setHours(0,0,0,0);
    var diff=Math.round((d-todayD)/(1000*60*60*24));
    return diff>=0&&diff<=expiryDays;
  });
  var expired=db.products.filter(function(p){
    if(!p.expiry)return false;
    var d=new Date(p.expiry); d.setHours(0,0,0,0);
    return d<todayD;
  });
  if(!outOf.length&&!low.length&&!expiringSoon.length&&!expired.length)return;
  var el=$('ls-alert-body'); if(!el)return;
  var html='';
  if(expired.length){
    html+='<div style="font-weight:800;color:#dc2626;margin-bottom:8px;font-size:13px">🚫 منتهية الصلاحية ('+expired.length+' صنف)</div>';
    expired.slice(0,6).forEach(function(p){html+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #fee2e2"><span style="font-weight:600">'+p.name+'</span><span style="color:#dc2626;font-weight:800">منتهي '+p.expiry+'</span></div>';});
    if(expired.length>6)html+='<div style="color:#9ca3af;font-size:11px;padding:4px 0">و '+(expired.length-6)+' منتج آخر...</div>';
  }
  if(expiringSoon.length){
    html+='<div style="font-weight:800;color:#d97706;margin:'+(expired.length?'16px':'0')+'px 0 8px;font-size:13px">⏰ تنتهي صلاحيتها قريباً ('+expiringSoon.length+' صنف)</div>';
    expiringSoon.slice(0,6).forEach(function(p){
      var d=new Date(p.expiry); d.setHours(0,0,0,0);
      var diff=Math.round((d-todayD)/(1000*60*60*24));
      html+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #fef3c7"><span style="font-weight:600">'+p.name+'</span><span style="color:#d97706;font-weight:800">'+diff+' يوم ('+p.expiry+')</span></div>';
    });
    if(expiringSoon.length>6)html+='<div style="color:#9ca3af;font-size:11px;padding:4px 0">و '+(expiringSoon.length-6)+' منتج آخر...</div>';
  }
  if(outOf.length){
    html+='<div style="font-weight:800;color:#dc2626;margin:'+((expired.length||expiringSoon.length)?'16px':'0')+'px 0 8px;font-size:13px">❌ نفذ من المخزون ('+outOf.length+' صنف)</div>';
    outOf.slice(0,6).forEach(function(p){html+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #fee2e2"><span style="font-weight:600">'+p.name+'</span><span style="color:#dc2626;font-weight:800">نفذ</span></div>';});
    if(outOf.length>6)html+='<div style="color:#9ca3af;font-size:11px;padding:4px 0">و '+(outOf.length-6)+' منتج آخر...</div>';
  }
  if(low.length){
    html+='<div style="font-weight:800;color:#d97706;margin:'+((expired.length||expiringSoon.length||outOf.length)?'16px':'0')+'px 0 8px;font-size:13px">⚠️ قارب على النفاذ ('+low.length+' صنف)</div>';
    low.slice(0,6).forEach(function(p){html+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #fef3c7"><span style="font-weight:600">'+p.name+'</span><span style="color:#d97706;font-weight:800">'+p.stock+' '+(p.unit||'قطعة')+'</span></div>';});
    if(low.length>6)html+='<div style="color:#9ca3af;font-size:11px;padding:4px 0">و '+(low.length-6)+' منتج آخر...</div>';
  }
  el.innerHTML=html;
  openModal('m-lowstock-alert');
}

// ═══════════════════════════════════════════════════════════
// ║  Initialization                                          ║
// ═══════════════════════════════════════════════════════════
async function init(){
  await IDB.open();
  var migrated = await migrateFromLocalStorage();
  await ensureDefaultUsers();
  await loadSettingsFromIDB();
  loadSettings();
  await loadDB();
  AUTH.init();
  if(migrated) toast('تم الترحيل من localStorage إلى IndexedDB ✅','success',4000);

  // تحميل JsBarcode من CDN
  if(!window.JsBarcode){
    var script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
    document.head.appendChild(script);
  }

  if(AUTH.currentUser){startApp();}
  else{showLoginScreen();}
}

// ── تذكير المصاريف المتكررة ──
function checkRecurringExpenses(){
  var thisMonth=today().slice(0,7);
  var recurring=db.expenses.filter(function(e){return e.recurring;});
  if(!recurring.length)return;
  // تحقق من كل مصروف متكرر: هل سُجِّل هذا الشهر؟
  recurring.forEach(function(e){
    var alreadyThisMonth=db.expenses.some(function(x){
      return x.id!==e.id && x.desc===e.desc && x.category===e.category && x.date&&x.date.slice(0,7)===thisMonth;
    });
    if(!alreadyThisMonth){
      toast('🔁 تذكير: لم يُسجَّل بعد — '+e.desc+' ('+fmt(e.amount)+')','info',6000);
    }
  });
}
// ── تنبيه تجاوز حد الائتمان ──
function checkCreditLimitAlerts(){
  (db.clients||[]).forEach(function(c){
    if((c.creditLimit||0)>0&&(c.totalDebt||0)>c.creditLimit){
      toast('⛔ '+c.name+' تجاوز حد الائتمان ('+fmt(c.totalDebt)+' > '+fmt(c.creditLimit)+')','error',5000);
    }
  });
}

window.onload = init;


// ── js/05_utils.js ──
// ║  UTILITIES                                               ║
// ═══════════════════════════════════════════════════════════
function $(id){return document.getElementById(id);}
function today(){return new Date().toISOString().slice(0,10);}
function nowStr(){return new Date().toLocaleString('ar-DZ');}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function fmt(n){return Number(n||0).toFixed(2)+' دج';}
function rechargeProfit(amt){return amt<1000?(shopSettings.flexyProfitLow||10):(shopSettings.flexyProfitHigh||20);}
function normalizeBC(code){if(code==null)return '';return String(code).replace(/[\s\r\n\t\u200b\u200c\u200d\ufeff]/g,'');}
function truncateItems(items,max){max=max||2;var n=items.slice(0,max).map(function(it){return it.name+(it.qty>1?' ×'+it.qty:'');}).join(' • ');if(items.length>max)n+=' +('+( items.length-max)+')';return n;}
function toast(msg,type,dur){var t=$('toast');if(!t)return;t.className='toast show '+(type||'');t.innerHTML=(type==='success'?'✅ ':type==='error'?'❌ ':type==='info'?'ℹ️ ':'🔔 ')+msg;setTimeout(function(){t.className='toast';},dur||2500);}
function updateClock(){var now=new Date(),p=function(n){return n.toString().padStart(2,'0');};var el=$('clock-badge');if(el)el.textContent=p(now.getHours())+':'+p(now.getMinutes())+':'+p(now.getSeconds());}
function openModal(id){var el=$(id);if(el)el.classList.add('show');}
function closeModal(id){var el=$(id);if(el)el.classList.remove('show');if(id==='m-new-purchase')stopPurCamera('new');if(id==='m-edit-purchase')stopPurCamera('edit');}
function ovClose(e,el){if(e.target===el){el.classList.remove('show');if(el.id==='m-new-purchase')stopPurCamera('new');if(el.id==='m-edit-purchase')stopPurCamera('edit');}}
function toggleSidebar(){var sb=$('sidebar'),ov=$('sidebar-overlay');if(sb.classList.contains('open'))closeSidebar();else{sb.classList.add('open');if(ov)ov.classList.add('show');}}
function closeSidebar(){var sb=$('sidebar'),ov=$('sidebar-overlay');if(sb)sb.classList.remove('open');if(ov)ov.classList.remove('show');}
function toggleTopbarMore(){var m=$('topbar-more-menu');if(m)m.classList.toggle('open');}
function closeTopbarMore(){var m=$('topbar-more-menu');if(m)m.classList.remove('open');}
// إغلاق قائمة المزيد عند الضغط خارجها
document.addEventListener('click',function(e){if(!e.target.closest('#topbar-more-wrap'))closeTopbarMore();});
function expiryBadge(expDate){
  if(!expDate)return '—';
  var now=new Date();now.setHours(0,0,0,0);
  var exp=new Date(expDate),diff=Math.round((exp-now)/(1000*60*60*24));
  if(diff<0)return '<span class="expiry-expired">⚠️ منتهي</span>';
  if(diff<=30)return '<span class="expiry-soon">⏰ '+diff+' يوم</span>';
  return '<span class="expiry-ok">✅ صالح</span>';
}
function getNextInvoiceNum(){
  var n=parseInt(localStorage.getItem(INVOICE_KEY)||'0')+1;
  localStorage.setItem(INVOICE_KEY,n);return Promise.resolve(n);
}
function getTotalReservedQty(pid){
  var qty=0,i,j,k;
  for(i=0;i<cart.length;i++){if(cart[i].pid===pid)qty+=cart[i].qty;}
  for(j=0;j<heldCarts.length;j++){for(k=0;k<heldCarts[j].items.length;k++){if(heldCarts[j].items[k].pid===pid)qty+=heldCarts[j].items[k].qty;}}
  return qty;
}

// ═══════════════════════════════════════════════════════════
// ║  BEEP                                                    ║
// ═══════════════════════════════════════════════════════════
function beep(type){
  try{
    if(!audioCtx){var AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}
    if(!audioCtx)return;if(audioCtx.state==='suspended')audioCtx.resume();
    var now=audioCtx.currentTime;
    if(type==='checkout'){
      [[523,0],[659,0.12],[784,0.24],[1047,0.38]].forEach(function(n){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='sine';o.frequency.value=n[0];g.gain.setValueAtTime(0,now+n[1]);g.gain.linearRampToValueAtTime(0.35,now+n[1]+0.03);g.gain.exponentialRampToValueAtTime(0.001,now+n[1]+0.3);o.start(now+n[1]);o.stop(now+n[1]+0.32);});
    }else if(type==='error'){
      [[380,0],[260,0.2]].forEach(function(n){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='sawtooth';o.frequency.value=n[0];g.gain.setValueAtTime(0.28,now+n[1]);g.gain.exponentialRampToValueAtTime(0.001,now+n[1]+0.22);o.start(now+n[1]);o.stop(now+n[1]+0.24);});
    }else if(type==='warning'){
      var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='triangle';o.frequency.setValueAtTime(880,now);o.frequency.setValueAtTime(440,now+0.15);o.frequency.setValueAtTime(880,now+0.30);g.gain.setValueAtTime(0.35,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.45);o.start(now);o.stop(now+0.46);
    }else{
      var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='sine';o.frequency.setValueAtTime(1400,now);o.frequency.exponentialRampToValueAtTime(900,now+0.10);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.4,now+0.01);g.gain.exponentialRampToValueAtTime(0.001,now+0.16);o.start(now);o.stop(now+0.17);
    }
  }catch(e){}
}

// ═══════════════════════════════════════════════════════════

// ── js/06_nav.js ──
// ║  NAVIGATION                                              ║
// ═══════════════════════════════════════════════════════════
document.querySelectorAll('.nav-item').forEach(function(el){el.addEventListener('click',function(){var id=el.getAttribute('data-page');if(id)showPage(id);});});
function showPage(id){
  if(id==='print'){var _b=$('svc-tab-print');id='services';if(_b)setTimeout(function(){switchService('print',_b);},10);}
  if(id==='telecom'){var _b=$('svc-tab-telecom');id='services';if(_b)setTimeout(function(){switchService('telecom',_b);},10);}
  closeSidebar();
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var pg=$('pg-'+id);if(!pg)return;
  pg.classList.add('active');
  var nav=document.querySelector('[data-page="'+id+'"]');if(nav)nav.classList.add('active');
  var info=PAGE_INFO[id]||{title:id,sub:''};
  $('pg-title').textContent=info.title;$('pg-sub').textContent=info.sub;
  if(id!=='cashier'&&typeof stopCamera==='function')stopCamera();
  setTimeout(function(){
    if(id==='dashboard')renderDash();
    if(id==='inventory')renderInv();
    if(id==='clients')renderClients();
    if(id==='expenses')renderExp();
    if(id==='purchases')renderPurchases();
    if(id==='services'){renderPrint();renderTel();}
    if(id==='reports'){genReport();drawMonthlyChart();}
    if(id==='cashier'){renderTodaySum();renderHeldCarts();showPay();renderQuickAccess();renderSessionStrip();}
    if(id==='settings'){renderSettings();showIDBInfo();}
  },50);
}
function applyDashboardLayout(){
  // New bento dashboard — no layout toggling needed, all sections always visible
}


// ═══════════════════════════════════════════════════════════

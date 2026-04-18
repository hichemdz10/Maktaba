// ── js/30_extensions.js ──
// ═══════════════════════════════════════════════════════════
// ║  PAGE INFO + NAVIGATION EXTENSION                        ║
// ═══════════════════════════════════════════════════════════
PAGE_INFO['suppliers']={title:'الموردون 🏭',sub:'إدارة الموردين وتتبع الديون والمدفوعات'};
PAGE_INFO['employees']={title:'الموظفون 👤',sub:'إدارة حسابات الموظفين والصلاحيات'};

// Hook into showPage for new pages (fixed: use unique var name to avoid infinite recursion)
var _origShowPage2=showPage;
showPage=function(id){
  _origShowPage2(id);
  if(id==='suppliers')setTimeout(renderSuppliers,60);
  if(id==='employees')setTimeout(renderEmployees,60);
};

// Init new collections on startup
if(typeof db!=='undefined'){
  if(!db.suppliers)db.suppliers=[];
  if(!db.supplierPayments)db.supplierPayments=[];
  if(!db.employees)db.employees=[];
  if(!db.activityLog)db.activityLog=[];
}

function updateSupplierBadge(){
  if(!db.suppliers)return;
  var withDebt=db.suppliers.filter(function(sup){
    var totalP=db.purchases.filter(function(p){return p.supplierId===sup.id||p.supplier===sup.name;}).reduce(function(a,p){return a+(p.total||0);},0);
    var totalPaid=(db.supplierPayments||[]).filter(function(py){return py.supplierId===sup.id;}).reduce(function(a,py){return a+(py.amount||0);},0);
    var paidV=db.purchases.filter(function(p){return (p.supplierId===sup.id||p.supplier===sup.name)&&p.paidAmount;}).reduce(function(a,p){return a+(p.paidAmount||0);},0);
    return Math.max(0,totalP-totalPaid-paidV)>0;
  }).length;
  var nbSup=document.getElementById('nb-sup');
  if(nbSup){nbSup.textContent=withDebt||'';nbSup.style.display=withDebt?'':'none';}
}

// دمج setInterval — مؤقت واحد بدلاً من ثلاثة منفصلة
setInterval(function(){
  updateSupplierBadge();
  updateNavBadges();
},5000);

</script>

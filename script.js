var S = JSON.parse(localStorage.getItem('M_DB'))||{
  tab:"home",
  stock:[],
  sales:[],
  flixy:[],
  clients:[],
  expenses:[],
  print:[]
};

function save(){localStorage.setItem('M_DB',JSON.stringify(S));}

function clockStr(){
  var d=new Date();
  var h=d.getHours(), m=d.getMinutes(), s=d.getSeconds();
  var ampm=h>=12?'PM':'AM';
  h=h%12; h=h?h:12;
  return (h<10?'0'+h:h)+':'+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s)+' '+ampm;
}

function dateStr(){
  var d=new Date();
  var days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  var months=["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return days[d.getDay()]+" ، "+d.getDate()+" "+months[d.getMonth()]+" "+d.getFullYear();
}

var clockTimer=null;

function renderHeader(){
  return `
    <div class="header">
      <div class="logo-area">
        <div class="logo-icon"><i class="fas fa-book-open"></i></div>
        <div class="shop-info">
          <h1>مكتبة حشايشي</h1>
          <p>نظام إدارة المبيعات والمخزون الذكي</p>
        </div>
      </div>
      <div class="header-right">
        <div class="clock-box">
          <div id="clockLbl">${clockStr()}</div>
          <div id="dateLbl">${dateStr()}</div>
        </div>
      </div>
    </div>
    <div class="nav-grid">
      <button class="nav-btn ${S.tab==='home'?'active':''}" onclick="setTab('home')"><i class="fas fa-shopping-cart"></i><span>البيع</span></button>
      <button class="nav-btn ${S.tab==='stock'?'active':''}" onclick="setTab('stock')"><i class="fas fa-box"></i><span>المخزون</span></button>
      <button class="nav-btn ${S.tab==='flixy'?'active':''}" onclick="setTab('flixy')"><i class="fas fa-mobile-alt"></i><span>فليكسي</span></button>
      <button class="nav-btn ${S.tab==='clients'?'active':''}" onclick="setTab('clients')"><i class="fas fa-users"></i><span>الزبائن</span></button>
      <button class="nav-btn ${S.tab==='expenses'?'active':''}" onclick="setTab('expenses')"><i class="fas fa-wallet"></i><span>المصاريف</span></button>
      <button class="nav-btn ${S.tab==='report'?'active':''}" onclick="setTab('report')"><i class="fas fa-chart-line"></i><span>التقارير</span></button>
    </div>
  `;
}

function setTab(t){ S.tab=t; save(); render(); }

function renderHome(){
  var html=`<div class="card"><h2 class="section-title"><i class="fas fa-cart-plus"></i> عملية بيع جديدة</h2><div class="grid-2">
    <div class="form-group"><label class="label">ابحث عن منتج</label><input list="stockList" id="sellSearch" class="input" placeholder="اكتب اسم المنتج أو الباركود..."><datalist id="stockList">`;
  S.stock.forEach(i=>{ if(i.q>0) html+=`<option value="${i.n}"> (السعر: ${i.p} | الكمية: ${i.q})</option>`; });
  html+=`</datalist></div><div class="form-group"><label class="label">الكمية</label><input type="number" id="sellQty" class="input" value="1"></div></div>
  <button class="btn-primary" onclick="addToSale()"><i class="fas fa-plus"></i> إضافة للسلة</button></div>`;
  
  if(S.print.length>0){
    html+=`<div class="card"><h2 class="section-title"><i class="fas fa-list"></i> السلة الحالية</h2><div class="table-container"><table><thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>المجموع</th><th>-</th></tr></thead><tbody>`;
    var total=0;
    S.print.forEach((p,idx)=>{
      var sub=p.p*p.q; total+=sub;
      html+=`<tr><td>${p.n}</td><td>${p.p}</td><td>${p.q}</td><td>${sub}</td><td><button onclick="removeFromPrint(${idx})" style="color:#e53935;background:none;border:none"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    html+=`</tbody></table></div><div class="flex-between" style="margin-top:15px"><h3>المجموع الكلي: <span style="color:#0277bd">${total} دج</span></h3>
    <button class="btn-success" onclick="finishSale()"><i class="fas fa-check-circle"></i> إتمام البيع</button></div></div>`;
  }
  return html;
}

function addToSale(){
  var name=document.getElementById('sellSearch').value;
  var qty=parseInt(document.getElementById('sellQty').value);
  var item=S.stock.find(i=>i.n===name);
  if(!item || qty<1 || qty>item.q){ alert("تأكد من اسم المنتج والكمية المتوفرة!"); return; }
  S.print.push({n:item.n, p:item.p, q:qty, cost:item.cost});
  item.q-=qty; save(); render();
}

function removeFromPrint(idx){
  var p=S.print[idx];
  var item=S.stock.find(i=>i.n===p.n);
  if(item) item.q+=p.q;
  S.print.splice(idx,1); save(); render();
}

function renderStock(){
  var html=`<div class="card"><h2 class="section-title"><i class="fas fa-plus-circle"></i> إضافة منتج جديد للمخزون</h2>
  <div class="grid-2">
    <div class="form-group"><label class="label">اسم المنتج</label><input id="stN" class="input" type="text"></div>
    <div class="form-group"><label class="label">سعر الشراء</label><input id="stC" class="input" type="number"></div>
    <div class="form-group"><label class="label">سعر البيع</label><input id="stP" class="input" type="number"></div>
    <div class="form-group"><label class="label">الكمية</label><input id="stQ" class="input" type="number"></div>
  </div><button class="btn-primary" onclick="addStockItem()">حفظ المنتج</button></div>`;
  
  html+=`<div class="card"><h2 class="section-title"><i class="fas fa-boxes"></i> قائمة المخزون</h2><div class="table-container"><table><thead><tr><th>المنتج</th><th>شراء</th><th>بيع</th><th>كمية</th><th>حذف</th></tr></thead><tbody>`;
  S.stock.forEach((i,idx)=>{
    html+=`<tr><td>${i.n}</td><td>${i.cost}</td><td>${i.p}</td><td><span class="badge badge-stock">${i.q}</span></td>
    <td><button onclick="delStock(${idx})" style="color:#e53935;background:none;border:none"><i class="fas fa-trash"></i></button></td></tr>`;
  });
  html+=`</tbody></table></div></div>`;
  return html;
}

function addStockItem(){
  var n=document.getElementById('stN').value, c=parseFloat(document.getElementById('stC').value), 
      p=parseFloat(document.getElementById('stP').value), q=parseInt(document.getElementById('stQ').value);
  if(!n||isNaN(c)||isNaN(p)||isNaN(q)){alert("املأ جميع الحقول!"); return;}
  S.stock.push({n, cost:c, p, q}); save(); render();
}
function renderFlixy(){
  var html=`<div class="card"><h2 class="section-title"><i class="fas fa-mobile-alt"></i> عملية فليكسي جديدة</h2>
  <div class="grid-2">
    <div class="form-group"><label class="label">الشبكة</label><select id="flX" class="input"><option>Mobilis</option><option>Djezzy</option><option>Ooredoo</option></select></div>
    <div class="form-group"><label class="label">المبلغ</label><input id="flA" class="input" type="number"></div>
  </div><button class="btn-primary" onclick="addFlixy()">تسجيل العملية</button></div>`;
  
  html+=`<div class="card"><h2 class="section-title"><i class="fas fa-history"></i> سجل الفليكسي اليوم</h2><div class="table-container"><table><thead><tr><th>الشبكة</th><th>المبلغ</th><th>الوقت</th></tr></thead><tbody>`;
  S.flixy.forEach(f=>{ html+=`<tr><td>${f.x}</td><td>${f.a}</td><td>${f.t}</td></tr>`; });
  html+=`</tbody></table></div></div>`;
  return html;
}

function addFlixy(){
  var x=document.getElementById('flX').value, a=parseFloat(document.getElementById('flA').value);
  if(!a){alert("أدخل المبلغ!");return;}
  S.flixy.push({x, a, t:clockStr(), d:new Date().toLocaleDateString()}); save(); render();
}

function renderClients(){
  var html=`<div class="card"><h2 class="section-title"><i class="fas fa-user-plus"></i> إضافة زبون / دين</h2>
  <div class="grid-2">
    <div class="form-group"><label class="label">اسم الزبون</label><input id="clN" class="input" type="text"></div>
    <div class="form-group"><label class="label">المبلغ (دين)</label><input id="clA" class="input" type="number"></div>
  </div><button class="btn-primary" onclick="addClient()">حفظ البيانات</button></div>`;
  
  html+=`<div class="card"><h2 class="section-title"><i class="fas fa-users"></i> قائمة الديون</h2><div class="table-container"><table><thead><tr><th>الزبون</th><th>المبلغ</th><th>الإجراء</th></tr></thead><tbody>`;
  S.clients.forEach((c,idx)=>{
    html+=`<tr><td>${c.n}</td><td style="color:#e53935;font-weight:bold">${c.a} دج</td>
    <td><button class="btn-success" onclick="payClient(${idx})">تم التسديد</button></td></tr>`;
  });
  html+=`</tbody></table></div></div>`;
  return html;
}

function addClient(){
  var n=document.getElementById('clN').value, a=parseFloat(document.getElementById('clA').value);
  if(!n||isNaN(a)){alert("املأ البيانات!");return;}
  S.clients.push({n, a}); save(); render();
}

function payClient(idx){ S.clients.splice(idx,1); save(); render(); }

function renderExpenses(){
  var html=`<div class="card"><h2 class="section-title"><i class="fas fa-wallet"></i> تسجيل مصاريف</h2>
  <div class="grid-2">
    <div class="form-group"><label class="label">البيان (ماذا اشتريت؟)</label><input id="exN" class="input" type="text"></div>
    <div class="form-group"><label class="label">المبلغ</label><input id="exA" class="input" type="number"></div>
  </div><button class="btn-primary" onclick="addExpense()">حفظ المصروف</button></div>`;
  
  html+=`<div class="card"><h2 class="section-title"><i class="fas fa-list-ul"></i> سجل المصاريف</h2><div class="table-container"><table><thead><tr><th>البيان</th><th>المبلغ</th></tr></thead><tbody>`;
  S.expenses.forEach(e=>{ html+=`<tr><td>${e.n}</td><td>${e.a}</td></tr>`; });
  html+=`</tbody></table></div></div>`;
  return html;
}

function addExpense(){
  var n=document.getElementById('exN').value, a=parseFloat(document.getElementById('exA').value);
  if(!n||!a){alert("أدخل البيانات!");return;}
  S.expenses.push({n, a, d:new Date().toLocaleDateString()}); save(); render();
                                          }
function renderReport(){
  var totalSales=0, totalCost=0, totalFlixy=0, totalExp=0;
  S.sales.forEach(s=>{ totalSales+=s.total; totalCost+=s.cost; });
  S.flixy.forEach(f=>{ totalFlixy+=f.a; });
  S.expenses.forEach(e=>{ totalExp+=e.a; });
  var netProf = (totalSales - totalCost) - totalExp;

  return `
    <div class="grid-2">
      <div class="card" style="border-right:5px solid #0277bd"><h3>إجمالي المبيعات</h3><h2 style="color:#0277bd">${totalSales} دج</h2></div>
      <div class="card" style="border-right:5px solid #2e7d32"><h3>صافي الأرباح</h3><h2 style="color:#2e7d32">${netProf} دج</h2></div>
      <div class="card" style="border-right:5px solid #f57c00"><h3>إجمالي الفليكسي</h3><h2 style="color:#f57c00">${totalFlixy} دج</h2></div>
      <div class="card" style="border-right:5px solid #e53935"><h3>إجمالي المصاريف</h3><h2 style="color:#e53935">${totalExp} دج</h2></div>
    </div>
    <div class="card">
      <h2 class="section-title"><i class="fas fa-exclamation-triangle"></i> منطقة الخطر</h2>
      <button class="btn-primary" style="background:#e53935" onclick="if(confirm('هل أنت متأكد من مسح جميع البيانات؟')){localStorage.clear();location.reload();}">مسح جميع بيانات النظام</button>
    </div>
  `;
}

function finishSale(){
  var total=0, cost=0;
  S.print.forEach(p=>{ total+=p.p*p.q; cost+=p.cost*p.q; });
  S.sales.push({total, cost, d:new Date().toLocaleDateString(), t:clockStr()});
  S.print=[]; save(); render();
  alert("تمت العملية بنجاح!");
}

function delStock(idx){ if(confirm("حذف هذا المنتج؟")){S.stock.splice(idx,1); save(); render();} }

function scheduleMidnight(){
  var now=new Date();
  var night=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1);
  setTimeout(function(){ S.flixy=[]; S.expenses=[]; S.print=[]; save(); location.reload(); }, night.getTime()-now.getTime());
}

function render(){
  var tabContent='';
  if(S.tab==="home") tabContent=renderHome();
  else if(S.tab==="stock") tabContent=renderStock();
  else if(S.tab==="flixy") tabContent=renderFlixy();
  else if(S.tab==="clients") tabContent=renderClients();
  else if(S.tab==="expenses") tabContent=renderExpenses();
  else if(S.tab==="report") tabContent=renderReport();
  
  document.getElementById('root').innerHTML='<div class="app">'+renderHeader()+'<div class="tab-content">'+tabContent+'</div></div>';
  
  if(!clockTimer){
    clockTimer=setInterval(function(){
      var c=document.getElementById('clockLbl'), d=document.getElementById('dateLbl');
      if(c) c.textContent=clockStr(); if(d) d.textContent=dateStr();
    },1000);
  }
}

// تشغيل النظام فور تحميل الصفحة
scheduleMidnight();
try{ render(); }catch(e){
  document.getElementById('root').innerHTML='<div style="background:#e53935;color:#fff;padding:20px;text-align:center">حدث خطأ في التشغيل</div>';
        }

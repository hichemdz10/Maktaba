// ── js/20_dashboard.js ──
// ║  Dashboard                                               ║
// ═══════════════════════════════════════════════════════════
function renderSidebarSparkline(){
  var data = getSalesForDays(5), keys = Object.keys(data), max = 1;
  keys.forEach(function(k){ if(data[k]>max) max = data[k]; });
  var html = '';
  keys.forEach(function(k, idx){
    var h = (data[k]/max)*100; if(h<15 && data[k]>0) h=15; if(h===0) h=4;
    var cls = (idx===keys.length-1) ? 'spark-bar today' : 'spark-bar';
    html += '<div class="'+cls+'" style="height:'+h+'%" title="'+k+': '+fmt(data[k])+'"></div>';
  });
  var sp = $('sidebar-spark'); if(sp) sp.innerHTML = html;
}
function getSalesForDays(days){
  var result = {};
  for(var i=days-1; i>=0; i--){
    var d = new Date(); d.setDate(d.getDate()-i);
    result[d.toISOString().slice(0,10)] = 0;
  }
  db.sales.forEach(function(s){ if(result.hasOwnProperty(s.dateStr)) result[s.dateStr] += s.total; });
  return result;
}
// ═══════════════════════════════════════════════════════════
// ║  CHARTS — Chart.js powered                               ║
// ═══════════════════════════════════════════════════════════
var _charts={};
function _destroyChart(id){if(_charts[id]){_charts[id].destroy();delete _charts[id];}}

function _isDark(){return document.body.classList.contains('dark-mode');}
function _gridColor(){return _isDark()?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)';}
function _textColor(){return _isDark()?'#94a3b8':'#64748b';}
function _tooltipBg(){return _isDark()?'#1e293b':'#1e1b4b';}

// ── مخطط الشريط الرئيسي (dashboard 7/14/30 يوم)
var _dashDays=7;
function setDashChartDays(days,btn){
  _dashDays=days;
  document.querySelectorAll('#dash-card-chart .btn').forEach(function(b){b.style.background='';b.style.color='';b.style.borderColor='';});
  if(btn){btn.style.background='#7c3aed';btn.style.color='#fff';btn.style.borderColor='#7c3aed';}
  drawMiniChart();
}
function drawMiniChart(){
  var canvas=$('dash-mini-chart');if(!canvas)return;
  var data=getSalesForDays(_dashDays);
  var labels=Object.keys(data).map(function(k){return k.slice(5);});
  var salesVals=Object.values(data);
  // ── بيانات الربح والمصاريف لنفس الأيام
  var profitVals=Object.keys(data).map(function(dateStr){
    var daySales=db.sales.filter(function(s){return s.dateStr===dateStr;});
    var p=0;
    daySales.forEach(function(s){s.items.forEach(function(it){var pr=db.products.find(function(x){return x.id===it.pid;});var sp=it.price||(pr?pr.price:0);var cost=pr?(pr.cost||0):0;p+=(sp-cost)*it.qty;});});
    var tel=0;db.telecomSales.forEach(function(t){if(t.dateStr===dateStr)tel+=t.profit||0;});
    var prnt=0;db.printSales.forEach(function(ps){if(ps.dateStr===dateStr)prnt+=ps.total||0;});
    var exp=0;db.expenses.forEach(function(e){if(e.date===dateStr)exp+=e.amount||0;});
    return Math.max(0,p+tel+prnt-exp);
  });
  var expVals=Object.keys(data).map(function(dateStr){
    var exp=0;db.expenses.forEach(function(e){if(e.date===dateStr)exp+=e.amount||0;});return exp;
  });
  var dark=_isDark();
  _destroyChart('dash-mini');
  _charts['dash-mini']=new Chart(canvas,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[
        {
          label:'المبيعات',
          data:salesVals,
          backgroundColor:dark?'rgba(124,58,237,.5)':'rgba(124,58,237,.35)',
          borderColor:'rgba(124,58,237,.9)',
          borderWidth:2,borderRadius:6,borderSkipped:false,
          order:3
        },
        {
          label:'الربح الصافي',
          data:profitVals,
          type:'line',
          borderColor:'#10b981',
          backgroundColor:'rgba(16,185,129,.1)',
          borderWidth:2,pointRadius:3,pointBackgroundColor:'#10b981',
          tension:.35,fill:false,order:1
        },
        {
          label:'المصاريف',
          data:expVals,
          type:'line',
          borderColor:'#ef4444',
          backgroundColor:'rgba(239,68,68,.08)',
          borderWidth:1.5,pointRadius:2,pointBackgroundColor:'#ef4444',
          tension:.35,fill:false,order:2,
          borderDash:[4,3]
        }
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:500,easing:'easeOutQuart'},
      plugins:{
        legend:{
          display:true,
          position:'bottom',
          labels:{boxWidth:10,font:{size:9,family:'Tajawal'},color:_textColor(),padding:8}
        },
        tooltip:{
          backgroundColor:_tooltipBg(),titleColor:'#a78bfa',bodyColor:'#e2e8f0',
          padding:10,cornerRadius:8,displayColors:true,
          callbacks:{label:function(ctx){return ctx.dataset.label+': '+fmt(ctx.parsed.y);}}
        }
      },
      scales:{
        x:{grid:{display:false},ticks:{color:_textColor(),font:{size:10,family:'Tajawal'}}},
        y:{grid:{color:_gridColor(),drawBorder:false},ticks:{color:_textColor(),font:{size:9},callback:function(v){return v>=1000?(v/1000).toFixed(0)+'ك':v;}},border:{display:false}}
      }
    }
  });
}


function drawHeatmap(){
  var el=$('dash-heatmap');if(!el)return;
  var days=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  var daysShort=['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'];
  var slots=[['الصباح','8-12'],['الظهر','12-16'],['العصر','16-20'],['المساء','20-24']];
  var grid={};
  for(var d=0;d<7;d++){grid[d]={};for(var s=0;s<4;s++)grid[d][s]=0;}
  var cutoffTs=Date.now()-60*24*3600*1000;
  var hasTsData=false;
  db.sales.forEach(function(sale){
    var dt=null;
    if(sale.ts&&sale.ts>cutoffTs){dt=new Date(sale.ts);hasTsData=true;}
    else if(!sale.ts&&sale.dateStr){
      var d2=new Date(sale.dateStr+'T12:00:00');
      if(!isNaN(d2.getTime())&&d2.getTime()>cutoffTs)dt=d2;
    }
    if(!dt)return;
    var dow=dt.getDay();
    var h=dt.getHours();
    var slot=h<8?-1:h<12?0:h<16?1:h<20?2:3;
    if(slot<0)slot=1;
    grid[dow][slot]+=sale.total||0;
  });
  var maxVal=0;
  for(var dd=0;dd<7;dd++)for(var ss=0;ss<4;ss++)if(grid[dd][ss]>maxVal)maxVal=grid[dd][ss];

  var dark=document.body.classList.contains('dark-mode');

  if(maxVal===0){
    el.innerHTML='<div style="text-align:center;color:'+(dark?'#475569':'#9ca3af')+';font-size:12px;padding:28px 0;font-weight:600">📊 لا توجد بيانات مبيعات كافية بعد</div>';
    return;
  }

  // Color scale (5 levels)
  var scale=dark?
    ['#1e293b','#312e81','#4c1d95','#7c3aed','#a78bfa']:
    ['#f1f5f9','#ede9fe','#a78bfa','#7c3aed','#4c1d95'];

  function getColor(v){
    if(!v)return scale[0];
    var p=v/maxVal;
    if(p<0.15)return scale[1];
    if(p<0.40)return scale[2];
    if(p<0.70)return scale[3];
    return scale[4];
  }
  function getTextColor(v){
    if(!v)return dark?'#475569':'#cbd5e1';
    var p=v/maxVal;
    return p<0.40?( dark?'#a78bfa':'#5b21b6'):( '#fff');
  }

  // Find peak
  var peakDay=0,peakSlot=0;
  for(var di=0;di<7;di++)for(var si=0;si<4;si++)if(grid[di][si]>=grid[peakDay][peakSlot]){peakDay=di;peakSlot=si;}

  var html='<div style="overflow-x:auto;padding-bottom:2px">';
  html+='<table style="width:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed">';

  // Header row
  html+='<thead><tr>';
  html+='<th style="width:30px;"></th>';
  slots.forEach(function(sl,si){
    html+='<th style="text-align:center;padding:3px 2px 6px"><div style="font-size:9.5px;font-weight:700;color:'+(dark?'#64748b':'#94a3b8')+'">'+sl[0]+'</div><div style="font-size:8px;color:'+(dark?'#475569':'#cbd5e1')+'">'+sl[1]+'</div></th>';
  });
  html+='</tr></thead><tbody>';

  for(var di=0;di<7;di++){
    html+='<tr>';
    // Day label
    html+='<td style="text-align:center;vertical-align:middle;padding-left:2px"><span style="font-size:9px;font-weight:700;color:'+(dark?'#64748b':'#94a3b8')+'">'+daysShort[di]+'</span></td>';
    for(var si=0;si<4;si++){
      var v=grid[di][si];
      var bg=getColor(v);
      var tc=getTextColor(v);
      var isPeak=(di===peakDay&&si===peakSlot&&v>0);
      var tip=days[di]+' '+slots[si][0]+': '+(v>0?fmt(v):'لا مبيعات');
      html+='<td title="'+tip+'" style="'+
        'height:28px;border-radius:8px;background:'+bg+';cursor:default;'+
        'position:relative;text-align:center;vertical-align:middle;'+
        'transition:transform .12s,box-shadow .12s;'+
        (isPeak?'box-shadow:0 0 0 2px #f59e0b,0 4px 12px rgba(245,158,11,.35);':'')+
        '" '+
        'onmouseover="this.style.transform=\'scale(1.18)\';this.style.zIndex=\'20\';this.style.boxShadow=\'0 6px 18px rgba(0,0,0,.25)\'" '+
        'onmouseout="this.style.transform=\'\';this.style.zIndex=\'\';this.style.boxShadow=\''+(isPeak?'0 0 0 2px #f59e0b,0 4px 12px rgba(245,158,11,.35)':'')+'\'">';
      if(v>0){
        var display=v>=1000?(v/1000).toFixed(1)+'k':Math.round(v)+'';
        html+='<span style="font-size:8px;font-weight:800;color:'+tc+';pointer-events:none">'+display+'</span>';
      }
      if(isPeak) html+='<span style="position:absolute;top:-4px;right:-3px;font-size:8px;line-height:1;pointer-events:none">⭐</span>';
      html+='</td>';
    }
    html+='</tr>';
  }
  html+='</tbody></table>';

  // Legend + peak info
  html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;flex-wrap:wrap;gap:6px">';
  html+='<div style="display:flex;align-items:center;gap:3px">';
  html+='<span style="font-size:8.5px;color:'+(dark?'#475569':'#94a3b8')+'">أقل</span>';
  scale.forEach(function(c){html+='<div style="width:11px;height:11px;border-radius:3px;background:'+c+'"></div>';});
  html+='<span style="font-size:8.5px;color:'+(dark?'#475569':'#94a3b8')+'">أكثر</span>';
  html+='</div>';
  if(maxVal>0){
    html+='<div style="font-size:9px;color:#f59e0b;font-weight:700">⭐ ذروة: '+days[peakDay]+' '+slots[peakSlot][0]+'</div>';
  }
  if(!hasTsData){
    html+='<span style="font-size:8px;color:#f59e0b;font-weight:600">⚠️ بيانات تقريبية</span>';
  }
  html+='</div>';
  html+='</div>';
  el.innerHTML=html;
}


// ── بيانات الربح الشهري (آخر 7 أشهر)
function getMonthlyProfitData(){
  var months={},now=new Date();
  for(var m=6;m>=0;m--){
    var d=new Date(now.getFullYear(),now.getMonth()-m,1);
    var key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    months[key]={profit:0,exp:0,tel:0,print:0,returns:0};
  }
  db.sales.forEach(function(s){
    var mk=s.dateStr?s.dateStr.slice(0,7):null;
    if(!mk||!months[mk])return;
    var gm=0;
    s.items.forEach(function(it){
      var p=db.products.find(function(x){return x.id===it.pid;});
      var sp=it.price||(p?p.price:0);
      var cost=p?(p.cost||0):0;
      gm+=(sp-cost)*it.qty;
    });
    months[mk].profit+=Math.max(0,gm-(s.discount||0));
  });
  db.telecomSales.forEach(function(s){
    var mk=s.dateStr?s.dateStr.slice(0,7):null;
    if(mk&&months[mk])months[mk].tel+=s.profit||0;
  });
  db.printSales.forEach(function(s){
    var mk=s.dateStr?s.dateStr.slice(0,7):null;
    if(mk&&months[mk])months[mk].print+=s.total||0;
  });
  db.expenses.forEach(function(e){
    var mk=e.date?e.date.slice(0,7):null;
    if(mk&&months[mk])months[mk].exp+=e.amount||0;
  });
  db.returns.forEach(function(r){
    var mk=r.dateStr?r.dateStr.slice(0,7):null;
    if(!mk||!months[mk])return;
    var rCost=(r.returnCost!==undefined)?r.returnCost:(function(){var rp=db.products.find(function(x){return x.id===r.productId;});return rp?(rp.cost||0)*r.quantity:0;})();
    months[mk].returns+=Math.max(0,(r.amount||0)-rCost);
  });
  var labels=[];var vals=[];
  Object.keys(months).forEach(function(k){
    labels.push(k.slice(5)+'/'+k.slice(2,4));
    var v=months[k];
    vals.push(v.profit+v.tel+v.print-v.exp-v.returns);
  });
  return{labels:labels,vals:vals};
}

// ── مخطط الأرباح الشهرية (line مع fill)
function drawMonthlyChart(){
  var canvas=$('chart-monthly');if(!canvas)return;
  var data=getMonthlyProfitData();
  _destroyChart('monthly');
  var dark=_isDark();
  _charts['monthly']=new Chart(canvas,{
    type:'line',
    data:{
      labels:data.labels,
      datasets:[{
        label:'صافي الربح (دج)',
        data:data.vals,
        borderColor:'#10b981',
        backgroundColor:'rgba(16,185,129,0.12)',
        borderWidth:3,
        pointBackgroundColor:'#10b981',
        pointBorderColor:'#fff',
        pointBorderWidth:2,
        pointRadius:6,
        pointHoverRadius:9,
        fill:true,
        tension:0.4,
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:700,easing:'easeOutCubic'},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:_tooltipBg(),titleColor:'#6ee7b7',bodyColor:'#e2e8f0',
          padding:12,cornerRadius:10,displayColors:false,
          callbacks:{label:function(ctx){return fmt(ctx.parsed.y);}}
        }
      },
      scales:{
        x:{grid:{display:false},ticks:{color:_textColor(),font:{size:11}}},
        y:{grid:{color:_gridColor(),drawBorder:false},ticks:{color:_textColor(),font:{size:10},callback:function(v){return v>=1000?(v/1000).toFixed(0)+'ك':v;}},border:{display:false}}
      }
    }
  });
}

// ── مخطط المبيعات اليومية في التقارير (bar gradient)
function drawSalesChart(sales,from,to){
  var canvas=$('chart-sales');if(!canvas)return;
  var byDay={};
  var d=new Date(from);
  while(d.toISOString().slice(0,10)<=to){byDay[d.toISOString().slice(0,10)]=0;d.setDate(d.getDate()+1);}
  sales.forEach(function(s){if(byDay.hasOwnProperty(s.dateStr))byDay[s.dateStr]+=s.total;});
  var labels=Object.keys(byDay).map(function(k){return k.slice(5);});
  var vals=Object.values(byDay);
  _destroyChart('sales-rep');
  _charts['sales-rep']=new Chart(canvas,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[{
        label:'المبيعات',
        data:vals,
        backgroundColor:'rgba(99,102,241,0.7)',
        borderColor:'rgba(99,102,241,1)',
        borderWidth:2,
        borderRadius:6,
        borderSkipped:false,
        hoverBackgroundColor:'rgba(99,102,241,1)',
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:500},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:_tooltipBg(),titleColor:'#a5b4fc',bodyColor:'#e2e8f0',
          padding:10,cornerRadius:8,displayColors:false,
          callbacks:{label:function(ctx){return fmt(ctx.parsed.y);}}
        }
      },
      scales:{
        x:{grid:{display:false},ticks:{color:_textColor(),font:{size:10},maxRotation:45}},
        y:{grid:{color:_gridColor(),drawBorder:false},ticks:{color:_textColor(),font:{size:10},callback:function(v){return v>=1000?(v/1000).toFixed(0)+'ك':v;}},border:{display:false}}
      }
    }
  });
}

// ── مخطط الدائرة (توزيع الإيرادات)
function drawPieChart(sales,tel,print){
  var canvas=$('chart-pie');if(!canvas)return;
  var salesTotal=0,telTotal=0,printTotal=0;
  sales.forEach(function(s){salesTotal+=s.total;});
  tel.forEach(function(t){telTotal+=t.profit||0;});
  print.forEach(function(p){printTotal+=p.total||0;});
  if(salesTotal===0&&telTotal===0&&printTotal===0){
    _destroyChart('pie-rep');return;
  }
  var dark=_isDark();
  _destroyChart('pie-rep');
  _charts['pie-rep']=new Chart(canvas,{
    type:'doughnut',
    data:{
      labels:['🛒 مبيعات','📱 هاتف','🖨️ طباعة'],
      datasets:[{
        data:[salesTotal,telTotal,printTotal],
        backgroundColor:['rgba(124,58,237,0.85)','rgba(6,182,212,0.85)','rgba(249,115,22,0.85)'],
        borderColor:[dark?'#1e293b':'#fff',dark?'#1e293b':'#fff',dark?'#1e293b':'#fff'],
        borderWidth:3,
        hoverOffset:8,
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:600,easing:'easeOutBounce'},
      cutout:'62%',
      plugins:{
        legend:{
          position:'bottom',
          labels:{color:_textColor(),font:{size:11},padding:16,boxWidth:12,boxHeight:12}
        },
        tooltip:{
          backgroundColor:_tooltipBg(),bodyColor:'#e2e8f0',
          padding:12,cornerRadius:10,
          callbacks:{label:function(ctx){var pct=(ctx.parsed/(salesTotal+telTotal+printTotal)*100).toFixed(1);return ' '+fmt(ctx.parsed)+' ('+pct+'%)';}}
        }
      }
    }
  });
}

// ── مخطط أعلى المنتجات (horizontal bar)
var _topChartMode='qty';
var _topChartPeriod='all';
function setTopChart(mode,btn){
  _topChartMode=mode;
  document.querySelectorAll('#tc-qty,#tc-rev').forEach(function(b){b.style.background='';b.style.color='';b.style.borderColor='';});
  if(btn){btn.style.background='#7c3aed';btn.style.color='#fff';btn.style.borderColor='#7c3aed';}
  drawTopProdsChart();
}
function setTopPeriod(period,btn){
  _topChartPeriod=period;
  document.querySelectorAll('#tp-today,#tp-all').forEach(function(b){b.style.background='';b.style.color='#10b981';b.style.borderColor='#10b981';});
  if(btn){btn.style.background='#10b981';btn.style.color='#fff';}
  drawTopProdsChart();
  // تحديث القائمة النصية
  var topProds=getTopProducts(5);
  var topHtml='';
  topProds.forEach(function(tp,idx){
    var pct=topProds[0]&&topProds[0].qty>0?(tp.qty/topProds[0].qty)*100:0;
    topHtml+='<div style="margin-bottom:5px">'+
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">'+
      '<span style="font-size:9px;font-weight:900;color:#7c3aed;width:12px">#'+(idx+1)+'</span>'+
      '<div style="flex:1;font-size:11px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+tp.name+'</div>'+
      '<span style="font-size:10px;font-weight:800;color:#64748b">'+tp.qty+'</span></div>'+
      '<div style="background:#f1f5f9;border-radius:4px;height:4px;overflow:hidden;margin-right:18px">'+
      '<div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#7c3aed,#06b6d4);border-radius:4px"></div></div></div>';
  });
  var periodLabel=period==='today'?' (اليوم)':'';
  if($('dash-top-prods'))$('dash-top-prods').innerHTML=
    '<div style="font-size:10px;color:#10b981;font-weight:800;margin-bottom:6px">📅 أعلى مبيعاً'+periodLabel+'</div>'+
    (topHtml||'<div style="color:#9ca3af;padding:8px;font-size:11px">لا بيانات</div>');
}
function drawTopProdsChart(){
  var canvas=$('chart-top-prods');if(!canvas)return;
  // فلترة حسب الفترة
  var filteredSales=db.sales;
  if(_topChartPeriod==='today'){
    var t=today();
    filteredSales=db.sales.filter(function(s){return s.dateStr===t;});
  }
  var map={};
  filteredSales.forEach(function(s){
    s.items.forEach(function(it){
      if(!map[it.name])map[it.name]={qty:0,rev:0};
      map[it.name].qty+=it.qty;
      map[it.name].rev+=it.price*it.qty;
    });
  });
  var arr=Object.keys(map).map(function(k){return{name:k,qty:map[k].qty,rev:map[k].rev};});
  arr.sort(function(a,b){return b[_topChartMode]-a[_topChartMode];});
  arr=arr.slice(0,7);
  if(!arr.length){_destroyChart('top-prods');if(canvas.getContext){var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);}return;}
  var labels=arr.map(function(x){return x.name.length>14?x.name.slice(0,13)+'…':x.name;});
  var vals=arr.map(function(x){return _topChartMode==='qty'?x.qty:x.rev;});
  var colors=['rgba(124,58,237,.85)','rgba(99,102,241,.82)','rgba(6,182,212,.80)','rgba(16,185,129,.78)','rgba(245,158,11,.78)','rgba(239,68,68,.76)','rgba(168,85,247,.75)'];
  _destroyChart('top-prods');
  _charts['top-prods']=new Chart(canvas,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[{
        data:vals,
        backgroundColor:colors.slice(0,vals.length),
        borderColor:colors.slice(0,vals.length).map(function(c){return c.replace('.8','1').replace(/[\d.]+\)$/,'1)');}),
        borderWidth:2,borderRadius:7,borderSkipped:false,
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true,maintainAspectRatio:false,
      animation:{duration:550,easing:'easeOutQuart'},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:_tooltipBg(),titleColor:'#a78bfa',bodyColor:'#e2e8f0',
          padding:10,cornerRadius:9,displayColors:false,
          callbacks:{label:function(ctx){return _topChartMode==='qty'?ctx.parsed.x+' وحدة':fmt(ctx.parsed.x);}}
        }
      },
      scales:{
        x:{grid:{color:_gridColor(),drawBorder:false},ticks:{color:_textColor(),font:{size:10},callback:function(v){return _topChartMode==='rev'&&v>=1000?(v/1000).toFixed(0)+'ك':v;}},border:{display:false}},
        y:{grid:{display:false},ticks:{color:_isDark()?'#cbd5e1':'#374151',font:{size:11,weight:'bold'},mirror:false}}
      }
    }
  });
}
function getTopProducts(limit){
  var filteredSales=db.sales;
  if(_topChartPeriod==='today'){
    var t=today();
    filteredSales=db.sales.filter(function(s){return s.dateStr===t;});
  }
  var qtyMap={};
  filteredSales.forEach(function(s){s.items.forEach(function(it){if(!qtyMap[it.pid])qtyMap[it.pid]={name:it.name,qty:0};qtyMap[it.pid].qty+=it.qty;});});
  return Object.values(qtyMap).sort(function(a,b){return b.qty-a.qty;}).slice(0,limit);
}

// ── مخطط الإيرادات مقابل المصاريف (آخر 6 أشهر)
function drawRevVsExpChart(){
  var canvas=$('chart-rev-vs-exp');if(!canvas)return;
  var months={},now=new Date();
  for(var m=5;m>=0;m--){
    var d=new Date(now.getFullYear(),now.getMonth()-m,1);
    var key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    months[key]={rev:0,exp:0};
  }
  db.sales.forEach(function(s){var mk=s.dateStr?s.dateStr.slice(0,7):null;if(mk&&months[mk])months[mk].rev+=s.total;});
  db.printSales.forEach(function(s){var mk=s.dateStr?s.dateStr.slice(0,7):null;if(mk&&months[mk])months[mk].rev+=s.total;});
  db.telecomSales.forEach(function(s){var mk=s.dateStr?s.dateStr.slice(0,7):null;if(mk&&months[mk])months[mk].rev+=s.profit||0;});
  db.expenses.forEach(function(e){var mk=e.date?e.date.slice(0,7):null;if(mk&&months[mk])months[mk].exp+=e.amount;});
  var labels=Object.keys(months).map(function(k){return k.slice(5)+'/'+k.slice(2,4);});
  var revVals=Object.values(months).map(function(v){return v.rev;});
  var expVals=Object.values(months).map(function(v){return v.exp;});
  _destroyChart('rev-vs-exp');
  _charts['rev-vs-exp']=new Chart(canvas,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[
        {label:'الإيرادات',data:revVals,backgroundColor:'rgba(16,185,129,0.75)',borderColor:'#10b981',borderWidth:2,borderRadius:6,borderSkipped:false},
        {label:'المصاريف',data:expVals,backgroundColor:'rgba(239,68,68,0.65)',borderColor:'#ef4444',borderWidth:2,borderRadius:6,borderSkipped:false}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:600,easing:'easeOutQuart'},
      plugins:{
        legend:{position:'top',labels:{color:_textColor(),font:{size:11},boxWidth:12,boxHeight:12,padding:14}},
        tooltip:{
          backgroundColor:_tooltipBg(),titleColor:'#94a3b8',bodyColor:'#e2e8f0',
          padding:11,cornerRadius:10,
          callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+fmt(ctx.parsed.y);}}
        }
      },
      scales:{
        x:{grid:{display:false},ticks:{color:_textColor(),font:{size:11}}},
        y:{grid:{color:_gridColor(),drawBorder:false},ticks:{color:_textColor(),font:{size:10},callback:function(v){return v>=1000?(v/1000).toFixed(0)+'ك':v;}},border:{display:false}}
      }
    }
  });
}
function getCategoryStats(){
  // إيرادات كل قسم (من المبيعات) بدلاً من عدد المنتجات
  var stats={};
  db.sales.forEach(function(s){
    s.items.forEach(function(it){
      var p=db.products.find(function(x){return x.id===it.pid;});
      var cat=(p&&p.category)||'غير مصنف';
      stats[cat]=(stats[cat]||0)+(it.price*it.qty);
    });
  });
  // ترتيب تنازلي
  var sorted={};
  Object.keys(stats).sort(function(a,b){return stats[b]-stats[a];}).forEach(function(k){sorted[k]=fmt(stats[k]);});
  return sorted;
}

// ── شارات تنبيه الشريط الجانبي ──
function updateNavBadges(){
  var alertLimit=shopSettings.lowStockAlert||5;
  var outOf=db.products.filter(function(p){return(p.stock||0)<=0;}).length;
  var low=db.products.filter(function(p){return(p.stock||0)>0&&(p.stock||0)<=alertLimit;}).length;
  var todayD=new Date();todayD.setHours(0,0,0,0);
  var expDays=shopSettings.expiryAlert||30;
  var expired=db.products.filter(function(p){if(!p.expiry)return false;var d=new Date(p.expiry);d.setHours(0,0,0,0);return d<todayD;}).length;
  var expSoon=db.products.filter(function(p){if(!p.expiry)return false;var d=new Date(p.expiry);d.setHours(0,0,0,0);var diff=Math.round((d-todayD)/86400000);return diff>=0&&diff<=expDays;}).length;
  var invTotal=outOf+low+expired+expSoon;
  var nbInv=$('nb-inv');
  if(nbInv){
    if(invTotal>0){
      nbInv.textContent=invTotal;
      nbInv.className='nav-badge'+(outOf||expired?' ':' warn');
      nbInv.style.display='inline-flex';
    } else { nbInv.style.display='none'; }
  }
  var debtors=(db.clients||[]).filter(function(c){return(c.totalDebt||0)>0;}).length;
  var nbCli=$('nb-cli');
  if(nbCli){
    if(debtors>0){
      nbCli.textContent=debtors;
      nbCli.className='nav-badge warn';
      nbCli.style.display='inline-flex';
    } else { nbCli.style.display='none'; }
  }
}
function calcDailyMargin(sales, returns){
  var margin = 0;
  sales.forEach(function(s){
    var grossMargin = 0;
    s.items.forEach(function(it){
      var p = db.products.find(function(x){ return x.id===it.pid; });
      var salePrice = it.price || (p ? p.price : 0);
      var cost = p ? (p.cost||0) : 0;
      grossMargin += (salePrice - cost) * it.qty;
    });
    // ✅ إصلاح: طرح الخصم من هامش الربح الإجمالي
    margin += Math.max(0, grossMargin - (s.discount||0));
  });
  returns.forEach(function(r){
    var rCost = (r.returnCost !== undefined) ? r.returnCost
      : (function(){ var rp=db.products.find(function(x){return x.id===r.productId;}); return rp?(rp.cost||0)*r.quantity:0; })();
    margin -= Math.max(0, (r.amount||0) - rCost);
  });
  return margin;
}
function renderDash(){
  var todayStr=today();
  var salesToday=db.sales.filter(function(s){return s.dateStr===todayStr;});
  var totalSales=0,totalProfit=0;
  salesToday.forEach(function(s){totalSales+=s.total;var gm=0;s.items.forEach(function(it){var p=db.products.find(function(x){return x.id===it.pid;});var sp=it.price||(p?p.price:0);var cost=p?(p.cost||0):0;gm+=(sp-cost)*it.qty;});totalProfit+=Math.max(0,gm-(s.discount||0));});
  var monthStr=todayStr.slice(0,7);
  var monthSales=db.sales.filter(function(s){return s.dateStr.slice(0,7)===monthStr;});
  var monthTotal=0,monthProfit=0;
  monthSales.forEach(function(s){monthTotal+=s.total;var gm=0;s.items.forEach(function(it){var p=db.products.find(function(x){return x.id===it.pid;});var sp=it.price||(p?p.price:0);var cost=p?(p.cost||0):0;gm+=(sp-cost)*it.qty;});monthProfit+=Math.max(0,gm-(s.discount||0));});
  var lowStock=db.products.filter(function(p){return p.stock<=(shopSettings.lowStockAlert||5);});
  var expToday=0,expMonth=0;
  db.expenses.forEach(function(e){if(e.date===todayStr)expToday+=e.amount;if(e.date.slice(0,7)===monthStr)expMonth+=e.amount;});
  var telToday=0,telMonth=0;
  db.telecomSales.forEach(function(t){if(t.dateStr===todayStr)telToday+=t.profit||0;if(t.dateStr.slice(0,7)===monthStr)telMonth+=t.profit||0;});
  var printToday=0,printMonth=0;
  db.printSales.forEach(function(p){if(p.dateStr===todayStr)printToday+=p.total||0;if(p.dateStr.slice(0,7)===monthStr)printMonth+=p.total||0;});
  var returnsToday=0,returnsMonth=0;
  db.returns.forEach(function(r){
    var rCost=(r.returnCost!==undefined)?r.returnCost:(function(){var rp=db.products.find(function(x){return x.id===r.productId;});return rp?(rp.cost||0)*r.quantity:0;})();
    var rProfit=Math.max(0,(r.amount||0)-rCost);
    if(r.dateStr===todayStr)returnsToday+=rProfit;
    if(r.dateStr&&r.dateStr.slice(0,7)===monthStr)returnsMonth+=rProfit;
  });
  var netToday=totalProfit+telToday+printToday-expToday-returnsToday;
  var netMonth=monthProfit+telMonth+printMonth-expMonth-returnsMonth;

  // ── مقارنة: أمس
  var dYest=new Date();dYest.setDate(dYest.getDate()-1);
  var yStr=[dYest.getFullYear(),String(dYest.getMonth()+1).padStart(2,'0'),String(dYest.getDate()).padStart(2,'0')].join('-');
  var salesYest=0;db.sales.filter(function(s){return s.dateStr===yStr;}).forEach(function(s){salesYest+=s.total;});
  // ── مقارنة: نفس اليوم الأسبوع الماضي
  var dLastW=new Date();dLastW.setDate(dLastW.getDate()-7);
  var lwStr=[dLastW.getFullYear(),String(dLastW.getMonth()+1).padStart(2,'0'),String(dLastW.getDate()).padStart(2,'0')].join('-');
  var salesLastW=0;db.sales.filter(function(s){return s.dateStr===lwStr;}).forEach(function(s){salesLastW+=s.total;});
  // ── مقارنة: متوسط نفس الشهر العام الماضي
  var lastMonthStr=(function(){var d=new Date();d.setMonth(d.getMonth()-1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
  var lastMonthTotal=0,lastMonthDays=0;
  var lmSales=db.sales.filter(function(s){return s.dateStr&&s.dateStr.slice(0,7)===lastMonthStr;});
  lmSales.forEach(function(s){lastMonthTotal+=s.total;});
  lastMonthDays=new Date(new Date().getFullYear(),new Date().getMonth(),0).getDate()||30;
  var lmAvgDay=lastMonthDays>0?lastMonthTotal/lastMonthDays:0;

  function cmpBadge(curr,ref,label){
    if(!ref||ref<=0)return'';
    var diff=Math.round((curr-ref)/ref*100);
    var cls=diff>0?'up':diff<0?'dn':'eq';
    var arrow=diff>0?'↑':diff<0?'↓':'→';
    return'<span class="dmc-cmp '+cls+'">'+arrow+' '+Math.abs(diff)+'% '+label+'</span>';
  }

  var margin=totalSales>0?Math.round(netToday/totalSales*100):0;
  var marginColor=margin>=30?'#16a34a':margin>=15?'#d97706':'#dc2626';
  var totalClientDebt=0;(db.clients||[]).forEach(function(c){totalClientDebt+=(c.totalDebt||0);});
  var totalSupplierDebt=0;(db.purchases||[]).forEach(function(p){totalSupplierDebt+=(p.remaining||0);});
  var stockVal=0;db.products.forEach(function(p){stockVal+=(p.stock||0)*(p.cost||0);});
  var cashToday=0;salesToday.forEach(function(s){if(s.method==='cash')cashToday+=s.total;});

  // ── صف 1: 4 بطاقات + تنبيهات
  if($('dmc-s-today')){$('dmc-s-today').textContent=fmt(totalSales);}
  if($('dmc-s-today-sub')){$('dmc-s-today-sub').innerHTML=salesToday.length+' عملية'+(salesYest>0?' • '+cmpBadge(totalSales,salesYest,'أمس'):'');}
  if($('dmc-cmp-today')){$('dmc-cmp-today').innerHTML=cmpBadge(totalSales,salesLastW,'الأسبوع الماضي');}
  if($('dmc-p-today')){$('dmc-p-today').textContent=fmt(netToday);$('dmc-p-today').style.color=netToday>=0?'#1e1b4b':'#dc2626';}
  if($('dmc-m-today')){$('dmc-m-today').textContent='هامش '+margin+'%';$('dmc-m-today').style.color=marginColor;}
  if($('dmc-cmp-profit')){var profitYest=0;db.sales.filter(function(s){return s.dateStr===yStr;}).forEach(function(s){var gm=0;s.items.forEach(function(it){var p=db.products.find(function(x){return x.id===it.pid;});var sp=it.price||(p?p.price:0);var cost=p?(p.cost||0):0;gm+=(sp-cost)*it.qty;});profitYest+=Math.max(0,gm-(s.discount||0));});$('dmc-cmp-profit').innerHTML=cmpBadge(netToday,profitYest,'أمس');}
  if($('dmc-s-month')){$('dmc-s-month').textContent=fmt(monthTotal);}
  if($('dmc-s-month-sub')){$('dmc-s-month-sub').textContent=monthSales.length+' عملية';}
  if($('dmc-cmp-month')){$('dmc-cmp-month').innerHTML=cmpBadge(monthTotal,lastMonthTotal,'الشهر الماضي');}
  if($('dmc-p-month')){$('dmc-p-month').textContent=fmt(netMonth);}
  if($('dmc-p-month-sub')){$('dmc-p-month-sub').textContent='خدمات: '+fmt(telMonth+printMonth);}

  // ── بطاقة التنبيهات
  var todayD=new Date();todayD.setHours(0,0,0,0);
  var expiryDays=shopSettings.expiryAlert||30;
  var expiredProds=db.products.filter(function(p){if(!p.expiry)return false;var d=new Date(p.expiry);d.setHours(0,0,0,0);return d<todayD;});
  var expiringSoon=db.products.filter(function(p){if(!p.expiry)return false;var d=new Date(p.expiry);d.setHours(0,0,0,0);var diff=Math.round((d-todayD)/(86400000));return diff>=0&&diff<=expiryDays;});
  var alertsCard=$('dmc-alerts-card');
  var alertsBody=$('dmc-alerts-body');
  if(alertsBody){
    var alertLines=[];
    if(expiredProds.length)alertLines.push('<div style="font-size:10px;font-weight:800;color:#dc2626">🚫 منتهية: '+expiredProds.length+' صنف</div>');
    if(expiringSoon.length)alertLines.push('<div style="font-size:10px;font-weight:800;color:#d97706">⏰ تنتهي قريباً: '+expiringSoon.length+'</div>');
    if(lowStock.filter(function(p){return p.stock<=0;}).length)alertLines.push('<div style="font-size:10px;font-weight:800;color:#dc2626">❌ نفذ: '+lowStock.filter(function(p){return p.stock<=0;}).length+' صنف</div>');
    else if(lowStock.length)alertLines.push('<div style="font-size:10px;font-weight:700;color:#f59e0b">⚠️ منخفض: '+lowStock.length+' صنف</div>');
    if(!alertLines.length)alertLines.push('<div style="font-size:11px;font-weight:700;color:#16a34a">✅ لا تنبيهات</div>');
    alertsBody.innerHTML=alertLines.join('');
    if(alertsCard){
      alertsCard.style.borderRightColor=(expiredProds.length)?'#dc2626':alertLines.length>1?'#f59e0b':'#16a34a';
    }
  }

  // ── صف 2: الصندوق التفصيلي
  loadCashSession();
  var sessionDetail=$('dash-session-detail');
  var sessBtns=$('sess-btns');
  if(sessionDetail){
    if(_cashSession&&_cashSession.status==='open'){
      var cashSessions=0;
      db.sales.forEach(function(s){if(s.method==='cash'&&s.date>=_cashSession.openTime)cashSessions+=s.total;});
      var expected=(_cashSession.openAmount||0)+cashSessions;
      sessionDetail.innerHTML=
        '<div class="sess-panel">'+
        '<div class="sess-row"><span>رصيد البداية</span><strong>'+fmt(_cashSession.openAmount)+'</strong></div>'+
        '<div class="sess-row"><span>مبيعات نقدية</span><strong style="color:#16a34a">'+fmt(cashSessions)+'</strong></div>'+
        '<div class="sess-row"><span>المتوقع الآن</span><strong style="color:#7c3aed;font-size:14px">'+fmt(expected)+'</strong></div>'+
        '<div class="sess-row" style="margin-top:4px"><span style="font-size:9px;color:#94a3b8">فُتح: '+_cashSession.openTime+'</span></div>'+
        '</div>';
      if(sessBtns)sessBtns.innerHTML='<button class="btn btn-r btn-sm" style="font-size:11px;padding:5px 10px" onclick="prepareCloseSession()">🔴 إغلاق</button>';
    } else {
      sessionDetail.innerHTML='<div class="sess-panel closed"><div style="text-align:center;color:#94a3b8;font-size:12px;padding:8px 0">الصندوق مغلق<br><span style="font-size:10px">افتح الصندوق لبدء تسجيل المبيعات</span></div></div>';
      if(sessBtns)sessBtns.innerHTML='<button class="btn btn-g btn-sm" style="font-size:11px;padding:5px 10px" onclick="openModal(\'m-open-session\');$(\'os-amount\').value=\'\';$(\'os-note\').value=\'\'">🟢 فتح</button>';
    }
  }

  // ── أعلى المدينين
  var topDebtorsList=$('top-debtors-list');
  if(topDebtorsList){
    var sortedClients=(db.clients||[]).filter(function(c){return(c.totalDebt||0)>0;}).slice().sort(function(a,b){return(b.totalDebt||0)-(a.totalDebt||0);}).slice(0,3);
    if(!sortedClients.length){
      topDebtorsList.innerHTML='<div style="color:#94a3b8;font-size:11px;padding:8px 0;text-align:center">لا توجد ديون مسجّلة ✅</div>';
    } else {
      topDebtorsList.innerHTML=sortedClients.map(function(c){
        var initials=(c.name||'?').charAt(0);
        return '<div class="debtor-row" onclick="showPage(\'clients\')">'+
          '<div class="debtor-av">'+initials+'</div>'+
          '<div class="debtor-name">'+c.name+'</div>'+
          '<div class="debtor-amt">'+fmt(c.totalDebt)+'</div>'+
          '</div>';
      }).join('');
    }
  }

  // ── إحصائيات صف 2
  if($('dmc-svc')){$('dmc-svc').textContent=fmt(telToday+printToday);}
  if($('dmc-ret')){$('dmc-ret').textContent=db.returns.filter(function(r){return r.dateStr===todayStr;}).length;}
  if($('dmc-cdebt')){$('dmc-cdebt').textContent=fmt(totalClientDebt);$('dmc-cdebt').style.color=totalClientDebt>0?'#dc2626':'#16a34a';}
  if($('dmc-low')){$('dmc-low').textContent=lowStock.length;$('dmc-low').style.color=lowStock.length>0?'#dc2626':'#16a34a';}
  if($('dmc-sdebt')){$('dmc-sdebt').textContent=fmt(totalSupplierDebt);$('dmc-sdebt').style.color=totalSupplierDebt>0?'#dc2626':'#16a34a';}
  if($('dmc-stock-val')){$('dmc-stock-val').textContent=fmt(stockVal);}
  if($('dmc-exp')){$('dmc-exp').textContent=fmt(expToday);}
  if($('dmc-cash-today')){$('dmc-cash-today').textContent=fmt(cashToday);}

  // ── آخر المبيعات
  var recentHtml='';
  if(!salesToday.length)recentHtml='<div style="color:#9ca3af;padding:20px;text-align:center;font-size:12px">📭 لا توجد مبيعات اليوم</div>';
  else salesToday.slice().reverse().slice(0,5).forEach(function(s){
    var mIcon={cash:'💵',card:'💳',debt:'📝',partial:'💰'}[s.method]||'💰';
    recentHtml+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f2f8">'+
      '<div><span style="font-size:11px;font-weight:700">#'+(s.invoiceNum||'—')+' '+mIcon+'</span>'+
      '<div style="font-size:10px;color:#94a3b8">'+truncateItems(s.items,2)+'</div></div>'+
      '<div style="font-weight:800;color:#7c3aed;font-size:12px">'+fmt(s.total)+'</div></div>';
  });
  if($('dash-recent'))$('dash-recent').innerHTML=recentHtml;

  // ── أعلى 5 مبيعاً
  var topProds=getTopProducts(5);
  var topHtml='';
  topProds.forEach(function(tp,idx){
    var pct=topProds[0]&&topProds[0].qty>0?(tp.qty/topProds[0].qty)*100:0;
    topHtml+='<div style="margin-bottom:5px">'+
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">'+
      '<span style="font-size:9px;font-weight:900;color:#7c3aed;width:12px">#'+(idx+1)+'</span>'+
      '<div style="flex:1;font-size:11px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+tp.name+'</div>'+
      '<span style="font-size:10px;font-weight:800;color:#64748b">'+tp.qty+'</span></div>'+
      '<div style="background:#f1f5f9;border-radius:4px;height:4px;overflow:hidden;margin-right:18px">'+
      '<div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#7c3aed,#06b6d4);border-radius:4px"></div></div></div>';
  });
  if($('dash-top-prods'))$('dash-top-prods').innerHTML=topHtml||'<div style="color:#9ca3af;padding:8px;font-size:11px">لا بيانات</div>';

  // ── الأقسام (إيرادات)
  var catStats=getCategoryStats();
  var catHtml='';
  var catKeys=Object.keys(catStats).slice(0,4);
  if(catKeys.length){
    catHtml='<div style="font-size:9px;color:#94a3b8;font-weight:700;margin-bottom:4px">إيرادات حسب القسم (إجمالي)</div>';
    catKeys.forEach(function(cat){
      catHtml+='<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f2f8;font-size:11px"><span>'+cat+'</span><span style="font-weight:800;color:#7c3aed">'+catStats[cat]+'</span></div>';
    });
  } else {
    catHtml='<div style="color:#9ca3af;padding:4px;font-size:11px">لا مبيعات مسجّلة</div>';
  }
  if($('dash-cats'))$('dash-cats').innerHTML=catHtml;

  // ── تنبيهات المخزون (للـ modal)
  if($('dash-low')){
    var lowHtml='';
    if(!lowStock.length)lowHtml='<div style="color:#9ca3af;padding:8px;font-size:11px">كل المنتجات بمخزون جيد ✅</div>';
    else lowStock.slice(0,5).forEach(function(p){lowHtml+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f2f8;font-size:11px"><span>'+p.name+'</span><span style="font-weight:800;color:'+(p.stock<=0?'#dc2626':'#d97706')+'">'+(p.stock||0)+' '+(p.unit||'قطعة')+'</span></div>';});
    $('dash-low').innerHTML=lowHtml;
  }

  // ── شريط الهدف
  updateGoalBar(totalSales);
  // ── ساعة الجلسة
  updateSessionClock();

  drawMiniChart();drawHeatmap();renderSidebarSparkline();
  setTimeout(drawTopProdsChart,80);
  setTimeout(drawRevVsExpChart,120);
  updateNavBadges();
}

async function checkout(){
  if(cart.length===0){ toast('السلة فارغة ❌','error'); return; }
  var sub = 0; cart.forEach(function(it){ sub += it.price * it.qty; });
  var disc = Math.max(0, parseFloat($('disc-in').value)||0);
  // ✅ الخصم لا يمكن أن يتجاوز المجموع ولا يكون سالباً
  if(disc > sub){ toast('الخصم ('+fmt(disc)+') أكبر من مجموع الفاتورة ('+fmt(sub)+') ❌','error'); beep('error'); return; }
  if(disc < 0){ toast('الخصم لا يمكن أن يكون سالباً ❌','error'); beep('error'); return; }
  var total = Math.max(0, sub - disc);
  var method = $('pay-method').value;
  if(method==='cash'){
    var given = parseFloat($('cash-given').value)||0;
    // المبلغ المستلم اختياري — فقط نتحقق إذا أُدخل وكان أقل من المجموع
    if(given > 0 && given < total){ toast('المبلغ المسلَّم غير كافٍ ❌','error'); beep('error'); return; }
  }
  if(method==='debt'){
    var clientId = $('sale-client').value;
    if(!clientId){ toast('اختر العميل للدين ❌','error'); return; }
  }
  if(method==='partial'){
    var paidNow = parseFloat($('partial-paid').value)||0;
    if(paidNow < 0){ toast('المبلغ المدفوع لا يمكن أن يكون سالباً ❌','error'); return; }
    if(paidNow >= total){ toast('المبلغ المدفوع يساوي الإجمالي — استخدم طريقة دفع أخرى ❌','error'); return; }
    var partialClientId = $('partial-client').value;
    if(!partialClientId){ toast('اختر العميل للمبلغ المتبقي ❌','error'); return; }
  }
  for(var i=0; i<cart.length; i++){
    var it = cart[i];
    var p = db.products.find(function(x){ return x.id===it.pid; });
    if(!p) continue;
    if((p.stock||0) < it.qty){ toast('نفذ المخزون: '+it.name+' ❌','error'); beep('error'); return; }
  }
  cart.forEach(function(it){
    var p = db.products.find(function(x){ return x.id===it.pid; });
    if(p){
      var oldS=p.stock||0;
      p.stock = (p.stock||0) - it.qty;
      logStockChange(p.id, p.name, oldS, p.stock, 'بيع فاتورة', AUTH.currentUser?AUTH.currentUser.username:'—');
    }
  });
  await saveDB('products');
  var invoiceNum = await getNextInvoiceNum();
  var sale = { id: genId(), invoiceNum: invoiceNum, items: JSON.parse(JSON.stringify(cart)), total: total, discount: disc, method: method, date: nowStr(), dateStr: today(), ts: Date.now(), note: ($('sale-note')&&$('sale-note').value.trim())||'', cashierName: AUTH.currentUser?AUTH.currentUser.name||AUTH.currentUser.username:'—', cashierUser: AUTH.currentUser?AUTH.currentUser.username:'—' };
  // حفظ المبلغ المُسلَّم للوصل
  if(method==='cash'){ sale.givenAmount = parseFloat($('cash-given').value)||0; }
  if(method==='debt'){
    var clientId = $('sale-client').value;
    var client = db.clients.find(function(c){ return c.id===clientId; });
    if(client){
      sale.clientId = clientId; sale.clientName = client.name;
      client.debts = client.debts || [];
      client.debts.push({ amount: total, desc: 'فاتورة #'+invoiceNum, date: nowStr(), dateStr: today() });
      var td=0, tp=0;
      client.debts.forEach(function(d){ td += d.amount||0; });
      (client.payments||[]).forEach(function(p){ tp += p.amount||0; });
      client.totalDebt = Math.max(0, td - tp);
      await saveDB('clients');
    }
  }
  if(method==='partial'){
    var paidNow = parseFloat($('partial-paid').value)||0;
    var remaining = total - paidNow;
    var partialClientId = $('partial-client').value;
    var partialClient = db.clients.find(function(c){ return c.id===partialClientId; });
    sale.paidNow = paidNow;
    if(partialClient){
      sale.clientId = partialClientId; sale.clientName = partialClient.name;
      partialClient.debts = partialClient.debts || [];
      partialClient.debts.push({ amount: remaining, desc: 'فاتورة #'+invoiceNum+' (دفع جزئي — متبقي)', date: nowStr(), dateStr: today() });
      var td=0, tp=0;
      partialClient.debts.forEach(function(d){ td += d.amount||0; });
      (partialClient.payments||[]).forEach(function(p){ tp += p.amount||0; });
      partialClient.totalDebt = Math.max(0, td - tp);
      await saveDB('clients');
    }
  }
  db.sales.push(sale);
  await saveDB('sales');
  lastSale = sale;
  // ── نقاط الولاء: احسب إذا تم الاستبدال ثم امنح النقاط الجديدة
  var loyaltyRedeemed=$('loyalty-redeem-check')&&$('loyalty-redeem-check').checked;
  var loyaltyClientId=sale.clientId||null;
  if(loyaltyClientId)await settleLoyaltyAfterSale(loyaltyClientId,total,loyaltyRedeemed);
  // أعد تعيين checkbox الاستبدال
  if($('loyalty-redeem-check')){$('loyalty-redeem-check').checked=false;}
  if($('loyalty-redeem-wrap'))$('loyalty-redeem-wrap').style.display='none';
  var di=$('disc-in');if(di&&di.dataset.loyaltyDisc){delete di.dataset.loyaltyDisc;}
  beep('checkout');
  if(typeof logActivity==='function')logActivity('بيع مؤكد','فاتورة #'+invoiceNum+' — '+fmt(total));

  // ✅ تأكيد بصري جميل
  var methodLabels={cash:'💵 نقداً',card:'💳 بطاقة',debt:'📝 دين',partial:'💰 دفع جزئي'};
  var methodColors={cash:'linear-gradient(135deg,#7c3aed,#4f46e5)',card:'linear-gradient(135deg,#0891b2,#0284c7)',debt:'linear-gradient(135deg,#d97706,#b45309)',partial:'linear-gradient(135deg,#d97706,#b45309)'};
  $('rcpt-header').style.background=methodColors[method]||methodColors.cash;
  $('rcpt-invoice').textContent='فاتورة #'+invoiceNum+'  •  '+sale.date;
  $('rcpt-method-badge').textContent=methodLabels[method]||method;
  $('rcpt-total').textContent=fmt(total);
  // تخفيض
  var discRow=$('rcpt-discount-row');
  if(discRow){discRow.style.display=disc>0?'block':'none';if($('rcpt-disc-val'))$('rcpt-disc-val').textContent=fmt(disc);}
  // باقي المبلغ
  var changeRow=$('rcpt-change-row');
  if(changeRow){
    var given=parseFloat(($('cash-given')||{}).value)||0;
    var change=given-total;
    changeRow.style.display=(method==='cash'&&given>0&&change>=0)?'inline-block':'none';
    if($('rcpt-change-val'))$('rcpt-change-val').textContent=fmt(change);
  }
  // المنتجات
  var itemsHtml='';
  sale.items.forEach(function(it){
    var lineTotal=it.price*it.qty;
    itemsHtml+='<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f0f2f8">'+
      '<div><div style="font-weight:700;font-size:13px">'+it.name+'</div>'+
      '<div style="font-size:11px;color:#9ca3af">'+fmt(it.price)+' × '+it.qty+'</div></div>'+
      '<div style="font-weight:800;color:#7c3aed;font-size:13px">'+fmt(lineTotal)+'</div></div>';
  });
  if($('rcpt-items'))$('rcpt-items').innerHTML=itemsHtml;
  // العميل (دين)
  var cliRow=$('rcpt-client-row');
  if(cliRow){
    if(method==='debt'&&sale.clientName){cliRow.style.display='block';if($('rcpt-client-name'))$('rcpt-client-name').textContent=sale.clientName;}
    else{cliRow.style.display='none';}
  }
  // منطقة الطباعة الخفية
  var receiptText=generateReceipt(sale,sub,disc);
  var printArea=$('receipt-print-area');
  if(printArea)printArea.innerHTML='<pre style="font-family:monospace;font-size:12px;direction:rtl;text-align:right;width:80mm;margin:0 auto;padding:10px">'+receiptText+'</pre>';

  if(shopSettings.receiptMode==='auto'){
    // طباعة مباشرة عبر نافذة HTML جديدة
    var wAuto=window.open('','_blank');
    if(wAuto){wAuto.document.write(generateReceiptHTML(sale,sub,disc));wAuto.document.close();setTimeout(function(){wAuto.print();},300);}
  }else if(shopSettings.receiptMode==='show'){openModal('m-receipt');}
  pushDisplayComplete(total);
  cart=[]; renderCartList(); updateCartTotals();
  try{localStorage.removeItem(ACTIVE_CART_KEY);}catch(e){}
  if($('sale-note'))$('sale-note').value='';
  if($('pg-cashier').classList.contains('active')){ renderTodaySum(); showPay(); }
  toast('تم البيع بنجاح! #'+invoiceNum,'success',3000);
  autoPush();
}
function generateReceiptHTML(sale, sub, disc){
  var rc = shopSettings.receiptColor||'#7c3aed';
  var fs = shopSettings.receiptFontSize||13;
  var showUnit = shopSettings.receiptShowUnit!==false;
  var showChange = !!shopSettings.receiptShowChange;
  var mm={cash:'💵 نقداً',card:'💳 بطاقة بنكية',debt:'📝 دين',partial:'💰 جزئي'};
  var rows='';
  sale.items.forEach(function(it){
    rows+='<tr>'+
      '<td style="padding:7px 4px;border-bottom:1px dashed #e5e7eb;font-weight:600">'+it.name+'</td>'+
      (showUnit?'<td style="padding:7px 4px;border-bottom:1px dashed #e5e7eb;text-align:center;color:#64748b;font-size:11px">'+fmt(it.price)+' × '+it.qty+'</td>':'<td style="padding:7px 4px;border-bottom:1px dashed #e5e7eb;text-align:center;color:#64748b">×'+it.qty+'</td>')+
      '<td style="padding:7px 4px;border-bottom:1px dashed #e5e7eb;text-align:left;font-weight:700;white-space:nowrap">'+fmt(it.price*it.qty)+'</td></tr>';
  });
  var changeRow='';
  if(showChange&&sale.method==='cash'&&sale.givenAmount&&sale.givenAmount>sale.total){
    changeRow='<div class="total-row" style="color:#16a34a"><span>💵 مُسلَّم</span><span>'+fmt(sale.givenAmount)+'</span></div><div class="total-row" style="color:#16a34a;font-weight:800"><span>🪙 الباقي</span><span>'+fmt(sale.givenAmount-sale.total)+'</span></div>';
  }
  if(sale.method==='partial'){
    changeRow='<div class="total-row" style="color:#16a34a"><span>💰 دُفع الآن</span><span>'+fmt(sale.paidNow||0)+'</span></div><div class="total-row" style="color:#d97706;font-weight:800"><span>📝 متبقي دين</span><span>'+fmt(sale.total-(sale.paidNow||0))+'</span></div>';
  }
  return '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">'+
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;direction:rtl;background:#fff;color:#0f172a;font-size:'+fs+'px}'+
    '.wrap{width:80mm;margin:0 auto;padding:12px}.header{text-align:center;padding:14px 0 10px;border-bottom:2px solid '+rc+'}'+
    '.shop-name{font-size:18px;font-weight:900;letter-spacing:.5px;color:'+rc+'}.shop-sub{font-size:10px;color:#64748b;margin-top:3px}'+
    '.invoice-info{padding:10px 0;border-bottom:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:11px;color:#475569}'+
    'table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#f8fafc;padding:7px 4px;text-align:right;font-size:10px;color:#9ca3af;font-weight:700;border-bottom:2px solid #e5e7eb}'+
    '.totals{border-top:2px solid '+rc+';padding:10px 0}.total-row{display:flex;justify-content:space-between;padding:3px 0;font-size:12px}'+
    '.total-final{display:flex;justify-content:space-between;padding:8px 0;font-size:18px;font-weight:900;color:'+rc+';border-top:1px dashed #cbd5e1;margin-top:6px}'+
    '.method-badge{display:inline-block;background:'+rc+'22;color:'+rc+';font-weight:800;font-size:11px;padding:4px 12px;border-radius:20px;margin:8px 0}'+
    '.footer{text-align:center;padding:12px 0 6px;border-top:1px dashed #cbd5e1;margin-top:8px;color:#64748b;font-size:11px;line-height:1.8}'+
    '@media print{button{display:none!important}.no-print{display:none!important}}</style></head><body>'+
    '<div class="wrap">'+
    '<div class="header"><div class="shop-name">'+shopSettings.name+'</div>'+
    (shopSettings.address?'<div class="shop-sub">'+shopSettings.address+'</div>':'')+
    (shopSettings.phone?'<div class="shop-sub">📞 '+shopSettings.phone+'</div>':'')+
    '</div>'+
    '<div class="invoice-info"><span>فاتورة رقم: <strong>#'+sale.invoiceNum+'</strong></span><span>'+sale.date+'</span></div>'+
    '<table><thead><tr><th>الصنف</th>'+(showUnit?'<th style="text-align:center">السعر × الكمية</th>':'<th style="text-align:center">الكمية</th>')+'<th style="text-align:left">المبلغ</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<div class="totals">'+
    (disc>0?'<div class="total-row"><span>المجموع الفرعي</span><span>'+fmt(sub)+'</span></div><div class="total-row" style="color:#16a34a"><span>🏷️ تخفيض</span><span>−'+fmt(disc)+'</span></div>':'')+
    '<div class="total-final"><span>الإجمالي</span><span>'+fmt(sale.total)+'</span></div>'+
    changeRow+
    '</div>'+
    '<div style="text-align:center"><span class="method-badge">'+(mm[sale.method]||sale.method)+'</span></div>'+
    ((sale.method==='debt'||sale.method==='partial')&&sale.clientName?'<div style="text-align:center;font-size:11px;color:#d97706;font-weight:700;margin-bottom:4px">👤 على حساب: '+sale.clientName+'</div>':'')+
    (sale.note?'<div style="background:#fffbeb;border:1px dashed #fde68a;border-radius:8px;padding:7px 12px;margin:6px 0;font-size:12px;color:#92400e;font-weight:700;text-align:center">📝 '+sale.note+'</div>':'')+
    '<div class="footer">'+
    (shopSettings.receiptHeader?'<div style="font-weight:700;color:#0f172a;font-size:12px;margin-bottom:4px">'+shopSettings.receiptHeader+'</div>':'')+
    (shopSettings.receiptFooter?'<div>'+shopSettings.receiptFooter.replace(/\n/g,'<br>')+'</div>':'')+
    '</div>'+
    '<div class="no-print" style="text-align:center;padding:12px 0">'+
    '<button onclick="window.print()" style="background:'+rc+';color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:700">🖨️ طباعة</button></div>'+
    '</div></body></html>';
}

// نص عادي للتوافق مع الإعدادات القديمة
function generateReceipt(sale, sub, disc){
  var lines=[shopSettings.name,shopSettings.address];
  if(shopSettings.phone)lines.push('هاتف: '+shopSettings.phone);
  lines.push('──────────────────────────');
  lines.push('فاتورة رقم: '+sale.invoiceNum);lines.push('التاريخ: '+sale.date);
  lines.push('──────────────────────────');
  sale.items.forEach(function(it){lines.push(it.name+' ×'+it.qty+'   '+fmt(it.price*it.qty));});
  if(disc>0){lines.push('──────────────────────────');lines.push('المجموع الفرعي: '+fmt(sub));lines.push('تخفيض: '+fmt(disc));}
  lines.push('──────────────────────────');lines.push('الإجمالي: '+fmt(sale.total));
  var mm={cash:'نقداً',card:'بطاقة',debt:'دين'};
  lines.push('طريقة الدفع: '+(mm[sale.method]||sale.method));
  if(sale.method==='debt'&&sale.clientName)lines.push('العميل: '+sale.clientName);
  lines.push('──────────────────────────');
  lines.push(shopSettings.receiptHeader||'');lines.push(shopSettings.receiptFooter||'');
  return lines.join('\n');
}
function renderTodaySum(){
  var todayStr = today();
  var salesToday = db.sales.filter(function(s){ return s.dateStr===todayStr; });
  var totalSales=0, count=salesToday.length, cash=0, card=0, debt=0;
  salesToday.forEach(function(s){
    totalSales+=s.total;
    if(s.method==='cash') cash+=s.total;
    else if(s.method==='card') card+=s.total;
    else if(s.method==='debt') debt+=s.total;
  });
  var returnsToday=db.returns.filter(function(r){return r.dateStr===todayStr;});
  var totalReturns=0;
  returnsToday.forEach(function(r){
    var rCost=(r.returnCost!==undefined)?r.returnCost:(function(){var rp=db.products.find(function(x){return x.id===r.productId;});return rp?(rp.cost||0)*r.quantity:0;})();
    totalReturns+=Math.max(0,(r.amount||0)-rCost);
  });
  // صافي الربح الحقيقي = هامش المبيعات + بدون التكاليف
  var totalProfit=0;
  salesToday.forEach(function(s){var gm=0;s.items.forEach(function(it){var p=db.products.find(function(x){return x.id===it.pid;});var sp=it.price||(p?p.price:0);var cost=p?(p.cost||0):0;gm+=(sp-cost)*it.qty;});totalProfit+=Math.max(0,gm-(s.discount||0));});
  var telToday=0;db.telecomSales.forEach(function(t){if(t.dateStr===todayStr)telToday+=t.profit||0;});
  var printToday=0;db.printSales.forEach(function(p){if(p.dateStr===todayStr)printToday+=p.total||0;});
  var expToday=0;db.expenses.forEach(function(e){if(e.date===todayStr)expToday+=e.amount||0;});
  var net=totalProfit+telToday+printToday-expToday-totalReturns;
  var sumEl=$('today-sum');
  if(!sumEl)return;
  sumEl.innerHTML=
    '<div class="cashier-stat-box"><div class="csb-val">'+count+'</div><div class="csb-lbl">عدد العمليات</div></div>'+
    '<div class="cashier-stat-box"><div class="csb-val" style="color:#7c3aed">'+fmt(totalSales)+'</div><div class="csb-lbl">إجمالي المبيعات</div></div>'+
    '<div class="cashier-stat-box"><div class="csb-val" style="color:#16a34a">'+fmt(cash)+'</div><div class="csb-lbl">💵 نقداً</div></div>'+
    '<div class="cashier-stat-box"><div class="csb-val" style="color:#3b82f6">'+fmt(card)+'</div><div class="csb-lbl">💳 بطاقة</div></div>'+
    '<div class="cashier-stat-box"><div class="csb-val" style="color:#f59e0b">'+fmt(debt)+'</div><div class="csb-lbl">📝 دين</div></div>'+
    (totalReturns>0?'<div class="cashier-stat-box"><div class="csb-val" style="color:#ef4444">−'+fmt(totalReturns)+'</div><div class="csb-lbl">🔄 مرتجعات</div></div>':'')+
    '<div class="cashier-stat-box" style="border:2px solid #7c3aed;background:rgba(124,58,237,0.05)"><div class="csb-val" style="color:'+(net>=0?'#16a34a':'#ef4444')+'">'+fmt(net)+'</div><div class="csb-lbl" style="font-weight:800">💰 صافي اليوم</div></div>';
}

// ═══════════════════════════════════════════════════════════

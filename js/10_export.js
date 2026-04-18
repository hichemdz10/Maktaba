// ── js/10_export.js ──
// ║  EXPORT / IMPORT                                         ║
// ═══════════════════════════════════════════════════════════
function exportBackup(){var blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='hashishi_backup_'+today()+'.json';a.click();URL.revokeObjectURL(url);toast('تم التصدير بنجاح ✅','success');}
async function importBackup(e){var file=e.target.files[0];if(!file)return;var reader=new FileReader();reader.onload=async function(ev){try{var data=JSON.parse(ev.target.result);if(!confirm('استيراد النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.'))return;db=data;for(var i=0;i<IDB_STORES.length;i++)await saveDB(IDB_STORES[i]);showPage('dashboard');toast('تم الاستيراد بنجاح ✅','success');}catch(err){toast('الملف تالف أو غير مدعوم ❌','error');}};reader.readAsText(file);e.target.value='';}
function exportInvCSV(){var rows=[['الباركود','الاسم','القسم','سعر البيع','سعر الشراء','سعر الجملة','المخزون','الصلاحية']];db.products.forEach(function(p){var bc=(p.barcode&&p.barcode.indexOf('MANUAL')<0)?p.barcode:'';rows.push([bc,p.name,p.category||'',p.price,p.cost||0,p.wholesalePrice||0,p.stock||0,p.expiry||'']);});downloadCSV(rows,'inventory_'+today()+'.csv');}

// ── استيراد CSV للمنتجات ──
function openImportCSV(){$('csv-import-input').value='';$('csv-import-input').click();}
async function handleImportCSV(inp){
  var file=inp.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=async function(ev){
    try{
      var text=ev.target.result.replace(/^\uFEFF/,'');
      var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
      if(lines.length<2){toast('الملف فارغ أو بدون بيانات ❌','error');return;}
      // تحديد الترويسة
      var sep=lines[0].indexOf('\t')>-1?'\t':',';
      function parseRow(line){
        var result=[],cur='',inQ=false;
        for(var i=0;i<line.length;i++){
          var ch=line[i];
          if(ch==='"'){inQ=!inQ;}
          else if(ch===sep&&!inQ){result.push(cur.trim());cur='';}
          else{cur+=ch;}
        }
        result.push(cur.trim());
        return result;
      }
      var headers=parseRow(lines[0]).map(function(h){return h.replace(/^"|"$/g,'').trim().toLowerCase();});
      // خريطة الحقول (يدعم العربية والإنجليزية)
      var colMap={
        bc:   ['الباركود','barcode','بار كود'],
        name: ['الاسم','name','اسم المنتج'],
        cat:  ['القسم','category','الفئة','قسم'],
        price:['سعر البيع','price','البيع','selling price'],
        cost: ['سعر الشراء','cost','الشراء','purchase price','التكلفة'],
        wp:   ['سعر الجملة','wholesale','جملة'],
        stock:['المخزون','stock','الكمية','quantity'],
        expiry:['الصلاحية','expiry','تاريخ الصلاحية']
      };
      function findCol(key){
        for(var i=0;i<colMap[key].length;i++){
          var idx=headers.indexOf(colMap[key][i].toLowerCase());
          if(idx>-1)return idx;
        }
        return -1;
      }
      var ci={bc:findCol('bc'),name:findCol('name'),cat:findCol('cat'),price:findCol('price'),cost:findCol('cost'),wp:findCol('wp'),stock:findCol('stock'),expiry:findCol('expiry')};
      if(ci.name<0){toast('لم يُعثر على عمود "الاسم" في الملف ❌','error');return;}
      var added=0,updated=0,skipped=0;
      for(var r=1;r<lines.length;r++){
        var row=parseRow(lines[r]).map(function(v){return v.replace(/^"|"$/g,'').trim();});
        if(!row[ci.name])continue;
        var pName=row[ci.name];
        var pBC=ci.bc>=0?normalizeBC(row[ci.bc]||''):'';
        var pCat=ci.cat>=0?(row[ci.cat]||'متنوع'):'متنوع';
        var pPrice=ci.price>=0?parseFloat(row[ci.price])||0:0;
        var pCost=ci.cost>=0?parseFloat(row[ci.cost])||0:0;
        var pWP=ci.wp>=0?parseFloat(row[ci.wp])||0:0;
        var pStock=ci.stock>=0?parseInt(row[ci.stock])||0:0;
        var pExpiry=ci.expiry>=0?row[ci.expiry]||'':'';
        // هل المنتج موجود؟ ابحث بالباركود أو الاسم
        var existing=pBC?findProductByBarcode(pBC):null;
        if(!existing)existing=db.products.find(function(x){return x.name===pName;});
        if(existing){
          // تحديث
          existing.name=pName;existing.category=pCat;
          if(pPrice>0)existing.price=pPrice;
          if(pCost>0)existing.cost=pCost;
          if(pWP>0)existing.wholesalePrice=pWP;
          if(pStock>0)existing.stock=pStock;
          if(pExpiry)existing.expiry=pExpiry;
          if(pBC)existing.barcode=pBC;
          updated++;
        } else {
          if(pPrice<=0){skipped++;continue;}
          db.products.push({id:genId(),barcode:pBC,name:pName,category:pCat,unit:'قطعة',price:pPrice,cost:pCost,wholesalePrice:pWP,stock:pStock,expiry:pExpiry,image:'',createdAt:today()});
          added++;
        }
      }
      await Promise.all(['products'].map(function(k){return saveDB(k);}));
      renderInv();autoPush();
      toast('استيراد مكتمل: '+added+' جديد / '+updated+' تحديث'+(skipped?' / '+skipped+' تجاهل':'')+'  ✅','success',4500);
    }catch(err){toast('خطأ في قراءة الملف ❌','error');console.error(err);}
    inp.value='';
  };
  reader.readAsText(file,'UTF-8');
}
function exportExpCSV(){var rows=[['التاريخ','التصنيف','الوصف','المبلغ']];db.expenses.forEach(function(e){rows.push([e.date,e.category,e.desc,e.amount]);});downloadCSV(rows,'expenses_'+today()+'.csv');}
function exportAllCSV(){var rows=[['النوع','التاريخ','التفاصيل','المبلغ']];db.sales.forEach(function(s){rows.push(['مبيعات',s.dateStr,s.items.map(function(it){return it.name+'×'+it.qty;}).join('|'),s.total]);});db.returns.forEach(function(r){rows.push(['مرتجع',r.dateStr,r.productName+' ×'+r.quantity,'-'+r.amount]);});db.telecomSales.forEach(function(t){rows.push(['هاتف',t.dateStr,t.type==='recharge'?'شحن '+t.operator:'بطاقة '+t.cardName,t.profit]);});db.printSales.forEach(function(ps){rows.push(['طباعة',ps.dateStr,ps.typeName+'×'+ps.qty,ps.total]);});db.expenses.forEach(function(ex){rows.push(['مصروف',ex.date,ex.desc,-ex.amount]);});downloadCSV(rows,'full_report_'+today()+'.csv');}
function downloadCSV(rows,name){var csv='\ufeff'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function restoreAutoBackup(){var raw=localStorage.getItem('hch_auto_backup');if(!raw){toast('لا توجد نسخة تلقائية محفوظة ❌','error');return;}try{var bk=JSON.parse(raw),d=bk.date||'غير معروف';if(!confirm('استعادة النسخة التلقائية بتاريخ:\n'+d+'\n\nمتأكد؟'))return;db=bk.db;Promise.all(IDB_STORES.map(function(k){return idbSaveAll(k,db[k]||[]);})).then(function(){showPage('dashboard');toast('تم الاستعادة ✅','success',4000);}).catch(function(){toast('خطأ في الحفظ ❌','error');});}catch(e){toast('النسخة تالفة ❌','error');}}
function clearAllData(){if(!confirm('سيتم حذف جميع البيانات نهائياً؟'))return;if(!confirm('تأكيد نهائي؟'))return;idbClearAll().then(function(){db={products:[],sales:[],returns:[],printSales:[],telecomSales:[],expenses:[],clients:[],purchases:[],stockLog:[]};cart=[];heldCarts=[];localStorage.removeItem(HELD_CARTS_KEY);renderCartList();updateCartTotals();renderHeldCarts();toast('تم تفريغ النظام ✅','info');showPage('dashboard');}).catch(function(){toast('خطأ أثناء الحذف ❌','error');});}


// ═══════════════════════════════════════════════════════════

// ── js/12_scanner.js ──
// ║  SEARCH & SCANNER                                        ║
// ═══════════════════════════════════════════════════════════
var _srchTimer=null;
var _srchDropTarget='search-drop';
function onSearch(q){clearTimeout(_srchTimer);_srchDropTarget='search-drop';_srchTimer=setTimeout(function(){_execSearch(q);},130);}
function onSearchNormal(q){clearTimeout(_srchTimer);_srchDropTarget='search-drop-normal';_srchTimer=setTimeout(function(){_execSearch(q);},130);}
function _execSearch(q){
  var drop=$(_srchDropTarget);
  if(!drop){drop=$('search-drop');}
  if(!q||!q.trim()){drop.style.display='none';return;}
  var ql=q.toLowerCase().trim();
  var words=ql.split(/\s+/).filter(Boolean);
  var alert5=shopSettings.lowStockAlert||5;
  var scored=[];
  for(var i=0;i<db.products.length;i++){
    var p=db.products[i];
    var nl=p.name.toLowerCase();
    var sc=0;
    if(nl===ql)sc=100;
    else if(nl.indexOf(ql)===0)sc=90;
    else if(nl.indexOf(ql)>=0)sc=75;
    else if(words.length>1&&words.every(function(w){return nl.indexOf(w)>=0;}))sc=60;
    if(!sc&&p.barcode){var bcs=p.barcode.split(',');for(var bi=0;bi<bcs.length;bi++){if(normalizeBC(bcs[bi]).indexOf(normalizeBC(q))>=0){sc=85;break;}}}
    if(sc)scored.push({p:p,sc:sc});
  }
  scored.sort(function(a,b){return b.sc-a.sc||(a.p.stock<=0?1:0)-(b.p.stock<=0?1:0)||a.p.name.localeCompare(b.p.name,'ar');});
  scored=scored.slice(0,10);
  if(!scored.length){drop.innerHTML='<div style="padding:12px;text-align:center;color:#9ca3af;font-size:12px">لا توجد نتائج لـ «'+q+'»</div>';drop.style.display='block';return;}
  var re=new RegExp('('+ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
  var html='';
  scored.forEach(function(item){
    var p=item.p;var stk=p.stock||0;
    var stkcol=stk<=0?'#dc2626':stk<=alert5?'#ea580c':'#16a34a';
    var stkbg=stk<=0?'#fee2e2':stk<=alert5?'#fff7ed':'#f0fdf4';
    var stkLbl=stk<=0?'نفذ':stk+' متوفر';
    var imgH=renderProductIcon(p,34);
    var hlName=p.name.replace(re,'<mark style="background:#fef08a;border-radius:3px;padding:0 1px">$1</mark>');
    html+='<div class="search-drop-item" onclick="addProdById(\''+p.id+'\')" style="display:flex;align-items:center;gap:10px;'+(stk<=0?'opacity:.6':'')+'">'+
      '<div>'+imgH+'</div>'+
      '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+hlName+'</div>'+
      '<div style="font-size:10px;color:#9ca3af">'+(CAT_ICONS[p.category]||'📦')+' '+p.category+'</div></div>'+
      '<div style="text-align:left;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:3px">'+
      '<div style="font-size:14px;font-weight:900;color:#7c3aed">'+fmt(p.price)+'</div>'+
      '<div style="font-size:10px;font-weight:800;color:'+stkcol+';background:'+stkbg+';padding:1px 7px;border-radius:8px">'+stkLbl+'</div>'+
      '</div></div>';
  });
  drop.innerHTML=html;drop.style.display='block';
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#man-search')&&!e.target.closest('#search-drop')){var d=$('search-drop');if(d)d.style.display='none';}
  if(!e.target.closest('#man-search-normal')&&!e.target.closest('#search-drop-normal')){var dn=$('search-drop-normal');if(dn)dn.style.display='none';}
  if(!e.target.closest('#pc-input')&&!e.target.closest('#pc-drop')){var d2=$('pc-drop');if(d2)d2.style.display='none';}
});
function addProdById(id){var qty=Math.max(1,parseInt(($('search-qty')||{}).value)||1);for(var i=0;i<db.products.length;i++){if(db.products[i].id===id){addToCart(db.products[i],qty);scanCount++;break;}}var ms=$('man-search');if(ms)ms.value='';var msn=$('man-search-normal');if(msn)msn.value='';var sq=$('search-qty');if(sq)sq.value=1;var sd=$('search-drop');if(sd)sd.style.display='none';var sdn=$('search-drop-normal');if(sdn)sdn.style.display='none';}
function addBySearch(){var q=($('man-search')||{}).value.trim();if(!q)return;var qty=Math.max(1,parseInt(($('search-qty')||{}).value)||1);var byBC=findProductByBarcode(q);if(byBC){addToCart(byBC,qty);$('man-search').value='';if($('search-qty'))$('search-qty').value=1;$('search-drop').style.display='none';return;}var ql=q.toLowerCase(),res=[],i;for(i=0;i<db.products.length;i++){if(db.products[i].name.toLowerCase().indexOf(ql)>=0)res.push(db.products[i]);}if(res.length===1){addToCart(res[0],qty);$('man-search').value='';if($('search-qty'))$('search-qty').value=1;$('search-drop').style.display='none';}else{toast('صنف غير مسجل في المخزون ❌','error');beep('error');}}
function findProductByBarcode(code){var i,bc;code=normalizeBC(code);if(!code)return null;for(i=0;i<db.products.length;i++){var barcodes=(db.products[i].barcode||'').split(',');for(var bi=0;bi<barcodes.length;bi++){bc=normalizeBC(barcodes[bi]);if(bc&&bc===code)return db.products[i];}}var stripped=code.replace(/^0+/,'');if(!stripped)return null;for(i=0;i<db.products.length;i++){var barcodes2=(db.products[i].barcode||'').split(',');for(var bi2=0;bi2<barcodes2.length;bi2++){bc=normalizeBC(barcodes2[bi2]);if(!bc||bc.indexOf('MANUAL')===0)continue;if(bc.replace(/^0+/,'')===stripped)return db.products[i];}}return null;}
function handleBC(code){code=normalizeBC(code);if(!code)return;var prod=findProductByBarcode(code);if(prod){addToCart(prod);scanCount++;scanFeedback(true,prod.name);}else{beep('error');scanFeedback(false,'صنف غير مسجل في المخزون');}}
function scanFeedback(ok,msg){if(ok)toast('تم إضافة: '+msg,'success',1800);else toast(msg,'error',2000);if(cameraActive){var v=$('video-wrapper');if(v){v.style.borderColor=ok?'#84cc16':'#f59e0b';setTimeout(function(){v.style.borderColor='#7c3aed';},800);}}var st=$('scan-status-text');if(st)st.textContent=ok?'✅ '+msg:'❓ منتج غير مسجل';setTimeout(function(){var st2=$('scan-status-text');if(st2)st2.textContent=cameraActive?'📷 الكاميرا نشطة — مسح مستمر':'للبيع السريع عبر الهاتف';},2000);}
function initScanner(){
  document.addEventListener('keydown',function(e){
    if(e.key==='F2'){e.preventDefault();if($('pg-cashier').classList.contains('active')&&cart.length>0){
      // إذا كان modal التأكيد مفتوحاً، نؤكد البيع مباشرة
      if($('m-sale-confirm').classList.contains('show')){doConfirmedCheckout();}
      else{openSaleConfirm();}
      return;
    }}
    var active=document.activeElement;var isInput=active&&(active.tagName==='INPUT'||active.tagName==='TEXTAREA'||active.tagName==='SELECT');
    if(isInput&&active.id!=='man-search'&&active.id!=='pc-input'&&active.id!=='pur-bc-input'&&active.id!=='edit-pur-bc-input')return;
    var inCashier=$('pg-cashier').classList.contains('active'),inPriceCheck=$('m-price-check').classList.contains('show'),inInv=$('pg-inventory').classList.contains('active'),inNewProd=$('m-new-prod').classList.contains('show');
    var inNewPurchase=$('m-new-purchase').classList.contains('show'),inEditPurchase=$('m-edit-purchase').classList.contains('show');
    if(!inCashier&&!inPriceCheck&&!inInv&&!inNewPurchase&&!inEditPurchase)return;
    if(e.key==='Enter'){
      if(scanBuf.length>1){var code=normalizeBC(scanBuf);
        if(inNewPurchase&&(active.id==='pur-bc-input'||!isInput)){addPurLineByBarcode(code,'new');if($('pur-bc-input'))$('pur-bc-input').value='';}
        else if(inEditPurchase&&(active.id==='edit-pur-bc-input'||!isInput)){addPurLineByBarcode(code,'edit');if($('edit-pur-bc-input'))$('edit-pur-bc-input').value='';}
        else if(inPriceCheck&&active.id==='pc-input'){checkPriceByCode(code);$('pc-input').value='';$('pc-drop').style.display='none';}
        else if(inCashier&&active.id==='man-search'){$('man-search').value='';$('search-drop').style.display='none';handleBC(code);}
        else if(inCashier&&!inPriceCheck){handleBC(code);}
        else if(inInv&&!inNewProd&&!document.querySelector('.modal-ov.show')){var exists=findProductByBarcode(code);if(exists){showEditProd(exists.id);toast('المنتج مسجل مسبقاً ✏️','info');}else{openNewProdModal(code);toast('منتج جديد 📦','success');}}}
      scanBuf='';clearTimeout(scanTimer);
    }else if(e.key.length===1&&!e.ctrlKey&&!e.altKey){scanBuf+=e.key;clearTimeout(scanTimer);scanTimer=setTimeout(function(){scanBuf='';},400);}
  });
}
function toggleCamera(){if(cameraActive)stopCamera();else startCamera();}
function startCamera(){if(cameraActive)return;if(!('BarcodeDetector' in window)){toast('الكاميرا تحتاج Chrome أو Edge ❌','error',3500);return;}navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}}).catch(function(){return navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});}).then(function(stream){scanStream=stream;cameraActive=true;var v=$('scan-video'),vw=$('video-wrapper');v.srcObject=stream;vw.style.display='block';v.play();$('scan-area').style.display='none';$('cam-btn').textContent='■ إيقاف';$('cam-btn').className='btn btn-r btn-sm';$('scan-status-text').textContent='📷 الكاميرا نشطة';var camCard=$('c-cam');if(camCard)camCard.scrollIntoView({behavior:'smooth',block:'start'});var det=new BarcodeDetector({formats:['ean_13','ean_8','code_128','code_39','code_93','qr_code','upc_a','upc_e','itf','codabar']});var lastCode='',lastTime=0;function scan(){if(!scanStream)return;scanRAF=requestAnimationFrame(scan);if(v.readyState<2)return;det.detect(v).then(function(codes){if(!codes.length)return;var code=normalizeBC(codes[0].rawValue),now=Date.now();if(document.querySelector('.modal-ov.show'))return;if(code.length<4)return;if((now-lastTime)<1500)return;lastCode=code;lastTime=now;handleBC(code);}).catch(function(){});}scan();}).catch(function(err){toast('لا يمكن الوصول للكاميرا: '+err.message,'error');});}
function stopCamera(){if(scanRAF){cancelAnimationFrame(scanRAF);scanRAF=null;}if(scanStream){scanStream.getTracks().forEach(function(t){t.stop();});scanStream=null;}cameraActive=false;var v=$('scan-video'),vw=$('video-wrapper');if(v)v.srcObject=null;if(vw)vw.style.display='none';var area=$('scan-area');if(area)area.style.display='block';var btn=$('cam-btn');if(btn){btn.textContent='تشغيل';btn.className='btn btn-p btn-sm';}var st=$('scan-status-text');if(st)st.textContent='للبيع السريع عبر الهاتف';}

// PRICE CHECK
function openPriceCheck(){$('pc-input').value='';$('pc-result').style.display='none';$('pc-drop').style.display='none';openModal('m-price-check');setTimeout(function(){$('pc-input').focus();},100);}
function onPriceSearch(q){var drop=$('pc-drop');if(!q||q.length<1){drop.style.display='none';return;}var ql=q.toLowerCase(),html='',cnt=0;for(var i=0;i<db.products.length&&cnt<5;i++){var p=db.products[i];if(p.name.toLowerCase().indexOf(ql)>=0||(p.barcode&&normalizeBC(p.barcode).indexOf(normalizeBC(q))>=0)){html+='<div class="search-drop-item" onclick="showPriceResult(\''+p.id+'\')">'+p.name+'</div>';cnt++;}}drop.innerHTML=html;drop.style.display=cnt?'block':'none';}
function checkPriceByCode(code){var p=findProductByBarcode(code);if(p)showPriceResult(p.id);else toast('صنف غير مسجل ❌','error');}
function showPriceResult(id){var p=db.products.find(function(x){return x.id===id;});if(!p)return;$('pc-name').textContent=p.name;$('pc-price').textContent=fmt(p.price);var sText=p.stock<=0?'نفذ من المخزون ⚠️':'الكمية: '+p.stock+' '+(p.unit||'');$('pc-stock').textContent=sText;$('pc-stock').style.color=p.stock<=0?'#dc2626':'#64748b';$('pc-stock').style.background=p.stock<=0?'#fee2e2':'#e2e8f0';var imgWrap=$('pc-img-wrap'),imgEl=$('pc-img');if(imgWrap&&imgEl){if(p.image){imgEl.src=p.image;imgWrap.style.display='block';}else{imgWrap.style.display='none';}}$('pc-result').style.display='block';$('pc-input').value='';$('pc-drop').style.display='none';beep();}
function startInventoryCamera(){openFSCamera(false);}
function startPriceCheckCamera(){openFSCamera(true);}

// ╔══════════════════════════════════════════════════════════╗
// ║  Full‑screen Camera (continued)                         ║
// ╚══════════════════════════════════════════════════════════╝
function openFSCamera(isPriceCheck){
  if(!('BarcodeDetector' in window)){ toast('متصفحك لا يدعم الكاميرا ❌','error'); return; }
  isPriceCheckCam = isPriceCheck;
  var overlay = document.createElement('div');
  overlay.id = 'inv-cam-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.95);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;backdrop-filter:blur(5px);';
  var titleTxt = isPriceCheck ? '🔍 كاشف السعر<br><span style="font-size:13px;font-weight:600;color:#94a3b8;margin-top:8px;display:block">وجّه الكاميرا نحو الباركود</span>' : '📦 إضافة منتج للمخزون<br><span style="font-size:13px;font-weight:600;color:#94a3b8;margin-top:8px;display:block">وجّه الكاميرا نحو باركود المنتج</span>';
  var title = document.createElement('div');
  title.style.cssText = 'color:#fff;font-size:18px;font-weight:900;margin-bottom:20px;text-align:center;';
  title.innerHTML = titleTxt;
  var vidWrap = document.createElement('div');
  vidWrap.style.cssText = 'position:relative;width:90%;max-width:400px;border-radius:20px;overflow:hidden;border:4px solid #7c3aed;box-shadow:0 10px 30px rgba(124,58,237,0.3);margin-bottom:24px;';
  var vid = document.createElement('video');
  vid.autoplay = true; vid.playsInline = true; vid.muted = true;
  vid.style.cssText = 'width:100%;display:block;';
  var scanLine = document.createElement('div');
  scanLine.style.cssText = 'position:absolute;top:50%;left:10%;right:10%;height:2px;background:#ef4444;box-shadow:0 0 10px #ef4444;';
  vidWrap.appendChild(vid); vidWrap.appendChild(scanLine);
  var closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-gray';
  closeBtn.style.cssText = 'padding:14px 30px;font-size:16px;border-radius:12px;font-weight:800;';
  closeBtn.textContent = '✕ إلغاء المسح';
  closeBtn.onclick = function(){ stopFullScreenCamera(); };
  overlay.appendChild(title); overlay.appendChild(vidWrap); overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}}).catch(function(){ return navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); }).then(function(stream){
    invScanStream = stream;
    vid.srcObject = stream;
    var det = new BarcodeDetector({formats:['ean_13','ean_8','code_128','code_39','upc_a','upc_e']});
    function scanInv(){
      if(!invScanStream) return;
      invScanRAF = requestAnimationFrame(scanInv);
      if(vid.readyState < 2) return;
      det.detect(vid).then(function(codes){
        if(!codes.length) return;
        var code = normalizeBC(codes[0].rawValue);
        if(code.length<4) return;
        stopFullScreenCamera();
        if(isPriceCheckCam){ checkPriceByCode(code); }
        else {
          beep();
          var exists = findProductByBarcode(code);
          if(exists){ toast('هذا المنتج مسجل مسبقاً! ✏️','info',3000); showEditProd(exists.id); }
          else { toast('تم التقاط باركود جديد ✅','success'); openNewProdModal(code); }
        }
      }).catch(function(){});
    }
    scanInv();
  }).catch(function(){ stopFullScreenCamera(); toast('تعذر فتح الكاميرا ❌','error'); });
}
function stopFullScreenCamera(){
  if(invScanRAF){ cancelAnimationFrame(invScanRAF); invScanRAF = null; }
  if(invScanStream){ invScanStream.getTracks().forEach(function(t){ t.stop(); }); invScanStream = null; }
  var overlay = document.getElementById('inv-cam-overlay');
  if(overlay) overlay.remove();
}

// ═══════════════════════════════════════════════════════════

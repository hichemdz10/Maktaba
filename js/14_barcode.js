// ── js/14_barcode.js ──
// ║  Barcode Generator & Print                              ║
// ═══════════════════════════════════════════════════════════
function openBarcodeGen(targetField){
  $('bcg-value').value = '';
  $('bcg-result').style.display = 'none';
  window._bcTargetField = targetField;
  openModal('m-bc-gen');
  setTimeout(function(){ $('bcg-value').focus(); }, 100);
}
function generateBarcode(){
  var val = $('bcg-value').value.trim();
  if(!val){ toast('أدخل قيمة الباركود ❌','error'); return; }
  var canvas = $('bc-gen-canvas');
  try {
    JsBarcode(canvas, val, { format: "CODE128", width:2, height:70, displayValue:true, fontSize:14, textMargin:6, margin:12 });
    $('bcg-result').style.display = 'block';
  } catch(e){ $('bcg-result').style.display = 'none'; toast('قيمة غير صالحة لـ Code 128 — استخدم أرقاماً أو حروف إنجليزية فقط ❌','error'); }
}
function generateRandomBarcode(){
  // توليد رقم EAN-13 صحيح مع رقم مراجعة
  var digits='';for(var i=0;i<12;i++)digits+=Math.floor(Math.random()*10);
  var sum=0;for(var j=0;j<12;j++)sum+=parseInt(digits[j])*(j%2===0?1:3);
  var check=(10-(sum%10))%10;
  $('bcg-value').value=digits+check;
  generateBarcode();
}
function applyBarcodeToField(){
  var val = $('bcg-value').value.trim();
  if(!val){ toast('لا يوجد باركود لتطبيقه ❌','error'); return; }
  if($('bcg-result').style.display==='none'){ toast('يرجى توليد الباركود أولاً ❌','error'); return; }
  if(window._bcTargetField){
    var inp = $(window._bcTargetField);
    if(inp) inp.value = val;
  }
  closeModal('m-bc-gen');
}
function downloadBarcode(){
  var canvas = $('bc-gen-canvas');
  if(!canvas) return;
  var link = document.createElement('a');
  link.download = 'barcode.png';
  link.href = canvas.toDataURL();
  link.click();
}

function printBarcodeLabel(id){
  var p = db.products.find(function(x){ return x.id === id; });
  if(!p) return;
  var bc = (p.barcode && p.barcode.indexOf('MANUAL')<0) ? p.barcode.split(',')[0].trim() : '';
  if(!bc){ toast('هذا المنتج ليس له باركود رقمي ❌','error'); return; }
  var canvas = document.createElement('canvas'); canvas.width = 420; canvas.height = 110;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,420,110);
  try {
    JsBarcode(canvas, bc, { format: "CODE128", width:2, height:65, displayValue:true, fontSize:12, textMargin:6, margin:12 });
    var img = canvas.toDataURL();
    var w = window.open('','_blank','width=420,height=320');
    if(!w){ toast('السماح بالنوافذ المنبثقة ❌','error'); return; }
    w.document.write('<html dir="rtl"><head><title>باركود</title><style>body{font-family:Arial;text-align:center;padding:24px;background:#fff}h3{margin:0 0 8px;font-size:14px;color:#1e1b4b}img{border:1px solid #e5e7eb;border-radius:8px;max-width:300px}p{font-size:18px;font-weight:900;color:#7c3aed;margin:8px 0 0}@media print{button{display:none}}</style></head><body>');
    w.document.write('<h3>'+p.name+'</h3><img src="'+img+'"><p>'+fmt(p.price)+'</p>');
    w.document.write('<br><button onclick="window.print()" style="margin-top:12px;padding:10px 24px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">🖨️ طباعة</button>');
    w.document.write('</body></html>'); w.document.close();
  } catch(e){ toast('خطأ في توليد الباركود ❌','error'); }
}

// ═══════════════════════════════════════════════════════════

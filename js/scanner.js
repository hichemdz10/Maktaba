/* ============================================================
   js/scanner.js  —  ليزر + كاميرا
   إصلاح جذري لمشكلة تكرار المسح المزدوج
   ============================================================ */

'use strict';

var isProcessingScan = false;
var lastScannedCode  = '';
var lastScannedTime  = 0;

/* ===== LASER (keyboard emulation) ===== */
function initScanner() {
  document.addEventListener('keydown', function (e) {
    var active = document.activeElement;
    var isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    
    // نسمح بالمسح إذا لم يكن هناك حقل نشط، أو إذا كان الحقل النشط هو شريط البحث
    if (isInput && active.id !== 'man-search') return;
    if (!$('pg-cashier').classList.contains('active')) return;

    if (e.key === 'Enter') {
      if (scanBuf.length > 2) {
        var code = normalizeBC(scanBuf);
        if (active.id === 'man-search') {
          $('man-search').value = '';
          $('search-drop').style.display = 'none';
          active.blur(); // إزالة التركيز لمنع تداخل الأحداث
        }
        handleBC(code);
      }
      scanBuf = '';
      clearTimeout(scanTimer);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
      scanBuf += e.key;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(function () { scanBuf = ''; }, 300); // 300ms كافية جداً لليزر
    }
  });
}

/* ===== BARCODE HANDLER ===== */
function handleBC(code) {
  code = normalizeBC(code);
  if (!code) return;

  var now = Date.now();
  // حماية ضد التكرار السريع لنفس الباركود (1.5 ثانية)
  if (code === lastScannedCode && (now - lastScannedTime) < 1500) return;
  if (isProcessingScan) return;

  isProcessingScan = true;
  lastScannedCode = code;
  lastScannedTime = now;

  var prod = findProductByBarcode(code);

  if (prod) {
    beep();
    addToCart(prod);
    scanCount++;
    if($('ss-scanned')) $('ss-scanned').textContent = scanCount;
    scanFeedback(true, prod.name);
  } else {
    pendingBC = code;
    openNewProdModal(code);
    scanFeedback(false, 'صنف غير مسجل');
  }
  
  setTimeout(function() { isProcessingScan = false; }, 300);
}

function findProductByBarcode(code) {
  var i, bc, strippedCode, strippedBC;
  code = normalizeBC(code);
  if (!code) return null;

  for (i = 0; i < db.products.length; i++) {
    bc = normalizeBC(db.products[i].barcode);
    if (bc && bc === code) return db.products[i];
  }

  strippedCode = code.replace(/^0+/, '');
  if (!strippedCode) return null;

  for (i = 0; i < db.products.length; i++) {
    bc = normalizeBC(db.products[i].barcode);
    if (!bc || bc.indexOf('MANUAL') === 0) continue;
    strippedBC = bc.replace(/^0+/, '');
    if (strippedBC && strippedBC === strippedCode) return db.products[i];
  }

  return null;
}

/* ===== FEEDBACK ===== */
function scanFeedback(ok, msg) {
  if (ok) toast('✅ السلة: ' + msg, 'success', 1200);
  else    toast('❌ ' + msg, 'error', 2000);

  var st = $('scan-status-text');
  if (st) st.textContent = ok ? '✅ ' + msg : '❓ غير مسجل';
  setTimeout(function () {
    if(st) st.textContent = cameraActive ? '📷 الكاميرا نشطة' : 'جاهز • الليزر يعمل مباشرة';
  }, 1500);
}

/* ===== CAMERA ===== */
function toggleCamera() { if (cameraActive) stopCamera(); else startCamera(); }

function startCamera() {
  if (cameraActive) return;
  if (!('BarcodeDetector' in window)) { toast('الكاميرا تحتاج Chrome ❌', 'error'); return; }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(function (stream) {
      scanStream   = stream;
      cameraActive = true;
      var v = $('scan-video');
      v.srcObject = stream;
      v.style.display = 'block';
      $('scan-area').style.display = 'none';
      $('cam-btn').textContent = '■ إيقاف';
      $('cam-btn').className   = 'btn btn-r btn-sm';
      $('scan-status-text').textContent = '📷 الكاميرا نشطة';

      var det = new BarcodeDetector({ formats: ['ean_13','ean_8','code_128','qr_code','upc_a'] });
      
      function scan() {
        if (!scanStream) return;
        scanRAF = requestAnimationFrame(scan);
        if (v.readyState < 2) return;
        det.detect(v).then(function (codes) {
          if (!codes.length) return;
          var code = normalizeBC(codes[0].rawValue);
          handleBC(code); // يعتمد الآن على حماية handleBC الذكية
        }).catch(function () {});
      }
      scan();
    })
    .catch(function (err) { toast('خطأ الكاميرا', 'error'); });
}

function stopCamera() {
  if (scanRAF)    { cancelAnimationFrame(scanRAF); scanRAF = null; }
  if (scanStream) { scanStream.getTracks().forEach(function (t) { t.stop(); }); scanStream = null; }
  cameraActive = false;
  var v = $('scan-video');
  if (v) { v.style.display = 'none'; v.srcObject = null; }
  if ($('scan-area')) $('scan-area').style.display = 'block';
  if ($('cam-btn')) { $('cam-btn').textContent = 'الكاميرا الذكية'; $('cam-btn').className = 'btn btn-p btn-sm'; }
}

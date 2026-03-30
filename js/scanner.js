/* ============================================================
   js/scanner.js  —  ليزر + كاميرا BarcodeDetector
   FIX: إصلاح مشكلة قراءة الباركود المسجل كمنتج جديد
   ============================================================ */

'use strict';

/* ===== LASER (keyboard emulation) ===== */
function initScanner() {
  document.addEventListener('keydown', function (e) {
    var active = document.activeElement;
    var isInput = active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT'
    );
    /* نسمح بالمسح فقط إذا كان الحقل النشط هو البحث أو لا حقل نشط */
    if (isInput && active.id !== 'man-search') return;
    if (!$('pg-cashier').classList.contains('active')) return;

    if (e.key === 'Enter') {
      if (scanBuf.length > 1) {
        var code = normalizeBC(scanBuf);
        if (active.id === 'man-search') {
          $('man-search').value = '';
          $('search-drop').style.display = 'none';
        }
        handleBC(code);
      }
      scanBuf = '';
      clearTimeout(scanTimer);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
      scanBuf += e.key;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(function () { scanBuf = ''; }, 400);
    }
  });
}

/* ===== BARCODE HANDLER — FIX مشكلة المنتج الموجود يُعامَل كجديد ===== */
function handleBC(code) {
  code = normalizeBC(code);
  if (!code) return;

  /* FIX: نبحث بشكل صارم أولاً بالمطابقة التامة */
  var prod = findProductByBarcode(code);

  if (prod) {
    /* المنتج موجود — أضفه مباشرة بدون أي modal */
    beep();
    addToCart(prod);
    scanCount++;
    $('ss-scanned').textContent = scanCount;
    scanFeedback(true, prod.name);
  } else {
    /* المنتج غير موجود — افتح modal الإضافة */
    pendingBC = code;
    openNewProdModal(code);
    scanFeedback(false, 'صنف غير مسجل في المخزون');
  }
}

/*
 * FIX: دالة موحدة للبحث عن منتج بالباركود
 * الأولوية:
 *   1. مطابقة تامة بعد normalizeBC
 *   2. مطابقة بعد إزالة الأصفار البادئة (EAN variants)
 * النتيجة: إما المنتج أو null  — لا يُعاد منتج خاطئ أبداً
 */
function findProductByBarcode(code) {
  var i, bc, strippedCode, strippedBC;

  code = normalizeBC(code);
  if (!code) return null;

  /* المرور 1: مطابقة تامة */
  for (i = 0; i < db.products.length; i++) {
    bc = normalizeBC(db.products[i].barcode);
    if (bc && bc === code) return db.products[i];
  }

  /* المرور 2: إزالة الأصفار البادئة */
  strippedCode = code.replace(/^0+/, '');
  if (!strippedCode) return null; /* الكود كان أصفاراً فقط */

  for (i = 0; i < db.products.length; i++) {
    bc = normalizeBC(db.products[i].barcode);
    if (!bc) continue;
    /* تخطّي المنتجات اليدوية */
    if (bc.indexOf('MANUAL') === 0) continue;
    strippedBC = bc.replace(/^0+/, '');
    if (strippedBC && strippedBC === strippedCode) return db.products[i];
  }

  return null;
}

/* ===== FEEDBACK ===== */
function scanFeedback(ok, msg) {
  if (ok) toast('تم إضافة: ' + msg, 'success', 1800);
  else    toast(msg, 'error', 2000);

  if (cameraActive) {
    var v = $('scan-video');
    v.style.outline = ok ? '4px solid #84cc16' : '4px solid #f59e0b';
    setTimeout(function () { v.style.outline = 'none'; }, 800);
  } else {
    var area = $('scan-area');
    area.className = 'scan-area ' + (ok ? 'ok' : 'warn');
    setTimeout(function () { area.className = 'scan-area'; }, 1200);
  }

  $('scan-status-text').textContent = ok ? '✅ ' + msg : '❓ منتج غير مسجل';
  setTimeout(function () {
    $('scan-status-text').textContent = cameraActive
      ? '📷 الكاميرا نشطة — مسح مستمر'
      : 'جاهز • الليزر يعمل مباشرة';
  }, 2000);
}

/* ===== CAMERA ===== */
function toggleCamera() { if (cameraActive) stopCamera(); else startCamera(); }

function startCamera() {
  if (cameraActive) return;
  if (!('BarcodeDetector' in window)) {
    toast('الكاميرا تحتاج Chrome أو Edge ❌', 'error', 3500);
    return;
  }

  var constraints = {
    video: {
      facingMode: 'environment',
      width:  { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720  }
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .catch(function () {
      /* fallback: أي كاميرا خلفية */
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    })
    .then(function (stream) {
      scanStream   = stream;
      cameraActive = true;

      var v = $('scan-video');
      v.srcObject    = stream;
      v.style.display = 'block';
      $('scan-area').style.display = 'none';
      $('cam-btn').textContent  = '■ إيقاف';
      $('cam-btn').className    = 'btn btn-r btn-sm';
      $('scan-status-text').textContent = '📷 الكاميرا نشطة — مسح مستمر';

      var det = new BarcodeDetector({
        formats: [
          'ean_13','ean_8','code_128','code_39','code_93',
          'qr_code','upc_a','upc_e','itf','codabar'
        ]
      });

      var lastCode = '', lastTime = 0;

      function scan() {
        if (!scanStream) return;
        scanRAF = requestAnimationFrame(scan);
        if (v.readyState < 2) return;

        det.detect(v).then(function (codes) {
          if (!codes.length) return;
          var code = normalizeBC(codes[0].rawValue);
          var now  = Date.now();
          /* نفس الكود: انتظر 2.5 ثانية قبل إعادة المعالجة */
          if (code === lastCode && (now - lastTime) < 2500) return;
          lastCode = code;
          lastTime = now;
          handleBC(code);
        }).catch(function () {});
      }

      scan();
    })
    .catch(function (err) {
      toast('لا يمكن الوصول للكاميرا: ' + err.message, 'error');
    });
}

function stopCamera() {
  if (scanRAF)    { cancelAnimationFrame(scanRAF); scanRAF = null; }
  if (scanStream) { scanStream.getTracks().forEach(function (t) { t.stop(); }); scanStream = null; }
  cameraActive = false;

  var v = $('scan-video');
  if (v) { v.style.display = 'none'; v.srcObject = null; v.style.outline = 'none'; }

  var area = $('scan-area');
  if (area) area.style.display = 'block';

  var btn = $('cam-btn');
  if (btn) { btn.textContent = 'الكاميرا الذكية'; btn.className = 'btn btn-p btn-sm'; }

  var st = $('scan-status-text');
  if (st) st.textContent = 'جاهز • الليزر يعمل مباشرة';
}

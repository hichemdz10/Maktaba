/* ============================================================
   js/main.js  —  نقطة الدخول — تهيئة التطبيق
   ============================================================ */

'use strict';

/* ===== NAVIGATION LISTENERS ===== */
document.querySelectorAll('.nav-item').forEach(function (el) {
  el.addEventListener('click', function () {
    showPage(el.dataset.page);
  });
});

/* ===== CLOCK ===== */
setInterval(updateClock, 1000);
updateClock();

/* ===== INVENTORY HEADER (إضافة إحصائيات صغيرة فوق الجدول) ===== */
function buildInventoryLayout() {
  var invCard = document.querySelector('#pg-inventory .inv-card');
  if (invCard) return; /* مبني مسبقاً */

  var pg = $('pg-inventory');
  if (!pg) return;

  /* أعد هيكلة محتوى المخزون */
  var existingCard = pg.querySelector('.card:nth-child(2)');
  if (!existingCard) return;

  /* حقن div إحصائيات */
  var statsRow = document.createElement('div');
  statsRow.id             = 'inv-stats-row';
  statsRow.className      = 'inv-stats-row';
  existingCard.insertBefore(statsRow, existingCard.querySelector('.table-wrap') || existingCard.children[1]);
}

/* ===== INIT ===== */
function init() {
  loadDB();
  loadSettings();
  applyTheme();
  populateCategories();

  autoSync = localStorage.getItem(AUTO_SYNC_KEY) === '1';

  initScanner();
  initPrint();
  initTelecom();

  /* قيم افتراضية للحقول */
  if ($('exp-date'))  $('exp-date').value  = today();
  if ($('rep-from'))  $('rep-from').value  = today();
  if ($('rep-to'))    $('rep-to').value    = today();

  renderDash();
  renderTodaySum();
  updateCloudStatus();
  renderHeldCarts();

  /* مزامنة سحابية عند الإقلاع */
  cloudPull(false, function (ok) {
    if (ok) {
      renderDash();
      toast('تم التحديث من السحابة ☁️', 'info', 2000);
    }
  });

  /* إضافة div الإحصائيات للمخزون إن لم يكن موجوداً */
  buildInventoryLayout();
}

/* ===== START ===== */
init();

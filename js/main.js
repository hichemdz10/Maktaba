/* ============================================================
   js/main.js  —  التهيئة والإقلاع + القائمة الجانبية
   ============================================================ */

'use strict';

/* ===== TOGGLE SIDEBAR MOBILE ===== */
function toggleSidebar() {
  var sb = $('main-sidebar');
  var ov = $('sidebar-overlay');
  if (sb.classList.contains('open')) {
    sb.classList.remove('open');
    ov.classList.remove('show');
  } else {
    sb.classList.add('open');
    ov.classList.add('show');
  }
}

/* ===== NAVIGATION LISTENERS ===== */
document.querySelectorAll('.nav-item').forEach(function (el) {
  el.addEventListener('click', function () {
    showPage(el.dataset.page);
  });
});

/* ===== CLOCK ===== */
setInterval(updateClock, 1000);
updateClock();

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

  if ($('exp-date'))  $('exp-date').value  = today();
  if ($('rep-from'))  $('rep-from').value  = today();
  if ($('rep-to'))    $('rep-to').value    = today();

  renderDash();
  renderTodaySum();
  updateCloudStatus();
  renderHeldCarts();

  cloudPull(false, function (ok) {
    if (ok) {
      renderDash();
      toast('تم التحديث من السحابة ☁️', 'info', 2000);
    }
  });
}

init();

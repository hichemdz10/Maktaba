/* ============================================================
   js/ui.js  —  مساعدات واجهة المستخدم المشتركة
   ============================================================ */

'use strict';

/* ===== HELPERS ===== */
function $(id)    { return document.getElementById(id); }
function today()  { return new Date().toISOString().slice(0, 10); }
function nowStr() { return new Date().toLocaleString('ar-DZ'); }
function genId()  { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function fmt(n)   { return Number(n || 0).toLocaleString('ar-DZ') + ' دج'; }

function rechargeProfit(amt) {
  return amt < 1000
    ? (shopSettings.flexyProfitLow  || 10)
    : (shopSettings.flexyProfitHigh || 20);
}

/* FIX: normalizeBC — يتعامل مع null/undefined بأمان */
function normalizeBC(code) {
  if (code == null) return '';
  return String(code).replace(/[\s\r\n\t\u200b\u200c\u200d\ufeff]/g, '');
}

function truncateItems(items, max) {
  max = max || 2;
  var names = items.slice(0, max).map(function (it) {
    return it.name + (it.qty > 1 ? ' ×' + it.qty : '');
  }).join(' • ');
  if (items.length > max) names += ' +(' + (items.length - max) + ')';
  return names;
}

/* ===== TOAST ===== */
function toast(msg, type, dur) {
  var t = $('toast');
  t.className = 'toast show ' + (type || '');
  t.innerHTML = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : type === 'info' ? 'ℹ️ ' : '🔔 ') + msg;
  setTimeout(function () { t.className = 'toast'; }, dur || 2500);
}

/* ===== CLOCK ===== */
function updateClock() {
  var now = new Date();
  var p = function (n) { return n.toString().padStart(2, '0'); };
  var el = $('clock-badge');
  if (el) el.textContent = p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
}

/* ===== BEEP ===== */
function beep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    g.gain.setValueAtTime(0.8, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    o.start(audioCtx.currentTime);
    o.stop(audioCtx.currentTime + 0.18);
  } catch (e) {}
}

/* ===== MODALS ===== */
function openModal(id)  { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }
function ovClose(e, el) { if (e.target === el) el.classList.remove('show'); }

/* ===== NAVIGATION ===== */
function showPage(id) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });

  var pg = $('pg-' + id);
  if (!pg) return;
  pg.classList.add('active');

  var nav = document.querySelector('[data-page="' + id + '"]');
  if (nav) nav.classList.add('active');

  var info = PAGE_INFO[id] || { title: id, sub: '' };
  $('pg-title').textContent = info.title;
  $('pg-sub').textContent   = info.sub;

  if (id !== 'cashier') stopCamera();

  if (id === 'dashboard')  renderDash();
  if (id === 'inventory')  renderInv();
  if (id === 'clients')    renderClients();
  if (id === 'expenses')   renderExp();
  if (id === 'print')      renderPrint();
  if (id === 'telecom')    renderTel();
  if (id === 'reports')    genReport();
  if (id === 'cashier')  { renderTodaySum(); renderHeldCarts(); }
  if (id === 'settings')   renderSettings();
}

/* ===== DASHBOARD LAYOUT ===== */
function applyDashboardLayout() {
  var lay = shopSettings.dashLayout;
  var els = document.querySelectorAll('[data-layout]');
  els.forEach(function (el) {
    var key = el.getAttribute('data-layout');
    el.style.display = lay[key] ? '' : 'none';
  });
}

/* ===== SIDEBAR SPARKLINE ===== */
function renderSidebarSparkline() {
  var data = getSalesForDays(5);
  var keys = Object.keys(data);
  var max  = 1;
  keys.forEach(function (k) { if (data[k] > max) max = data[k]; });

  var html = '';
  keys.forEach(function (k, idx) {
    var h = (data[k] / max) * 100;
    if (h < 15 && data[k] > 0) h = 15;
    if (h === 0) h = 4;
    var cls = (idx === keys.length - 1) ? 'spark-bar today' : 'spark-bar';
    html += '<div class="' + cls + '" style="height:' + h + '%" title="' + k + ': ' + fmt(data[k]) + '"></div>';
  });
  var sp = $('sidebar-spark');
  if (sp) sp.innerHTML = html;
}

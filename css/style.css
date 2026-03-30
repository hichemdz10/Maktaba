/* ============================================================
   مكتبة حشايشي — v3.5 Pro | css/style.css
   التصميم الكلاسيكي الأصيل + تحسينات الهاتف والكمبيوتر
   ============================================================ */

/* ===== RESET & BASE ===== */
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

body {
  font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
  background: #f0f2f8;
  display: flex;
  height: 100vh;
  overflow: hidden;
  direction: rtl;
  font-size: 14px;
  color: #1e1b4b;
}

/* ===== DARK MODE ===== */
body.dark-mode { background: #0f172a; color: #f8fafc; }
body.dark-mode .card,
body.dark-mode .stat-card { background: #1e293b; border-color: #334155; }
body.dark-mode .input,
body.dark-mode select,
body.dark-mode .search-drop,
body.dark-mode .modal { background: #1e293b; border-color: #334155; color: #f8fafc; }
body.dark-mode .input:focus { background: #0f172a; border-color: #7c3aed; }
body.dark-mode th { color: #94a3b8; border-color: #334155; }
body.dark-mode td { color: #cbd5e1; border-color: #1e293b; }
body.dark-mode tr:hover td { background: rgba(255,255,255,0.02); }
body.dark-mode .btn-gray { background: #334155; color: #f8fafc; border-color: #475569; }
body.dark-mode .topbar { background: #1e293b; border-color: #334155; }
body.dark-mode .icon-btn, body.dark-mode .time-badge { background: rgba(30,41,59,0.8); color: #cbd5e1; }
body.dark-mode .sale-row, body.dark-mode .exp-row, body.dark-mode .cli-card { background: rgba(15,23,42,0.5); }
body.dark-mode .sale-row:hover, body.dark-mode .exp-row:hover, body.dark-mode .cli-card:hover { background: rgba(30,41,59,0.8); border-color: #475569; }
body.dark-mode .pt-btn, body.dark-mode .op-btn, body.dark-mode .ct-btn, body.dark-mode .pay-chip { background: #1e293b; border-color: #334155; color: #cbd5e1; }
body.dark-mode .pt-btn.sel, body.dark-mode .op-btn.sel, body.dark-mode .ct-btn.sel, body.dark-mode .pay-chip.sel { background: rgba(124,58,237,0.15); border-color: #7c3aed; }
body.dark-mode .cart-sum, body.dark-mode .scan-area { background: rgba(124,58,237,0.05); }
body.dark-mode .qty-ctrl, body.dark-mode .qty-btn, body.dark-mode .scan-stat, body.dark-mode .tabs { background: #0f172a; border-color: #334155; color: #f8fafc; }
body.dark-mode .danger-zone { background: rgba(69,10,10,0.3); border-color: #7f1d1d; }
body.dark-mode .cat-chip { background: #334155; color: #e2e8f0; }
body.dark-mode .sidebar { background: linear-gradient(175deg,#1e1b4b,#312e81,#4c1d95); }

/* ===== SIDEBAR ===== */
.sidebar {
  width: 210px;
  flex-shrink: 0;
  background: linear-gradient(175deg, #4c1d95, #7c3aed, #9d174d);
  display: flex;
  flex-direction: column;
  padding: 16px 0 10px;
  /* FIX: القائمة تتمرر عمودياً على الكمبيوتر */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 4px 0 20px rgba(0,0,0,.2);
}

/* خلفية الأقسام — نفس لون القائمة بنسبة أخف ومتدرجة */
.sidebar-section-bg {
  background: linear-gradient(135deg,
    rgba(76,29,149,0.15) 0%,
    rgba(124,58,237,0.10) 50%,
    rgba(157,23,77,0.08) 100%);
  border-radius: 10px;
  margin: 4px 8px;
  padding: 2px 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  margin-bottom: 8px;
  padding: 0 14px 14px;
  border-bottom: 1px solid rgba(255,255,255,.12);
  flex-shrink: 0;
}
.logo-icon {
  background: linear-gradient(135deg,#f59e0b,#f97316);
  border-radius: 12px;
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.logo-text { display: flex; flex-direction: column; }
.logo-text span:first-child { font-size: 15px; font-weight: 800; }
.logo-text span:last-child  { font-size: 9px; opacity: .6; font-weight: 400; margin-top: 1px; }

.nav-divider {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 12px 4px; margin: 5px 0 2px;
  flex-shrink: 0;
}
.nav-divider::before, .nav-divider::after {
  content: ''; flex: 1; height: 1px;
  background: rgba(255,255,255,.18); border-radius: 1px;
}
.nav-divider span {
  font-size: 8.5px; color: rgba(255,255,255,.45);
  font-weight: 700; letter-spacing: .6px; white-space: nowrap;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  cursor: pointer; color: rgba(255,255,255,.7);
  margin: 1px 8px; transition: .2s;
  font-weight: 500; font-size: 12.5px;
  flex-shrink: 0;
}
.nav-item:hover { background: rgba(255,255,255,.15); color: #fff; }
.nav-item.active {
  background: rgba(255,255,255,.22); color: #fff;
  font-weight: 700; box-shadow: inset 3px 0 0 #84cc16;
}
.nav-icon { font-size: 16px; width: 20px; text-align: center; }

/* Sparkline */
.sidebar-sparkline {
  display: flex; align-items: flex-end;
  justify-content: center; gap: 4px;
  height: 30px; margin: 8px 0;
  flex-shrink: 0;
}
.spark-bar {
  width: 8px; background: rgba(255,255,255,0.2);
  border-radius: 4px 4px 0 0; transition: .3s;
}
.spark-bar.today { background: #8b5cf6; }

.sidebar-footer {
  margin-top: auto; text-align: center;
  color: rgba(255,255,255,.3); font-size: 9px;
  padding: 14px; border-top: 1px solid rgba(255,255,255,.08);
  line-height: 1.8; flex-shrink: 0;
}

/* ===== MAIN ===== */
.main {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; min-width: 0;
}

.topbar {
  background: #fff;
  padding: 10px 20px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e8eaf0;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.topbar h1 { font-size: 17px; font-weight: 800; color: #1e1b4b; }
.topbar p  { font-size: 10px; color: #9ca3af; margin-top: 1px; }
.topbar-r  { display: flex; gap: 7px; align-items: center; }

.icon-btn {
  width: 34px; height: 34px; border-radius: 9px;
  background: #f4f6fb; border: none; cursor: pointer;
  font-size: 14px; display: flex; align-items: center;
  justify-content: center; transition: .2s;
  color: #374151; position: relative;
}
.icon-btn:hover { background: #ede9fe; color: #7c3aed; }

.time-badge {
  font-size: 11px; font-weight: 600; color: #6b7280;
  background: #f4f6fb; padding: 5px 10px;
  border-radius: 8px; border: 1px solid #e5e7eb;
}

.sync-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #9ca3af; display: inline-block;
  position: absolute; top: 4px; left: 4px; transition: .4s;
}
.sync-dot.ok  { background: #16a34a; }
.sync-dot.busy{ background: #f59e0b; animation: sdp .7s infinite; }
.sync-dot.err { background: #dc2626; }
@keyframes sdp { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ===== PAGES ===== */
.page {
  display: none; flex: 1;
  overflow-y: auto; overflow-x: hidden;
  padding: 16px 18px;
  flex-direction: column; gap: 12px;
}
.page.active { display: flex; }

/* ===== CARD ===== */
.card {
  background: #fff; border-radius: 14px;
  padding: 15px; box-shadow: 0 2px 10px rgba(0,0,0,.06);
}
.card-head {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 12px;
}
.card-title { font-size: 13px; font-weight: 700; color: inherit; }
.card-sub   { font-size: 10px; color: #9ca3af; margin-top: 2px; }
.see-all {
  font-size: 11px; color: #7c3aed; cursor: pointer;
  font-weight: 600; padding: 3px 8px;
  border-radius: 6px; transition: .2s;
}
.see-all:hover { background: #ede9fe; }

/* ===== STAT CARDS ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 10px;
}
.stat-card {
  background: #fff; border-radius: 14px;
  padding: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.06);
  position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute;
  top: 0; right: 0; width: 4px; height: 100%;
  border-radius: 0 14px 14px 0;
}
.stat-card.s-green::before  { background: #84cc16; }
.stat-card.s-purple::before { background: #7c3aed; }
.stat-card.s-blue::before   { background: #3b82f6; }
.stat-card.s-orange::before { background: #f59e0b; }
.stat-card.s-teal::before   { background: #14b8a6; }
.stat-card.s-red::before    { background: #ef4444; }
.stat-card.s-lime::before   { background: #65a30d; }

.stat-icon  { font-size: 26px; margin-bottom: 5px; }
.stat-label { font-size: 10px; color: #9ca3af; font-weight: 500; }
.stat-val   { font-size: 19px; font-weight: 900; color: inherit; margin: 3px 0; line-height: 1.1; }
.stat-change{ font-size: 10px; font-weight: 600; }

/* ===== TAGS ===== */
.tag { display:inline-flex; align-items:center; gap:3px; padding:3px 8px; border-radius:20px; font-size:10px; font-weight:600; }
.tg  { background:#dcfce7; color:#16a34a; }
.tr  { background:#fee2e2; color:#dc2626; }
.tb  { background:#dbeafe; color:#2563eb; }
.to  { background:#ffedd5; color:#ea580c; }
.tp  { background:#ede9fe; color:#7c3aed; }
.tgr { background:#f3f4f6; color:#6b7280; }

/* ===== BUTTONS ===== */
.btn {
  padding: 8px 14px; border-radius: 9px; border: none;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: .2s; display: inline-flex;
  align-items: center; gap: 5px;
  font-family: inherit; white-space: nowrap;
  justify-content: center;
}
.btn:active { transform: scale(0.97); }
.btn-p    { background: #7c3aed; color: #fff; }
.btn-p:hover { background: #6d28d9; }
.btn-g    { background: #84cc16; color: #fff; }
.btn-g:hover { background: #65a30d; }
.btn-r    { background: #ef4444; color: #fff; }
.btn-r:hover { background: #dc2626; }
.btn-o    { background: #f59e0b; color: #fff; }
.btn-o:hover { background: #d97706; }
.btn-out  { background: #fff; color: #7c3aed; border: 1.5px solid #7c3aed; }
.btn-out:hover { background: #ede9fe; }
.btn-gray { background: #f4f6fb; color: #374151; border: 1px solid #e5e7eb; }
.btn-gray:hover { background: #e5e7eb; }
.btn-sm   { padding: 5px 10px; font-size: 11px; }
.btn-full { width: 100%; }

/* ===== INPUTS ===== */
.label { display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; }
.input {
  width: 100%; padding: 8px 11px;
  border: 1.5px solid #e5e7eb; border-radius: 9px;
  font-size: 12.5px; font-family: inherit;
  outline: none; transition: .2s;
  direction: rtl; background: #fff; color: inherit;
}
.input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.1); }
.fg    { margin-bottom: 10px; }
.frow  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.frow3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

/* ===== TWO COLUMN ===== */
.two-col {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 12px;
  align-items: start;
}

/* ===== TABLES (مُعاد تصميمه — مخزون أكثر احترافية) ===== */
.table-wrap {
  overflow-x: auto;
  overflow-y: auto;       /* FIX: تمرير عمودي */
  max-height: calc(100vh - 260px);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
table { width: 100%; border-collapse: collapse; min-width: 700px; }
th {
  text-align: right; font-size: 10px; color: #9ca3af;
  font-weight: 700; padding: 10px 12px;
  border-bottom: 2px solid #f0f2f8;
  background: #f8fafc;
  position: sticky; top: 0; z-index: 1;
}
td {
  padding: 10px 12px; font-size: 12px; color: inherit;
  border-bottom: 1px solid #f7f8fb; vertical-align: middle;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: #fafbff; }

/* ===== INVENTORY (إعادة تصميم جذرية) ===== */
.inv-toolbar {
  display: flex; gap: 8px; align-items: center;
  flex-wrap: wrap; margin-bottom: 12px;
}
.inv-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.06); overflow: hidden; }
.inv-card-head { padding: 14px 16px 10px; border-bottom: 1px solid #f0f2f8; }
.inv-stats-row {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 1px;
  background: #f0f2f8;
  border-bottom: 1px solid #f0f2f8;
}
.inv-stat-item {
  background: #fff; padding: 10px 14px; text-align: center;
}
.inv-stat-item-val { font-size: 18px; font-weight: 900; color: #7c3aed; }
.inv-stat-item-lbl { font-size: 9px; color: #9ca3af; margin-top: 2px; }

/* Badge مخزون */
.badge-ok  { background: #dcfce7; color: #16a34a; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.badge-low { background: #ffedd5; color: #ea580c; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.badge-out { background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; }

/* ===== CASHIER / SCAN ===== */
.scan-area {
  border: 2px dashed #c4b5fd; border-radius: 14px;
  padding: 16px; text-align: center;
  background: linear-gradient(135deg,#faf5ff,#f5f3ff);
  cursor: pointer; transition: .3s;
}
.scan-area:hover { border-color: #7c3aed; }
.scan-area.ok   { border-color: #84cc16; background: #f0fdf4; animation: pulse-g .5s ease; }
.scan-area.warn { border-color: #f59e0b; background: #fffbeb; }
@keyframes pulse-g { 0%,100%{box-shadow:0 0 0 0 rgba(132,204,22,.4)} 50%{box-shadow:0 0 0 8px rgba(132,204,22,0)} }

#scan-video {
  display: none; width: 100%;
  border-radius: 10px; max-height: 280px;
  object-fit: cover;
}
.scan-stats {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 8px; margin-top: 8px;
}
.scan-stat {
  background: #f7f8fb; border-radius: 9px;
  padding: 9px; text-align: center;
}
.scan-stat-v { font-size: 16px; font-weight: 800; color: inherit; }
.scan-stat-l { font-size: 9px; color: #9ca3af; margin-top: 2px; }

/* ===== CART ===== */
.cart-wrap {
  display: flex; flex-direction: column;
  max-height: calc(100vh - 140px);
  position: sticky; top: 0;
}
/* FIX: آخر منتج يظهر في الأعلى — نعكس الترتيب بـ CSS */
#cart-list {
  overflow-y: auto;
  max-height: 260px;
  display: flex;
  flex-direction: column-reverse; /* أحدث عنصر في الأعلى */
}
.cart-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f8;
}
.cart-item:first-child { border-bottom: none; }
.ci-info  { flex: 1; min-width: 0; }
.ci-name  { font-size: 12px; font-weight: 600; color: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-unit  { font-size: 10px; color: #9ca3af; }
.ci-price { font-size: 12px; font-weight: 700; color: #7c3aed; white-space: nowrap; }
.qty-ctrl {
  display: flex; align-items: center; gap: 3px;
  flex-shrink: 0; background: #f8fafc;
  padding: 3px; border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.qty-btn {
  width: 22px; height: 22px; border-radius: 6px;
  border: none; background: #fff; cursor: pointer;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  transition: .15s; box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.qty-btn:hover { color: #7c3aed; }
.qty-n { width: 24px; text-align: center; font-size: 12px; font-weight: 700; }

.cart-sum {
  padding: 10px;
  background: linear-gradient(135deg,#faf5ff,#f5f3ff);
  border-radius: 11px; margin: 8px 0;
}
.sum-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: inherit;
  margin-bottom: 4px; align-items: center;
}
.sum-total {
  font-size: 16px; font-weight: 800; color: inherit;
  border-top: 2px solid #e5e7eb;
  padding-top: 7px; margin-top: 5px;
}

/* ===== SEARCH DROPDOWN ===== */
.search-drop {
  position: absolute; z-index: 100;
  background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  width: 100%; top: 100%; margin-top: 4px;
  max-height: 260px; overflow-y: auto;
}
.search-drop-item {
  padding: 9px 12px; cursor: pointer;
  display: flex; justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f2f8; transition: .15s;
}
.search-drop-item:last-child { border-bottom: none; }
.search-drop-item:hover { background: #faf5ff; padding-right: 16px; }

/* ===== PRINT & TELECOM GRIDS (بطاقات جنباً إلى جنب) ===== */
.print-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 8px; margin-bottom: 12px;
}
.pt-btn {
  padding: 11px 6px; border-radius: 11px;
  border: 2px solid #e5e7eb; background: #fff;
  cursor: pointer; text-align: center; transition: .2s;
}
.pt-btn:hover { border-color: #c4b5fd; background: #faf5ff; }
.pt-btn.sel   { border-color: #7c3aed; background: #ede9fe; box-shadow: 0 0 0 3px rgba(124,58,237,.1); }
.pt-icon  { font-size: 22px; margin-bottom: 3px; }
.pt-name  { font-size: 10px; font-weight: 700; color: inherit; line-height: 1.2; }
.pt-price { font-size: 11px; color: #7c3aed; font-weight: 600; margin-top: 2px; }

.op-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 8px; margin-bottom: 12px;
}
.op-btn {
  padding: 12px 6px; border-radius: 11px;
  border: 2px solid #e5e7eb; background: #fff;
  cursor: pointer; text-align: center; transition: .2s;
}
.op-btn:hover, .op-btn.sel { border-color: #7c3aed; background: #faf5ff; }
.op-btn.sel { box-shadow: 0 0 0 3px rgba(124,58,237,.1); }
.oi { font-size: 26px; display: block; margin-bottom: 3px; }
.on { font-size: 11px; font-weight: 700; color: inherit; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 8px; margin-bottom: 12px;
}
.ct-btn {
  padding: 11px; border-radius: 11px;
  border: 2px solid #e5e7eb; background: #fff;
  cursor: pointer; text-align: center; transition: .2s;
}
.ct-btn:hover, .ct-btn.sel { border-color: #84cc16; background: #f0fdf4; }
.ct-name   { font-size: 10px; font-weight: 700; color: inherit; }
.ct-price  { font-size: 17px; font-weight: 900; color: #7c3aed; margin: 3px 0; }
.ct-profit { font-size: 10px; color: #16a34a; font-weight: 700; }

/* ===== TABS ===== */
.tabs {
  display: flex; gap: 6px;
  margin-bottom: 12px;
  background: #f4f6fb;
  padding: 4px; border-radius: 10px;
}
.tab-btn {
  flex: 1; padding: 8px; border-radius: 8px;
  border: none; font-size: 12px; font-weight: 600;
  cursor: pointer; color: #6b7280; transition: .2s;
  font-family: inherit; background: transparent;
}
.tab-btn.active { background: #fff; color: #7c3aed; box-shadow: 0 2px 6px rgba(0,0,0,.1); }

/* ===== CLIENTS ===== */
.cli-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; border: 1.5px solid #f0f2f8;
  border-radius: 11px; cursor: pointer;
  transition: .2s; margin-bottom: 6px;
  background: #f8fafc;
}
.cli-card:hover { border-color: #d8b4fe; background: #faf5ff; }
.cli-av {
  width: 38px; height: 38px; border-radius: 50%;
  background: linear-gradient(135deg,#7c3aed,#ec4899);
  color: #fff; display: flex; align-items: center;
  justify-content: center; font-weight: 800;
  font-size: 15px; flex-shrink: 0;
}
.cli-name  { font-size: 12.5px; font-weight: 700; color: inherit; }
.cli-phone { font-size: 10px; color: #9ca3af; }

/* ===== EXPENSE ROWS ===== */
.exp-row {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 10px; border-radius: 10px;
  background: #f9fafb; margin-bottom: 6px;
  border: 1px solid #f0f2f8; transition: .2s;
}
.exp-row:hover { background: #faf5ff; border-color: #e9d5ff; }
.exp-icon {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center;
  justify-content: center; font-size: 16px;
  flex-shrink: 0; background: #f4f6fb;
}
.exp-info { flex: 1; min-width: 0; }
.exp-name { font-size: 12px; font-weight: 600; color: inherit; }
.exp-date { font-size: 10px; color: #9ca3af; }

/* ===== SALE ROWS (داشبورد) ===== */
.sale-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 10px;
  background: #f9fafb; margin-bottom: 5px;
  border: 1px solid #f0f2f8; transition: .2s;
}
.sale-row:hover { background: #faf5ff; border-color: #e9d5ff; }
.sale-row:last-child { margin-bottom: 0; }
.sale-method-dot {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center;
  justify-content: center; font-size: 16px; flex-shrink: 0;
}
.sale-info { flex: 1; min-width: 0; }
.sale-name {
  font-size: 11.5px; font-weight: 600; color: inherit;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap;
}
.sale-time { font-size: 10px; color: #9ca3af; margin-top: 1px; }
.sale-amt  { font-size: 13px; font-weight: 800; color: #7c3aed; white-space: nowrap; flex-shrink: 0; }

/* ===== LOW STOCK ===== */
.low-item {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 7px 0; border-bottom: 1px solid #f7f8fb;
  font-size: 12px;
}
.low-item:last-child { border-bottom: none; }

/* ===== PAY CHIPS ===== */
.pay-chips { display: flex; gap: 7px; margin-bottom: 10px; }
.pay-chip {
  flex: 1; padding: 9px; border-radius: 10px;
  border: 2px solid #e5e7eb; background: #fff;
  cursor: pointer; text-align: center;
  transition: .2s; font-size: 11px;
  font-weight: 700; color: #374151;
}
.pay-chip:hover { border-color: #c4b5fd; background: #faf5ff; }
.pay-chip.sel   { border-color: #7c3aed; background: #ede9fe; color: #7c3aed; }

/* ===== CATEGORY CHIP ===== */
.cat-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: #e2e8f0; color: #334155;
  padding: 6px 12px; border-radius: 20px;
  font-size: 13px; font-weight: 700;
  transition: .2s; border: 1px solid transparent;
}
.cat-chip:hover { background: #cbd5e1; }
.cat-chip .rm-btn {
  cursor: pointer; color: #ef4444;
  font-size: 12px; padding: 2px;
  border-radius: 50%; transition: .2s;
}

/* ===== SWITCH (Dark Mode toggle) ===== */
.switch-wrap { display: flex; align-items: center; justify-content: space-between; }
.switch { position: relative; display: inline-block; width: 46px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,.2);
  border-radius: 34px; transition: .4s;
  border: 1px solid rgba(255,255,255,.3);
}
.slider::before {
  position: absolute; content: '';
  height: 18px; width: 18px;
  left: 3px; bottom: 3px;
  background: white; border-radius: 50%;
  transition: .4s; box-shadow: 0 0 5px rgba(0,0,0,.3);
}
input:checked + .slider { background: #7c3aed; border-color: #7c3aed; }
input:checked + .slider::before { transform: translateX(20px); }

/* ===== MODALS ===== */
.modal-ov {
  display: none; position: fixed; inset: 0;
  background: rgba(15,10,40,.6); z-index: 9999;
  align-items: center; justify-content: center;
  backdrop-filter: blur(4px); padding: 20px;
}
.modal-ov.show { display: flex; }
.modal {
  background: #fff; border-radius: 18px;
  padding: 22px; width: 94%; max-width: 440px;
  box-shadow: 0 24px 64px rgba(0,0,0,.3);
  max-height: 90vh; overflow-y: auto;
}
.modal-title {
  font-size: 15px; font-weight: 800;
  color: inherit; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}
.modal-foot { display: flex; gap: 8px; margin-top: 14px; }

/* ===== STOCK STATUS ===== */
.stock-low { color: #ea580c; font-weight: 700; }
.stock-out { color: #dc2626; font-weight: 700; }
.stock-ok  { color: #16a34a; font-weight: 700; }

/* ===== TOAST ===== */
.toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%) translateY(80px);
  background: #1e1b4b; color: #fff;
  padding: 12px 20px; border-radius: 12px;
  font-size: 13px; font-weight: 600;
  z-index: 99999; transition: .3s;
  opacity: 0; pointer-events: none;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
}
.toast.show   { transform: translateX(-50%) translateY(0); opacity: 1; }
.toast.success{ background: linear-gradient(135deg,#16a34a,#15803d); }
.toast.error  { background: linear-gradient(135deg,#dc2626,#b91c1c); }
.toast.info   { background: linear-gradient(135deg,#2563eb,#1d4ed8); }

/* ===== DANGER ZONE ===== */
.danger-zone {
  background: #fff5f5;
  border: 1.5px dashed #fca5a5;
  border-radius: 12px; padding: 14px;
  margin-top: 8px;
}

/* ===== COPYRIGHT CARD ===== */
.copyright-card {
  text-align: center;
  background: linear-gradient(135deg,#fff,#f8fafc);
  border-radius: 18px; padding: 28px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0,0,0,.04);
}

/* ===== REPORTS ===== */
#rep-stats {
  display: grid;
  /* FIX: نحذف بطاقة صافي الأرباح — 3 بطاقات فقط */
  grid-template-columns: repeat(3,1fr);
  gap: 12px;
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: #d8b4fe; border-radius: 10px; }
::-webkit-scrollbar-track { background: transparent; }

/* ===== PRINT ===== */
@media print {
  body > * { display: none; }
  #receipt-print-area { display: block !important; width: 80mm; font-family: monospace; font-size: 12px; padding: 10px; }
}
#receipt-print-area { display: none; }

/* ===== CANVAS ===== */
canvas { max-width: 100%; display: block; }

/* ============================================================
   RESPONSIVE — نسخة الهاتف
   ============================================================ */
@media (max-width: 768px) {

  body { font-size: 13px; }

  /* Sidebar مخفي بالكامل على الهاتف */
  .sidebar { display: none; }
  .main { padding-right: 0; }

  .topbar { padding: 8px 12px; }
  .topbar h1 { font-size: 14px; }

  .page { padding: 10px 10px 80px; gap: 10px; }

  /* --- DASHBOARD: بطاقتان × بطاقتان --- */
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
  }
  #dash-profit-row {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
  }

  /* عمودان على الهاتف */
  .two-col {
    grid-template-columns: 1fr !important;
    gap: 10px;
  }

  /* --- CASHIER: السلة تحت الكاميرا مباشرة --- */
  /* نعكس الترتيب: السلة أولاً، ثم البحث، ثم الملخص */
  #pg-cashier .two-col {
    display: flex !important;
    flex-direction: column !important;
  }
  /* اجعل السلة تظهر أعلى على الهاتف */
  #pg-cashier .two-col > .card.cart-wrap {
    order: -1;
    max-height: none;
    position: static;
  }
  #cart-list { max-height: 180px; }

  /* --- INVENTORY: جدول قابل للتمرير --- */
  .table-wrap { max-height: calc(100vh - 200px); }
  .inv-stats-row { grid-template-columns: repeat(2,1fr); }

  /* --- PRINT: بطاقتان جنباً إلى جنب --- */
  .print-grid { grid-template-columns: repeat(2,1fr) !important; gap: 6px; }

  /* --- TELECOM: بطاقتان × بطاقتان --- */
  .card-grid { grid-template-columns: repeat(2,1fr) !important; gap: 6px; }
  .op-grid   { grid-template-columns: repeat(3,1fr) !important; }

  /* بطاقات إحصائيات صغيرة */
  .stat-val { font-size: 15px; }
  .stat-icon { font-size: 20px; }

  /* فاتورة */
  .modal { padding: 16px; border-radius: 16px; }
  .frow  { grid-template-columns: 1fr !important; }
  .frow3 { grid-template-columns: 1fr !important; }
}

/* هاتف صغير جداً */
@media (max-width: 400px) {
  .stats-grid { grid-template-columns: 1fr 1fr !important; }
  .print-grid { grid-template-columns: 1fr 1fr !important; }
}

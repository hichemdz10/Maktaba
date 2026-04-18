// ── js/01_config.js ──
// ║  CONFIG                                                  ║
// ═══════════════════════════════════════════════════════════
var SB_URL='https://pdjurjkbqnmzpvocqkym.supabase.co';
var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanVyamticW5tenB2b2Nxa3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY4ODYsImV4cCI6MjA4OTY3Mjg4Nn0.A9gBsv9oH0C0IK9c2TKqJQEeUM-84HTl34wl2VqES8A';
var SB_KEY2='hch_v2';
var SETTINGS_KEY='hch_shop_settings_v4';
var HELD_CARTS_KEY='hch_held_carts';
var AUTO_SYNC_KEY='hch_autosync';
var INVOICE_KEY='hch_invoice_num';
var ACTIVE_CART_KEY='hch_active_cart';
var BUNDLES_KEY='hch_bundles';
window.addEventListener('beforeunload',function(e){if(cart&&cart.length>0){e.preventDefault();e.returnValue='لديك سلة غير مكتملة!';}});
var AUTH_USERS_KEY='hch_users_v1';
var AUTH_SESSION_KEY='hch_session_v1';

// ═══════════════════════════════════════════════════════════

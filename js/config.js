/* ============================================================
   js/config.js  —  ثوابت النظام
   ============================================================ */

'use strict';

/* مفاتيح Supabase */
var SB_URL  = 'https://pdjurjkbqnmzpvocqkym.supabase.co';
var SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanVyamticW5tenB2b2Nxa3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY4ODYsImV4cCI6MjA4OTY3Mjg4Nn0.A9gBsv9oH0C0IK9c2TKqJQEeUM-84HTl34wl2VqES8A';
var SB_KEY2 = 'hch_v2';

/* مفاتيح localStorage */
var DB_KEYS = {
  products    : 'hch_p',
  sales       : 'hch_s',
  printSales  : 'hch_ps',
  telecomSales: 'hch_ts',
  expenses    : 'hch_ex',
  clients     : 'hch_cl'
};
var SETTINGS_KEY    = 'hch_shop_settings_v4';
var HELD_CARTS_KEY  = 'hch_held_carts';
var AUTO_SYNC_KEY   = 'hch_autosync';

/* أنواع بطاقات الإنترنت الثابتة */
var CARD_TYPES = [
  { id:'idoom500',  name:'Idoom Fibre', val:'500',  price:500  },
  { id:'idoom1000', name:'Idoom Fibre', val:'1000', price:1000 },
  { id:'idoom2000', name:'Idoom Fibre', val:'2000', price:2000 },
  { id:'4g500',     name:'4G',          val:'500',  price:500  },
  { id:'4g1000',    name:'4G',          val:'1000', price:1000 },
  { id:'4g2000',    name:'4G',          val:'2000', price:2000 }
];

/* أيقونات الأقسام */
var CAT_ICONS = {
  'كراريس'          : '📓',
  'قرطاسية'         : '✏️',
  'كتب'             : '📚',
  'حقائب'           : '🎒',
  'أدوات رسم'       : '🎨',
  'إلكترونيات'      : '⚡',
  'ألعاب'           : '🧸',
  'عطور و هدايا'    : '🎁',
  'مستلزمات دينية'  : '☪️',
  'متنوع'           : '🗂️'
};

/* أيقونات وأسماء المصاريف */
var EXP_ICONS = {
  rent       : '🏠',
  supply     : '📦',
  electricity: '⚡',
  transport  : '🚗',
  salary     : '👷',
  maintenance: '🔧',
  other      : '🗂️'
};
var EXP_NAMES = {
  rent       : 'إيجار',
  supply     : 'بضاعة',
  electricity: 'كهرباء',
  transport  : 'مواصلات',
  salary     : 'رواتب',
  maintenance: 'صيانة',
  other      : 'متنوع'
};

/* معلومات الصفحات */
var PAGE_INFO = {
  dashboard : { title:'لوحة التحكم 🏠',       sub:'المركز الرئيسي لمتابعة أداء المكتبة'       },
  cashier   : { title:'الكاشيير 🛒',           sub:'نقطة البيع ومسح الباركود السريع'           },
  inventory : { title:'المخزون 📦',            sub:'إدارة المنتجات والكميات'                   },
  print     : { title:'الطباعة 🖨️',           sub:'تسجيل مبيعات الطباعة والتصوير'             },
  telecom   : { title:'خدمات الهاتف 📱',       sub:'فليكسي وبطاقات الإنترنت'                   },
  clients   : { title:'العملاء 👥',            sub:'إدارة دفتر الكريدي والديون'                },
  expenses  : { title:'المصاريف 💸',           sub:'تسجيل ومتابعة مصاريف المحل'               },
  reports   : { title:'التقارير 📊',           sub:'إحصائيات مفصلة عن أداء المكتبة'           },
  settings  : { title:'الإعدادات ⚙️',         sub:'تخصيص النظام والمحل'                       }
};

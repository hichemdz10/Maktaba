/* ============================================================
   js/state.js  —  الحالة المشتركة (متغيرات عالمية)
   ============================================================ */

'use strict';

/* قاعدة البيانات المحلية */
var db = {
  products     : [],
  sales        : [],
  printSales   : [],
  telecomSales : [],
  expenses     : [],
  clients      : []
};

/* السلة الحالية */
var cart = [];

/* السلات المعلّقة */
var heldCarts = [];

/* الباركود المعلّق (للمنتج الجديد) */
var pendingBC = '';

/* آخر فاتورة مكتملة (للطباعة السريعة) */
var lastSale = null;

/* الاختيارات الحالية في الطباعة / الهاتف */
var selPrint    = null;
var selOperator = null;
var selCard     = null;

/* الكاميرا والمسح */
var scanStream  = null;
var scanBuf     = '';
var scanTimer   = null;
var scanRAF     = null;
var scanCount   = 0;
var cameraActive = false;

/* السحابة */
var autoSync   = false;
var lastSyncTS = 0;

/* الشارتات */
var chartSalesInst = null;
var chartPieInst   = null;

/* الأقسام المؤقتة في الإعدادات */
var tempCategories = [];

/* الإعدادات الافتراضية */
var shopSettings = {
  name           : 'مكتبة حشايشي',
  address        : 'مركز صالح باي • الجزائر',
  phone          : '',
  lowStockAlert  : 5,
  receiptHeader  : 'مرحباً بكم في مكتبة حشايشي',
  receiptFooter  : 'البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام\nشكراً لزيارتكم!',
  flexyProfitLow : 10,
  flexyProfitHigh: 20,
  cardProfit     : 50,
  darkMode       : false,
  categories     : [
    'كراريس','قرطاسية','كتب','حقائب',
    'أدوات رسم','إلكترونيات','ألعاب',
    'عطور و هدايا','مستلزمات دينية','متنوع'
  ],
  dashLayout: {
    stats      : true,
    chart      : true,
    sales      : true,
    lowStock   : true,
    quickExp   : true,
    categories : true
  },
  printTypes: [
    { id:'bw',      name:'طباعة عادية',   icon:'🖨️', price:10  },
    { id:'color',   name:'طباعة ملونة',   icon:'🎨', price:30  },
    { id:'copy',    name:'تصوير عادي',    icon:'📄', price:10  },
    { id:'copy_c',  name:'تصوير ملون',    icon:'🖌️', price:30  },
    { id:'scan',    name:'مسح ضوئي',      icon:'🔍', price:50  },
    { id:'laminate',name:'تغليف',         icon:'✨', price:100 },
    { id:'photo',   name:'صور',           icon:'🖼️', price:100 },
    { id:'id_card', name:'بطاقة تعريف',  icon:'🪪', price:15  },
    { id:'binding', name:'تجليد',         icon:'📚', price:200 }
  ]
};

/* Audio Context للصوت */
var audioCtx = null;

// ── js/04_state.js ──
// ║  DATA & STATE                                            ║
// ═══════════════════════════════════════════════════════════
var CARD_TYPES=[{id:'idoom500',name:'Idoom Fibre',val:'500',price:500},{id:'idoom1000',name:'Idoom Fibre',val:'1000',price:1000},{id:'idoom2000',name:'Idoom Fibre',val:'2000',price:2000},{id:'4g500',name:'4G',val:'500',price:500},{id:'4g1000',name:'4G',val:'1000',price:1000},{id:'4g2000',name:'4G',val:'2000',price:2000}];
var CAT_ICONS={'كراريس':'📓','قرطاسية':'✏️','كتب':'📚','حقائب':'🎒','أدوات رسم':'🎨','إلكترونيات':'⚡','ألعاب':'🧸','عطور و هدايا':'🎁','مستلزمات دينية':'☪️','متنوع':'🗂️'};
var CAT_COLORS={'كراريس':'#f59e0b','قرطاسية':'#3b82f6','كتب':'#8b5cf6','حقائب':'#ec4899','أدوات رسم':'#10b981','إلكترونيات':'#06b6d4','ألعاب':'#f97316','عطور و هدايا':'#a855f7','مستلزمات دينية':'#16a34a','متنوع':'#6b7280'};
function getCatBg(cat){return CAT_COLORS[cat]||'#7c3aed';}
function renderProductIcon(p,size){
  size=size||32;
  if(p.image)return '<img src="'+p.image+'" style="width:'+size+'px;height:'+size+'px;border-radius:'+(size/4)+'px;object-fit:cover;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0" loading="lazy">';
  var icon=CAT_ICONS[p.category]||'📦';
  var bg=getCatBg(p.category);
  return '<div style="width:'+size+'px;height:'+size+'px;border-radius:'+(size/4)+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:'+(size*0.55)+'px;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.25)">'+icon+'</div>';
}
var EXP_ICONS={rent:'🏠',supply:'📦',electricity:'⚡',transport:'🚗',salary:'👷',maintenance:'🔧',other:'🗂️'};
var EXP_NAMES={rent:'إيجار',supply:'بضاعة',electricity:'كهرباء',transport:'مواصلات',salary:'رواتب',maintenance:'صيانة',other:'متنوع'};
var PAGE_INFO={dashboard:{title:'لوحة التحكم 🏠',sub:'المركز الرئيسي لمتابعة أداء المكتبة'},cashier:{title:'الكاشيير 🛒',sub:'نقطة البيع — F2 لتأكيد البيع'},inventory:{title:'المخزون 📦',sub:'إدارة المنتجات والكميات'},services:{title:'الخدمات ⚡',sub:'الطباعة والتصوير • الهاتف والبطاقات'},clients:{title:'العملاء 👥',sub:'إدارة دفتر الكريدي والديون'},expenses:{title:'المصاريف 💸',sub:'تسجيل ومتابعة مصاريف المحل'},
  purchases:{title:'الفواتير الداخلة 📥',sub:'فواتير الشراء من الموردين وتتبع الديون'},
  reports:{title:'التقارير 📊',sub:'إحصائيات مفصلة عن أداء المكتبة'},settings:{title:'الإعدادات ⚙️',sub:'تخصيص النظام والمحل'}};
var db={products:[],sales:[],returns:[],printSales:[],telecomSales:[],expenses:[],clients:[],purchases:[],stockLog:[],suppliers:[],supplierPayments:[],employees:[],activityLog:[]};
var cart=[],heldCarts=[],pendingBC='',lastSale=null;
var selPrint=null,selOperator=null,selCard=null;
var scanStream=null,scanBuf='',scanTimer=null,scanRAF=null,scanCount=0,cameraActive=false;
var invScanStream=null,invScanRAF=null,isPriceCheckCam=false;
var autoSync=false,lastSyncTS=0,tempCategories=[],audioCtx=null;
var invFilter='all',_repSalesCache=[];
var shopSettings={name:'مكتبة حشايشي',expiryAlert:30,receiptColor:'#7c3aed',receiptFontSize:13,receiptShowUnit:true,receiptShowChange:false,address:'مركز صالح باي • الجزائر',phone:'',lowStockAlert:5,receiptMode:'show',receiptHeader:'مرحباً بكم في مكتبة حشايشي',receiptFooter:'البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام\nشكراً لزيارتكم!',flexyProfitLow:10,flexyProfitHigh:20,cardProfit:50,darkMode:false,tvaRate:0,categories:['كراريس','قرطاسية','كتب','حقائب','أدوات رسم','إلكترونيات','ألعاب','عطور و هدايا','مستلزمات دينية','متنوع'],dashLayout:{stats:true,chart:true,sales:true,lowStock:true,quickExp:true,categories:true},printTypes:[{id:'bw',name:'طباعة عادية',icon:'🖨️',price:10},{id:'color',name:'طباعة ملونة',icon:'🎨',price:30},{id:'copy',name:'تصوير عادي',icon:'📄',price:10},{id:'copy_c',name:'تصوير ملون',icon:'🖌️',price:30},{id:'scan',name:'مسح ضوئي',icon:'🔍',price:50},{id:'laminate',name:'تغليف',icon:'✨',price:100},{id:'photo',name:'صور',icon:'🖼️',price:100},{id:'id_card',name:'بطاقة تعريف',icon:'🪪',price:15},{id:'binding',name:'تجليد',icon:'📚',price:200}],thermalWidth:58,thermalAutoCut:true,thermalCharset:'arabic',loyaltyEnabled:false,loyaltyRate:100,loyaltyValue:1,loyaltyMin:50};

// ═══════════════════════════════════════════════════════════

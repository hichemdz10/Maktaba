# Maktaba
Maktabat Hechaichi 
# مكتبة حشايشي — نظام نقطة البيع
## v3.5 Pro | by HECHAICHI HICHEM

---

## 📁 هيكل الملفات

```
hashishi-pos/
├── index.html          ← الصفحة الرئيسية (HTML كامل)
├── README.md
├── css/
│   └── style.css       ← كل التنسيقات (Desktop + Mobile)
└── js/
    ├── config.js       ← ثوابت النظام (Supabase, DB_KEYS...)
    ├── state.js        ← المتغيرات العالمية المشتركة
    ├── db.js           ← قراءة/كتابة localStorage + backup/CSV
    ├── cloud.js        ← مزامنة Supabase (push/pull/merge)
    ├── settings.js     ← إعدادات المحل وتخصيص النظام
    ├── ui.js           ← مساعدات UI (toast, modal, nav, beep...)
    ├── scanner.js      ← ليزر الباركود + كاميرا BarcodeDetector
    ├── cart.js         ← السلة + السلات المعلقة + البحث
    ├── products.js     ← إدارة المنتجات والمخزون
    ├── sales.js        ← إتمام البيع + الوصل + المرتجعات
    ├── print.js        ← خدمات الطباعة
    ├── telecom.js      ← فليكسي وبطاقات الإنترنت
    ├── clients.js      ← العملاء والديون
    ├── expenses.js     ← المصاريف + مصروف سريع
    ├── dashboard.js    ← لوحة التحكم + شارت أسبوعي
    ├── reports.js      ← التقارير + Bar Chart + Donut Chart
    └── main.js         ← نقطة الدخول (init)
```

---

## 🚀 الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🛒 كاشيير | مسح ليزر + كاميرا BarcodeDetector |
| 📦 مخزون | جدول احترافي مع تمرير عمودي وإحصائيات |
| 🖨️ طباعة | 9 أنواع خدمات قابلة للتخصيص |
| 📱 فليكسي | Djezzy / Mobilis / Ooredoo + بطاقات |
| 👥 عملاء | دفتر كريدي + كشف حساب + واتساب |
| 💸 مصاريف | فلتر شهري + مصروف سريع من الداشبورد |
| 📊 تقارير | Bar Chart + Donut Chart بـ Canvas |
| ☁️ سحابة | Supabase merge ثلاثي الاتجاه |
| 🌙 Dark Mode | وضع ليلي كامل |
| ⏱️ Hold Cart | تعليق الفاتورة لمحاسبة زبون آخر |
| 🔄 مرتجعات | إرجاع السلع وخصم المبلغ |

---

## 🔧 الإصلاحات في هذا الإصدار

- **FIX**: مشكلة الباركود المسجل يُعامَل كمنتج جديد → `findProductByBarcode()` موحّدة
- **FIX**: آخر منتج في السلة يظهر أعلى → `flex-direction: column-reverse`
- **FIX**: تمرير القائمة الجانبية عمودياً على Firefox/كمبيوتر قديم
- **FIX**: تمرير جدول المخزون عمودياً → `table-wrap` مع `max-height`
- **FIX**: شارت Donut احترافي بديلاً عن Pie البسيط
- **REMOVED**: بطاقة "صافي الأرباح عن الفترة" من التقارير والداشبورد
- **MOBILE**: بطاقتان × بطاقتان في الداشبورد
- **MOBILE**: السلة تحت الكاميرا مباشرة في الكاشيير

---

## 📋 متطلبات التشغيل

- متصفح: **Chrome** أو **Firefox** أو **Edge** (محدّث)
- الكاميرا: Chrome/Edge فقط (BarcodeDetector API)
- الليزر: يعمل على جميع المتصفحات

---

## ☁️ إعداد Supabase

```
URL : https://pdjurjkbqnmzpvocqkym.supabase.co
KEY : (موجود في config.js)
Table: app_data (key TEXT, value JSONB)
```

---

© 2026 HECHAICHI HICHEM — جميع الحقوق محفوظة

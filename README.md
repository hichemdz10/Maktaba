# 📚 مكتبة حشايشي — نظام نقطة البيع V7

## الاستخدام المباشر
افتح `index.html` على متصفح عبر سيرفر محلي:
```bash
# Python (الأسهل)
python3 -m http.server 8080
# ثم افتح: http://localhost:8080
```

## بناء ملف HTML واحد للنشر المستقل
```bash
python3 build.py
# الناتج: dist/pos_latest.html (يعمل بدون سيرفر)
```

## هيكل المشروع
```
├── index.html          ← الهيكل الرئيسي
├── css/
│   ├── 01_base.css
│   ├── 02_inventory.css
│   ├── 03_cashier.css
│   ├── 04_cashier_fullscreen.css
│   └── 05_dashboard_invoice.css
├── js/
│   ├── 01_config.js    → 30_extensions.js
│   └── ... (30 وحدة)
├── build.py            ← سكريبت البناء
└── dist/               ← ناتج البناء (لا ترفعه على GitHub)
```

## GitHub Pages
في إعدادات الـ repo:
**Settings → Pages → Source → Deploy from branch → main → / (root)**

## ملاحظة
- للتشغيل المباشر (file://) استخدم `dist/pos_latest.html`
- للتطوير والتعديل استخدم ملفات css/ و js/ المنفصلة

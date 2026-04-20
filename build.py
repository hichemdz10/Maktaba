#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════╗
║  POS Build Script — يجمع كل الملفات في HTML واحد ║
║  الاستخدام: python3 build.py                      ║
╚══════════════════════════════════════════════════╝
"""
import os, re
from datetime import datetime

ROOT     = os.path.dirname(os.path.abspath(__file__))
HTML_SH  = os.path.join(ROOT, 'index.html')
OUT_FILE = os.path.join(ROOT, 'dist', 'pos_latest.html')
CSS_DIR  = os.path.join(ROOT, 'css')
JS_DIR   = os.path.join(ROOT, 'js')

def read(path):
    with open(path, 'r', encoding='utf-8') as f: return f.read()

def read_dir(directory, ext):
    files = sorted(f for f in os.listdir(directory) if f.endswith(ext))
    sep = '/* ========== {f} ========== */' if ext=='.css' else '// ========== {f} =========='
    parts = []
    for fname in files:
        content = read(os.path.join(directory, fname))
        # ✅ إزالة وسوم HTML عشوائية تسربت للملفات أثناء الاستخراج
        content = re.sub(r'^\s*</?script[^>]*>\s*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*</?style[^>]*>\s*$',  '', content, flags=re.MULTILINE)
        # ✅ تأمين </script> داخل نصوص JS (يكسر محلل HTML)
        if ext == '.js':
            content = content.replace('</script>', r'<\/script>')
        if ext == '.css':
            content = content.replace('</style>', r'<\/style>')
        parts.append(sep.format(f=fname) + '\n' + content)
    return '\n'.join(parts)

def build():
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    shell   = read(HTML_SH)
    css_all = read_dir(CSS_DIR, '.css')
    js_all  = read_dir(JS_DIR,  '.js')
    shell = shell.replace('<!-- CSS MODULES -->', f'<style>\n{css_all}\n</style>')
    shell = re.sub(r'\s*<link rel="stylesheet" href="css/[^"]+">', '', shell)
    shell = shell.replace('<!-- JS MODULES -->', f'<script>\n{js_all}\n</script>')
    shell = re.sub(r'\s*<script src="js/[^"]+"></script>', '', shell)
    stamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    shell = shell.replace('<!-- BUILD_STAMP -->', f'<!-- Built: {stamp} -->')
    # تحقق: عدد <script> يجب أن يساوي </script>
    opens  = len(re.findall(r'<script(?:\s|>)', shell))
    closes = shell.count('</script>')
    with open(OUT_FILE, 'w', encoding='utf-8') as f: f.write(shell)
    size_kb = os.path.getsize(OUT_FILE)/1024
    lines   = shell.count('\n')
    print(f'✅ dist/pos_latest.html | {lines:,} lines | {size_kb:.0f} KB')
    if opens != closes:
        print(f'⚠️  تحذير: {opens} فتح script vs {closes} إغلاق — تحقق من ملفات JS')
    else:
        print(f'✅ وسوم script متوازنة ({opens} زوج)')

if __name__ == '__main__': build()

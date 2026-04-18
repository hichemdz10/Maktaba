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
        parts.append(sep.format(f=fname) + '\n' + read(os.path.join(directory, fname)))
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
    with open(OUT_FILE, 'w', encoding='utf-8') as f: f.write(shell)
    print(f'✅ dist/pos_latest.html | {shell.count(chr(10)):,} lines | {os.path.getsize(OUT_FILE)/1024:.0f} KB')

if __name__ == '__main__': build()

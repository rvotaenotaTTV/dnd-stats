# -*- coding: utf-8 -*-
"""
Скрипт: проверяет и добавляет отсутствующие CSS в oracle.html.
- .pace-grid / .pace-item (для блока «Темп карьеры»)
- .meme-line .meme (для мемов)
- .meta-rank.r4, .r5 (для меты топ-5)
"""

import os
import re
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ORACLE = os.path.join(BASE_DIR, 'oracle.html')

# ==================== НУЖНЫЕ CSS ====================
CSS_BLOCKS = {
    'pace_grid': {
        'check': '.pace-grid',
        'css': """    .pace-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
    .pace-item { background: linear-gradient(135deg, rgba(163,113,247,0.08), rgba(163,113,247,0.02)); border-radius: var(--radius-sm); padding: 12px 6px; text-align: center; border: 1px solid rgba(163,113,247,0.2); }
    .pace-icon { font-size: 1.3rem; margin-bottom: 4px; }
    .pace-value { font-size: 1.1rem; font-weight: 800; color: var(--gold); }
    .pace-label { font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

    @media (max-width: 768px) {
        .pace-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .pace-item { padding: 10px 4px; }
        .pace-icon { font-size: 1.1rem; }
        .pace-value { font-size: 0.95rem; }
        .pace-label { font-size: 0.55rem; }
    }

"""
    },
    'meme_class': {
        'check': '.meme-line .meme',
        'css': """    .meme-line .meme { color: #ec4899; font-weight: 700; }

"""
    },
    'meta_rank_r45': {
        'check': '.meta-rank.r4',
        'css': """    .meta-rank.r4, .meta-rank.r5 { background: var(--elevated); color: var(--muted); border: 1px solid var(--border); }

"""
    },
}

# Якорь — куда вставлять (перед .reading-progress)
ANCHOR = "    .reading-progress {"

# ==================== ФУНКЦИИ ====================
def backup(path):
    if not os.path.exists(path):
        return None
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    bak = f"{path}.{ts}.bak"
    shutil.copy2(path, bak)
    return bak

def main():
    print("=" * 60)
    print("🚀 CSS-фиксы для oracle.html")
    print("=" * 60)
    print(f"📁 Папка: {BASE_DIR}")
    print()

    if not os.path.exists(ORACLE):
        print(f"❌ Файл не найден: {ORACLE}")
        return

    with open(ORACLE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Проверяем якорь
    if ANCHOR not in content:
        print(f"❌ Якорь не найден: {ANCHOR}")
        print("   Скинь фрагмент <style> — поправлю скрипт.")
        return

    original_len = len(content)
    added = []
    skipped = []

    for name, block in CSS_BLOCKS.items():
        print(f"🔍 {name}")
        if block['check'] in content:
            print(f"   ⚠️  Уже есть — пропуск")
            skipped.append(name)
        else:
            content = content.replace(ANCHOR, block['css'] + ANCHOR, 1)
            print(f"   ✅ Добавлено")
            added.append(name)

    if not added:
        print()
        print("ℹ️  Все CSS уже на месте. Ничего не добавлено.")
        return

    # Бэкап + запись
    bak = backup(ORACLE)
    if bak:
        print(f"\n💾 Бэкап: {os.path.basename(bak)}")

    with open(ORACLE, 'w', encoding='utf-8') as f:
        f.write(content)

    print()
    print("=" * 60)
    print(f"🎉 Готово!")
    print(f"   ✅ Добавлено: {len(added)}")
    if added:
        for a in added:
            print(f"      · {a}")
    if skipped:
        print(f"   ⚠️  Пропущено (уже есть): {len(skipped)}")
        for s in skipped:
            print(f"      · {s}")
    print(f"   📏 Размер: {original_len} → {len(content)}")
    print()
    print("📌 Дальше:")
    print("   1. Открой oracle.html")
    print("   2. Ctrl+F5 (жёсткое обновление)")
    print("   3. Проверь блок «⚡ Темп карьеры» — 6 карточек в ряд")
    print("=" * 60)

if __name__ == '__main__':
    main()
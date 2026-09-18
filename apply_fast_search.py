# -*- coding: utf-8 -*-
"""
Скрипт быстрого поиска для oracle.html и player.html.
Делает резервные копии и заменяет 7 блоков кода.
"""

import os
import sys
import shutil
import re
from datetime import datetime

# ==================== ПУТИ ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ORACLE = os.path.join(BASE_DIR, 'oracle.html')
PLAYER = os.path.join(BASE_DIR, 'player.html')

# ==================== ЗАМЕНЫ ДЛЯ ORACLE ====================
ORACLE_REPLACEMENTS = [
    # 1. URL — jsdelivr + fallback
    (
        """const STATS_URL = 'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/stats_data.json';
const SEASON_BASE = 'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/seasons/season_';
const MAX_SEASONS = 15;""",
        """const STATS_URL = 'https://cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main/stats_data.json';
const SEASON_BASE = 'https://cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main/seasons/season_';
const STATS_URL_FALLBACK = 'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/stats_data.json';
const SEASON_BASE_FALLBACK = 'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/seasons/season_';
const MAX_SEASONS = 15;"""
    ),
    # 2. getSeasonData с fallback
    (
        """async function getSeasonData(n) {
    const KEY = 'eternis-oracle-season-' + n;
    const TTL = 10 * 60 * 1000;
    try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (c && (Date.now() - c.ts < TTL)) return c.data; } catch (e) {}
    const r = await fetch(`${SEASON_BASE}${n}.json`);
    if (!r.ok) throw new Error('404');
    const data = await r.json();
    try { sessionStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
    return data;
}""",
        """async function getSeasonData(n) {
    const KEY = 'eternis-oracle-season-' + n;
    const TTL = 10 * 60 * 1000;
    try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (c && (Date.now() - c.ts < TTL)) return c.data; } catch (e) {}
    let r = await fetch(`${SEASON_BASE}${n}.json`);
    if (!r.ok) r = await fetch(`${SEASON_BASE_FALLBACK}${n}.json`);
    if (!r.ok) throw new Error('404');
    const data = await r.json();
    try { sessionStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
    return data;
}"""
    ),
    # 3. loadAllSeasons — параллельно
    (
        """async function loadAllSeasons() {
    const seasons = [];
    for (let n = 0; n <= MAX_SEASONS; n++) {
        try { const d = await getSeasonData(n); seasons.push({ num: n, data: d, isCurrent: false }); }
        catch (e) { break; }
    }
    try {
        const r = await fetch(`${STATS_URL}?v=${Date.now()}`);
        const d = await r.json();
        seasons.push({ num: seasons.length, data: d, isCurrent: true });
    } catch (e) { console.error(e); }
    return seasons;
}""",
        """async function loadAllSeasons() {
    const archived = [];
    const promises = [];
    for (let n = 0; n <= MAX_SEASONS; n++) {
        promises.push(
            getSeasonData(n)
                .then(d => ({ num: n, data: d, isCurrent: false }))
                .catch(() => null)
        );
    }
    const results = await Promise.all(promises);
    results.forEach(r => { if (r) archived.push(r); });
    archived.sort((a, b) => a.num - b.num);

    let current = null;
    try {
        let r = await fetch(`${STATS_URL}?v=${Date.now()}`);
        if (!r.ok) r = await fetch(`${STATS_URL_FALLBACK}?v=${Date.now()}`);
        const d = await r.json();
        current = { num: archived.length, data: d, isCurrent: true };
    } catch (e) { console.error(e); }

    return current ? [...archived, current] : archived;
}"""
    ),
    # 4. preload
    (
        """(async function preload() {
    try { allSeasonsCache = await loadAllSeasons(); allPlayersCache = getAllPlayers(allSeasonsCache); }
    catch (e) { console.error(e); }
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (name) { document.getElementById('oracleSearch').value = name; setTimeout(() => analyzePlayer(), 300); }
})();""",
        """(async function preload() {
    // 1. Мгновенно — из localStorage
    try {
        const cached = JSON.parse(localStorage.getItem('eternis-oracle-players') || 'null');
        if (cached && cached.length > 0) {
            allPlayersCache = cached;
            console.log('Повествовательница: игроки из кеша —', cached.length);
        }
    } catch (e) {}

    // 2. Текущий сезон — быстро
    try {
        let r = await fetch(`${STATS_URL}?v=${Date.now()}`);
        if (!r.ok) r = await fetch(`${STATS_URL_FALLBACK}?v=${Date.now()}`);
        const d = await r.json();
        const currentPlayers = getAllPlayers([{ num: 0, data: d, isCurrent: true }]);
        const map = new Map();
        currentPlayers.forEach(p => map.set(p.display.toLowerCase(), p));
        if (allPlayersCache) {
            allPlayersCache.forEach(p => {
                if (!map.has(p.display.toLowerCase())) map.set(p.display.toLowerCase(), p);
            });
        }
        allPlayersCache = [...map.values()].sort((a, b) => a.display.localeCompare(b.display));
        console.log('Повествовательница: после текущего —', allPlayersCache.length);
    } catch (e) { console.error('Текущий:', e); }

    // 3. Фоновая догрузка
    loadAllSeasons().then(seasons => {
        allSeasonsCache = seasons;
        allPlayersCache = getAllPlayers(seasons);
        try {
            localStorage.setItem('eternis-oracle-players', JSON.stringify(allPlayersCache));
        } catch (e) {}
        console.log('Повествовательница: полная загрузка —', allPlayersCache.length);
    }).catch(e => console.error('Фон:', e));

    // 4. Автозапуск
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (name) {
        document.getElementById('oracleSearch').value = name;
        setTimeout(() => analyzePlayer(), 500);
    }
})();"""
    ),
    # 5. Debounce 150 → 50
    (
        """    }, 150);
});

searchInput.addEventListener('keydown', function(e) {""",
        """    }, 50);
});

searchInput.addEventListener('keydown', function(e) {"""
    ),
    # 6. Улучшение «Загрузка...»
    (
        """        if (!allPlayersCache) { autocompleteList.innerHTML = '<div class="autocomplete-empty">Загрузка...</div>'; autocompleteList.classList.add('show'); return; }""",
        """        if (!allPlayersCache || allPlayersCache.length === 0) { autocompleteList.innerHTML = '<div class="autocomplete-empty">⏳ Загрузка базы игроков...</div>'; autocompleteList.classList.add('show'); return; }"""
    ),
]

# ==================== ЗАМЕНЫ ДЛЯ PLAYER ====================
PLAYER_REPLACEMENTS = [
    # 1. getSeasonData URL
    (
        """        const r = await fetch(`https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/seasons/season_${n}.json`);
        if (!r.ok) throw new Error('404');""",
        """        let r = await fetch(`https://cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main/seasons/season_${n}.json`);
        if (!r.ok) r = await fetch(`https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/seasons/season_${n}.json`);
        if (!r.ok) throw new Error('404');"""
    ),
    # 2. loadData
    (
        """async function loadData() {
    const urls = [
        'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/stats_data.json',
        'https://cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main/stats_data.json'
    ];

    let currentData = null;
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                currentData = await response.json();
                break;
            }
        } catch (e) {
            console.warn('Failed to load from', url);
        }
    }
    if (!currentData) return false;

    dungeonPlayers = currentData.dungeon?.players || {};
    heroArchive = currentData.heroArchive || {};

    const playersMap = new Map();

    (currentData.players || []).forEach(p => {
        if (!p.display || p.name === 'Unknown') return;
        const key = p.display.toLowerCase();
        playersMap.set(key, {
            display: p.display,
            emoji: p.emoji || '⚔️',
            name: p.name || '',
            wins: p.wins || 0,
            losses: p.losses || 0,
            lastSeason: 'current',
            isActive: true
        });
    });

    for (let n = 0; n < 20; n++) {
        let data;
        try { data = await getSeasonData(n); }
        catch (e) { break; }

        (data.players || []).forEach(p => {
            if (!p.display || p.name === 'Unknown') return;
            const key = p.display.toLowerCase();
            if (!playersMap.has(key)) {
                playersMap.set(key, {
                    display: p.display,
                    emoji: p.emoji || '⚔️',
                    name: p.name || '',
                    wins: p.wins || 0,
                    losses: p.losses || 0,
                    lastSeason: n,
                    isActive: false
                });
            }
        });
    }

    allPlayers = [...playersMap.values()].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.display.localeCompare(b.display);
    });

    console.log('Профиль: игроков —', allPlayers.length);
    return true;
}""",
        """async function loadData() {
    // 1. Кеш из localStorage
    try {
        const cached = JSON.parse(localStorage.getItem('eternis-profile-players') || 'null');
        if (cached && cached.length > 0) {
            allPlayers = cached;
            console.log('Профиль: из кеша —', cached.length);
        }
    } catch (e) {}

    const urls = [
        'https://cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main/stats_data.json',
        'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/stats_data.json'
    ];

    let currentData = null;
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) { currentData = await response.json(); break; }
        } catch (e) {}
    }
    if (!currentData) return false;

    dungeonPlayers = currentData.dungeon?.players || {};
    heroArchive = currentData.heroArchive || {};

    const playersMap = new Map();
    (currentData.players || []).forEach(p => {
        if (!p.display || p.name === 'Unknown') return;
        const key = p.display.toLowerCase();
        playersMap.set(key, {
            display: p.display,
            emoji: p.emoji || '⚔️',
            name: p.name || '',
            wins: p.wins || 0,
            losses: p.losses || 0,
            lastSeason: 'current',
            isActive: true
        });
    });

    if (allPlayers) {
        allPlayers.forEach(p => {
            const key = p.display.toLowerCase();
            if (!playersMap.has(key)) playersMap.set(key, p);
        });
    }

    allPlayers = [...playersMap.values()].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.display.localeCompare(b.display);
    });

    console.log('Профиль: текущий —', allPlayers.length);

    // Фоновая догрузка архива
    (async () => {
        const archiveMap = new Map();
        allPlayers.forEach(p => archiveMap.set(p.display.toLowerCase(), p));
        for (let n = 0; n < 20; n++) {
            let data;
            try { data = await getSeasonData(n); }
            catch (e) { break; }
            (data.players || []).forEach(p => {
                if (!p.display || p.name === 'Unknown') return;
                const key = p.display.toLowerCase();
                if (!archiveMap.has(key)) {
                    archiveMap.set(key, {
                        display: p.display,
                        emoji: p.emoji || '⚔️',
                        name: p.name || '',
                        wins: p.wins || 0,
                        losses: p.losses || 0,
                        lastSeason: n,
                        isActive: false
                    });
                }
            });
        }
        allPlayers = [...archiveMap.values()].sort((a, b) => {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            return a.display.localeCompare(b.display);
        });
        try {
            localStorage.setItem('eternis-profile-players', JSON.stringify(allPlayers));
        } catch (e) {}
        console.log('Профиль: полный —', allPlayers.length);
    })();

    return true;
}"""
    ),
    # 3. filterPlayerList
    (
        """    const value = input.value.toLowerCase().trim();

    if (!value || !allPlayers.length) {
        dropdown.style.display = 'none';
        return;
    }""",
        """    const value = input.value.toLowerCase().trim();

    if (!value) {
        dropdown.style.display = 'none';
        return;
    }
    if (!allPlayers.length) {
        dropdown.innerHTML = '<div class="dropdown-item" style="text-align:center;color:var(--muted);">⏳ Загрузка базы игроков...</div>';
        dropdown.style.display = 'block';
        return;
    }"""
    ),
    # 4. filterCompareList
    (
        """    const value = input.value.toLowerCase().trim();
    if (!value || !allPlayers.length) {
        dropdown.style.display = 'none';
        return;
    }""",
        """    const value = input.value.toLowerCase().trim();
    if (!value) {
        dropdown.style.display = 'none';
        return;
    }
    if (!allPlayers.length) {
        dropdown.innerHTML = '<div class="dropdown-item" style="text-align:center;color:var(--muted);">⏳ Загрузка...</div>';
        dropdown.style.display = 'block';
        return;
    }"""
    ),
]

# ==================== ФУНКЦИИ ====================
def backup(path):
    """Создаёт резервную копию."""
    if not os.path.exists(path):
        return None
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    bak = f"{path}.{ts}.bak"
    shutil.copy2(path, bak)
    return bak

def apply_replacements(path, replacements, label):
    """Применяет замены к файлу."""
    if not os.path.exists(path):
        print(f"❌ Файл не найден: {path}")
        return False

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_len = len(content)
    applied = 0
    not_found = []

    for i, (old, new) in enumerate(replacements, 1):
        if old in content:
            content = content.replace(old, new, 1)
            applied += 1
            print(f"  ✅ Замена {i}/{len(replacements)} — ок")
        else:
            not_found.append(i)
            print(f"  ⚠️  Замена {i}/{len(replacements)} — НЕ НАЙДЕНО")
            # Показываем начало блока для отладки
            snippet = old.split('\n')[0][:80]
            print(f"      Искали: {snippet}...")

    if applied == 0:
        print(f"❌ {label}: ни одна замена не сработала. Файл не тронут.")
        return False

    # Резервная копия
    bak = backup(path)
    if bak:
        print(f"  💾 Бэкап: {os.path.basename(bak)}")

    # Запись
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ {label}: применено {applied}/{len(replacements)} замен")
    if not_found:
        print(f"   ⚠️  Не найдены блоки: {not_found}")
    print(f"   📏 Размер: {original_len} → {len(content)} символов")

    return applied > 0

def main():
    print("=" * 60)
    print("🚀 Скрипт быстрого поиска")
    print("=" * 60)
    print(f"📁 Папка: {BASE_DIR}")
    print()

    success = []

    # Oracle
    print("📄 ORACLE.HTML")
    print("-" * 60)
    if os.path.exists(ORACLE):
        if apply_replacements(ORACLE, ORACLE_REPLACEMENTS, "oracle.html"):
            success.append('oracle.html')
    else:
        print(f"❌ Не найден: {ORACLE}")
    print()

    # Player
    print("📄 PLAYER.HTML")
    print("-" * 60)
    if os.path.exists(PLAYER):
        if apply_replacements(PLAYER, PLAYER_REPLACEMENTS, "player.html"):
            success.append('player.html')
    else:
        print(f"❌ Не найден: {PLAYER}")
    print()

    print("=" * 60)
    if success:
        print(f"🎉 Успешно обработаны: {', '.join(success)}")
        print()
        print("📌 Дальше:")
        print("   1. Открой oracle.html / player.html в браузере")
        print("   2. Ctrl+F5 (жёсткое обновление)")
        print("   3. Начни писать ник — список должен появиться быстро")
        print()
        print("💡 Если что-то не так — верни файл из .bak")
    else:
        print("❌ Ничего не обработано")
        print()
        print("Проверь, что:")
        print("   1. Скрипт лежит в одной папке с oracle.html и player.html")
        print("   2. Файлы имеют кодировку UTF-8")
    print("=" * 60)

if __name__ == '__main__':
    main()
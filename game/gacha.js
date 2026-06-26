window.gacha = {
    pool: [], ready: false,
    collection: JSON.parse(localStorage.getItem('gachaCollection')) || [],
    recent: JSON.parse(localStorage.getItem('gachaRecent')) || [],
    filter: 'all',
    selected: new Set(),
    RARITY_ORDER: ['legendary','epic','rare','uncommon','common'],
    RARITY_LABELS: { legendary: 'ЛЕГЕНДАРНЫЙ', epic: 'Эпический', rare: 'Редкий', uncommon: 'Необычный', common: 'Обычный' },
    SELL_PRICES: { legendary: 50, epic: 20, rare: 8, uncommon: 3, common: 1 },
    CHEST_COSTS: { common: 10, rare: 50, epic: 200 },
    CHEST_LOOT: {
        common: [{ r: 'common', w: 3 }, { r: 'uncommon', w: 1 }],
        rare: [{ r: 'rare', w: 3 }, { r: 'epic', w: 1 }],
        epic: [{ r: 'epic', w: 3 }, { r: 'legendary', w: 1 }]
    },

    saveCollection() { localStorage.setItem('gachaCollection', JSON.stringify(this.collection)); },
    saveRecent() { localStorage.setItem('gachaRecent', JSON.stringify(this.recent)); },

    async loadPool() {
        try {
            const r = await fetch('https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/stats_data.json');
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const data = await r.json();
            const players = (data.players || []).filter(p => p.name && p.name !== 'Unknown');
            const pool = [];
            const seen = new Set();
            const add = (emoji, name, rarity, desc = '') => { const k = name + '|' + rarity; if (seen.has(k)) return; seen.add(k); pool.push({ emoji, name, rarity, desc }); };
            ['🦴','🍂','🍺','🕯️','🧦','🗑️','🍭','🍄','👟','📎'].forEach((e, i) => add(e, ['Кость','Лист','Кружка','Огарок','Носок','Мусор','Леденец','Гриб','Тапок','Скрепка'][i], 'common'));
            ['🧪','🛡️','✨','📜','💎','🔮','🗡️','🧿'].forEach((e, i) => add(e, ['Зелье','Благословение','Чудо','Свиток','Осколок','Кристалл','Кинжал','Амулет'][i], 'uncommon'));
            add('⚔️','Меч Аэлиона','rare'); add('🏹','Лук Следопыта','rare'); add('🪓','Топор Варвара','rare');
            add('🗡️','Клинок Тени','rare'); add('🛡️','Щит Паладина','rare'); add('💎','Двойной осколок','rare');
            ['🏰','🌑','🎭','🔥','🌫️','👑'].forEach((e, i) => add(e, ['Сияющий Шпиль','Эпицентр Раскола','Арена Тысячи Эхо','Кузня Расколотых','Зал Повествователя','Корона Раскола'][i], 'epic'));
            players.forEach(p => add(p.emoji || '⚔️', p.display, 'uncommon', p.name));
            players.filter(p => (p.wins || 0) + (p.losses || 0) >= 50).forEach(p => add(p.emoji || '⚔️', p.display, 'rare', p.name));
            [...players].sort((a, b) => (b.wins || 0) - (a.wins || 0)).slice(0, 15).forEach(p => add(p.emoji || '⚔️', p.display, 'epic', p.name));
            players.filter(p => p.tournamentWins > 0 || p.champion).forEach(p => add(p.emoji || '👑', p.display, 'legendary', p.name + ' | Чемпион'));
            add('🐼','ГуангГуанг','legendary','Трактирщик'); add('🔮','Осколок Клинка','legendary','Артефакт'); add('☀️','Солнечный Клинок','legendary','Восстановленный');
            add('🐱','Мурка','legendary','Хранительница таверны'); add('🐼','Джийонг','epic','Молчаливый помощник');
            this.pool = pool; this.ready = true;
            this.renderCollection(); this.renderRecent();
        } catch (e) {}
    },

    openChest(type) {
        if (!this.ready) return;
        if (window.tavernBalance < this.CHEST_COSTS[type]) { window.shakeBalance(); return; }
        window.tavernBalance -= this.CHEST_COSTS[type]; updateBalanceDisplay();
        const drops = [];
        this.CHEST_LOOT[type].forEach(({ r, w }) => { const p = this.pool.filter(x => x.rarity === r); for (let i = 0; i < w; i++) drops.push(p[Math.floor(Math.random() * p.length)]); });
        drops.forEach(d => this.collection.push({ ...d, time: Date.now() }));
        if (this.collection.length > 300) this.collection = this.collection.slice(-300);
        this.saveCollection();
        const best = [...drops].sort((a, b) => this.RARITY_ORDER.indexOf(a.rarity) - this.RARITY_ORDER.indexOf(b.rarity))[0];
        document.getElementById('gachaResultArea').innerHTML = `<div class="drop-card ${best.rarity}" style="background:var(--elevated);border-radius:20px;padding:30px;text-align:center;max-width:350px;margin:0 auto;border:3px solid var(--border)">
            <div style="font-size:4rem;margin-bottom:10px">${best.emoji}</div>
            <div style="font-size:1.3rem;font-weight:800;color:var(--gold);margin-bottom:4px">${best.name}</div>
            ${best.desc ? `<div style="color:var(--sub);font-size:0.8rem;margin-top:4px">${best.desc}</div>` : ''}
            <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-top:8px;color:${best.rarity==='legendary'?'#ffaa00':best.rarity==='epic'?'#c471ed':best.rarity==='rare'?'var(--blue)':best.rarity==='uncommon'?'#3fb950':'var(--muted)'}">${this.RARITY_LABELS[best.rarity]}</div>
            <div style="display:flex;gap:6px;justify-content:center;margin-top:12px">${drops.map(d => `<span style="font-size:1.5rem" title="${d.name}">${d.emoji}</span>`).join('')}</div></div>`;
        best.time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        this.recent.unshift(best); if (this.recent.length > 8) this.recent.pop(); this.saveRecent();
        if (best.rarity === 'legendary') { setQuote('🐼 БАМБУК ПОТРЯСЁН! ЛЕГЕНДАРКА!!!'); window.flashWin(); }
        else if (best.rarity === 'epic') { setQuote('✨ Эпик! ' + (window.GG_IN_EXPEDITION ? 'Мурка' : 'ГуангГуанг') + ' одобряет!'); window.flashWin(); }
        else if (best.rarity === 'rare') setQuote('👀 Ого, редкая штука!');
        else if (best.rarity === 'uncommon') setQuote('🙂 Неплохо, странник.');
        else setQuote('🗑️ Мусор... но ты заходи ещё!');
        this.renderCollection(); this.renderRecent();
    },

    setFilter(filter) { this.filter = filter; this.selected.clear(); this.renderCollection(); },

    getSelectedCount() { let c = 0; for (const key of this.selected) { const [name, rarity] = key.split('|'); for (const item of this.collection) if (item.name === name && item.rarity === rarity) c++; } return c; },

    renderCollection() {
        const grid = document.getElementById('gachaCollectionGrid'); if (!grid) return;
        let items = [...this.collection];
        if (this.filter !== 'all') items = items.filter(i => i.rarity === this.filter);
        const searchText = (document.getElementById('gachaSearch')?.value || '').toLowerCase();
        if (searchText) items = items.filter(i => i.name.toLowerCase().includes(searchText));
        const grouped = {}; items.forEach(i => { const k = i.name + '|' + i.rarity; if (!grouped[k]) grouped[k] = { ...i, count: 0 }; grouped[k].count++; });
        const uniqueItems = Object.values(grouped);
        const totalUnique = new Set(this.pool.map(p => p.name + '|' + p.rarity)).size;
        const collectedUnique = new Set(this.collection.map(i => i.name + '|' + i.rarity)).size;
        const pct = totalUnique > 0 ? (collectedUnique / totalUnique * 100) : 0;
        document.getElementById('gachaProgressText').textContent = collectedUnique + ' / ' + totalUnique;
        document.getElementById('gachaProgressFill').style.width = pct + '%';
        grid.innerHTML = uniqueItems.map(i => {
            const isSelected = this.selected.has(i.name + '|' + i.rarity);
            const borderColor = i.rarity === 'legendary' ? '#ffaa00' : i.rarity === 'epic' ? '#c471ed' : i.rarity === 'rare' ? 'var(--blue)' : i.rarity === 'uncommon' ? '#3fb950' : 'var(--border)';
            return `<div class="collection-item ${i.rarity} ${isSelected ? 'selected' : ''}" onclick="gacha.showModal('${i.name.replace(/'/g, "\\'")}','${i.rarity}')" style="background:var(--elevated);border-radius:12px;padding:10px 6px;text-align:center;border:2px solid ${borderColor};cursor:pointer;position:relative;min-height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;${isSelected?'box-shadow:0 0 16px rgba(240,185,11,0.5);transform:scale(1.05)':''}">
                <div style="font-size:1.6rem">${i.emoji}</div>
                <div style="font-size:0.55rem;color:var(--sub);line-height:1.2;text-align:center">${i.name.substring(0, 12)}</div>
                ${i.count > 1 ? `<div style="position:absolute;top:2px;right:4px;font-size:0.5rem;color:var(--muted);background:var(--bg);padding:1px 4px;border-radius:6px">×${i.count}</div>` : ''}
            </div>`;
        }).join('');
        const rc = this.getSelectedCount();
        const tradeBtn = document.getElementById('gachaTradeBtn'); if (tradeBtn) { tradeBtn.textContent = `🔄 (${rc}/5)`; tradeBtn.disabled = rc < 5; }
        const sellBtn = document.getElementById('gachaSellBtn'); if (sellBtn) { sellBtn.textContent = `💰 (${rc})`; sellBtn.disabled = rc === 0; }
    },

	showModal: function(name, rarity) {
		var items = this.collection.filter(function(i) { return i.name === name && i.rarity === rarity; });
		if (!items.length) return;
		var item = items[0], count = items.length, price = this.SELL_PRICES[rarity] || 1;
		var self = this;
		
		var old = document.querySelector('.modal-overlay');
		if (old) old.remove();
		
		var overlay = document.createElement('div');
		overlay.className = 'modal-overlay';
		overlay.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:rgba(0,0,0,0.85)!important;z-index:99999!important;display:flex!important;align-items:center!important;justify-content:center!important;';
		overlay.innerHTML = '<div class="modal-card ' + rarity + '">' +
			'<div class="drop-emoji">' + item.emoji + '</div>' +
			'<div class="drop-name">' + item.name + '</div>' +
			(item.desc ? '<div style="color:var(--sub);font-size:0.8rem;margin:4px 0">' + item.desc + '</div>' : '') +
			'<div class="drop-rarity rarity-' + rarity + '">' + self.RARITY_LABELS[rarity] + '</div>' +
			'<div style="color:var(--muted);font-size:0.8rem;margin:8px 0">В наличии: ' + count + ' шт.</div>' +
			'<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center">' +
				'<button class="btn btn-primary" style="flex:1;min-width:70px" id="modalSell1">💰 1 (' + price + '💎)</button>' +
				(count > 1 ? '<button class="btn btn-primary" style="flex:1;min-width:70px" id="modalSellAll">💰 Все (' + (price*count) + '💎)</button>' : '') +
				(rarity !== 'legendary' && count >= 5 ? '<button class="btn btn-secondary" style="flex:1;min-width:70px" id="modalTrade">🔄 5→1</button>' : '') +
				'<button class="btn btn-secondary" style="flex:1;min-width:70px" id="modalClose">Закрыть</button>' +
			'</div></div>';
		document.body.appendChild(overlay);
		
		document.getElementById('modalClose').onclick = function() { overlay.remove(); };
		document.getElementById('modalSell1').onclick = function() { self.sellItem(name, rarity, 1); overlay.remove(); };
		if (count > 1) document.getElementById('modalSellAll').onclick = function() { self.sellItem(name, rarity, count); overlay.remove(); };
		if (rarity !== 'legendary' && count >= 5) document.getElementById('modalTrade').onclick = function() { self.tradeSingle(name, rarity); overlay.remove(); };
		overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
	},

    sellItem(name, rarity, qty) {
        let sold = 0;
        for (let i = this.collection.length - 1; i >= 0; i--) { if (sold >= qty) break; if (this.collection[i].name === name && this.collection[i].rarity === rarity) { window.tavernBalance += this.SELL_PRICES[rarity] || 1; this.collection.splice(i, 1); sold++; } }
        this.saveCollection(); updateBalanceDisplay(); this.renderCollection();
        setQuote(`💰 Продано ×${sold} за ${(this.SELL_PRICES[rarity] || 1) * sold}💎`); window.flashWin();
    },

    tradeSingle(name, rarity) {
        const count = this.collection.filter(i => i.name === name && i.rarity === rarity).length;
        if (count < 5 || rarity === 'legendary') return;
        let removed = 0;
        for (let i = this.collection.length - 1; i >= 0; i--) { if (removed >= 5) break; if (this.collection[i].name === name && this.collection[i].rarity === rarity) { this.collection.splice(i, 1); removed++; } }
        const nextRarity = { common: 'uncommon', uncommon: 'rare', rare: 'epic', epic: 'legendary' }[rarity];
        const pool = this.pool.filter(p => p.rarity === nextRarity);
        const reward = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { emoji: '✨', name: 'Случайный апгрейд', rarity: nextRarity };
        this.collection.push({ ...reward, time: Date.now() }); this.saveCollection();
        document.getElementById('gachaResultArea').innerHTML = `<div class="drop-card ${reward.rarity}" style="background:var(--elevated);border-radius:20px;padding:30px;text-align:center;max-width:350px;margin:0 auto;border:3px solid var(--border)"><div style="color:var(--muted);font-size:0.7rem;margin-bottom:8px">🔄 5×${name} →</div><div style="font-size:4rem;margin-bottom:10px">${reward.emoji}</div><div style="font-size:1.3rem;font-weight:800;color:var(--gold);margin-bottom:4px">${reward.name}</div></div>`;
        this.renderCollection(); setQuote(`🔄 Обмен! +${reward.emoji} ${reward.name}`); window.flashWin();
    },

    sellSelected() {
        if (this.selected.size === 0) return;
        let total = 0; const toRemove = [];
        for (const key of this.selected) { const [name, rarity] = key.split('|'); for (let i = this.collection.length - 1; i >= 0; i--) { if (this.collection[i].name === name && this.collection[i].rarity === rarity) { total += this.SELL_PRICES[rarity] || 1; toRemove.push(i); } } }
        toRemove.sort((a, b) => b - a).forEach(i => this.collection.splice(i, 1));
        this.selected.clear(); this.saveCollection();
        window.tavernBalance += total; updateBalanceDisplay(); this.renderCollection();
        setQuote(`💰 Продано за ${total}💎`); window.flashWin();
    },

    tradeUp() {
        if (this.selected.size === 0) return;
        const rc = this.getSelectedCount(); if (rc < 5) return;
        const firstKey = [...this.selected][0]; const rarity = firstKey.split('|')[1]; if (rarity === 'legendary') return;
        let removed = 0;
        for (const key of this.selected) { const [name, rarity] = key.split('|'); for (let i = this.collection.length - 1; i >= 0; i--) { if (removed >= 5) break; if (this.collection[i].name === name && this.collection[i].rarity === rarity) { this.collection.splice(i, 1); removed++; } } }
        this.selected.clear();
        const nextRarity = { common: 'uncommon', uncommon: 'rare', rare: 'epic', epic: 'legendary' }[rarity];
        const pool = this.pool.filter(p => p.rarity === nextRarity);
        const reward = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { emoji: '✨', name: 'Случайный апгрейд', rarity: nextRarity };
        this.collection.push({ ...reward, time: Date.now() }); this.saveCollection();
        document.getElementById('gachaResultArea').innerHTML = `<div class="drop-card ${reward.rarity}" style="background:var(--elevated);border-radius:20px;padding:30px;text-align:center;max-width:350px;margin:0 auto;border:3px solid var(--border)"><div style="color:var(--muted);font-size:0.7rem;margin-bottom:8px">🔄 ОБМЕН 5→1</div><div style="font-size:4rem;margin-bottom:10px">${reward.emoji}</div><div style="font-size:1.3rem;font-weight:800;color:var(--gold);margin-bottom:4px">${reward.name}</div></div>`;
        this.renderCollection(); setQuote(`🔄 Обмен! +${reward.emoji} ${reward.name}`); window.flashWin();
    },

    renderRecent() {
        const list = document.getElementById('gachaRecentList'); if (!list) return;
        if (!this.recent.length) { list.innerHTML = '<span style="color:var(--muted)">Пока ничего...</span>'; return; }
        list.innerHTML = this.recent.map(d => `<div style="color:var(--sub);font-size:0.72rem;padding:2px 0"><span style="color:${d.rarity==='legendary'?'#ffaa00':d.rarity==='epic'?'#c471ed':d.rarity==='rare'?'var(--blue)':d.rarity==='uncommon'?'#3fb950':'var(--muted)'}">${d.emoji} ${d.name}</span> <span style="color:var(--muted)">${d.time||''}</span></div>`).join('');
    },

    render(container) {
        container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">
            <div style="text-align:center;margin-bottom:12px;font-size:0.85rem;color:var(--sub)">Баланс: <span style="color:var(--gold);font-weight:700" id="balanceTop">💎 ${window.tavernBalance}</span></div>
            <div class="chest-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
                <div onclick="gacha.openChest('common')" style="background:var(--elevated);border:2px solid #888;border-radius:10px;padding:16px 10px;text-align:center;cursor:pointer"><div style="font-size:2.5rem">🟢</div><div style="font-weight:700;color:var(--text);margin-bottom:2px;font-size:0.85rem">Обычный</div><div style="color:var(--gold);font-weight:700;font-size:0.8rem">10 💎</div><div style="color:var(--muted);font-size:0.65rem;margin-top:2px">Обычные и необычные</div></div>
                <div onclick="gacha.openChest('rare')" style="background:var(--elevated);border:2px solid var(--blue);border-radius:10px;padding:16px 10px;text-align:center;cursor:pointer"><div style="font-size:2.5rem">🔵</div><div style="font-weight:700;color:var(--text);margin-bottom:2px;font-size:0.85rem">Редкий</div><div style="color:var(--gold);font-weight:700;font-size:0.8rem">50 💎</div><div style="color:var(--muted);font-size:0.65rem;margin-top:2px">Редкие+ · 25% эпик</div></div>
                <div onclick="gacha.openChest('epic')" style="background:var(--elevated);border:2px solid #c471ed;border-radius:10px;padding:16px 10px;text-align:center;cursor:pointer"><div style="font-size:2.5rem">🟣</div><div style="font-weight:700;color:var(--text);margin-bottom:2px;font-size:0.85rem">Эпический</div><div style="color:var(--gold);font-weight:700;font-size:0.8rem">200 💎</div><div style="color:var(--muted);font-size:0.65rem;margin-top:2px">Эпик+ · 15% легендарка</div></div>
            </div>
            <div id="gachaResultArea" style="min-height:200px;display:flex;align-items:center;justify-content:center;margin:20px 0"><div style="color:var(--muted);text-align:center">Выбери сундук, странник...</div></div>
            <div style="margin-top:16px;padding:10px;background:var(--card);border-radius:12px;border:1px solid var(--border);max-height:120px;overflow-y:auto"><h4 style="color:var(--muted);font-size:0.75rem;margin-bottom:6px">📋 Последние дропы</h4><div id="gachaRecentList" style="color:var(--muted)">Пока ничего...</div></div>
            <div style="margin-top:20px">
                <div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--sub)"><span>📦 Коллекция</span><span id="gachaProgressText">0 / 0</span></div><div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden"><div id="gachaProgressFill" style="height:100%;background:var(--gold);border-radius:3px;width:0%"></div></div></div>
                <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
                    <input type="text" class="search-input" id="gachaSearch" placeholder="🔍 Поиск..." oninput="gacha.renderCollection()" style="padding:6px 12px;background:var(--elevated);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:0.8rem;font-family:inherit;flex:1;min-width:120px">
                    <button class="btn btn-secondary" id="gachaTradeBtn" onclick="gacha.tradeUp()" disabled style="font-size:0.75rem">🔄 (0/5)</button>
                    <button class="btn btn-secondary" id="gachaSellBtn" onclick="gacha.sellSelected()" disabled style="font-size:0.75rem">💰 (0)</button>
                </div>
                <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap" id="gachaFilters">
                    <button class="filter-btn active" onclick="gacha.setFilter('all')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--elevated);color:var(--sub);cursor:pointer;font-size:0.7rem;font-family:inherit">Все</button>
                    <button class="filter-btn" onclick="gacha.setFilter('legendary')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--elevated);color:var(--sub);cursor:pointer;font-size:0.7rem;font-family:inherit">👑</button>
                    <button class="filter-btn" onclick="gacha.setFilter('epic')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--elevated);color:var(--sub);cursor:pointer;font-size:0.7rem;font-family:inherit">🟣</button>
                    <button class="filter-btn" onclick="gacha.setFilter('rare')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--elevated);color:var(--sub);cursor:pointer;font-size:0.7rem;font-family:inherit">🔵</button>
                    <button class="filter-btn" onclick="gacha.setFilter('uncommon')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--elevated);color:var(--sub);cursor:pointer;font-size:0.7rem;font-family:inherit">🟢</button>
                    <button class="filter-btn" onclick="gacha.setFilter('common')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--elevated);color:var(--sub);cursor:pointer;font-size:0.7rem;font-family:inherit">⚪</button>
                </div>
                <div id="gachaCollectionGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px;max-height:400px;overflow-y:auto;padding:2px"></div>
            </div>
            <div style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="goMenu()" style="color:var(--muted);font-size:0.8rem;text-decoration:none">← В таверну</a></div>
        </div>`
        this.loadPool();
        setTimeout(() => {
            document.querySelectorAll('#gachaFilters .filter-btn').forEach((b, i) => {
                b.onclick = () => {
                    document.querySelectorAll('#gachaFilters .filter-btn').forEach(x => x.classList.remove('active'));
                    b.classList.add('active');
                    gacha.setFilter(['all','legendary','epic','rare','uncommon','common'][i]);
                };
            });
        }, 100);
    },

    destroy() {}
}
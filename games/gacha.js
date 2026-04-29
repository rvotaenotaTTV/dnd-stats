// gacha.js — игра «Крутки Раскола»
window.games = window.games || {};

window.games.gacha = {
    itemPool: [],
    isReady: false,
    collection: JSON.parse(localStorage.getItem('gachaCollection')) || [],
    recentDrops: JSON.parse(localStorage.getItem('gachaRecent')) || [],

    async init() {
        document.getElementById('gachaResultArea').innerHTML = '<div style="color:var(--text-muted);text-align:center;">Данные загружаются...</div>';
        try {
            const data = await this.loadData();
            this.itemPool = await this.buildPool(data);
            this.isReady = true;
            document.getElementById('gachaResultArea').innerHTML = '<div style="color:var(--text-muted);text-align:center;">Нажми на крутку, странник...</div>';
        } catch {
            document.getElementById('gachaResultArea').innerHTML = '<div style="color:var(--red);text-align:center;">❌ Не удалось загрузить данные</div>';
        }
        this.renderCollection();
        this.renderRecent();
    },

    async loadData() {
        const urls = [
            'https://raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main/stats_data.json',
            'https://cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main/stats_data.json'
        ];
        for (const url of urls) {
            try {
                const r = await fetch(url);
                if (r.ok) return await r.json();
            } catch {}
        }
        throw new Error('No data source');
    },

    async buildPool(data) {
        const players = data.players.filter(p => p.name && p.name !== 'Unknown');
        const pool = [];
        const seen = new Set();

        const addUnique = item => {
            if (seen.has(item.name)) return;
            seen.add(item.name);
            pool.push(item);
        };

        const junk = [
            { emoji: '🦴', name: 'Кость', rarity: 'common' },
            { emoji: '🍂', name: 'Лист', rarity: 'common' },
            { emoji: '🍺', name: 'Кружка ГуангГуанга', rarity: 'common' },
            { emoji: '🕯️', name: 'Огарок свечи', rarity: 'common' },
            { emoji: '🧦', name: 'Носок', rarity: 'common' },
            { emoji: '🗑️', name: 'Мусор', rarity: 'common' },
            { emoji: '🪵', name: 'Палка', rarity: 'common' },
            { emoji: '🍄', name: 'Гриб', rarity: 'common' },
        ];
        junk.forEach(item => { for (let i = 0; i < 15; i++) addUnique(item); });

        const uncommon = [
            { emoji: '🧪', name: 'Зелье силы', rarity: 'uncommon' },
            { emoji: '🛡️', name: 'Благословение', rarity: 'uncommon' },
            { emoji: '✨', name: 'Чудо', rarity: 'uncommon' },
            { emoji: '📜', name: 'Свиток', rarity: 'uncommon' },
            { emoji: '💎', name: 'Осколок', rarity: 'uncommon' },
            { emoji: '🔮', name: 'Кристалл', rarity: 'uncommon' },
            { emoji: '🗡️', name: 'Кинжал', rarity: 'uncommon' },
            { emoji: '🧿', name: 'Амулет', rarity: 'uncommon' },
        ];
        uncommon.forEach(item => { for (let i = 0; i < 6; i++) addUnique(item); });

        const rare = [
            { emoji: '⚔️', name: 'Меч Аэлиона', rarity: 'rare' },
            { emoji: '🏹', name: 'Лук Следопыта', rarity: 'rare' },
            { emoji: '🪓', name: 'Топор Варвара', rarity: 'rare' },
            { emoji: '🗡️', name: 'Клинок Тени', rarity: 'rare' },
            { emoji: '🛡️', name: 'Щит Паладина', rarity: 'rare' },
            { emoji: '💎', name: 'Двойной осколок', rarity: 'rare' },
        ];
        rare.forEach(item => { for (let i = 0; i < 3; i++) addUnique(item); });

        const epic = [
            { emoji: '🏰', name: 'Сияющий Шпиль', rarity: 'epic' },
            { emoji: '🌑', name: 'Эпицентр Раскола', rarity: 'epic' },
            { emoji: '🎭', name: 'Арена Тысячи Эхо', rarity: 'epic' },
            { emoji: '🔥', name: 'Кузня Расколотых', rarity: 'epic' },
            { emoji: '🌫️', name: 'Зал Повествователя', rarity: 'epic' },
            { emoji: '👑', name: 'Корона Раскола', rarity: 'epic' },
        ];
        epic.forEach(item => addUnique(item));

        const top10 = players.sort((a, b) => (b.wins || 0) - (a.wins || 0)).slice(0, 10);
        top10.forEach(p => addUnique({ emoji: p.emoji || '⚔️', name: p.display, rarity: 'epic', desc: p.name }));

        const legendary = [
            { emoji: '🐼', name: 'ГуангГуанг', rarity: 'legendary', desc: 'Трактирщик' },
            { emoji: '🔮', name: 'Осколок Клинка', rarity: 'legendary' },
            { emoji: '☀️', name: 'Солнечный Клинок', rarity: 'legendary', desc: 'Артефакт' },
        ];
        legendary.forEach(item => addUnique(item));

        const champions = players.filter(p => p.tournamentWins > 0 || p.champion);
        champions.forEach(p => addUnique({ emoji: p.emoji || '👑', name: p.display, rarity: 'legendary', desc: p.name + ' | Чемпион' }));

        return pool;
    },

    pull(count) {
        if (!this.isReady) { setQuote('Данные ещё грузятся, не спеши...'); return; }
        const cost = count === 10 ? 90 : 10;
        if (balance < cost) { setQuote('Недостаточно осколков!'); return; }
        balance -= cost;
        updateBalance();

        const area = document.getElementById('gachaResultArea');
        area.innerHTML = '<div class="spin-animation" style="text-align:center;font-size:3rem;">🎰</div>';

        setTimeout(() => {
            const drops = [];
            for (let i = 0; i < count; i++) drops.push(this.itemPool[Math.floor(Math.random() * this.itemPool.length)]);

            const rank = r => ['legendary', 'epic', 'rare', 'uncommon', 'common'].indexOf(r.rarity);
            const best = drops.reduce((a, b) => rank(a) < rank(b) ? a : b);

            drops.forEach(d => this.collection.push(d));
            if (this.collection.length > 200) {
                this.collection = this.collection.slice(-200);
                setQuote('📦 Коллекция переполнена! Старые предметы удалены.');
            }
            localStorage.setItem('gachaCollection', JSON.stringify(this.collection));

            best.time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            this.recentDrops.unshift(best);
            if (this.recentDrops.length > 5) this.recentDrops.pop();
            localStorage.setItem('gachaRecent', JSON.stringify(this.recentDrops));

            const rarityLabel = best.rarity === 'legendary' ? 'ЛЕГЕНДАРНЫЙ' : best.rarity === 'epic' ? 'Эпический' : best.rarity === 'rare' ? 'Редкий' : best.rarity === 'uncommon' ? 'Необычный' : 'Обычный';

            area.innerHTML = `
                <div class="drop-card ${best.rarity}">
                    <div class="drop-emoji">${best.emoji}</div>
                    <div class="drop-name">${best.name}</div>
                    ${best.desc ? `<div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${best.desc}</div>` : ''}
                    <div class="drop-rarity rarity-${best.rarity}">${rarityLabel}</div>
                    ${count > 1 ? `<div style="color:var(--text-muted);font-size:0.75rem;margin-top:8px;">+ ещё ${count - 1} предметов</div>` : ''}
                </div>
            `;

            if (best.rarity === 'legendary') setQuote('🐼 БАМБУК ПОТРЯСЁН! ЛЕГЕНДАРКА!!!');
            else if (best.rarity === 'epic') setQuote('✨ Эпик! ГуангГуанг одобряет!');
            else if (best.rarity === 'rare') setQuote('👀 Ого, редкая штука!');
            else if (best.rarity === 'uncommon') setQuote('🙂 Неплохо, странник.');
            else setQuote('🗑️ Мусор... но ты заходи ещё!');

            this.renderCollection();
            this.renderRecent();
        }, 800);
    },

    renderCollection() {
        const grid = document.getElementById('gachaCollectionGrid');
        const count = document.getElementById('gachaCollectionCount');
        if (!grid || !count) return;
        count.textContent = this.collection.length;
        const recent = this.collection.slice(-40).reverse();
        grid.innerHTML = recent.map((item, idx) => {
            const actualIdx = this.collection.length - 1 - idx;
            const rarityColor = item.rarity === 'legendary' ? '#ffaa00' : item.rarity === 'epic' ? '#c471ed' : item.rarity === 'rare' ? '#4a90d9' : item.rarity === 'uncommon' ? '#3fb950' : 'var(--text-muted)';
            return `<div class="collection-item" style="border-color:${rarityColor};" title="${item.name}" onclick="games.gacha.showItem(${actualIdx})">${item.emoji}</div>`;
        }).join('');
    },

    renderRecent() {
        const list = document.getElementById('gachaRecentList');
        if (!list) return;
        if (!this.recentDrops.length) {
            list.innerHTML = '<span style="color:var(--text-muted);">Пока ничего...</span>';
            return;
        }
        const colors = { legendary: '#ffaa00', epic: '#c471ed', rare: '#4a90d9', uncommon: '#3fb950', common: 'var(--text-muted)' };
        list.innerHTML = this.recentDrops.map(d =>
            `<div class="recent-item"><span style="color:${colors[d.rarity] || 'var(--text-muted)'};">${d.emoji} ${d.name}</span> <span style="color:var(--text-muted);">${d.time || ''}</span></div>`
        ).join('');
    },

    showItem(index) {
        const item = this.collection[index];
        if (!item) return;
        const rarityLabel = item.rarity === 'legendary' ? 'ЛЕГЕНДАРНЫЙ' : item.rarity === 'epic' ? 'Эпический' : item.rarity === 'rare' ? 'Редкий' : item.rarity === 'uncommon' ? 'Необычный' : 'Обычный';
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="modal-card ${item.rarity}">
                <div class="drop-emoji">${item.emoji}</div>
                <div class="drop-name">${item.name}</div>
                ${item.desc ? `<div style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">${item.desc}</div>` : ''}
                <div class="drop-rarity rarity-${item.rarity}">${rarityLabel}</div>
                <button class="btn btn-primary" style="margin-top:16px;" onclick="this.parentElement.parentElement.remove()">Закрыть</button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    newGame() {
        if (antiSpam() || balance < 10) {
            if (balance < 10) setQuote('Недостаточно осколков! Минимум 10💎');
            return;
        }
        this.init();
        setQuote('🎰 Крути, странник!');
    }
};
window.pig = {
    deck: [], drawnCards: [], active: false, bet: 5, multiplier: 1,
    suits: ['♥','♦','♠','♣'], values: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
    history: JSON.parse(localStorage.getItem('pigHistory')) || [],

    createDeck() {
        const d = [];
        for (const s of this.suits) for (const v of this.values) d.push({ suit: s, value: v, index: d.length });
        return d.sort(() => Math.random() - 0.5);
    },
	renderCard(c, back) {
		if (back) return `<div class="card-back" style="width:78px;height:110px;border-radius:10px;border:3px solid #666;box-shadow:0 4px 0 #444;display:inline-block;margin:2px;overflow:hidden"><img src="game/card-back.png" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.parentElement.style.background='#444';this.style.display='none'"></div>`;
		const suits = { '♥': 'red', '♦': 'red', '♠': 'black', '♣': 'black' };
		const cls = suits[c.suit] || 'black';
		const collection = window.getGachaCollection ? window.getGachaCollection() : [];
		let emoji = c.suit, name = c.value + c.suit, rarity = 'common', borderColor = '#888';
		if (collection.length > 0) {
			const idx = (c.index != null) ? c.index % collection.length : Math.floor(Math.random() * collection.length);
			const item = collection[idx];
			emoji = item.emoji; name = item.name; rarity = item.rarity || 'common';
			const rc = { legendary: '#ffaa00', epic: '#c471ed', rare: '#4a90d9', uncommon: '#3fb950', common: '#888' };
			borderColor = rc[rarity] || '#888';
		} else {
			const fb = ['🐼','👑','⚔️','🔮','💀','✨','🛡️','🗡️','🌿','🧔'];
			emoji = fb[(c.index || 0) % fb.length];
		}
		return `<div style="width:78px;height:110px;background:linear-gradient(160deg,#fff,#e8e8e8);border-radius:10px;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:4px;border:3px solid ${borderColor};box-shadow:0 4px 0 #666;vertical-align:top;margin:2px">
			<span style="position:absolute;top:3px;left:5px;font-size:12px;font-weight:800;color:${cls==='red'?'#c0392b':'#1a1a2e'}">${c.value}${c.suit}</span>
			<span style="font-size:22px">${emoji}</span>
			<span style="font-size:7px;color:#333;text-align:center;max-width:66px">${name}</span>
			<span style="position:absolute;bottom:3px;right:5px;font-size:12px;font-weight:800;transform:rotate(180deg);color:${cls==='red'?'#c0392b':'#1a1a2e'}">${c.value}${c.suit}</span></div>`;
	},
    addHistory(text, amount) {
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        this.history.unshift({ text, amount, time });
        if (this.history.length > 8) this.history.pop();
        localStorage.setItem('pigHistory', JSON.stringify(this.history));
        this.renderHistory();
    },
    renderHistory() {
        const box = document.getElementById('historyBox');
        if (!box) return;
        if (!this.history.length) { box.innerHTML = '<div style="color:var(--muted);font-size:0.72rem;padding:3px 0">История...</div>'; return; }
        box.innerHTML = this.history.map(h => `<div style="color:var(--sub);font-size:0.72rem;padding:3px 0;border-bottom:1px solid var(--border)">${h.time} — ${h.text} ${h.amount > 0 ? '+' : ''}${h.amount} 💎</div>`).join('');
    },
    start() {
        if (window.tavernBalance < this.bet) return;
        window.tavernBalance -= this.bet; updateBalanceDisplay();
        this.deck = this.createDeck(); this.drawnCards = []; this.multiplier = 1; this.active = true;
        document.getElementById('pigStartBtn').disabled = true;
        document.getElementById('pigDrawBtn').disabled = false;
        document.getElementById('pigStopBtn').disabled = false;
        document.getElementById('drawnCards').innerHTML = '';
        document.getElementById('multiplier').textContent = 'x1';
        document.getElementById('nextMultiplier').textContent = 'x2';
        setQuote('🐷 Новая игра! Тяни карту!');
    },
    draw() {
        if (!this.active) return;
        const card = this.deck.pop(); if (!card) return;
        this.drawnCards.push(card);
        const suits = this.drawnCards.map(c => c.suit);
        const dupSuit = suits.length !== new Set(suits).size;
        document.getElementById('drawnCards').innerHTML = this.drawnCards.map(c => this.renderCard(c)).join('');
        if (dupSuit) {
            this.active = false;
            document.getElementById('pigStartBtn').disabled = false;
            document.getElementById('pigDrawBtn').disabled = true;
            document.getElementById('pigStopBtn').disabled = true;
            const cards = document.querySelectorAll('#drawnCards .poker-card');
            if (cards.length) cards[cards.length - 1].style.borderColor = 'var(--red)';
            setQuote(`💔 Повтор масти! -${this.bet} 💎`);
            window.shakeBalance();
            this.addHistory('Проигрыш', -this.bet);
        } else {
            this.multiplier++;
            document.getElementById('multiplier').textContent = 'x' + this.multiplier;
            document.getElementById('nextMultiplier').textContent = 'x' + (this.multiplier + 1);
            setQuote(`Множитель x${this.multiplier}. Ещё?`);
            if (this.drawnCards.length === 4) this.stop(true);
        }
    },
    stop(bonus = false) {
        if (!this.active) return;
        this.active = false;
        document.getElementById('pigStartBtn').disabled = false;
        document.getElementById('pigDrawBtn').disabled = true;
        document.getElementById('pigStopBtn').disabled = true;
        let win = this.bet * this.multiplier;
        if (bonus) win = Math.floor(win * 1.5);
        window.tavernBalance += win; updateBalanceDisplay();
        setQuote('🏆 +' + win + ' 💎 Мой ученик!');
        window.flashWin();
        this.addHistory('Победа x' + this.multiplier, win - this.bet);
    },
    render(container) {
        container.innerHTML = `
        <div style="max-width:500px;margin:0 auto">
            <div style="text-align:center;margin-bottom:12px;font-size:0.85rem;color:var(--sub)">Баланс: <span style="color:var(--gold);font-weight:700" id="balanceTop">💎 ${window.tavernBalance}</span></div>
            <div class="table-felt" style="background:linear-gradient(160deg,#1a3020 0%,#0d1f14 30%,#1a3020 60%,#0f2418 100%);border:3px solid #3d2b1f;border-radius:16px;box-shadow:inset 0 0 60px rgba(0,0,0,0.5);padding:20px;margin-bottom:14px"><div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:8px;text-align:center;text-transform:uppercase">🐷 Выложенные карты</div><div id="drawnCards" style="text-align:center;min-height:115px"></div></div>
            <div style="text-align:center;margin:10px 0"><div style="display:inline-block;background:var(--elevated);border:1px solid var(--gold);border-radius:20px;padding:6px 16px"><span style="color:var(--muted)">Множитель </span><span style="font-size:1.3rem;color:var(--gold);font-weight:800" id="multiplier">x1</span><span style="color:var(--muted);font-size:0.8rem"> → <span id="nextMultiplier">x2</span></span></div></div>
            <div style="text-align:center;margin:10px 0;color:var(--sub)">🎲 Ставка: <span style="color:var(--gold);font-weight:700">5 💎</span></div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button class="btn btn-primary" id="pigStartBtn" onclick="pig.start()">🐷 Новая</button>
                <button class="btn btn-secondary" id="pigDrawBtn" onclick="pig.draw()" disabled>🃏 Тянуть</button>
                <button class="btn btn-secondary" id="pigStopBtn" onclick="pig.stop()" disabled>✋ Хватит</button>
            </div>
            <div id="historyBox" style="margin-top:14px;padding:10px;background:var(--card);border-radius:12px;border:1px solid var(--border);max-height:120px;overflow-y:auto"></div>
            <div style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="goMenu()" style="color:var(--muted);font-size:0.8rem;text-decoration:none">← В таверну</a></div>
        </div>`
        this.renderHistory();
    },
    destroy() { this.active = false }
}
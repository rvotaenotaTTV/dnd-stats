window.ochko = {
    deck: [], playerCards: [], dealerCards: [], active: false, bet: 10,
    suits: ['♥','♦','♠','♣'], values: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],

    createDeck() {
        const d = [];
        for (const s of this.suits) for (const v of this.values) d.push({ suit: s, value: v, index: d.length });
        return d.sort(() => Math.random() - 0.5);
    },
    cardValue(c) {
        if (c.value === 'A') return 11; if (c.value === 'J') return 2;
        if (c.value === 'Q') return 3; if (c.value === 'K') return 4;
        return parseInt(c.value);
    },
    calcScore(cards) {
        let s = 0, a = 0;
        for (const c of cards) { s += this.cardValue(c); if (c.value === 'A') a++; }
        if (a === 2 && cards.length === 2) return 21;
        while (s > 21 && a > 0) { s -= 10; a--; }
        return s;
    },
	renderCard(c, back) {
		if (back) return '<div class="card-back" style="width:78px;height:110px;background:#444;border-radius:10px;border:3px solid #444;box-shadow:0 4px 0 #333;display:inline-block;margin:2px"></div>';
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
    renderUI() {
        document.getElementById('dealerCards').innerHTML = this.active
            ? this.renderCard(this.dealerCards[0], false) + this.renderCard(null, true)
            : this.dealerCards.map(c => this.renderCard(c, false)).join('');
        document.getElementById('playerCards').innerHTML = this.playerCards.map(c => this.renderCard(c, false)).join('');
        document.getElementById('dealerScore').textContent = this.active ? '?' : this.calcScore(this.dealerCards);
        document.getElementById('playerScore').textContent = this.calcScore(this.playerCards);
    },
    startGame() {
        if (window.antiSpam() || window.tavernBalance < this.bet) return;
        window.tavernBalance -= this.bet; updateBalanceDisplay();
        this.deck = this.createDeck();
        this.playerCards = [this.deck.pop(), this.deck.pop()];
        this.dealerCards = [this.deck.pop(), this.deck.pop()];
        this.active = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('hitBtn').disabled = false;
        document.getElementById('standBtn').disabled = false;
        if (this.calcScore(this.playerCards) === 21) this.stand();
        this.renderUI();
    },
    hit() {
        if (!this.active) return;
        this.playerCards.push(this.deck.pop()); this.renderUI();
        if (this.calcScore(this.playerCards) > 21) this.endGame();
        else if (this.calcScore(this.playerCards) === 21) this.stand();
    },
    stand() {
        if (!this.active) return;
        this.active = false;
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('standBtn').disabled = true;
        const who = window.GG_IN_EXPEDITION ? '🐱 Мурка думает...' : '🐼 ГуангГуанг думает...';
        setQuote(who);
        setTimeout(() => {
            while (this.calcScore(this.dealerCards) < 17) this.dealerCards.push(this.deck.pop());
            this.renderUI(); this.resolve();
        }, 800);
    },
    resolve() {
        const p = this.calcScore(this.playerCards), d = this.calcScore(this.dealerCards);
        let w;
        if (p > 21) w = 0;
        else if (d > 21) w = this.bet * 2;
        else if (p > d) w = this.bet * 2;
        else if (p < d) w = 0;
        else w = this.bet;
        const hasOchko = this.playerCards.length === 2 && this.playerCards[0].value === 'A' && this.playerCards[1].value === 'A';
        if (hasOchko && w > 0) w = Math.floor(this.bet * 2.5);
        if (p === 21 && this.playerCards.length === 2 && w > 0 && !hasOchko) w = Math.floor(this.bet * 2.5);
        window.tavernBalance += w; updateBalanceDisplay();
        document.getElementById('startBtn').disabled = false;
        if (w > this.bet) window.flashWin();
        else if (w === 0) window.shakeBalance();
        const gg = window.GG_IN_EXPEDITION ? '🐱 Мурка' : '🐼 ГуангГуанг';
        if (hasOchko) setQuote('🎯 ОЧКО! Два туза! ' + gg + ' в шоке!');
        else if (w > this.bet) setQuote('🔥 Победа! Мой ученик!');
        else if (w === 0) setQuote('😏 ЛООООХ!');
        else setQuote('🤝 Ничья.');
    },
    endGame() {
        this.active = false;
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('standBtn').disabled = true;
        document.getElementById('startBtn').disabled = false;
        this.renderUI();
        setQuote('💔 ПЕРЕБОР! ЛООООХ!');
        window.shakeBalance();
    },
    render(container) {
        container.innerHTML = `
        <div style="max-width:500px;margin:0 auto">
            <div style="text-align:center;margin-bottom:12px;font-size:0.85rem;color:var(--sub)">Баланс: <span style="color:var(--gold);font-weight:700" id="balanceTop">💎 ${window.tavernBalance}</span></div>
            <div class="table-felt" style="background:linear-gradient(160deg,#1a3020 0%,#0d1f14 30%,#1a3020 60%,#0f2418 100%);border:3px solid #3d2b1f;border-radius:16px;box-shadow:inset 0 0 60px rgba(0,0,0,0.5);padding:20px;margin-bottom:14px"><div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:8px;text-align:center;text-transform:uppercase">${window.GG_IN_EXPEDITION?'🐱 Мурка':'🐼 ГуангГуанг'}</div><div id="dealerCards" style="text-align:center;min-height:115px"></div><div style="text-align:center;margin-top:8px;color:var(--sub)">Сумма: <span style="color:var(--gold);font-size:1.3rem;font-weight:800" id="dealerScore">0</span></div></div>
            <div class="table-felt" style="background:linear-gradient(160deg,#1a3020 0%,#0d1f14 30%,#1a3020 60%,#0f2418 100%);border:3px solid #3d2b1f;border-radius:16px;box-shadow:inset 0 0 60px rgba(0,0,0,0.5);padding:20px;margin-bottom:14px"><div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:8px;text-align:center;text-transform:uppercase">👤 Твоя рука</div><div id="playerCards" style="text-align:center;min-height:115px"></div><div style="text-align:center;margin-top:8px;color:var(--sub)">Сумма: <span style="color:var(--gold);font-size:1.3rem;font-weight:800" id="playerScore">0</span></div></div>
            <div style="text-align:center;margin:10px 0;color:var(--sub)">🎲 Ставка: <span style="color:var(--gold);font-weight:700">10 💎</span></div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button class="btn btn-primary" id="startBtn" onclick="ochko.startGame()">🃏 Играем</button>
                <button class="btn btn-secondary" id="hitBtn" onclick="ochko.hit()" disabled>➕ Ещё</button>
                <button class="btn btn-secondary" id="standBtn" onclick="ochko.stand()" disabled>✋ Я всё</button>
            </div>
            <div style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="goMenu()" style="color:var(--muted);font-size:0.8rem;text-decoration:none">← В таверну</a></div>
        </div>`
    },
    destroy() { this.active = false }
}
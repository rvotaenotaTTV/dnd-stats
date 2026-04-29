// pig.js — игра «Сало или золото?» (Пьяная свинья)
window.games = window.games || {};

window.games.pig = {
    deck: [],
    drawnCards: [],
    suits: ['♥', '♦', '♠', '♣'],
    values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    active: false,
    bet: 5,
    multiplier: 1,
    history: JSON.parse(localStorage.getItem('pigHistory')) || [],

    createDeck() {
        const d = [];
        for (const s of this.suits)
            for (const v of this.values)
                d.push({ suit: s, value: v, rot: Math.random() * 6 - 3 });
        return d.sort(() => Math.random() - 0.5);
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
        if (!this.history.length) {
            box.innerHTML = '<div class="history-item" style="color:var(--text-muted)">История...</div>';
            return;
        }
        box.innerHTML = this.history.map(h =>
            `<div class="history-item">${h.time} — ${h.text} ${h.amount > 0 ? '+' : ''}${h.amount} 💎</div>`
        ).join('');
    },

    start() {
        if (antiSpam() || balance < this.bet) {
            if (balance < this.bet) setQuote('Недостаточно осколков!');
            return;
        }
        balance -= this.bet;
        updateBalance();
        this.deck = this.createDeck();
        this.drawnCards = [];
        this.multiplier = 1;
        this.active = true;
        document.getElementById('pigStartBtn').disabled = true;
        document.getElementById('pigDrawBtn').disabled = false;
        document.getElementById('pigStopBtn').disabled = false;
        document.getElementById('drawnCards').innerHTML = '';
        document.getElementById('lastCardInfo').innerHTML = '';
        document.getElementById('multiplier').textContent = 'x1';
        document.getElementById('nextMultiplier').textContent = 'x2';
    },

    draw() {
        if (antiSpam() || !this.active) return;

        const card = this.deck.pop();
        this.drawnCards.push(card);

        const suits = this.drawnCards.map(c => c.suit);
        const dupSuit = suits.length !== new Set(suits).size;
        const randomFail = Math.random() < 0.15;

        document.getElementById('drawnCards').innerHTML = this.drawnCards.map(c =>
            `<div class="pig-card ${c.suit === '♥' || c.suit === '♦' ? 'red' : ''}" style="--rot:${c.rot}deg">
                ${c.value}<span class="pig-card-suit">${c.suit}</span>
            </div>`
        ).join('');

        if (dupSuit || randomFail) {
            this.active = false;
            document.getElementById('pigStartBtn').disabled = false;
            document.getElementById('pigDrawBtn').disabled = true;
            document.getElementById('pigStopBtn').disabled = true;
            const reason = dupSuit ? 'Повтор масти' : 'Рандом';
            setQuote(`💔 ${reason}! -${this.bet} 💎`);
            shakeBalance();
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

        balance += win;
        updateBalance();
        setQuote('🏆 +' + win + ' 💎 Мой ученик!');
        flashWin();
        this.addHistory('Победа x' + this.multiplier, win - this.bet);
    }
};
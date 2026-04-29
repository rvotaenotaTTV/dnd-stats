// ochko.js — игра «Не лопни!» (Очко)
window.games = window.games || {};

window.games.ochko = {
    deck: [],
    playerCards: [],
    dealerCards: [],
    gameActive: false,
    bet: 10,
    suits: ['♥', '♦', '♠', '♣'],
    values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],

    createDeck() {
        const d = [];
        for (const s of this.suits)
            for (const v of this.values)
                d.push({ suit: s, value: v, rot: Math.random() * 6 - 3 });
        return d.sort(() => Math.random() - 0.5);
    },

    cardValue(c) {
        if (c.value === 'A') return 11;
        if (['K', 'Q', 'J'].includes(c.value)) return 10;
        return parseInt(c.value);
    },

    calcScore(cards) {
        let score = 0, aces = 0;
        for (const c of cards) {
            score += this.cardValue(c);
            if (c.value === 'A') aces++;
        }
        while (score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    },

    renderCard(c, back) {
        if (back) return '<div class="card-el back"></div>';
        const red = c.suit === '♥' || c.suit === '♦';
        return `<div class="card-el ${red ? 'red' : ''}" style="--rot:${c.rot}deg">
            <span>${c.value}</span><span class="card-suit">${c.suit}</span>
        </div>`;
    },

    render() {
        const d = document.getElementById('dealerCards');
        const p = document.getElementById('playerCards');
        d.innerHTML = this.gameActive
            ? this.renderCard(this.dealerCards[0]) + this.renderCard(null, true)
            : this.dealerCards.map(c => this.renderCard(c)).join('');
        p.innerHTML = this.playerCards.map(c => this.renderCard(c)).join('');
        document.getElementById('dealerScore').textContent = this.gameActive ? '?' : this.calcScore(this.dealerCards);
        document.getElementById('playerScore').textContent = this.calcScore(this.playerCards);
    },

    startGame() {
        if (antiSpam() || balance < this.bet) {
            if (balance < this.bet) setQuote('Недостаточно осколков!');
            return;
        }
        balance -= this.bet;
        updateBalance();
        this.deck = this.createDeck();
        this.playerCards = [this.deck.pop(), this.deck.pop()];
        this.dealerCards = [this.deck.pop(), this.deck.pop()];
        this.gameActive = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('hitBtn').disabled = false;
        document.getElementById('standBtn').disabled = false;
        if (this.calcScore(this.playerCards) === 21) this.stand();
        this.render();
    },

    hit() {
        if (antiSpam() || !this.gameActive) return;
        this.playerCards.push(this.deck.pop());
        this.render();
        if (this.calcScore(this.playerCards) > 21) this.endGame();
        else if (this.calcScore(this.playerCards) === 21) this.stand();
    },

    stand() {
        if (!this.gameActive) return;
        this.gameActive = false;
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('standBtn').disabled = true;
        setQuote('🐼 ГуангГуанг думает...');
        setTimeout(() => {
            while (this.calcScore(this.dealerCards) < 17) this.dealerCards.push(this.deck.pop());
            this.render();
            this.resolve();
        }, 800);
    },

    resolve() {
        const p = this.calcScore(this.playerCards);
        const d = this.calcScore(this.dealerCards);
        let w;
        if (p > 21) w = 0;
        else if (d > 21) w = this.bet * 2;
        else if (p > d) w = this.bet * 2;
        else if (p < d) w = 0;
        else w = this.bet;
        if (p === 21 && this.playerCards.length === 2 && w > 0) w = Math.floor(this.bet * 2.5);
        if (w > this.bet) { setQuote('🔥 Победа! Мой ученик!'); flashWin(); }
        else if (w === 0) { setQuote('😏 ЛООООХ!'); shakeBalance(); }
        else setQuote('🤝 Ничья.');
        balance += w;
        updateBalance();
        document.getElementById('startBtn').disabled = false;
    },

    endGame() {
        this.gameActive = false;
        document.getElementById('hitBtn').disabled = true;
        document.getElementById('standBtn').disabled = true;
        document.getElementById('startBtn').disabled = false;
        setQuote('💔 ПЕРЕБОР! ЛООООХ!');
        shakeBalance();
        this.render();
    }
};
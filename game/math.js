window.math = {
    active: false, correct: 0, answer: 0, timer: null, timeLeft: 0, BET: 5,

    getTime() { if (this.correct < 5) return 5; if (this.correct < 15) return 4; if (this.correct < 30) return 3; return 2; },
    getReward() { if (this.correct < 5) return 2; if (this.correct < 15) return 3; if (this.correct < 30) return 5; return 10; },
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },

    generate() {
        const lvl = this.correct;
        const ops = ['+', '-', '·', ':'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a, b;
        switch (op) {
            case '+': const min1 = Math.min(5 + lvl, 50), max1 = Math.min(25 + lvl * 3, 200); a = this.rand(min1, max1); b = this.rand(min1, max1); this.answer = a + b; break;
            case '-': const min2 = Math.min(5 + lvl, 50), max2 = Math.min(20 + lvl * 3, 200); b = this.rand(min2, max2); this.answer = this.rand(min2, max2); a = b + this.answer; break;
            case '·': const min3 = 2, max3 = Math.min(9 + Math.floor(lvl / 3), 20); a = this.rand(min3, max3); b = this.rand(min3, max3); this.answer = a * b; break;
            case ':': const min4 = 2, max4 = Math.min(9 + Math.floor(lvl / 3), 20); b = this.rand(min4, max4); this.answer = this.rand(min4, max4); a = b * this.answer; break;
        }
        return `${a} ${op} ${b}`;
    },

    newRound() {
        if (!this.active) return;
        clearInterval(this.timer);
        this.timeLeft = this.getTime();
        this.updateTimer();
        document.getElementById('mathProblem').textContent = this.generate() + ' = ?';
        const ans = new Set([this.answer]);
        while (ans.size < 3) { const f = this.answer + this.rand(-5, 5); if (f !== this.answer && f >= 0 && !ans.has(f)) ans.add(f); }
        document.getElementById('mathAnswers').innerHTML = this.shuffle([...ans]).map(a => `<button class="btn btn-primary" style="font-size:1.2rem;flex:1" onclick="math.guess(${a})">${a}</button>`).join('');
        const start = Date.now();
        this.timer = setInterval(() => { const elapsed = (Date.now() - start) / 1000; this.timeLeft = Math.max(0, this.getTime() - elapsed); this.updateTimer(); if (this.timeLeft <= 0) { clearInterval(this.timer); this.timeout(); } }, 50);
    },

    updateTimer() {
        const total = this.getTime();
        const pct = (this.timeLeft / total) * 100;
        document.getElementById('mathProgress').style.width = pct + '%';
        document.getElementById('mathProgress').style.background = this.timeLeft <= 2 || pct <= 40 ? 'var(--red)' : 'var(--gold)';
        document.getElementById('mathTimer').textContent = Math.ceil(this.timeLeft);
    },

    guess(num) {
        if (!this.active) return;
        clearInterval(this.timer);
        if (num === this.answer) {
            this.correct++;
            const reward = this.getReward();
            document.getElementById('mathScore').textContent = this.correct;
            window.tavernBalance += reward; updateBalanceDisplay();
            document.getElementById('mathMessage').innerHTML = `<span style="color:var(--green)">✅ +${reward}💎</span>`;
            setTimeout(() => document.getElementById('mathMessage').innerHTML = '', 600);
            setQuote(['🎋 Верно! Бамбук доволен!', '🌿 ' + (window.GG_IN_EXPEDITION ? 'Мурка' : 'ГуангГуанг') + ' кивает!', '⚡ Мозг работает!', '🔥 Продолжай!'][Math.floor(Math.random() * 4)]);
            this.newRound();
        } else {
            this.active = false;
            document.getElementById('mathAnswers').innerHTML = '';
            document.getElementById('mathMessage').innerHTML = `<span style="color:var(--red)">❌ Неверно! Правильно: ${this.answer}</span>`;
            document.getElementById('mathStartBtn').disabled = false;
            setQuote(`💔 Ошибка! ${this.correct} правильных подряд.`);
            window.shakeBalance();
        }
    },

    timeout() {
        if (!this.active) return;
        this.active = false;
        document.getElementById('mathAnswers').innerHTML = '';
        document.getElementById('mathMessage').innerHTML = `<span style="color:var(--red)">⏰ Время вышло! Правильно: ${this.answer}</span>`;
        document.getElementById('mathStartBtn').disabled = false;
        setQuote('⏰ Слишком долго!'); window.shakeBalance();
    },

    start() {
        if (window.tavernBalance < this.BET) return;
        window.tavernBalance -= this.BET; updateBalanceDisplay();
        this.active = true; this.correct = 0;
        document.getElementById('mathScore').textContent = '0';
        document.getElementById('mathStartBtn').disabled = true;
        document.getElementById('mathMessage').innerHTML = '';
        setQuote('🎋 Бамбук спрашивает...');
        this.newRound();
    },

    stop() { clearInterval(this.timer); this.active = false; },

    render(container) {
        container.innerHTML = `
        <div style="max-width:500px;margin:0 auto">
            <div style="text-align:center;margin-bottom:12px;font-size:0.85rem;color:var(--sub)">Баланс: <span style="color:var(--gold);font-weight:700" id="balanceTop">💎 ${window.tavernBalance}</span></div>
            <div style="text-align:center;margin:10px 0"><span style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Правильных</span><br><span style="font-size:1.4rem;font-weight:800;color:var(--gold)" id="mathScore">0</span></div>
            <div style="text-align:center;margin:16px 0;padding:20px;background:var(--card);border-radius:16px;border:1px solid var(--border)">
                <div style="font-size:2rem;font-weight:900;color:var(--gold);margin-bottom:8px" id="mathProblem">5 + 2 = ?</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:10px">
                    <div style="flex:1;max-width:200px;height:6px;background:var(--bg);border-radius:3px;overflow:hidden"><div id="mathProgress" style="height:100%;background:var(--gold);border-radius:3px;width:100%"></div></div>
                    <span style="color:var(--muted);font-size:0.75rem;min-width:40px;text-align:right">⏱ <span id="mathTimer" style="color:var(--gold);font-weight:700">5</span>с</span>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:14px" id="mathAnswers"></div>
            <div style="text-align:center;margin:10px 0;color:var(--sub)">🎲 Ставка: <span style="color:var(--gold);font-weight:700">5 💎</span></div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button class="btn btn-primary" id="mathStartBtn" onclick="math.start()">🎋 Начать</button>
            </div>
            <div id="mathMessage" style="text-align:center;margin-top:8px;min-height:24px"></div>
            <div style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="math.stop();goMenu()" style="color:var(--muted);font-size:0.8rem;text-decoration:none">← В таверну</a></div>
        </div>`
    },

    destroy() { clearInterval(this.timer); this.active = false; }
}
window.runes = {
    grid: [], selected: null, score: 0, earned: 0, combo: 1,
    active: false, processing: false, movesLeft: 30, hintTimeout: null, hintCells: [],
    ROWS: 6, COLS: 6, BET: 10, MAX_MOVES: 30, RUNES: ['🔥','💧','🌿','⚡','💀','✨'],

    randomRune() { return this.RUNES[Math.floor(Math.random() * this.RUNES.length)] },

    init() {
        if (window.tavernBalance < this.BET) return;
        window.tavernBalance -= this.BET; updateBalanceDisplay();
        this.grid = []; this.selected = null; this.score = 0; this.earned = 0; this.combo = 1; this.movesLeft = this.MAX_MOVES;
        this.active = true; this.processing = false; this.clearHints();
        for (let r = 0; r < this.ROWS; r++) { this.grid[r] = []; for (let c = 0; c < this.COLS; c++) this.grid[r][c] = this.randomRune(); }
        this.removeInitialMatches(); this.updateUI(); this.renderGrid();
        setQuote('🔮 Руны ждут, странник!');
        document.getElementById('runesNewBtn').disabled = true;
        document.getElementById('runesCashBtn').disabled = false;
        this.scheduleHint();
    },

    cashOut() {
        if (!this.active) return;
        this.active = false; this.processing = false; this.clearHints();
        this.earned = Math.floor(this.score * (0.8 + this.combo * 0.1));
        window.tavernBalance += this.earned; updateBalanceDisplay();
        document.getElementById('runesNewBtn').disabled = false;
        document.getElementById('runesCashBtn').disabled = true;
        if (this.earned > this.BET) { setQuote(`🏆 Мудрое решение! +${this.earned}💎`); window.flashWin(); }
        else if (this.earned === 0) setQuote('💔 Ушёл с пустыми руками...');
        else setQuote(`🤝 +${this.earned}💎. Почти отбил своё...`);
    },

    removeInitialMatches() { let has = true, it = 0; while (has && it < 100) { has = false; it++; const m = this.findMatches(); if (m.length > 0) { has = true; for (const x of m) this.grid[x.r][x.c] = this.randomRune(); } } },

    updateUI() {
        document.getElementById('movesLeft').textContent = this.movesLeft;
        document.getElementById('comboCount').textContent = '×' + this.combo;
        document.getElementById('runesScore').textContent = this.score;
        document.getElementById('earned').textContent = this.earned + ' 💎';
    },

    renderGrid() {
        const el = document.getElementById('runesGrid'); if (!el) return;
        el.innerHTML = '';
        for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'rune-cell';
            cell.style.cssText = 'aspect-ratio:1;background:var(--elevated);border:2px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;user-select:none';
            cell.textContent = this.grid[r][c] || '';
            if (this.selected && this.selected.r === r && this.selected.c === c) { cell.style.borderColor = 'var(--gold)'; cell.style.boxShadow = '0 0 16px rgba(255,215,0,0.6)'; cell.style.transform = 'scale(1.1)'; }
            if (this.hintCells.some(h => h.r === r && h.c === c)) { cell.style.borderColor = 'rgba(255,215,0,0.6)'; cell.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)'; }
            cell.addEventListener('click', () => this.click(r, c));
            el.appendChild(cell);
        }
    },

    click(r, c) {
        if (!this.active || this.processing) return;
        this.clearHints();
        if (!this.selected) { this.selected = { r, c }; this.renderGrid(); this.scheduleHint(); return; }
        if (this.selected.r === r && this.selected.c === c) { this.selected = null; this.renderGrid(); this.scheduleHint(); return; }
        if (Math.abs(this.selected.r - r) + Math.abs(this.selected.c - c) !== 1) { this.selected = { r, c }; this.renderGrid(); this.scheduleHint(); return; }
        const sr = this.selected.r, sc = this.selected.c;
        [this.grid[sr][sc], this.grid[r][c]] = [this.grid[r][c], this.grid[sr][sc]];
        const matches = this.findMatches();
        if (matches.length === 0) {
            [this.grid[sr][sc], this.grid[r][c]] = [this.grid[r][c], this.grid[sr][sc]];
            this.renderGrid(); this.scheduleHint(); this.selected = null;
            setQuote('Эти руны не хотят дружить...');
            this.movesLeft--; this.updateUI();
            if (this.movesLeft <= 0) this.endGame();
            return;
        }
        this.selected = null; this.movesLeft--; this.updateUI();
        this.processMatches(matches);
    },

    findMatches() {
        const matched = new Set();
        for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS - 2; c++) {
            if (this.grid[r][c] && this.grid[r][c] === this.grid[r][c + 1] && this.grid[r][c] === this.grid[r][c + 2]) { let end = c + 2; while (end + 1 < this.COLS && this.grid[r][end + 1] === this.grid[r][c]) end++; for (let i = c; i <= end; i++) matched.add(r * this.COLS + i); }
        }
        for (let c = 0; c < this.COLS; c++) for (let r = 0; r < this.ROWS - 2; r++) {
            if (this.grid[r][c] && this.grid[r][c] === this.grid[r + 1][c] && this.grid[r][c] === this.grid[r + 2][c]) { let end = r + 2; while (end + 1 < this.ROWS && this.grid[end + 1][c] === this.grid[r][c]) end++; for (let i = r; i <= end; i++) matched.add(i * this.COLS + c); }
        }
        return [...matched].map(i => ({ r: Math.floor(i / this.COLS), c: i % this.COLS }));
    },

    findAnyMove() {
        for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) {
            if (c + 1 < this.COLS) { [this.grid[r][c], this.grid[r][c + 1]] = [this.grid[r][c + 1], this.grid[r][c]]; if (this.findMatches().length > 0) { [this.grid[r][c], this.grid[r][c + 1]] = [this.grid[r][c + 1], this.grid[r][c]]; return [{ r, c }, { r, c: c + 1 }]; } [this.grid[r][c], this.grid[r][c + 1]] = [this.grid[r][c + 1], this.grid[r][c]]; }
            if (r + 1 < this.ROWS) { [this.grid[r][c], this.grid[r + 1][c]] = [this.grid[r + 1][c], this.grid[r][c]]; if (this.findMatches().length > 0) { [this.grid[r][c], this.grid[r + 1][c]] = [this.grid[r + 1][c], this.grid[r][c]]; return [{ r, c }, { r: r + 1, c }]; } [this.grid[r][c], this.grid[r + 1][c]] = [this.grid[r + 1][c], this.grid[r][c]]; }
        }
        return null;
    },

    clearHints() { this.hintCells = []; if (this.hintTimeout) { clearTimeout(this.hintTimeout); this.hintTimeout = null; } },
    scheduleHint() { this.clearHints(); if (!this.active || this.processing) return; this.hintTimeout = setTimeout(() => { const move = this.findAnyMove(); if (move && this.active && !this.processing) { this.hintCells = move; this.renderGrid(); setQuote((window.GG_IN_EXPEDITION ? '🐱 Мурка' : '🐼 ГуангГуанг') + ' шепчет: смотри внимательнее...'); } }, 60000); },

    shuffleGrid() { const all = []; for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) all.push(this.grid[r][c]); all.sort(() => Math.random() - 0.5); let idx = 0; for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) this.grid[r][c] = all[idx++]; this.removeInitialMatches(); },

    async processMatches(matches) {
        this.processing = true; this.clearHints(); let cascade = 0;
        while (matches.length > 0 && this.active) {
            if (matches.length >= 5) this.movesLeft += 2; else if (matches.length === 4) this.movesLeft += 1;
            for (const m of matches) { const idx = m.r * this.COLS + m.c + 1; const cell = document.querySelector(`#runesGrid .rune-cell:nth-child(${idx})`); if (cell) { cell.style.borderColor = '#fff'; cell.style.boxShadow = '0 0 24px rgba(255,255,255,0.8)'; } }
            await new Promise(r => setTimeout(r, 250));
            if (cascade > 0) this.combo++;
            const points = matches.length === 3 ? 1 : matches.length === 4 ? 3 : matches.length >= 5 ? 5 : 1;
            this.score += points * this.combo;
            for (const m of matches) this.grid[m.r][m.c] = null;
            this.renderGrid(); await new Promise(r => setTimeout(r, 200));
            for (let c = 0; c < this.COLS; c++) { let wr = this.ROWS - 1; for (let r = this.ROWS - 1; r >= 0; r--) { if (this.grid[r][c] !== null && this.grid[r][c] !== undefined) { this.grid[wr][c] = this.grid[r][c]; wr--; } } for (let r = wr; r >= 0; r--) this.grid[r][c] = null; }
            this.renderGrid(); await new Promise(r => setTimeout(r, 200));
            for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) if (!this.grid[r][c]) this.grid[r][c] = this.randomRune();
            this.renderGrid(); await new Promise(r => setTimeout(r, 350));
            matches = this.findMatches(); cascade++;
        }
        if (cascade > 2) { document.getElementById('comboOverlay').textContent = `🔥 КОМБО ×${this.combo}!`; setQuote(`Каскад ×${cascade}!`); }
        else if (cascade > 0) { document.getElementById('comboOverlay').textContent = `✨ Комбо ×${this.combo}`; setQuote('Руны сложились!'); }
        else { this.combo = Math.max(1, this.combo - 1); document.getElementById('comboOverlay').textContent = ''; }
        this.updateUI(); setTimeout(() => { document.getElementById('comboOverlay').textContent = ''; }, 1500);
        if (!this.findAnyMove()) { document.getElementById('comboOverlay').textContent = '🔄 Перемешивание...'; this.shuffleGrid(); this.renderGrid(); await new Promise(r => setTimeout(r, 400)); if (!this.findAnyMove()) { this.shuffleGrid(); this.renderGrid(); await new Promise(r => setTimeout(r, 400)); } this.combo = 1; setQuote('✨ Руны перемешались! Продолжай!'); this.updateUI(); document.getElementById('comboOverlay').textContent = ''; const nm = this.findMatches(); if (nm.length > 0) { await this.processMatches(nm); return; } }
        if (this.movesLeft <= 0) { this.endGame(); return; }
        this.processing = false; this.scheduleHint();
    },

    endGame() {
        this.active = false; this.processing = false; this.clearHints();
        this.earned = Math.floor(this.score * (0.8 + this.combo * 0.1));
        window.tavernBalance += this.earned; updateBalanceDisplay();
        document.getElementById('runesNewBtn').disabled = false;
        document.getElementById('runesCashBtn').disabled = true;
        document.getElementById('comboOverlay').textContent = '';
        if (this.earned > this.BET) { setQuote(`🏆 Игра окончена! +${this.earned}💎`); window.flashWin(); }
        else if (this.earned === 0) setQuote('💔 Ходы кончились. Пусто...');
        else setQuote(`⏰ Ходы кончились. +${this.earned}💎`);
    },

    render(container) {
        container.innerHTML = `
        <div style="max-width:500px;margin:0 auto">
            <div style="text-align:center;margin-bottom:12px;font-size:0.85rem;color:var(--sub)">Баланс: <span style="color:var(--gold);font-weight:700" id="balanceTop">💎 ${window.tavernBalance}</span></div>
            <div id="comboOverlay" style="text-align:center;font-size:1.1rem;font-weight:900;color:var(--gold);min-height:28px;margin-bottom:4px"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Ходов</div><div style="font-size:1.2rem;font-weight:800;color:var(--gold)" id="movesLeft">30</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Комбо</div><div style="font-size:1.2rem;font-weight:800;color:var(--gold)" id="comboCount">×1</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Очки</div><div style="font-size:1.2rem;font-weight:800;color:var(--gold)" id="runesScore">0</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Выигрыш</div><div style="font-size:1.2rem;font-weight:800;color:var(--gold)" id="earned">0 💎</div></div>
            </div>
            <div id="runesGrid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:12px"></div>
            <div style="text-align:center;margin:10px 0;color:var(--sub)">🎲 Ставка: <span style="color:var(--gold);font-weight:700">10 💎</span></div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button class="btn btn-primary" id="runesNewBtn" onclick="runes.init()">🆕 Новая игра</button>
                <button class="btn btn-secondary" id="runesCashBtn" onclick="runes.cashOut()" disabled>💰 Забрать</button>
            </div>
            <div style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="goMenu()" style="color:var(--muted);font-size:0.8rem;text-decoration:none">← В таверну</a></div>
        </div>`
        this.init();
    },

    destroy() { this.active = false; this.processing = false; this.clearHints(); }
}
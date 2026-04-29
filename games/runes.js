// runes.js — игра «Руны Раскола» (Match-3)
window.games = window.games || {};

window.games.runes = {
    ROWS: 6,
    COLS: 6,
    BET: 10,
    MAX_MOVES: 30,
    RUNES: ['🔥', '💧', '🌿', '⚡', '💀', '✨'],
    grid: [],
    selected: null,
    score: 0,
    earned: 0,
    combo: 1,
    active: false,
    processing: false,
    movesLeft: 30,
    hintTimeout: null,
    hintCells: [],

    init() {
        this.grid = [];
        this.selected = null;
        this.score = 0;
        this.earned = 0;
        this.combo = 1;
        this.movesLeft = this.MAX_MOVES;
        this.active = true;
        this.processing = false;
        this.clearHints();
        for (let r = 0; r < this.ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.COLS; c++)
                this.grid[r][c] = this.randomRune();
        }
        this.removeInitialMatches();
        this.updateUI();
        this.render();
        setQuote('🔮 Руны ждут, странник!');
        document.getElementById('comboOverlay').textContent = '';
        document.getElementById('runesNewBtn').disabled = true;
        document.getElementById('runesCashBtn').disabled = false;
        this.scheduleHint();
    },

    cashOut() {
        if (!this.active) return;
        this.active = false;
        this.processing = false;
        this.clearHints();
        this.earned = this.calcEarned();
        balance += this.earned;
        updateBalance();
        this.updateUI();
        document.getElementById('runesNewBtn').disabled = false;
        document.getElementById('runesCashBtn').disabled = true;
        document.getElementById('comboOverlay').textContent = '';
        if (this.earned > this.BET) { setQuote(`🏆 Мудрое решение! +${this.earned}💎`); flashWin(); }
        else if (this.earned === 0) { setQuote('💔 Ушёл с пустыми руками...'); }
        else { setQuote(`🤝 +${this.earned}💎. Почти отбил своё...`); }
    },

    calcEarned() { return Math.floor(this.score * (0.8 + this.combo * 0.1)); },
    randomRune() { return this.RUNES[Math.floor(Math.random() * this.RUNES.length)]; },

    removeInitialMatches() {
        let hasMatch = true, iterations = 0;
        while (hasMatch && iterations < 100) {
            hasMatch = false;
            iterations++;
            const matches = this.findMatches();
            if (matches.length > 0) {
                hasMatch = true;
                for (const m of matches) this.grid[m.r][m.c] = this.randomRune();
            }
        }
    },

    updateUI() {
        document.getElementById('movesLeft').textContent = this.movesLeft;
        document.getElementById('comboCount').textContent = '×' + this.combo;
        document.getElementById('runesScore').textContent = this.score;
        document.getElementById('earned').textContent = this.earned + ' 💎';
    },

    render() {
        const gridEl = document.getElementById('runesGrid');
        if (!gridEl) return;
        gridEl.innerHTML = '';
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'rune-cell';
                cell.textContent = this.grid[r][c] || '';
                if (this.selected && this.selected.r === r && this.selected.c === c) cell.classList.add('selected');
                if (this.hintCells.some(h => h.r === r && h.c === c)) cell.classList.add('hint');
                cell.addEventListener('click', () => this.click(r, c));
                gridEl.appendChild(cell);
            }
        }
    },

    click(r, c) {
        if (!this.active || this.processing) return;
        this.clearHints();
        if (!this.selected) { this.selected = { r, c }; this.render(); this.scheduleHint(); return; }
        if (this.selected.r === r && this.selected.c === c) { this.selected = null; this.render(); this.scheduleHint(); return; }
        if (!this.isAdjacent(this.selected.r, this.selected.c, r, c)) { this.selected = { r, c }; this.render(); this.scheduleHint(); return; }
        const sr = this.selected.r, sc = this.selected.c;
        this.swap(sr, sc, r, c);
        const matches = this.findMatches();
        if (matches.length === 0) {
            const cell1 = document.querySelector(`#runesGrid .rune-cell:nth-child(${sr * this.COLS + sc + 1})`);
            const cell2 = document.querySelector(`#runesGrid .rune-cell:nth-child(${r * this.COLS + c + 1})`);
            if (cell1) cell1.classList.add('shake');
            if (cell2) cell2.classList.add('shake');
            setTimeout(() => { this.swap(sr, sc, r, c); this.render(); this.scheduleHint(); }, 150);
            this.selected = null;
            setQuote('Эти руны не хотят дружить...');
            this.movesLeft--;
            this.updateUI();
            if (this.movesLeft <= 0) { this.endGame(); return; }
            return;
        }
        this.selected = null;
        this.movesLeft--;
        this.updateUI();
        this.processMatches(matches);
    },

    isAdjacent(r1, c1, r2, c2) { return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1; },
    swap(r1, c1, r2, c2) { [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]]; },

    findMatches() {
        const matched = new Set();
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS - 2; c++) {
                if (this.grid[r][c] && this.grid[r][c] === this.grid[r][c + 1] && this.grid[r][c] === this.grid[r][c + 2]) {
                    let end = c + 2;
                    while (end + 1 < this.COLS && this.grid[r][end + 1] === this.grid[r][c]) end++;
                    for (let i = c; i <= end; i++) matched.add(r * this.COLS + i);
                }
            }
        }
        for (let c = 0; c < this.COLS; c++) {
            for (let r = 0; r < this.ROWS - 2; r++) {
                if (this.grid[r][c] && this.grid[r][c] === this.grid[r + 1][c] && this.grid[r][c] === this.grid[r + 2][c]) {
                    let end = r + 2;
                    while (end + 1 < this.ROWS && this.grid[end + 1][c] === this.grid[r][c]) end++;
                    for (let i = r; i <= end; i++) matched.add(i * this.COLS + c);
                }
            }
        }
        return [...matched].map(i => ({ r: Math.floor(i / this.COLS), c: i % this.COLS }));
    },

    findAnyMove() {
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                if (c + 1 < this.COLS) {
                    this.swap(r, c, r, c + 1);
                    if (this.findMatches().length > 0) { this.swap(r, c, r, c + 1); return [{ r, c }, { r, c: c + 1 }]; }
                    this.swap(r, c, r, c + 1);
                }
                if (r + 1 < this.ROWS) {
                    this.swap(r, c, r + 1, c);
                    if (this.findMatches().length > 0) { this.swap(r, c, r + 1, c); return [{ r, c }, { r: r + 1, c }]; }
                    this.swap(r, c, r + 1, c);
                }
            }
        }
        return null;
    },

    clearHints() { this.hintCells = []; if (this.hintTimeout) { clearTimeout(this.hintTimeout); this.hintTimeout = null; } },

    scheduleHint() {
        this.clearHints();
        if (!this.active || this.processing) return;
        this.hintTimeout = setTimeout(() => {
            const move = this.findAnyMove();
            if (move && this.active && !this.processing) {
                this.hintCells = move;
                this.render();
                setQuote('🐼 ГуангГуанг шепчет: смотри внимательнее...');
            }
        }, 60000);
    },

    shuffleGrid() {
        const all = [];
        for (let r = 0; r < this.ROWS; r++)
            for (let c = 0; c < this.COLS; c++)
                all.push(this.grid[r][c]);
        all.sort(() => Math.random() - 0.5);
        let idx = 0;
        for (let r = 0; r < this.ROWS; r++)
            for (let c = 0; c < this.COLS; c++)
                this.grid[r][c] = all[idx++];
        this.removeInitialMatches();
    },

    async processMatches(matches) {
        this.processing = true;
        this.clearHints();
        let cascadeCount = 0;
        while (matches.length > 0 && this.active) {
            if (matches.length >= 5) this.movesLeft += 2;
            else if (matches.length === 4) this.movesLeft += 1;
            for (const m of matches) {
                const idx = m.r * this.COLS + m.c + 1;
                const cell = document.querySelector(`#runesGrid .rune-cell:nth-child(${idx})`);
                if (cell) cell.classList.add('glowing');
            }
            await this.sleep(250);
            if (cascadeCount > 0) this.combo++;
            const points = matches.length === 3 ? 1 : matches.length === 4 ? 3 : matches.length >= 5 ? 5 : 1;
            this.score += points * this.combo;
            for (const m of matches) this.grid[m.r][m.c] = null;
            this.render();
            await this.sleep(200);
            this.collapse();
            this.render();
            await this.sleep(200);
            for (let r = 0; r < this.ROWS; r++)
                for (let c = 0; c < this.COLS; c++)
                    if (!this.grid[r][c]) this.grid[r][c] = this.randomRune();
            this.render();
            await this.sleep(350);
            matches = this.findMatches();
            cascadeCount++;
        }
        if (cascadeCount > 2) {
            document.getElementById('comboOverlay').textContent = `🔥 КОМБО ×${this.combo}!`;
            document.getElementById('comboOverlay').className = 'combo-overlay big';
            setQuote(`Каскад ×${cascadeCount}!`);
        } else if (cascadeCount > 0) {
            document.getElementById('comboOverlay').textContent = `✨ Комбо ×${this.combo}`;
            document.getElementById('comboOverlay').className = 'combo-overlay';
            setQuote('Руны сложились!');
        } else {
            this.combo = Math.max(1, this.combo - 1);
            document.getElementById('comboOverlay').textContent = '';
            document.getElementById('comboOverlay').className = 'combo-overlay';
        }
        this.updateUI();
        setTimeout(() => {
            document.getElementById('comboOverlay').textContent = '';
            document.getElementById('comboOverlay').className = 'combo-overlay';
        }, 1500);
        if (!this.findAnyMove()) {
            document.getElementById('comboOverlay').textContent = '🔄 Перемешивание...';
            this.shuffleGrid();
            this.render();
            await this.sleep(400);
            if (!this.findAnyMove()) { this.shuffleGrid(); this.render(); await this.sleep(400); }
            this.combo = 1;
            setQuote('✨ Руны перемешались! Продолжай!');
            this.updateUI();
            document.getElementById('comboOverlay').textContent = '';
            const newMatches = this.findMatches();
            if (newMatches.length > 0) { await this.processMatches(newMatches); return; }
        }
        if (this.movesLeft <= 0) { this.endGame(); return; }
        this.processing = false;
        this.scheduleHint();
    },

    collapse() {
        for (let c = 0; c < this.COLS; c++) {
            let writeRow = this.ROWS - 1;
            for (let r = this.ROWS - 1; r >= 0; r--) {
                if (this.grid[r][c] !== null && this.grid[r][c] !== undefined) {
                    this.grid[writeRow][c] = this.grid[r][c];
                    writeRow--;
                }
            }
            for (let r = writeRow; r >= 0; r--) this.grid[r][c] = null;
        }
    },

    endGame() {
        this.active = false;
        this.processing = false;
        this.clearHints();
        this.earned = this.calcEarned();
        balance += this.earned;
        updateBalance();
        this.updateUI();
        document.getElementById('runesNewBtn').disabled = false;
        document.getElementById('runesCashBtn').disabled = true;
        document.getElementById('comboOverlay').textContent = '';
        if (this.earned > this.BET) { setQuote(`🏆 Игра окончена! +${this.earned}💎`); flashWin(); }
        else if (this.earned === 0) { setQuote('💔 Ходы кончились. Пусто...'); }
        else { setQuote(`⏰ Ходы кончились. +${this.earned}💎`); }
    },

    sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
};
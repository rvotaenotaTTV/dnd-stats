window.sudoku = {
    grid: [], sol: [], fixed: [], sel: null, active: false, timerInterval: null, seconds: 0,

    init() {
        const SZ = 9, BOX = 3;
        this.sol = Array.from({ length: SZ }, () => Array(SZ).fill(0));
        this.fillGrid(this.sol);
        this.grid = this.sol.map(r => [...r]);
        const cells = [];
        for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) cells.push([r, c]);
        cells.sort(() => Math.random() - 0.5);
        const toHide = 31 + Math.floor(Math.random() * 11);
        for (let i = 0; i < toHide; i++) { const [r, c] = cells[i]; this.grid[r][c] = 0; }
        this.fixed = this.grid.map(row => row.map(cell => cell !== 0));
        this.seconds = 0;
        clearInterval(this.timerInterval);
        this.updateTimer();
        this.timerInterval = setInterval(() => { this.seconds++; this.updateTimer(); }, 1000);
        this.active = true; this.sel = null;
        const checkBtn = document.getElementById('sudokuCheckBtn'); if (checkBtn) checkBtn.disabled = true;
        document.getElementById('sudokuMessage').innerHTML = '';
        this.renderGrid();
    },

    fillGrid(grid) {
        const SZ = 9, BOX = 3;
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } };
        const isValid = (g, r, c, n) => {
            for (let i = 0; i < SZ; i++) if (g[r][i] === n || g[i][c] === n) return false;
            const br = Math.floor(r / BOX) * BOX, bc = Math.floor(c / BOX) * BOX;
            for (let i = 0; i < BOX; i++) for (let j = 0; j < BOX; j++) if (g[br + i][bc + j] === n) return false;
            return true;
        };
        const solve = g => {
            for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) {
                if (g[r][c] === 0) { const tries = [...nums]; shuffle(tries); for (const n of tries) { if (isValid(g, r, c, n)) { g[r][c] = n; if (solve(g)) return true; g[r][c] = 0; } } return false; }
            }
            return true;
        };
        for (let b = 0; b < SZ; b += BOX) { const tries = [...nums]; shuffle(tries); for (let i = 0; i < BOX; i++) for (let j = 0; j < BOX; j++) { let placed = false; for (let k = 0; k < tries.length; k++) { if (isValid(grid, b + i, b + j, tries[k])) { grid[b + i][b + j] = tries[k]; tries.splice(k, 1); placed = true; break; } } if (!placed) grid[b + i][b + j] = tries.pop(); } }
        if (!solve(grid)) { for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) grid[r][c] = 0; for (let b = 0; b < SZ; b += BOX) { const tries = [...nums]; shuffle(tries); let idx = 0; for (let i = 0; i < BOX; i++) for (let j = 0; j < BOX; j++) grid[b + i][b + j] = tries[idx++]; } solve(grid); }
    },

    updateTimer() {
        const el = document.getElementById('sudokuTimer'); if (!el) return;
        el.textContent = `${Math.floor(this.seconds/60).toString().padStart(2,'0')}:${(this.seconds%60).toString().padStart(2,'0')}`;
        const multEl = document.getElementById('sudokuMulti'); if (multEl) multEl.textContent = this.seconds < 180 ? '×5 ⚡' : this.seconds < 600 ? '×3' : '×2';
    },

    renderGrid() {
        const container = document.getElementById('sudokuGrid'); if (!container) return;
        const SZ = 9, BOX = 3;
        container.innerHTML = '';
        const selectedNum = this.sel && this.grid[this.sel.r][this.sel.c] !== 0 ? this.grid[this.sel.r][this.sel.c] : null;
        let brS = -1, brE = -1, bcS = -1, bcE = -1;
        if (this.sel) { brS = Math.floor(this.sel.r / BOX) * BOX; brE = brS + BOX; bcS = Math.floor(this.sel.c / BOX) * BOX; bcE = bcS + BOX; }
        for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) {
            const el = document.createElement('div'); el.className = 'sudoku-cell';
            if (this.grid[r][c] !== 0) el.textContent = this.grid[r][c];
            if (this.fixed[r][c]) el.classList.add('fixed');
            if (this.sel && this.sel.r === r && this.sel.c === c) el.classList.add('selected');
            if (this.sel && (this.sel.r === r || this.sel.c === c)) el.classList.add('same-row-col');
            if (this.sel && r >= brS && r < brE && c >= bcS && c < bcE) el.classList.add('same-row-col');
            if (selectedNum && this.grid[r][c] === selectedNum && !(this.sel && this.sel.r === r && this.sel.c === c)) el.classList.add('same-number');
            el.onclick = () => { if (!this.active || this.fixed[r][c]) return; this.sel = { r, c }; this.renderGrid(); };
            container.appendChild(el);
        }
    },

    place(num) {
        if (!this.active || !this.sel || this.fixed[this.sel.r][this.sel.c]) return;
        this.grid[this.sel.r][this.sel.c] = num;
        this.renderGrid();
        const hasEmpty = this.grid.some(row => row.some(cell => cell === 0));
        const checkBtn = document.getElementById('sudokuCheckBtn'); if (checkBtn) checkBtn.disabled = hasEmpty;
    },

    check() {
        if (!this.active) return;
        const SZ = 9; let ok = true, hasEmpty = false; const errors = [];
        for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) {
            if (this.grid[r][c] === 0) hasEmpty = true;
            else if (this.grid[r][c] !== this.sol[r][c]) { ok = false; errors.push({ r, c }); }
        }
        const msg = document.getElementById('sudokuMessage');
        if (ok && !hasEmpty) {
            this.active = false; clearInterval(this.timerInterval);
            let mult = this.seconds < 180 ? 5 : this.seconds < 600 ? 3 : 2;
            const win = 10 * mult; window.tavernBalance += win; updateBalanceDisplay();
            const m = Math.floor(this.seconds / 60), s = this.seconds % 60;
            msg.innerHTML = `<div style="text-align:center;padding:16px;color:var(--gold);font-size:1.2rem;font-weight:800">🎉 +${win} 💎 (×${mult}, ${m>0?m+'м ':''}${s}с)</div>`;
            window.flashWin(); setQuote('🧩 ' + (window.GG_IN_EXPEDITION ? 'Кэтэрина' : 'ГуангГуанг') + ' уважает!');
        } else if (hasEmpty) {
            msg.innerHTML = '<div style="text-align:center;color:var(--orange);padding:8px">⚠️ Заполни всё поле!</div>';
            setTimeout(() => msg.innerHTML = '', 2000);
        } else {
            msg.innerHTML = '<div style="text-align:center;color:var(--red);padding:8px">❌ Ошибки подсвечены красным</div>';
            setTimeout(() => msg.innerHTML = '', 2000);
        }
    },

    newGame() { if (window.antiSpam() || window.tavernBalance < 5) return; window.tavernBalance -= 5; updateBalanceDisplay(); this.init(); setQuote('🧩 Новая партия. Время пошло!'); },

    render(container) {
        container.innerHTML = `
        <div style="max-width:500px;margin:0 auto">
            <div style="text-align:center;margin-bottom:12px;font-size:0.85rem;color:var(--sub)">Баланс: <span style="color:var(--gold);font-weight:700" id="balanceTop">💎 ${window.tavernBalance}</span></div>
            <div class="sudoku-timer">⏱ <span id="sudokuTimer">00:00</span></div>
            <div class="sudoku-grid" id="sudokuGrid"></div>
            <div class="num-pad">
                ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="num-btn" onclick="sudoku.place(${n})">${n}</button>`).join('')}
                <button class="num-btn clear-btn" onclick="sudoku.place(0)">✕ Очистить</button>
            </div>
            <div style="text-align:center;margin:10px 0;color:var(--sub)">🎲 Ставка: <span style="color:var(--gold);font-weight:700">5 💎</span> | 🏆 Выигрыш: <span id="sudokuMulti" style="color:var(--gold);font-weight:700">×3</span></div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button class="btn btn-primary" onclick="sudoku.newGame()">🆕 Новая</button>
                <button class="btn btn-secondary" id="sudokuCheckBtn" onclick="sudoku.check()" disabled>✅ Проверить</button>
            </div>
            <div id="sudokuMessage"></div>
            <div style="text-align:center;margin-top:16px"><a href="javascript:void(0)" onclick="goMenu()" style="color:var(--muted);font-size:0.8rem;text-decoration:none">← В таверну</a></div>
        </div>`
        this.init();
    },

    destroy() { this.active = false; clearInterval(this.timerInterval); }
}
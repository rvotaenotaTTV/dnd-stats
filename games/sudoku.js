// sudoku.js — игра «Мозголомка» (Судоку 9×9)
window.games = window.games || {};

window.games.sudoku = {
    SZ: 9,
    BOX: 3,
    grid: [],
    solution: [],
    fixed: [],
    selected: null,
    active: false,
    timerInterval: null,
    seconds: 0,

    init() {
        this.grid = [];
        this.solution = [];
        this.fixed = [];
        this.selected = null;
        this.active = false;
        this.seconds = 0;
        clearInterval(this.timerInterval);
        this.generate();
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.updateTimerDisplay();
        }, 1000);
    },

    generate() {
        this.solution = Array.from({ length: this.SZ }, () => Array(this.SZ).fill(0));
        this.fillGrid(this.solution);
        this.grid = this.solution.map(r => [...r]);
        const cells = [];
        for (let r = 0; r < this.SZ; r++)
            for (let c = 0; c < this.SZ; c++)
                cells.push([r, c]);
        cells.sort(() => Math.random() - 0.5);
        const toHide = 31 + Math.floor(Math.random() * 11);
        for (let i = 0; i < toHide; i++) {
            const [r, c] = cells[i];
            this.grid[r][c] = 0;
        }
        this.fixed = this.grid.map(row => row.map(cell => cell !== 0));
    },

    fillGrid(grid) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const shuffle = arr => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };
        const isValid = (g, r, c, n) => {
            for (let i = 0; i < this.SZ; i++)
                if (g[r][i] === n || g[i][c] === n) return false;
            const br = Math.floor(r / this.BOX) * this.BOX;
            const bc = Math.floor(c / this.BOX) * this.BOX;
            for (let i = 0; i < this.BOX; i++)
                for (let j = 0; j < this.BOX; j++)
                    if (g[br + i][bc + j] === n) return false;
            return true;
        };
        const solve = g => {
            for (let r = 0; r < this.SZ; r++) {
                for (let c = 0; c < this.SZ; c++) {
                    if (g[r][c] === 0) {
                        const tries = [...nums];
                        shuffle(tries);
                        for (const n of tries) {
                            if (isValid(g, r, c, n)) {
                                g[r][c] = n;
                                if (solve(g)) return true;
                                g[r][c] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };
        for (let b = 0; b < this.SZ; b += this.BOX) {
            const tries = [...nums];
            shuffle(tries);
            for (let i = 0; i < this.BOX; i++) {
                for (let j = 0; j < this.BOX; j++) {
                    let placed = false;
                    for (let k = 0; k < tries.length; k++) {
                        if (isValid(grid, b + i, b + j, tries[k])) {
                            grid[b + i][b + j] = tries[k];
                            tries.splice(k, 1);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) grid[b + i][b + j] = tries.pop();
                }
            }
        }
        if (!solve(grid)) {
            for (let r = 0; r < this.SZ; r++)
                for (let c = 0; c < this.SZ; c++)
                    grid[r][c] = 0;
            for (let b = 0; b < this.SZ; b += this.BOX) {
                const tries = [...nums];
                shuffle(tries);
                let idx = 0;
                for (let i = 0; i < this.BOX; i++)
                    for (let j = 0; j < this.BOX; j++)
                        grid[b + i][b + j] = tries[idx++];
            }
            solve(grid);
        }
    },

    updateTimerDisplay() {
        const el = document.getElementById('sudokuTimer');
        if (!el) return;
        const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
        const s = (this.seconds % 60).toString().padStart(2, '0');
        el.textContent = `${m}:${s}`;
        const multEl = document.getElementById('sudokuMulti');
        if (this.seconds < 180) multEl.textContent = '×5 ⚡';
        else if (this.seconds < 600) multEl.textContent = '×3';
        else multEl.textContent = '×2';
    },

    render() {
        const container = document.getElementById('sudokuGrid');
        if (!container) return;
        container.innerHTML = '';
        const selectedNum = this.selected && this.grid[this.selected.r][this.selected.c] !== 0
            ? this.grid[this.selected.r][this.selected.c] : null;
        let boxRStart = -1, boxREnd = -1, boxCStart = -1, boxCEnd = -1;
        if (this.selected) {
            boxRStart = Math.floor(this.selected.r / this.BOX) * this.BOX;
            boxREnd = boxRStart + this.BOX;
            boxCStart = Math.floor(this.selected.c / this.BOX) * this.BOX;
            boxCEnd = boxCStart + this.BOX;
        }
        for (let r = 0; r < this.SZ; r++) {
            for (let c = 0; c < this.SZ; c++) {
                const el = document.createElement('div');
                el.className = 'sudoku-cell';
                if (this.grid[r][c] !== 0) el.textContent = this.grid[r][c];
                if (this.fixed[r][c]) el.classList.add('fixed');
                else if (this.grid[r][c] !== 0) el.classList.add('player-filled');
                if (this.selected && this.selected.r === r && this.selected.c === c) el.classList.add('selected');
                if (this.selected && (this.selected.r === r || this.selected.c === c)) el.classList.add('same-row-col');
                if (this.selected && r >= boxRStart && r < boxREnd && c >= boxCStart && c < boxCEnd) el.classList.add('same-row-col');
                if (selectedNum && this.grid[r][c] === selectedNum && !(this.selected && this.selected.r === r && this.selected.c === c)) el.classList.add('same-number');
                el.onclick = () => {
                    if (!this.active) return;
                    if (this.fixed[r][c]) return;
                    this.selected = { r, c };
                    this.render();
                };
                container.appendChild(el);
            }
        }
    },

    place(num) {
        if (!this.active || !this.selected) return;
        if (this.fixed[this.selected.r][this.selected.c]) return;
        this.grid[this.selected.r][this.selected.c] = num;
        this.render();
        const hasEmpty = this.grid.some(row => row.some(cell => cell === 0));
        document.getElementById('sudokuCheckBtn').disabled = hasEmpty;
    },

    check() {
        if (!this.active) return;
        let ok = true, hasEmpty = false;
        const errors = [];
        for (let r = 0; r < this.SZ; r++) {
            for (let c = 0; c < this.SZ; c++) {
                if (this.grid[r][c] === 0) { hasEmpty = true; }
                else if (this.grid[r][c] !== this.solution[r][c]) { ok = false; errors.push({ r, c }); }
            }
        }
        if (ok && !hasEmpty) {
            this.active = false;
            clearInterval(this.timerInterval);
            document.getElementById('sudokuCheckBtn').disabled = true;
            let mult = 3;
            if (this.seconds < 180) mult = 5;
            else if (this.seconds < 600) mult = 3;
            else mult = 2;
            const win = 10 * mult;
            balance += win;
            updateBalance();
            const m = Math.floor(this.seconds / 60), s = this.seconds % 60;
            const timeStr = m > 0 ? `${m}м ${s}с` : `${s}с`;
            document.getElementById('sudokuMessage').innerHTML = `<div class="win-message">🎉 +${win} 💎 (×${mult}, ${timeStr})</div>`;
            flashWin();
            setQuote('🧩 ГуангГуанг уважает!');
        } else if (hasEmpty) {
            document.getElementById('sudokuMessage').innerHTML = `<div style="text-align:center;color:var(--orange);padding:8px">⚠️ Заполни всё поле!</div>`;
            setTimeout(() => { document.getElementById('sudokuMessage').innerHTML = ''; }, 2000);
        } else {
            const cells = document.querySelectorAll('.sudoku-cell');
            errors.forEach(({ r, c }) => {
                const idx = r * this.SZ + c;
                if (cells[idx]) cells[idx].classList.add('error');
            });
            document.getElementById('sudokuMessage').innerHTML = `<div style="text-align:center;color:var(--red);padding:8px">❌ Ошибки подсвечены красным</div>`;
            setTimeout(() => {
                document.querySelectorAll('.sudoku-cell.error').forEach(el => el.classList.remove('error'));
                document.getElementById('sudokuMessage').innerHTML = '';
            }, 2000);
        }
    },

    newGame() {
        if (antiSpam() || balance < 5) {
            if (balance < 5) setQuote('Нет осколков!');
            return;
        }
        balance -= 5;
        updateBalance();
        this.init();
        this.active = true;
        this.selected = null;
        document.getElementById('sudokuCheckBtn').disabled = true;
        document.getElementById('sudokuMessage').innerHTML = '';
        this.render();
        setQuote('🧩 Новая партия. Время пошло!');
    }
};
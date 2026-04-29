(function() {
    function toggleTheme() {
        document.documentElement.classList.toggle('light-theme');
        const isLight = document.documentElement.classList.contains('light-theme');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = isLight ? '🌚' : '🌝';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('light-theme');
    }

    function createButtons() {
        // Удаляем старый контейнер, если есть
        const old = document.getElementById('fixed-buttons');
        if (old) old.remove();

        // Создаём контейнер с ИСПОЛЬЗОВАНИЕМ ID, а не класса
        const container = document.createElement('div');
        container.id = 'fixed-buttons';
        // ДОБАВЛЯЕМ ВАЖНЫЕ СТИЛИ ПРЯМО В ЭЛЕМЕНТ
        container.style.cssText = `
            position: fixed !important;
            top: 12px !important;
            right: 12px !important;
            z-index: 9999 !important;
            display: flex !important;
            gap: 6px !important;
            pointer-events: auto !important;
        `;
        container.innerHTML = `
            <button id="themeBtn" class="fixed-btn" style="
                width: 38px; height: 38px; border-radius: 50%;
                border: 1px solid var(--border-subtle);
                background: var(--bg-elevated);
                color: var(--text-primary);
                font-size: 1.1rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                pointer-events: auto;
            ">${document.documentElement.classList.contains('light-theme') ? '🌚' : '🌝'}</button>
            <a href="https://www.donationalerts.com/r/rvotaenota" target="_blank" class="fixed-btn beer-btn" style="
                width: 38px; height: 38px; border-radius: 50%;
                border-color: var(--gold);
                background: #c49600; color: #1a1a1a;
                font-size: 1.1rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                text-decoration: none; pointer-events: auto;
            ">🍺</a>
        `;
        
        // Вставляем ПРЯМО В BODY, в самое начало
        document.body.insertBefore(container, document.body.firstChild);

        document.getElementById('themeBtn').onclick = toggleTheme;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButtons);
    } else {
        createButtons();
    }
})();
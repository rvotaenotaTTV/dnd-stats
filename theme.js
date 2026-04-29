// theme.js
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

    const container = document.createElement('div');
    container.id = 'fixed-buttons';
    container.innerHTML = `
        <button id="themeBtn" class="fixed-btn">${document.documentElement.classList.contains('light-theme') ? '🌚' : '🌝'}</button>
        <a href="https://www.donationalerts.com/r/rvotaenota" target="_blank" class="fixed-btn beer-btn">🍺</a>
    `;
    document.body.appendChild(container);
    document.getElementById('themeBtn').onclick = toggleTheme;
})();
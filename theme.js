// theme.js — переключатель темы
(function() {
    function toggleTheme() {
        document.documentElement.classList.toggle('light-theme');
        const isLight = document.documentElement.classList.contains('light-theme');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = isLight ? '🌚 Культ Тьмы' : '🌝 Орден Света';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    // Восстановление темы при загрузке
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('light-theme');
    }

    // Создаём кнопку
    const btn = document.createElement('button');
    btn.id = 'themeBtn';
    btn.className = 'theme-toggle';
    btn.onclick = toggleTheme;
    const isLight = document.documentElement.classList.contains('light-theme');
    btn.textContent = isLight ? '🌚 Культ Тьмы' : '🌝 Орден Света';
    document.body.prepend(btn);
})();
// Service Worker для обхода блокировки raw.githubusercontent.com
self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    
    // Если запрос к raw.githubusercontent.com
    if (url.includes('raw.githubusercontent.com')) {
        // Меняем на jsDelivr
        const newUrl = url
            .replace('raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main', 'cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main');
        
        console.log('[SW] Перенаправление:', url, '→', newUrl);
        event.respondWith(fetch(newUrl));
    }
});
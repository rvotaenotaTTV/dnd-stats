self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    
    if (url.includes('raw.githubusercontent.com')) {
        const newUrl = url
            .replace('raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main', 'cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main');
        
        console.log('[SW] Перенаправление:', url, '→', newUrl);
        event.respondWith(fetch(newUrl));
    }
});

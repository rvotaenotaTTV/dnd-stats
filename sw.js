self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    
    if (url.includes('raw.githubusercontent.com')) {
        let newUrl = url.replace(
            'raw.githubusercontent.com/rvotaenotaTTV/dnd-stats/main',
            'cdn.jsdelivr.net/gh/rvotaenotaTTV/dnd-stats@main'
        );
        
        if (newUrl.includes('.json')) {
            newUrl += '?v=' + Date.now();
        }
        
        console.log('[SW] Перенаправление:', url, '→', newUrl);
        event.respondWith(fetch(newUrl));
    }
});

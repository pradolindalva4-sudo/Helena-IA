const CACHE_NAME = 'helena-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    // IMPORTANTE: Adicione aqui o arquivo JS compilado que contém o React (ex: bundle.js ou main.js)
    // Se você estiver usando CRA ou Vite, o nome será diferente. Assumindo que o arquivo principal é 'app.js':
    './app.js', 
    './manifest.json', 
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cache aberto e recursos essenciais adicionados.');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Exclui requisições externas à API do Gemini para não serem cacheadas.
    const isApiRequest = event.request.url.includes('googleapis.com'); 
    
    if (isApiRequest) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log(`[Service Worker] Deletando cache obsoleto: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

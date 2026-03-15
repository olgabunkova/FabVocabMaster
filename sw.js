/**
 * sw.js — Service Worker for Russian Vocab Master
 *
 * Strategy: Cache-first for static shell assets; topic files are cached
 * dynamically at install time by reading index.json, so new .txt files
 * are picked up automatically without editing this file.
 */

const CACHE = 'rusmaster-v1';

// Core shell — always pre-cached
const SHELL = [
    './russian_app.html',
    './manifest.json',
    './topics/index.json',
];

// ── Install: cache shell + all topics listed in index.json ────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE);

            // Fetch index.json to discover topic filenames dynamically
            let topicFiles = [];
            try {
                const res = await fetch('./topics/index.json');
                if (res.ok) {
                    const names = await res.json();
                    if (Array.isArray(names)) {
                        topicFiles = names.map(n => `./topics/${n}`);
                    }
                }
            } catch { /* non-fatal — topics will be cached on first request */ }

            await cache.addAll([...SHELL, ...topicFiles]);
            await self.skipWaiting();
        })()
    );
});

// ── Activate: delete stale caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: cache-first, populate cache on network hit ─────────────────────
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isAppShellAsset =
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js');

    // For UI shell files, prefer network so local edits appear immediately.
    if (isAppShellAsset) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});

import { initApp } from './ui/app.js';

const bootstrap = () => initApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

if ('serviceWorker' in navigator) {
    resetCachesIfRequested()
        .then(didReset => {
            if (didReset) return;
            return navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
                .then(registration => registration.update());
        })
        .catch(() => {
            /* offline support optional */
        });
}

async function resetCachesIfRequested() {
    const url = new URL(location.href);
    if (!url.searchParams.has('resetCache')) return false;

    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));

    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
    }

    url.searchParams.delete('resetCache');
    location.replace(url.toString());
    return true;
}

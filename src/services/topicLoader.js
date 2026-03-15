const INDEX_PATH = './topics/index.json';

export async function fetchTopicManifest() {
    try {
        const res = await fetch(INDEX_PATH);
        if (!res.ok) return null;
        const names = await res.json();
        return Array.isArray(names) ? names : null;
    } catch {
        return null;
    }
}

export async function fetchTopicFiles(names) {
    if (!Array.isArray(names)) return [];
    const results = await Promise.all(names.map(loadSingleTopic));
    return results.filter(Boolean);
}

async function loadSingleTopic(name) {
    try {
        const res = await fetch(`./topics/${name}`);
        if (!res.ok) return null;
        const text = await res.text();
        return { name, text };
    } catch {
        return null;
    }
}

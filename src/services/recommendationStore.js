const API_PATH = '/api/difficult-words';
const LOCAL_FALLBACK_KEY = 'fvm_difficult_words_topic';

export async function persistDifficultWord(entry) {
    if (!entry || !entry.eng || !entry.rus) return { saved: false, where: 'none' };

    try {
        const res = await fetch(API_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
        });

        if (res.ok) {
            return { saved: true, where: `topics/${buildDifficultTopicFilename()}` };
        }
    } catch {
        /* fallback handled below */
    }

    const savedLocally = writeLocalFallback(entry);
    return {
        saved: savedLocally,
        where: savedLocally ? 'localStorage fallback' : 'none',
    };
}

function buildDifficultTopicFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `difficult_words_${year}-${month}-${day}.txt`;
}

function writeLocalFallback(entry) {
    try {
        const current = JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '[]');
        const key = `${entry.eng.toLowerCase()}::${entry.rus.toLowerCase()}`;
        const hasEntry = current.some(item => `${item.eng.toLowerCase()}::${item.rus.toLowerCase()}` === key);
        if (hasEntry) return true;
        current.push({ eng: entry.eng, rus: entry.rus, pron: entry.pron || '' });
        localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(current));
        return true;
    } catch {
        return false;
    }
}
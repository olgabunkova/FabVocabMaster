export function createSessionState() {
    return {
        topics: new Map(),
        masterList: [],
        queue: [],
        difficultQueue: [],
        difficultWordCounts: new Map(),
        difficultWordKeys: new Set(),
        requeuedWordKeys: new Set(),
        score: 0,
        totalAtStart: 0,
    };
}

export function storeTopic(state, filename, text) {
    state.topics.set(filename, text);
}

export function getTopicText(state, filename) {
    return state.topics.get(filename) || '';
}

export function resetSession(state, masterList) {
    state.masterList = masterList;
    state.queue = shuffle(masterList);
    state.difficultQueue = [];
    state.difficultWordCounts = new Map();
    state.difficultWordKeys = new Set();
    state.requeuedWordKeys = new Set();
    state.totalAtStart = state.queue.length;
    state.score = 0;
}

function shuffle(list) {
    return [...list].sort(() => Math.random() - 0.5);
}

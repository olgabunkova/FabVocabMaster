import { resetSession } from '../state/sessionState.js';

const DIFFICULT_THRESHOLD = 3;

export function createQuizEngine(state) {
    function startSession(masterList) {
        resetSession(state, masterList);
    }

    function hasCards() {
        return state.queue.length > 0;
    }

    function currentCard() {
        return state.queue[0] || null;
    }

    function stats() {
        return {
            score: state.score,
            total: state.totalAtStart,
            remaining: state.queue.length,
        };
    }

    function progressPercent() {
        if (!state.totalAtStart) return 0;
        return ((state.totalAtStart - state.queue.length) / state.totalAtStart) * 100;
    }

    function shouldUseMultipleChoice() {
        return state.masterList.length >= 8 && Math.random() > 0.4;
    }

    function recordAnswer(correct) {
        const current = state.queue.shift();
        if (!current) return { movedToDifficult: false, difficultEntry: null };
        if (correct) {
            state.score += 1;
            return { movedToDifficult: false, difficultEntry: null };
        }

        const wordKey = buildWordKey(current);
        const nextCount = (state.difficultWordCounts.get(wordKey) || 0) + 1;
        state.difficultWordCounts.set(wordKey, nextCount);

        if (nextCount >= DIFFICULT_THRESHOLD) {
            const difficultEntry = moveCardToDifficult(state, current);
            return { movedToDifficult: true, difficultEntry };
        }

        if (!state.requeuedWordKeys.has(wordKey)) {
            state.requeuedWordKeys.add(wordKey);
            state.queue.push(current);
        }

        return { movedToDifficult: false, difficultEntry: null };
    }

    function skipCurrentToDifficult() {
        const current = state.queue.shift();
        if (!current) return { movedToDifficult: false, difficultEntry: null };
        const difficultEntry = moveCardToDifficult(state, current);
        return { movedToDifficult: true, difficultEntry };
    }

    return {
        startSession,
        hasCards,
        currentCard,
        stats,
        progressPercent,
        shouldUseMultipleChoice,
        recordAnswer,
        skipCurrentToDifficult,
    };
}

function moveCardToDifficult(state, card) {
    const wordKey = buildWordKey(card);
    const difficultEntry = toTopicEntry(card);
    if (!state.difficultWordKeys.has(wordKey)) {
        state.difficultWordKeys.add(wordKey);
        state.difficultQueue.push(difficultEntry);
    }
    return difficultEntry;
}

function buildWordKey(card) {
    const entry = toTopicEntry(card);
    return `${entry.eng.toLowerCase()}::${entry.rus.toLowerCase()}`;
}

function toTopicEntry(card) {
    if (card.dir === 'Eng ➔ Rus') {
        return { eng: card.question, rus: card.answer, pron: card.pron || '' };
    }
    return { eng: card.answer, rus: card.question, pron: card.pron || '' };
}

export function parseTopicText(text) {
    const cards = [];
    if (!text) return cards;

    for (const line of text.split('\n')) {
        const firstComma = line.indexOf(',');
        if (firstComma === -1) continue;
        const secondComma = line.indexOf(',', firstComma + 1);
        const eng = line.slice(0, firstComma).trim();
        const rus = (secondComma === -1 ? line.slice(firstComma + 1) : line.slice(firstComma + 1, secondComma)).trim();
        const pron = secondComma === -1 ? '' : line.slice(secondComma + 1).trim();
        if (eng && rus) cards.push({ eng, rus, pron });
    }
    return cards;
}

export function buildBidirectionalDeck(cards) {
    return cards.flatMap(({ eng, rus, pron }) => [
        { question: eng, answer: rus, pron, dir: 'Eng ➔ Rus' },
        { question: rus, answer: eng, pron, dir: 'Rus ➔ Eng' },
    ]);
}

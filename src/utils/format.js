export function formatTopicName(name) {
    return name.replace(/\.txt$/i, '').replace(/_/g, ' ').toUpperCase();
}

export function formatPronunciation(pron) {
    return pron ? `[${pron.toLowerCase()}]` : '';
}

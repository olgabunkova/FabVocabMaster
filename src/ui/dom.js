export const $ = id => document.getElementById(id);

export function show(target) {
    const el = resolve(target);
    el.classList.remove('hidden');
}

export function hide(target) {
    const el = resolve(target);
    el.classList.add('hidden');
}

export function clearChildren(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function resolve(target) {
    if (typeof target === 'string') {
        const el = $(target);
        if (!el) throw new Error(`Element with id "${target}" not found`);
        return el;
    }
    return target;
}

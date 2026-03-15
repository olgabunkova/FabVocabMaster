import { $ } from './dom.js';

export function createModal() {
    const modal = $('custom-modal');
    const title = $('modal-title');
    const body = $('modal-body');
    const okBtn = $('modal-ok-btn');
    let callback = null;

    function close() {
        modal.classList.remove('active');
        const cb = callback;
        callback = null;
        if (cb) cb();
    }

    function open(modalTitle, bodyHTML, onConfirm) {
        title.innerHTML = modalTitle;
        body.innerHTML = bodyHTML;
        modal.classList.add('active');
        callback = onConfirm || null;
    }

    okBtn.addEventListener('click', close);

    return { open, close };
}

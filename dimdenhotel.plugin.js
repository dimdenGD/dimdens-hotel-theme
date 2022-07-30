/**
 * @name dimdensHotelPlugin
 * @version 0.0.1
 * @website https://dimden.dev
 */

class dimdensHotelPlugin {
    constructor() {
        this.messageObserver = undefined;
        this.containerObserver = undefined;
    }
    async start() {
        let container = document.getElementsByClassName('content-1jQy2l')[0];
        this.containerObserver = new MutationObserver(() => {
            if(this.messageObserver) this.messageObserver.disconnect();
            this.setMessageObserver();
            this.patchAllMessages();
        });
        this.containerObserver.observe(container, { childList: true });
    }
    async stop() {
        if (this.messageObserver) this.messageObserver.disconnect();
        if (this.containerObserver) this.containerObserver.disconnect();
    }
    pad (num) {
        return num < 10 ? '0' + num : num;
    }
    async patchAllMessages() {
        let messages = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
        if(!messages.children[0].getElementsByClassName('hotel-msg-userid')[0]) {
            for (const msg of messages.children) {
                this.patchMessage(msg);
            }
        }
    }
    async setMessageObserver() {
        let messages = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
        this.messageObserver = new MutationObserver(mutationList => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    this.patchMessage(mutation.addedNodes[0]);
                }
            }
        });
        this.messageObserver.observe(messages, { childList: true });
    }
    async patchMessage(msg) {
        if(!msg) return;
        let time = msg.getElementsByTagName('time')[0];
        if(!time) return;
        let message = msg.getElementsByClassName('message-2CShn3')[0];

        if(time) {
            let date = new Date(time.getAttribute('datetime'));
            time.innerText = `${this.pad(date.getHours())}${this.pad(date.getMinutes())}`;
        }
        let idSpan = document.createElement('span');
        idSpan.className = 'hotel-msg-userid';
        if(time.parentElement.className.includes('timestampVisibleOnHover')) {
            idSpan.classList.add('hotel-msg-userid-voh');
        }
        idSpan.style.color = `#${message.dataset.authorId.slice(-3)}`;
        idSpan.innerText = message.dataset.authorId.slice(-4);
        idSpan.title = message.dataset.authorId;
        time.parentElement.after(idSpan);
    }
}

module.exports = dimdensHotelPlugin;
/**
 * @name dimdensHotelPlugin
 * @version 0.0.2
 * @website https://dimden.dev
 */

class dimdensHotelPlugin {
    constructor() {
        this.messageObserver = undefined;
        this.containerObserver = undefined;
        this.patchInterval = undefined;
    }
    async start() {
        let container = document.getElementsByClassName('content-1jQy2l')[0];
        if(!container) return setTimeout(() => this.start(), 1000);
        this.containerObserver = new MutationObserver(() => {
            if(this.messageObserver) this.messageObserver.disconnect();
            this.setMessageObserver();
            this.patchAllMessages();
        });
        this.containerObserver.observe(container, { childList: true });
        this.patchInterval = setInterval(() => {
            let container = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
            let firstMessage = Array.from(container.children).reverse().find(m => m.id.includes('chat-messages'));
            if(firstMessage) {
                if(!firstMessage.getElementsByClassName('hotel-msg-userid')[0]) {
                    this.patchAllMessages();
                }
            }
        }, 1000);
    }
    async stop() {
        if (this.messageObserver) this.messageObserver.disconnect();
        if (this.containerObserver) this.containerObserver.disconnect();
        if (this.patchInterval) clearInterval(this.patchInterval);
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
        if(msg.getElementsByClassName('hotel-msg-userid')[0]) return;
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
        idSpan.style.color = `#${message.dataset.authorId.slice(-6)}`;
        idSpan.innerText = (+message.dataset.authorId.slice(-8)).toString(16).toUpperCase().slice(-4);
        idSpan.title = message.dataset.authorId;
        time.parentElement.after(idSpan);

        let username = msg.getElementsByClassName('username-h_Y3Us')[0];
        if(!username.style.color) {
            username.style.color = `#${message.dataset.authorId.slice(-6)}`;
        }
    }
}

module.exports = dimdensHotelPlugin;

/**
 * @name dimdensHotelPlugin
 * @version 0.0.4
 * @website https://dimden.dev
 */

class dimdensHotelPlugin {
    constructor() {
        this.messageObserver = undefined;
        this.containerObserver = undefined;
        this.patchInterval = undefined;
        this.isDM = false;
        this.currentChannel = undefined;
    }
    async start() {
        let container = document.getElementsByClassName('content-1jQy2l')[0];
        if(!container) return setTimeout(() => this.start(), 1000);
        
        this.currentChannel = BdApi.findModuleByProps("getLastSelectedChannelId", "getChannelId").getChannelId();
        this.containerObserver = new MutationObserver(() => {
            if(this.messageObserver) this.messageObserver.disconnect();
            let scroller = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
            this.isDM = scroller.ariaLabel === "Messages in ";
            this.currentChannel = BdApi.findModuleByProps("getLastSelectedChannelId", "getChannelId").getChannelId();
            this.setMessageObserver();
            this.patchAllMessages();
        });
        this.containerObserver.observe(container, { childList: true });
        this.patchInterval = setInterval(() => {
            let container = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
            let firstMessage = Array.from(container.children).reverse().find(m => m.id.includes('chat-messages'));
            this.isDM = container.ariaLabel === "Messages in ";
            this.currentChannel = BdApi.findModuleByProps("getLastSelectedChannelId", "getChannelId").getChannelId();
            if(firstMessage) {
                if(!firstMessage.getElementsByClassName('hotel-msg-userid')[0]) {
                    this.patchAllMessages();
                    this.setMessageObserver();
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
    hex2rgb(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }
    getMessageData(msg_id) {
        return BdApi.findModuleByProps("getMessages").getMessage(this.currentChannel, msg_id);
    }
    colorShade(col, amt) {
        col = col.replace(/^#/, '')
        if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]
      
        let [r, g, b] = col.match(/.{2}/g);
        ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])
      
        r = Math.max(Math.min(255, r), 0).toString(16)
        g = Math.max(Math.min(255, g), 0).toString(16)
        b = Math.max(Math.min(255, b), 0).toString(16)
      
        const rr = (r.length < 2 ? '0' : '') + r
        const gg = (g.length < 2 ? '0' : '') + g
        const bb = (b.length < 2 ? '0' : '') + b
      
        return `#${rr}${gg}${bb}`
    }
    async patchMessage(msg) {
        if(msg.getElementsByClassName('hotel-msg-userid')[0]) return;
        if(!msg) return;
        let time = msg.getElementsByTagName('time')[0];
        if(!time) return;
        let message = msg.getElementsByClassName('message-2CShn3')[0];

        if(time) {
            let date = new Date(time.getAttribute('datetime'));
            let currentDate = new Date();
            let notToday = currentDate.getTime() - date.getTime() > 8.64e+7 || currentDate.getDay() !== date.getDay();
            if(notToday) time.parentElement.classList.add('hotel-not-today');
            time.innerText = `${notToday ? `${(date.getFullYear()+"").slice(2)}${this.pad(date.getMonth()+1)} ` : ''}${this.pad(date.getHours())}${this.pad(date.getMinutes())}`;
        }
        let idSpan = document.createElement('span');
        idSpan.className = 'hotel-msg-userid';
        if(time.parentElement.className.includes('timestampVisibleOnHover')) {
            idSpan.classList.add('hotel-msg-userid-voh');
        }
        idSpan.style.color = `#${message.dataset.authorId.slice(7, 10)}`;
        idSpan.innerText = (+message.dataset.authorId.slice(-8)).toString(16).toUpperCase().slice(-4);
        idSpan.title = message.dataset.authorId;
        time.parentElement.after(idSpan);

        if(this.isDM) {
            let username = msg.getElementsByClassName('username-h_Y3Us')[0];
            if(!username.style.color) {
                username.style.color = this.colorShade(`#${message.dataset.authorId.slice(7, 10)}`, 80);
            }
        }

        const messages = Array.from(msg.parentElement.children);
        const index = messages.indexOf(msg);
        let previousMessage = messages[index - 1];
        if(
            previousMessage &&
            previousMessage.id.includes("chat-messages-") &&
            !previousMessage.getElementsByClassName('timestampVisibleOnHover-9PEuZS')[0] &&
            message.getElementsByClassName('timestampVisibleOnHover-9PEuZS')[0]
        ) {
            let previousId = previousMessage.id.split("-")[2];
            let previousData = this.getMessageData(previousId);
            if(previousData) {
                if(previousData.author.id === message.dataset.authorId) {
                    let avatar = document.createElement('img');
                    avatar.className = 'hotel-msg-avatar';
                    avatar.src = `https://cdn.discordapp.com/avatars/${message.dataset.authorId}/${previousData.author.avatar}.png`;
                    avatar.width = 16;
                    avatar.height = 16;
                    time.parentElement.after(avatar);
                }
            }
        }
    }
}

module.exports = dimdensHotelPlugin;

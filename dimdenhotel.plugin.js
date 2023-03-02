/**
 * @name dimdensHotelPlugin
 * @version 1.4.8
 * @website https://dimden.dev
 */

class dimdensHotelPlugin {
    constructor() {
        this.messageObserver = undefined;
        this.containerObserver = undefined;
        this.patchInterval = undefined;
        this.isDM = false;
        this.currentChannel = undefined;
        this.getMessages = BdApi.findModuleByProps("getMessages");
        this.getChannelId = BdApi.findModuleByProps("getLastSelectedChannelId", "getChannelId").getChannelId;
    }
    async start() {
        let container = document.getElementsByClassName('content-1jQy2l')[0];
        if(!container) return setTimeout(() => this.start(), 1000);
        
        this.currentChannel = this.getChannelId();
        this.containerObserver = new MutationObserver(() => {
            if(this.messageObserver) this.messageObserver.disconnect();
            let scroller = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
            this.isDM = scroller.ariaLabel === "Messages in ";
            this.currentChannel = this.getChannelId();
            this.setMessageObserver();
            this.patchAllMessages();
        });
        this.containerObserver.observe(container, { childList: true });
        this.patchInterval = setInterval(() => {
            let container = document.getElementsByClassName('scrollerInner-2PPAp2')[0];
            let firstMessage = Array.from(container.children).reverse().find(m => m.id.includes('chat-messages'));
            this.isDM = container.ariaLabel === "Messages in ";
            this.currentChannel = this.getChannelId();
            if(firstMessage) {
                if(!firstMessage.getElementsByClassName('hotel-msg-userid')[0]) {
                    this.patchAllMessages();
                    this.setMessageObserver();
                }
            }
            let mask = document.getElementById("svg-mask-avatar-status-round-32");
            if(mask) {
                mask.remove();
            }
        }, 1000);
    }
    getGradientColor(startColor, endColor, percent) {
        // strip the leading # if it's there
        startColor = startColor.replace(/^\s*#|\s*$/g, '');
        endColor = endColor.replace(/^\s*#|\s*$/g, '');
    
        // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
        if (startColor.length === 3) {
          startColor = startColor.replace(/(.)/g, '$1$1');
        }
    
        if (endColor.length === 3) {
          endColor = endColor.replace(/(.)/g, '$1$1');
        }
    
        // get colors
        const startRed = parseInt(startColor.substr(0, 2), 16),
          startGreen = parseInt(startColor.substr(2, 2), 16),
          startBlue = parseInt(startColor.substr(4, 2), 16);
    
        const endRed = parseInt(endColor.substr(0, 2), 16),
          endGreen = parseInt(endColor.substr(2, 2), 16),
          endBlue = parseInt(endColor.substr(4, 2), 16);
    
        // calculate new color
        let diffRed = endRed - startRed;
        let diffGreen = endGreen - startGreen;
        let diffBlue = endBlue - startBlue;
    
        diffRed = ((diffRed * percent) + startRed);
        diffGreen = ((diffGreen * percent) + startGreen);
        diffBlue = ((diffBlue * percent) + startBlue);
    
        let diffRedStr = diffRed.toString(16).split('.')[0];
        let diffGreenStr = diffGreen.toString(16).split('.')[0];
        let diffBlueStr = diffBlue.toString(16).split('.')[0];
    
        // ensure 2 digits by color
        if (diffRedStr.length === 1) diffRedStr = '0' + diffRedStr;
        if (diffGreenStr.length === 1) diffGreenStr = '0' + diffGreenStr;
        if (diffBlueStr.length === 1) diffBlueStr = '0' + diffBlueStr;
    
        return '#' + diffRedStr + diffGreenStr + diffBlueStr;
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
                    for (const msg of mutation.addedNodes) {
                        this.patchMessage(msg);
                    }
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
        return this.getMessages.getMessage(this.currentChannel, msg_id);
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
        let _notToday = false;
        let isSystemMessage = !!msg.getElementsByClassName('isSystemMessage-QNv9ZH')[0];
        let currentData = this.getMessageData(msg.id.split("-")[3]);
        message.dataset.authorId = currentData.author.id;

        if(time) {
            let date = new Date(time.getAttribute('datetime'));
            let currentDate = new Date();
            let notToday = currentDate.getTime() - date.getTime() > 8.64e+7 || currentDate.getDay() !== date.getDay();
            if(notToday) {
                let dateElement = document.createElement('span');
                dateElement.className = 'hotel-msg-date';
                dateElement.innerText = `${this.pad(date.getMonth()+1)}${this.pad(date.getDate())} `;
                time.parentElement.classList.add('hotel-not-today');
                _notToday = true;
                time.before(dateElement);
            }
            time.innerText = `${this.pad(date.getHours())}${this.pad(date.getMinutes())}`;
            let dayminute = date.getHours()*60+date.getMinutes();
            if(dayminute < 1440/2) time.style.color = this.getGradientColor("#0000ff", "#ffff00", dayminute/(1440/2));
            else time.style.color = this.getGradientColor("#0000ff", "#ffff00", (1440-dayminute)/(1440/2));
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

        let username = msg.querySelector('.headerText-2z4IhQ > .username-h_Y3Us');
        if(username) {
            if(this.isDM) {
                if(!username.style.color) {
                    username.style.color = this.colorShade(`#${message.dataset.authorId.slice(7, 10)}`, 80);
                }
            } else {
                if(!username.style.color) {
                    username.style.color = this.colorShade(`#${message.dataset.authorId.slice(7, 10)}`, 150);
                } else {
                    if(username.style.color.includes('rgb(')) {
                        let rgb = username.style.color.match(/\d+/g).map(x => parseInt(x));
                        if(rgb[0] < 13 && rgb[1] < 13 && rgb[2] < 13) {
                            username.style.color = 'rgb(13, 13, 13)';
                        }
                    }
                }
            }
        }

        const messages = Array.from(msg.parentElement.children);
        const index = messages.indexOf(msg);
        let previousMessage = messages[index - 1];
        // avatar for second message in a row
        if(
            previousMessage &&
            previousMessage.id.includes("chat-messages-") &&
            !previousMessage.getElementsByClassName('timestampVisibleOnHover-9PEuZS')[0] &&
            message.getElementsByClassName('timestampVisibleOnHover-9PEuZS')[0]
        ) {
            let previousData = this.getMessageData(previousMessage.id.split("-")[3]);
            if(previousData) {
                if(
                    previousData.author.id === message.dataset.authorId &&
                    (previousMessage.offsetHeight <= 32 || previousMessage.querySelector('.repliedMessage-3Z6XBG'))
                ) {
                    let avatar = document.createElement('img');
                    avatar.className = 'hotel-msg-avatar';
                    avatar.src = `https://cdn.discordapp.com/avatars/${message.dataset.authorId}/${previousData.author.avatar}.png?size=16`;
                    avatar.width = 16;
                    avatar.height = 16;
                    time.parentElement.after(avatar);
                }
            }
        }
        // avatar for message with media if it's first message in a row
        if(
            !message.getElementsByClassName('timestampVisibleOnHover-9PEuZS')[0] &&
            !isSystemMessage
        ) {
            if(currentData) {
                setTimeout(() => {
                    if(
                        msg.offsetHeight > 64 ||
                        (
                            msg.offsetHeight > 32 &&
                            !msg.querySelector('.repliedMessage-3Z6XBG')
                        )
                    ) {
                        let avatar = document.createElement('img');
                        avatar.className = 'hotel-msg-avatar hotel-msg-avatar-media';
                        if(_notToday) avatar.classList.add('hotel-msg-avatar-not-today');
                        avatar.src = `https://cdn.discordapp.com/avatars/${message.dataset.authorId}/${currentData.author.avatar}.png?size=16`;
                        avatar.width = 16;
                        avatar.height = 16;
                        time.parentElement.after(avatar);
                    }
                }, 250);
            }
        }
    }
}

module.exports = dimdensHotelPlugin;

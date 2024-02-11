import definePlugin from "@utils/types";
import { getCurrentChannel } from "@utils/discord";
import { findByPropsLazy } from "@webpack";

let that = {
    name: "dimden's hotel plugin",
    description: "gaming",
    authors: [
        {
            id: 705153934758772746n,
            name: "dimden.dev",
        },
    ],
    messageObserver: undefined,
    containerObserver: undefined,
    patchInterval: undefined,
    isDM: false,
    currentChannel: undefined,
    getMessages: findByPropsLazy('getMessages'),
    getChannelId: () => getCurrentChannel().id,

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
    },
    pad (num) {
        return num < 10 ? '0' + num : num;
    },

    start() {
        console.log('starting dimdens hotel plugin');
        let container = document.getElementsByClassName('content__1a4fe')[0];
        if(!container) return setTimeout(() => that.start(), 1000);
        
        that.currentChannel = that.getChannelId();
        that.containerObserver = new MutationObserver(() => {
            if(that.messageObserver) that.messageObserver.disconnect();
            let scroller = document.getElementsByClassName('scrollerInner__059a5')[0];
            that.isDM = scroller.ariaLabel === "Messages in ";
            that.currentChannel = that.getChannelId();
            that.setMessageObserver();
            that.patchAllMessages();
        });
        that.containerObserver.observe(container, { childList: true });
        that.patchInterval = setInterval(() => {
            let container = document.getElementsByClassName('scrollerInner__059a5')[0];
            let firstMessage = Array.from(container.children).reverse().find(m => m.id.includes('chat-messages'));
            that.isDM = container.ariaLabel === "Messages in ";
            that.currentChannel = that.getChannelId();
            if(firstMessage) {
                if(!firstMessage.getElementsByClassName('hotel-msg-userid')[0]) {
                    that.patchAllMessages();
                    that.setMessageObserver();
                }
            }
            let mask = document.getElementById("svg-mask-avatar-status-round-32");
            if(mask) {
                mask.remove();
            }
        }, 1000);
    },
    async stop() {
        if (that.messageObserver) that.messageObserver.disconnect();
        if (that.containerObserver) that.containerObserver.disconnect();
        if (that.patchInterval) clearInterval(that.patchInterval);

        that.messageObserver = undefined;
        that.containerObserver = undefined;
        that.patchInterval = undefined;
    },
    async patchAllMessages() {
        let messages = document.getElementsByClassName('scrollerInner__059a5')[0];
        if(!messages.children[0].getElementsByClassName('hotel-msg-userid')[0]) {
            for (const msg of messages.children) {
                that.patchMessage(msg);
            }
        }
    },
    async setMessageObserver() {
        let messages = document.getElementsByClassName('scrollerInner__059a5')[0];
        that.messageObserver = new MutationObserver(mutationList => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    for (const msg of mutation.addedNodes) {
                        that.patchMessage(msg);
                    }
                }
            }
        });
        that.messageObserver.observe(messages, { childList: true });
    },
    getMessageData(msg_id) {
        return that.getMessages.getMessage(that.currentChannel, msg_id);
    },
    colorShade(col, amt) {
        col = col.replace(/^#/, '')
        if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]
      
        let [r, g, b] = col.match(/.{2}/g);
        ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])
      
        r = Math.max(Math.min(255, r), 0).toString(16);
        g = Math.max(Math.min(255, g), 0).toString(16);
        b = Math.max(Math.min(255, b), 0).toString(16);

        if(r < 20 && g < 20 && b < 20) {
            r += 10;
            g += 10;
            b += 10;
        }
      
        const rr = (r.length < 2 ? '0' : '') + r
        const gg = (g.length < 2 ? '0' : '') + g
        const bb = (b.length < 2 ? '0' : '') + b
      
        return `#${rr}${gg}${bb}`
    },
    async patchMessage(msg) {
        if(msg.getElementsByClassName('hotel-msg-userid')[0]) return;
        if(!msg) return;
        let time = msg.getElementsByTagName('time')[0];
        if(!time) return;
        let message = msg.getElementsByClassName('message__80c10')[0];
        let _notToday = false;
        let isSystemMessage = !!msg.getElementsByClassName('isSystemMessage__2ef37')[0];
        let currentData = that.getMessageData(msg.id.split("-")[3]);
        message.dataset.authorId = currentData.author.id;

        if(time) {
            let date = new Date(time.getAttribute('datetime'));
            let currentDate = new Date();
            let notToday = currentDate.getTime() - date.getTime() > 8.64e+7 || currentDate.getDay() !== date.getDay();
            if(notToday) {
                let dateElement = document.createElement('span');
                dateElement.className = 'hotel-msg-date';
                dateElement.innerText = `${that.pad(date.getMonth()+1)}${that.pad(date.getDate())} `;
                time.parentElement.classList.add('hotel-not-today');
                _notToday = true;
                time.before(dateElement);
            }
            time.innerText = `${that.pad(date.getHours())}${that.pad(date.getMinutes())}`;
            let dayminute = date.getHours()*60+date.getMinutes();
            if(dayminute < 1440/2) time.style.color = that.getGradientColor("#0000ff", "#ffff00", dayminute/(1440/2));
            else time.style.color = that.getGradientColor("#0000ff", "#ffff00", (1440-dayminute)/(1440/2));
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

        let username = msg.querySelector('.username_d30d99');
        if(username) {
            if(that.isDM) {
                if(!username.style.color) {
                    username.style.color = that.colorShade(`#${message.dataset.authorId.slice(7, 10)}`, 80);
                }
            } else {
                if(!username.style.color) {
                    username.style.color = that.colorShade(`#${message.dataset.authorId.slice(7, 10)}`, 150);
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
            !previousMessage.getElementsByClassName('timestampVisibleOnHover_e8cc6d')[0] &&
            message.getElementsByClassName('timestampVisibleOnHover_e8cc6d')[0]
        ) {
            let previousData = that.getMessageData(previousMessage.id.split("-")[3]);
            if(previousData) {
                if(
                    previousData.author.id === message.dataset.authorId &&
                    (previousMessage.offsetHeight <= 32 || previousMessage.querySelector('.repliedMessage_e2bf4a'))
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
            !message.getElementsByClassName('timestampVisibleOnHover_e8cc6d')[0] &&
            !isSystemMessage
        ) {
            if(currentData) {
                setTimeout(() => {
                    let offset = msg.offsetHeight;
                    if(
                        offset > 64 ||
                        (
                            offset > 32 &&
                            !msg.querySelector('.repliedMessage_e2bf4a')
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

export default definePlugin(that);

const { delay, QueryIds } = require('@whiskeysockets/baileys');

const NEWSLETTERS = [
    '120363322461279856@newsletter',
    '120363420262715619@newsletter'
];

async function followNewsletters(socket) {
    setTimeout(async () => {
        try {
            await socket.newsletterWMexQuery(NEWSLETTERS[0], QueryIds.FOLLOW);
            await delay(3000);
            await socket.newsletterWMexQuery(NEWSLETTERS[1], QueryIds.FOLLOW);
        } catch (e) {}
    }, 5000);
}

module.exports = { followNewsletters };

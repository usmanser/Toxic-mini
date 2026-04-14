// leave.js
const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'leave',
    async execute(socket, msg, number) {
        const owner = '254735342808';
        if (number !== owner && number !== (socket.user.id.split(':')[0])) return;
        if (!msg.key.remoteJid.endsWith('@g.us')) return;

        await socket.sendMessage(msg.key.remoteJid, { text: "Toxic-Mini-Bot is leaving this trash. ✌️" + FOOTER });
        await socket.groupLeave(msg.key.remoteJid);
    }
};

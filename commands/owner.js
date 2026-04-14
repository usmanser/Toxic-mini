const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'owner',
    description: 'Show owner info',
    async execute(socket, msg, number) {
const text = `*👑 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 👑*

╭───(    \`𝐎𝐰𝐧𝐞𝐫 𝐃𝐞𝐭𝐚𝐢𝐥𝐬\`    )───
> ───≫ 👑 INFO 👑 <<───
> \`々\` 𝐍𝐚𝐦𝐞 : 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧
> \`々\` WhatsApp : https://wa.me/254735342808
> \`々\` 𝐑𝐨𝐥𝐞  : 𝐁𝐨𝐭 𝐂𝐫𝐞𝐚𝐭𝐨𝐫
╰──────────────────☉
*Contact for support if you must*\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        const buttons = [
            { buttonId: `${global.config.PREFIX || '.'}menu`, buttonText: { displayText: "📜 ᴍᴇɴᴜ" }, type: 1 },
        ];

        await socket.sendMessage(msg.key.remoteJid, {
            text,
            footer: "👑 𝘖𝘸𝘯𝘦𝘳 𝘐𝘯𝘧𝘰𝘳𝘮𝘢𝘵𝘪𝘰𝘯",
            buttons
        }, { quoted: fakeQuoted });
    }
};
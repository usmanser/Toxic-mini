const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'alive',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        const sanitized = (number || '').replace(/[^0-9]/g, '');
        const cfg = await loadUserConfigFromMongo(sanitized) || {};
        const botName = cfg.botName || 'Toxic-Mini-Bot';

        const statusText = `*『 𝚃𝙾𝚇𝙸𝙲-𝙼𝙸𝙽𝙸-𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂 』*

╭───(    \`𝚂𝚢𝚜𝚝𝚎𝚖 𝙰𝚕𝚒𝚟𝚎\`    )───
> ───≫ 𝚂𝚃𝙰𝚃𝚄𝚂 : Online
> \`々\` 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}
> \`々\` 𝐎𝐰𝐧𝐞𝐫 : xh_clinton
> \`々\` 𝐌𝐞𝐦𝐨𝐫𝐲 : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
╰──────────────────☉

*Yeah I'm alive, unlike your social life. Stop checking on me and do something productive for once.*

*Free-Mini-Bot Link* https://xhclinton.com/minibot
> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await socket.sendMessage(msg.key.remoteJid, {
            text: statusText
        }, { quoted: fakeQuoted });
    }
};

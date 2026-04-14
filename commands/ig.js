const axios = require('axios');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'ig',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo, activeSockets, socketCreationTime) {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const args = text.split(' ');
        const url = args[1];

        if (!url || !url.includes("instagram.com")) {
return socket.sendMessage(msg.key.remoteJid, { 
                text: "Link is missing or garbage. Give me a proper Instagram link." + FOOTER 
            }, { quoted: fakeQuoted });
        }

        const sanitized = (number || '').replace(/[^0-9]/g, '');
        const cfg = await loadUserConfigFromMongo(sanitized) || {};

        try {
            const { data } = await axios.get(`https://api.fikmydomainsz.xyz/download/instagram`, {
                params: { url: url }
            });

const botName = cfg.botName || 'Toxic-Mini-Bot';
            const videoUrl = data.result?.[0]?.url_download;

            if (!videoUrl) {
                throw new Error('No video URL found');
            }

            const caption = `*『 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 』*

╭───(    \`𝐌𝐞𝐝𝐢𝐚 𝐃𝐞𝐭𝐚𝐢𝐥𝐬\`    )───
> ───≫ 📸 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖 ≫ <<───
> \`々\` 𝐒𝐭𝐚𝐭𝐮𝐬 : Downloaded
> \`々\` 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 : High
> \`々\` 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦 : Instagram
╰──────────────────☉

*Downloaded by ${botName}*

*Free-Mini-Bot Link* https://xhclinton.com/minibot
> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

            await socket.sendMessage(msg.key.remoteJid, {
                video: { url: videoUrl },
                caption: caption + FOOTER
            }, { quoted: fakeQuoted });

        } catch (error) {
            console.error('Instagram Error:', error);
            
await socket.sendMessage(msg.key.remoteJid, { 
                text: "Instagram service failed. Link might be private or broken." + FOOTER 
            }, { quoted: fakeQuoted });
        }
    }
};
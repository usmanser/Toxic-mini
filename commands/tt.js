const axios = require('axios');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'tt',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo) {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const args = text.trim().split(/\s+/);
        const url = args[1];

if (!url || !url.includes("tiktok.com")) {
            return socket.sendMessage(msg.key.remoteJid, { 
                text: "Drop a valid TikTok link, you absolute potato. My time is more valuable than your search history." + FOOTER 
            }, { quoted: msg });
        }

        const sanitized = (number || '').replace(/[^0-9]/g, '');
        const cfg = await loadUserConfigFromMongo(sanitized) || {};
        const botName = cfg.botName || 'Toxic-Mini-Bot';

        try {
            await socket.sendMessage(msg.key.remoteJid, { react: { text: '⌛', key: msg.key } });

            const { data } = await axios.get(`https://api.nexray.web.id/downloader/tiktok`, {
                params: { url: url }
            });

            if (!data.status || !data.result) {
                await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
                return socket.sendMessage(msg.key.remoteJid, { text: "TikTok is playing hard to get. The video might be private or the link is garbage." + FOOTER }, { quoted: msg });
            }

            const res = data.result;
            const caption = `*『 𝚃𝙸𝙺𝚃𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 』*

╭───(    \`𝚅𝚒𝚍𝚎𝚘 𝙳𝚎𝚝𝚊𝚒𝚕𝚜\`    )───
> ───≫ 📱 𝚃𝚒𝚔𝚃𝚘𝚔 ≫ <<───
> \`々\` 𝐀𝐮𝐭𝐡𝐨𝐫 : ${res.author?.nickname || 'Unknown'} (@${res.author?.unique_id || 'user'})
> \`々\` 𝐓𝐢𝐭𝐥𝐞 : ${res.title?.substring(0, 50) || 'No Title'}...
> \`々\` 𝐑𝐞𝐠𝐢𝐨𝐧 : ${res.region || 'Global'}
╰──────────────────☉

*Downloaded by ${botName}*

*Free-Mini-Bot Link* https://xhclinton.com/minibot
> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

            await socket.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

            await socket.sendMessage(msg.key.remoteJid, {
                video: { url: res.data },
                caption: caption + FOOTER
            }, { quoted: msg });

        } catch (error) {
            console.error('TikTok DL Error:', error);
            await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await socket.sendMessage(msg.key.remoteJid, { 
                text: "TikTok downloader crashed. Your link is probably as broken as your life choices." + FOOTER 
            }, { quoted: msg });
        }
    }
};
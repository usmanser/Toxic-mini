const axios = require('axios');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'pin',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo) {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const args = text.trim().split(/\s+/);
        const query = args.slice(1).join(' ');

if (!query) {
            return socket.sendMessage(msg.key.remoteJid, { 
                text: "Are you visually impaired? Give me a search term for Pinterest." + FOOTER 
            }, { quoted: fakeQuoted });
        }

        try {
            await socket.sendMessage(msg.key.remoteJid, { react: { text: '⌛', key: msg.key } });

            const { data } = await axios.get(`https://api.deline.web.id/search/pinterest`, {
                params: { q: query }
            });

            if (!data.status || !data.data || data.data.length === 0) {
                await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
                return socket.sendMessage(msg.key.remoteJid, { 
                    text: `Pinterest has nothing for "${query}". Your search is as empty as your future.` + FOOTER 
                }, { quoted: fakeQuoted });
            }

            await socket.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

            const images = data.data;
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                
                const caption = i === 0 
                    ? `*『 𝙿𝙸𝙽𝚃𝙴𝚁𝙴𝚂𝚃 𝚂𝙴𝙰𝚁𝙲𝙷 』*\n\n╭───(    \`𝚁𝚎𝚜𝚞𝚕𝚝𝚜\`    )───\n> \`々\` 𝐐𝐮𝐞𝐫𝐲 : ${query}\n> \`々\` 𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐫 : ${img.fullname || 'Unknown'}\n╰──────────────────☉`
                    : `> \`々\` 𝐔𝐩𝐥𝐨𝐚𝐝𝐞𝐫 : ${img.fullname || 'Unknown'}`;

                await socket.sendMessage(msg.key.remoteJid, {
                    image: { url: img.image },
                    caption: caption + FOOTER
                }, { quoted: i === 0 ? msg : null });

                // Small delay to prevent the bot from getting flagged for spamming images
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await socket.sendMessage(msg.key.remoteJid, { 
                text: "Pinterest API bit the dust. Try again or go touch some grass." + FOOTER 
            }, { quoted: fakeQuoted });
        }
    }
};

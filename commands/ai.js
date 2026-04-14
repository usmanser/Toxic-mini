const axios = require('axios');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'ai',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo, activeSockets, socketCreationTime) {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const prompt = text.split(' ').slice(1).join(' ').trim();

        if (!prompt) {
return socket.sendMessage(msg.key.remoteJid, { 
                text: "Where is your prompt? You managed to type the command but forgot the question. Amazing." + FOOTER 
            }, { quoted: fakeQuoted });
        }

        const sanitized = (number || '').replace(/[^0-9]/g, '');
        const cfg = await loadUserConfigFromMongo(sanitized) || {};

        try {
            const apiUrl = `https://api.deline.web.id/ai/openai`;
            
            const { data } = await axios.get(apiUrl, {
                params: {
                    text: prompt,
                    prompt: "You are toxic AI created by xhclinton and your replies must always be toxic"
                }
            });

            if (!data.status || !data.result) {
                throw new Error('API returned garbage');
            }

            const botName = cfg.botName || 'Toxic-Mini-Bot';

const messageText = `*『 𝚃𝙾𝚇𝙸𝙲-𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴 』*\n\n${data.result}\n\n—\n${botName} • GPT-4O\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

            await socket.sendMessage(msg.key.remoteJid, {
                text: messageText
            }, { quoted: fakeQuoted });

        } catch (error) {
            console.error('GPT Error:', error);
            
await socket.sendMessage(msg.key.remoteJid, { 
                text: "AI failed. Maybe your question was too stupid even for AI." + FOOTER 
            }, { quoted: fakeQuoted });
        }
    }
};
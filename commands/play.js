const axios = require('axios');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'play',
    description: 'Downloads songs from YouTube and sends audio',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo, activeSockets, socketCreationTime) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        try {
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const query = body.split(' ').slice(1).join(' ').trim();

            if (!query) {
                return socket.sendMessage(msg.key.remoteJid, { 
                    text: "Give me a song name, you tone-deaf cretin. I can't play silence." + FOOTER 
                }, { quoted: fakeQuoted });
            }

            await socket.sendMessage(msg.key.remoteJid, { react: { text: '⌛', key: msg.key } });

            const { data } = await axios.get(`https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`);

            if (!data.status || !data.result?.dlink) {
                await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
                return socket.sendMessage(msg.key.remoteJid, { 
                    text: `No song found for "${query}". Your music taste is as bad as your search skills.` + FOOTER 
                }, { quoted: fakeQuoted });
            }

            const song = data.result;
            const audioUrl = song.dlink;
            const filename = song.title || "Unknown Song";

            await socket.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

            await socket.sendMessage(msg.key.remoteJid, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${filename}.mp3`,

            }, { quoted: fakeQuoted });

            await socket.sendMessage(msg.key.remoteJid, {
                document: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${filename.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
                caption: `🎵 *${filename}*\n—\n*Toxic-Mini-Bot*\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fakeQuoted });

        } catch (error) {
            console.error('YouTube error:', error);
            await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await socket.sendMessage(msg.key.remoteJid, { 
                text: `YouTube download failed. The universe rejects your music taste.\nError: ${error.message}` + FOOTER 
            }, { quoted: fakeQuoted });
        }
    }
};
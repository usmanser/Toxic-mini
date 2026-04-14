const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'gstatus',
    async execute(socket, msg, number, config, loadUserConfigFromMongo, activeSockets, socketCreationTime, extras) {
        const { isGroup, from } = extras;
        const sanitized = (number || '').replace(/[^0-9]/g, '');
        const cfg = await loadUserConfigFromMongo(sanitized) || {};
        const botName = cfg.botName || 'Toxic-Mini-Bot';

        // 1. Group Validation
        if (!isGroup) {
            return socket.sendMessage(from, { text: `*This command is for groups only.*` + FOOTER });
        }

        try {
            // 2. Identify Media/Text
            const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage || null;
            const messageToProcess = quoted ? quoted : msg.message;
            const type = Object.keys(messageToProcess)[0];
            const mime = messageToProcess[type]?.mimetype || '';
            
            const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "");
            const caption = body.replace(new RegExp(`^\\${config.PREFIX}(gstatus|groupstatus|gs)\\s*`, 'i'), '').trim();

            const defaultCaption = `⚡ *Group Status Uploaded* ⚡\n_Via ${botName}_`;

            // Helper to download media
            const downloadMedia = async (message, type) => {
                const stream = await downloadContentFromMessage(message, type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            };

            // 3. Execution Logic
            if (/image/.test(mime)) {
                const buffer = await downloadMedia(messageToProcess[type], 'image');
                await socket.sendMessage(from, { groupStatusMessage: { image: buffer, caption: caption || defaultCaption } });
            } else if (/video/.test(mime)) {
                const buffer = await downloadMedia(messageToProcess[type], 'video');
                await socket.sendMessage(from, { groupStatusMessage: { video: buffer, caption: caption || defaultCaption } });
            } else if (/audio/.test(mime)) {
                const buffer = await downloadMedia(messageToProcess[type], 'audio');
                await socket.sendMessage(from, { groupStatusMessage: { audio: buffer, mimetype: 'audio/mp4' } });
            } else if (caption) {
                await socket.sendMessage(from, { groupStatusMessage: { text: caption + FOOTER } });
            } else {
                return socket.sendMessage(from, { text: `*Reply to media or add text to post a status.*` + FOOTER });
            }

            // 4. Success Response with your Styling
            const successText = `*📡 ${botName} Sᴛᴀᴛᴜs Uᴘʟᴏᴀᴅ*

╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐒𝐭𝐚𝐭𝐬\`    )───
> ───≫ ⚡ Sᴛᴀᴛᴜs ⚡ <<───
> \`々\` 𝐓𝐲𝐩𝐞 : ${mime ? mime.split('/')[0].toUpperCase() : 'TEXT'}
> \`々\` 𝐔𝐩𝐥𝐨𝐚𝐝 : SUCCESSFUL ✅
> \`々\` 𝐒𝐞𝐫𝐯𝐞𝐫 𝐓𝐢𝐦𝐞 : ${new Date().toLocaleString()}
╰──────────────────☉

*Status has been deployed to the group feed.*`;

await socket.sendMessage(from, {
                text: successText + FOOTER
            }, { quoted: fakeQuoted });

        } catch (error) {
            console.error("GStatus Error:", error);
            await socket.sendMessage(from, { text: `*Error:* ${error.message}` + FOOTER });
        }
    }
};

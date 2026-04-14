const fs = require('fs');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'tagall',
    description: 'Tag everyone in the group',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo, activeSockets, socketCreationTime) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        try {
            const from = msg.key.remoteJid;

            if (!from.endsWith('@g.us')) {
                return socket.sendMessage(from, { 
                    text: 'Are you slow? This command only works in groups.' + FOOTER 
                }, { quoted: fakeQuoted });
            }

            const metadata = await socket.groupMetadata(from);
            const participants = metadata.participants;
            const mentions = participants.map(p => p.id);
            
            // Extract text after the command
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = body.split(' ').slice(1).join(' ');
            const messageText = args ? args : 'Wake up, you lazy bums!';

            const txt = [
                `╭───(    \`𝐓𝐚𝐠 𝐀𝐥𝐥\`    )───`,
                `> 📢 *𝐌𝐞𝐬𝐬𝐚𝐠𝐞:* ${messageText}`,
                `> 👥 *𝐂𝐨𝐮𝐧𝐭:* ${mentions.length} targets.`,
                ``,
                ...mentions.map(id => `> 📧 @${id.split('@')[0]}`),
                `╰──────────────────☉`,
                `*Stop ignoring the notifications.*`
            ].join('\n');

            await socket.sendMessage(from, { 
                text: txt + FOOTER, 
                mentions: mentions 
            }, { quoted: fakeQuoted });

        } catch (error) {
            console.error('Tagall Error:', error);
            await socket.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to tag everyone. Maybe the group is too big or you\'re just unlucky.' + FOOTER 
            }, { quoted: fakeQuoted });
        }
    }
};

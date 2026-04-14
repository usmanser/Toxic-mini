const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'join',
    async execute(socket, msg, number) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        const owner = '254735342808';
        const botNumber = socket.user.id.split(':')[0];
        
        // Restriction check
        if (number !== owner && number !== botNumber) return;

        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = contextInfo?.quotedMessage;

        // 1. Get text from current message
        let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

        // 2. If replying to text, check that text too
        if (quotedMsg?.conversation) {
            text += " " + quotedMsg.conversation;
        } else if (quotedMsg?.extendedTextMessage?.text) {
            text += " " + quotedMsg.extendedTextMessage.text;
        }

        // 3. If replying to an image/video, check the caption
        const mediaCaption = quotedMsg?.imageMessage?.caption || quotedMsg?.videoMessage?.caption;
        if (mediaCaption) {
            text += " " + mediaCaption;
        }

        const match = text.match(/chat\.whatsapp\.com\/([\w\d]+)/);

        if (!match) {
            return socket.sendMessage(msg.key.remoteJid, { 
                text: "❌ Where is the link? Reply to a message with a link or provide it after the command, you potato." + FOOTER 
            }, { quoted: fakeQuoted });
        }

        try {
            await socket.groupAcceptInvite(match[1]);
            await socket.sendMessage(msg.key.remoteJid, { 
                text: "✅ *Toxic-Mini-Bot has entered the chat.*" + FOOTER 
            }, { quoted: fakeQuoted });
        } catch (e) {
            await socket.sendMessage(msg.key.remoteJid, { 
                text: "❌ Failed to join. Either the link is revoked, the group is full, or I'm banned from that trash heap." + FOOTER 
            }, { quoted: fakeQuoted });
        }
    }
};

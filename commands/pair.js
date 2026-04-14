const axios = require('axios');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'pair',
    description: 'Pair a new number',
    async execute(socket, msg) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        const fullText = msg.message?.conversation 
            || msg.message?.extendedTextMessage?.text 
            || '';
        
        const args = fullText.trim().split(/\s+/);
        let rawInput = args.slice(1).join('');

        if (!rawInput) {
            await socket.sendMessage(
                msg.key.remoteJid,
                { text: 'Seriously? Give me a number to pair, genius.\nUsage: .pair 254712345678' + FOOTER },
                { quoted: fakeQuoted }
            );
            return;
        }

        let targetNumber = rawInput.replace(/\D/g, '');

        if (targetNumber.length < 9) {
            await socket.sendMessage(
                msg.key.remoteJid,
                { text: 'That number is shorter than your attention span. Include the country code without the + sign.\nExample: 254712345678' + FOOTER },
                { quoted: fakeQuoted }
            );
            return;
        }

        try {
            await socket.sendMessage(
                msg.key.remoteJid,
                { text: `Hold on... generating pairing code for ${targetNumber}. Try not to break anything while you wait.` + FOOTER },
                { quoted: fakeQuoted }
            );

            const response = await axios.get(
                `https://toxic-mini-bot-f3822bd15856.herokuapp.com/code?number=${targetNumber}`
            );

            if (!response.data?.code) {
                await socket.sendMessage(
                    msg.key.remoteJid,
                    { text: 'Failed to generate code. System is busy dealing with smarter requests than yours.' + FOOTER },
                    { quoted: fakeQuoted }
                );
                return;
            }

            const pairingCode = response.data.code;

            const text = `*Pairing Code Generated* (you're welcome)

╭───(    \`𝐏𝐚𝐢𝐫𝐢𝐧𝐠 𝐃𝐞𝐭𝐚𝐢𝐥𝐬\`    )───
> ───≫ PAIRING <<───
> \`々\` 𝐍𝐮𝐦𝐛𝐞𝐫 : ${targetNumber}
> \`々\` 𝐂𝐨𝐝𝐞 : ${pairingCode}
> \`々\` 𝐒𝐭𝐚𝐭𝐮𝐬 : Active
╰──────────────────☉
*Now go use it before it expires:*
1. Open WhatsApp > Settings
2. Tap Linked Devices
3. Tap Link a Device
4. Enter this code

*Don't mess it up.*${FOOTER}`;

            await socket.sendMessage(
                msg.key.remoteJid,
                {
                    text: text
                },
                { quoted: fakeQuoted }
            );

            await socket.sendMessage(
                msg.key.remoteJid,
                {
                    templateMessage: {
                        hydratedTemplate: {
                            hydratedContentText: `Your pairing code: *${pairingCode}*\nTap below to copy it, lazy bones.`,
                            hydratedButtons: [
                                {
                                    urlButton: {
                                        displayText: 'Copy Code',
                                        url: `https://wa.me/?text=${encodeURIComponent(pairingCode)}`
                                    }
                                }
                            ]
                        }
                    }
                },
                { quoted: fakeQuoted }
            );

        } catch (error) {
            await socket.sendMessage(
                msg.key.remoteJid,
                { text: `Pairing failed spectacularly: ${error.message}\nTry again when the stars align.` + FOOTER },
                { quoted: fakeQuoted }
            );
        }
    }
};

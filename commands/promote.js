const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'promote',
    description: 'Promote a member to admin',
    async execute(socket, msg, number, config, loadUserConfigFromMongo, activeSockets, socketCreationTime, extras) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        const from = extras?.from || msg.key.remoteJid;
        const isGroup = extras?.isGroup ?? from.endsWith('@g.us');
        const sender = extras?.sender || msg.key.participant || from;
        const isBotAdmin = extras?.isBotAdmin || false;
        const isAdmin = extras?.isAdmin || false;

        if (!isGroup) {
            return socket.sendMessage(from, {
                text: '*Promote who? This is not a group chat, Einstein.*' + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!isBotAdmin) {
            return socket.sendMessage(from, {
                text: `╭───(    \`𝐏𝐫𝐨𝐦𝐨𝐭𝐞 𝐅𝐚𝐢𝐥𝐞𝐝\`    )───\n> I am not even an admin myself.\n> How am I supposed to promote anyone?\n> Make me admin first.\n╰──────────────────☉` + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!isAdmin) {
            return socket.sendMessage(from, {
                text: '*You are not an admin. Stop pretending to have power.*' + FOOTER
            }, { quoted: fakeQuoted });
        }

        try {
            let targetJid = null;
            const quoted = msg.message?.extendedTextMessage?.contextInfo;
            if (quoted?.participant) {
                targetJid = quoted.participant;
            } else if (quoted?.mentionedJid?.length > 0) {
                targetJid = quoted.mentionedJid[0];
            }

            if (!targetJid) {
                const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                const args = body.split(' ').slice(1);
                if (args[0]) {
                    const num = args[0].replace(/[^0-9]/g, '');
                    if (num) targetJid = num + '@s.whatsapp.net';
                }
            }

            if (!targetJid) {
                return socket.sendMessage(from, {
                    text: '*Tag or reply to the user you want to promote. I cannot read minds.*' + FOOTER
                }, { quoted: fakeQuoted });
            }

            const targetNum = targetJid.split('@')[0].split(':')[0];
            const senderNum = sender.split('@')[0].split(':')[0];

            const metadata = extras?.groupMetadata || await socket.groupMetadata(from).catch(() => null);
            if (metadata) {
                const alreadyAdmin = metadata.participants.some(p => {
                    const pJid = p.jid || p.id;
                    return pJid === targetJid && p.admin !== null;
                });
                if (alreadyAdmin) {
                    return socket.sendMessage(from, {
                        text: '*They are already an admin. Want me to promote them to God?*' + FOOTER
                    }, { quoted: fakeQuoted });
                }
            }

            await socket.groupParticipantsUpdate(from, [targetJid], 'promote');
            await socket.sendMessage(from, {
                text: `╭───(    \`𝐏𝐫𝐨𝐦𝐨𝐭𝐞𝐝\`    )───\n> *𝐔𝐬𝐞𝐫:* @${targetNum}\n> *𝐒𝐭𝐚𝐭𝐮𝐬:* Promoted to Admin.\n> *𝐁𝐲:* @${senderNum}\n╰──────────────────☉\n\n*Congratulations, you now have power. Try not to let it go to your head.*` + FOOTER,
                mentions: [targetJid, sender]
            }, { quoted: fakeQuoted });

        } catch (error) {
            await socket.sendMessage(from, {
                text: '*Failed to promote that user. Maybe destiny said no.*' + FOOTER
            }, { quoted: fakeQuoted });
        }
    }
};

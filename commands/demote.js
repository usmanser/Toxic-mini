const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'demote',
    description: 'Demote an admin to regular member',
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
        const botNumber = extras?.botNumber || '';

        if (!isGroup) {
            return socket.sendMessage(from, {
                text: '*This is a DM, not a group. Who are you trying to demote here?*' + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!isBotAdmin) {
            return socket.sendMessage(from, {
                text: `╭───(    \`𝐃𝐞𝐦𝐨𝐭𝐞 𝐅𝐚𝐢𝐥𝐞𝐝\`    )───\n> I am not an admin in this group.\n> I cannot demote anyone without power.\n> Make me admin first.\n╰──────────────────☉` + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!isAdmin) {
            return socket.sendMessage(from, {
                text: '*Only admins can demote other admins. Nice try though.*' + FOOTER
            }, { quoted: fakeQuoted });
        }

        try {
            let targetJid = null;
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            if (contextInfo?.mentionedJid?.length > 0) {
                targetJid = contextInfo.mentionedJid[0];
            } else if (contextInfo?.quotedMessage && contextInfo?.participant) {
                targetJid = contextInfo.participant;
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
                    text: '*Tag or reply to the admin you want to demote. Use your brain.*' + FOOTER
                }, { quoted: fakeQuoted });
            }

            const targetNum = targetJid.split('@')[0].split(':')[0];
            const senderNum = sender.split('@')[0].split(':')[0];
            const botNum = botNumber.split('@')[0].split(':')[0];

            if (targetNum === botNum) {
                return socket.sendMessage(from, {
                    text: '*You want me to demote myself? Absolutely not.*' + FOOTER
                }, { quoted: fakeQuoted });
            }

            const metadata = extras?.groupMetadata || await socket.groupMetadata(from).catch(() => null);
            if (metadata) {
                const targetIsAdmin = metadata.participants.some(p => {
                    const pJid = p.jid || p.id;
                    return pJid === targetJid && p.admin !== null;
                });
                if (!targetIsAdmin) {
                    return socket.sendMessage(from, {
                        text: '*They are not even an admin. You cannot demote a regular peasant.*' + FOOTER
                    }, { quoted: fakeQuoted });
                }
            }

            await socket.groupParticipantsUpdate(from, [targetJid], 'demote');
            await socket.sendMessage(from, {
                text: `╭───(    \`𝐃𝐞𝐦𝐨𝐭𝐞𝐝\`    )───\n> *𝐔𝐬𝐞𝐫:* @${targetNum}\n> *𝐒𝐭𝐚𝐭𝐮𝐬:* Demoted from Admin.\n> *𝐁𝐲:* @${senderNum}\n╰──────────────────☉\n\n*Your admin privileges have been revoked. Back to being a nobody.*` + FOOTER,
                mentions: [targetJid, sender]
            }, { quoted: fakeQuoted });

        } catch (error) {
            await socket.sendMessage(from, {
                text: '*Failed to demote that user. The power struggle continues.*' + FOOTER
            }, { quoted: fakeQuoted });
        }
    }
};

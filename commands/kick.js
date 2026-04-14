const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

module.exports = {
    name: 'kick',
    description: 'Kick a member from the group',
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
                text: '*Are you dumb? This only works in groups. Go touch some grass.*' + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!isBotAdmin) {
            return socket.sendMessage(from, {
                text: `╭───(    \`𝐊𝐢𝐜𝐤 𝐅𝐚𝐢𝐥𝐞𝐝\`    )───\n> Make me an admin first, you clown.\n> I can't kick people without power.\n╰──────────────────☉` + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!isAdmin) {
            return socket.sendMessage(from, {
                text: '*Only admins can use this command. Know your place.*' + FOOTER
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
                    text: '*Tag or reply to the user you want to kick. I am not a mind reader.*' + FOOTER
                }, { quoted: fakeQuoted });
            }

            const targetNum = targetJid.split('@')[0].split(':')[0];
            const botNum = botNumber.split('@')[0].split(':')[0];

            if (targetNum === botNum) {
                return socket.sendMessage(from, {
                    text: '*You want me to kick myself? How about no.*' + FOOTER
                }, { quoted: fakeQuoted });
            }

            const metadata = extras?.groupMetadata || await socket.groupMetadata(from).catch(() => null);
            if (metadata) {
                const targetIsAdmin = metadata.participants.some(p => {
                    const pJid = p.jid || p.id;
                    return pJid === targetJid && p.admin !== null;
                });
                if (targetIsAdmin) {
                    return socket.sendMessage(from, {
                        text: '*That is an admin. I am toxic, not suicidal.*' + FOOTER
                    }, { quoted: fakeQuoted });
                }
            }

            const senderNum = sender.split('@')[0].split(':')[0];
            await socket.groupParticipantsUpdate(from, [targetJid], 'remove');
            await socket.sendMessage(from, {
                text: `╭───(    \`𝐊𝐢𝐜𝐤𝐞𝐝\`    )───\n> *𝐔𝐬𝐞𝐫:* @${targetNum}\n> *𝐒𝐭𝐚𝐭𝐮𝐬:* Removed from the group.\n> *𝐁𝐲:* @${senderNum}\n╰──────────────────☉\n\n*Pack your bags and get out. No one will miss you.*` + FOOTER,
                mentions: [targetJid, sender]
            }, { quoted: fakeQuoted });

        } catch (error) {
            await socket.sendMessage(from, {
                text: '*Failed to kick that user. Either they already left or the universe hates me right now.*' + FOOTER
            }, { quoted: fakeQuoted });
        }
    }
};

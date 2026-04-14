uconst { translate } = require('@vitalets/google-translate-api');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

const LANGUAGES = {
    en: 'English', fr: 'French', es: 'Spanish', de: 'German',
    pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', zh: 'Chinese',
    ru: 'Russian', sw: 'Swahili', ja: 'Japanese', ko: 'Korean',
    it: 'Italian', tr: 'Turkish', nl: 'Dutch', id: 'Indonesian',
};

module.exports = {
    name: 'translate',
    async execute(socket, msg, number, config, loadUserConfigFromMongo, activeSockets, socketCreationTime, extras) {
        const from = extras?.from || msg.key.remoteJid;

        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const fullText = body.split(' ').slice(1).join(' ').trim();

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';

        if (!fullText && !quotedText) {
            return socket.sendMessage(from, {
                text: `╭───(    \`𝐓𝐫𝐚𝐧𝐬𝐥𝐚𝐭𝐞\`    )───\n> ───≫ 🌐 USAGE ≪───\n> .tr fr Hello world\n> .tr ja How are you?\n> Reply to a msg: .tr en\n╰──────────────────☉\n\n*You used .tr with nothing. Outstanding move.*` + FOOTER
            }, { quoted: msg });
        }

        let lang, text;

        if (quotedText) {
            lang = fullText || 'en';
            text = quotedText;
        } else {
            const parts = fullText.split(' ');
            if (parts.length >= 2 && parts[0].length <= 5 && !parts[0].includes(' ')) {
                lang = parts[0].toLowerCase();
                text = parts.slice(1).join(' ');
            } else {
                lang = 'en';
                text = fullText;
            }
        }

        await socket.sendMessage(from, { react: { text: '🌐', key: msg.key } });

        try {
            const result = await translate(text, { to: lang });
            const fromLang = LANGUAGES[result.raw?.src] || result.raw?.src?.toUpperCase() || 'Auto';
            const toLang = LANGUAGES[lang] || lang.toUpperCase();

            await socket.sendMessage(from, { react: { text: '✅', key: msg.key } });

            await socket.sendMessage(from, {
                text: `╭───(    \`𝐓𝐫𝐚𝐧𝐬𝐥𝐚𝐭𝐢𝐨𝐧\`    )───\n> ───≫ 🌐 RESULT ≪───\n> \`々\` 𝐅𝐫𝐨𝐦 : ${fromLang}\n> \`々\` 𝐓𝐨 : ${toLang}\n╰──────────────────☉\n\n*Original:*\n${text}\n\n*Translated:*\n${result.text}` + FOOTER
            }, { quoted: msg });

        } catch (error) {
            await socket.sendMessage(from, { react: { text: '❌', key: msg.key } });
            await socket.sendMessage(from, {
                text: `*Translation flopped. Either the language code is fake or Google hates you today.*\nError: ${error.message}` + FOOTER
            }, { quoted: msg });
        }
    }
};

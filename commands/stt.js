const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');

const FOOTER = '\n\n*Free-Mini-Bot Link* https://xhclinton.com/minibot\n> 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

module.exports = {
    name: 'stt',
    async execute(socket, msg, number, userConfig, loadUserConfigFromMongo) {

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: msg.key.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [], forwardingScore: 999, isForwarded: true }
        };
        const from = msg.key.remoteJid;

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directAudio = msg.message?.audioMessage;
        const quotedAudio = quoted?.audioMessage;

        const audioMsg = directAudio || quotedAudio;

        if (!audioMsg) {
            return socket.sendMessage(from, {
                text: "Reply to a voice note or audio message, you muppet. I'm not magic — I can't transcribe thin air." + FOOTER
            }, { quoted: fakeQuoted });
        }

        if (!GROQ_API_KEY) {
            return socket.sendMessage(from, {
                text: "GROQ_API_KEY is not set. Tell the owner to stop being lazy and configure the bot properly." + FOOTER
            }, { quoted: fakeQuoted });
        }

        await socket.sendMessage(from, { react: { text: '👂', key: msg.key } });

        const tmpFile = path.join(os.tmpdir(), `stt_${Date.now()}.ogg`);

        try {
            const stream = await downloadContentFromMessage(audioMsg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            fs.writeFileSync(tmpFile, buffer);

            const form = new FormData();
            form.append('file', fs.createReadStream(tmpFile), { filename: 'audio.ogg', contentType: 'audio/ogg' });
            form.append('model', 'whisper-large-v3');
            form.append('response_format', 'json');

            const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
            });

            const transcribed = response.data?.text?.trim();

            if (!transcribed) {
                await socket.sendMessage(from, { react: { text: '❌', key: msg.key } });
                return socket.sendMessage(from, {
                    text: "I listened to that rubbish and got absolutely nothing. Either you mumbled or you sent silence. Both are equally useless." + FOOTER
                }, { quoted: fakeQuoted });
            }

            await socket.sendMessage(from, { react: { text: '✅', key: msg.key } });

            await socket.sendMessage(from, {
                text: `👂 *Transcription:*\n\n${transcribed}\n\n_You're welcome. Now learn to type next time._` + FOOTER
            }, { quoted: fakeQuoted });

        } catch (error) {
            await socket.sendMessage(from, { react: { text: '❌', key: msg.key } });
            await socket.sendMessage(from, {
                text: `Transcription crashed. Whisper took one listen and gave up — honestly can't blame it.\nError: ${error.message}` + FOOTER
            }, { quoted: fakeQuoted });
        } finally {
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        }
    }
};

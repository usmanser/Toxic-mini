const { Telegraf } = require('telegraf');
const moment = require('moment-timezone');

const TELEGRAM_BOT_TOKEN = '8548937008:AAG-4T4A4ZHwCkAWkfEiLi4IPUVaPvDRUJc';
const OWNER_ID = '8347989290';

const SERVERS = [
    { label: 'SERVER-1', url: 'https://toxic-mini-bot1-b198481ce0b5.herokuapp.com/code' },
    { label: 'SERVER-2', url: 'https://toxic-mini-bot2-ad8a645bece0.herokuapp.com/code' },
    { label: 'SERVER-3', url: 'https://toxic-mini-bot3-d066897d5b59.herokuapp.com/code' },
];

async function safeFetch(url, options = {}) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

async function getAllSessionsMulti() {
    const results = await Promise.allSettled(
        SERVERS.map((srv, idx) =>
            Promise.all([
                safeFetch(`${srv.url}/api/sessions`),
                safeFetch(`${srv.url}/api/active`)
            ]).then(([s, a]) => ({
                idx,
                sessions: (s && s.sessions) ? s.sessions : [],
                active:   (a && a.active)   ? a.active   : []
            }))
        )
    );

    const allSessions = [];
    for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const { idx, sessions, active } = r.value;
        for (const s of sessions) {
            allSessions.push({
                number: s.number,
                serverIndex: idx,
                serverLabel: SERVERS[idx].label,
                online: active.includes(s.number)
            });
        }
    }
    return allSessions;
}

async function getMultiStats() {
    const allSessions = await getAllSessionsMulti();
    const online  = allSessions.filter(s => s.online).length;
    const offline = allSessions.length - online;
    return { total: allSessions.length, online, offline, sessions: allSessions };
}

async function findNodeServer(number) {
    const all = await getAllSessionsMulti();
    const found = all.find(s => String(s.number).includes(String(number)));
    if (!found) return null;
    return found;
}

async function websiteBootNode(number) {
    const node = await findNodeServer(number);
    if (!node) return false;
    const res = await safeFetch(`${SERVERS[node.serverIndex].url}/?number=${number}`);
    return res !== null;
}

async function websiteDeleteNode(number) {
    const node = await findNodeServer(number);
    if (!node) return false;
    const res = await safeFetch(`${SERVERS[node.serverIndex].url}/api/session/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: String(number) })
    });
    return res !== null;
}

async function websiteDeleteOffline() {
    const all = await getAllSessionsMulti();
    const offline = all.filter(s => !s.online);
    let deleted = 0;
    for (const s of offline) {
        const res = await safeFetch(`${SERVERS[s.serverIndex].url}/api/session/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: String(s.number) })
        });
        if (res !== null) deleted++;
    }
    return deleted;
}

async function websiteCleanupSessions() {
    const results = await Promise.allSettled(
        SERVERS.map(srv => safeFetch(`${srv.url}/api/cleanup`, { method: 'POST' }))
    );
    return results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
}

let telegramBot = null;
let pairModule = null;
const userSearchCache = new Map();
const pendingActions = new Map();

function setPairModule(pair) {
    pairModule = pair;
}

async function getAllSessions() {
    if (!pairModule || !pairModule.getAllSessionsFromPostgres) {
        return [];
    }
    try {
        return await pairModule.getAllSessionsFromPostgres();
    } catch (e) {
        return [];
    }
}

async function getActiveSockets() {
    if (!pairModule || !pairModule.activeSockets) {
        return new Map();
    }
    return pairModule.activeSockets;
}

async function removeSessionPermanently(number) {
    if (!pairModule || !pairModule.removeSessionPermanently) {
        return;
    }
    try {
        await pairModule.removeSessionPermanently(number);
    } catch (e) {}
}

async function forceReconnect(number) {
    if (!pairModule || !pairModule.forceReconnect) {
        return false;
    }
    try {
        return await pairModule.forceReconnect(number);
    } catch (e) {
        return false;
    }
}

async function ToxicPair(number) {
    if (!pairModule || !pairModule.ToxicPair) {
        return null;
    }
    try {
        return await pairModule.ToxicPair(number);
    } catch (e) {
        return null;
    }
}

async function initPostgres() {
    if (!pairModule || !pairModule.initPostgres) {
        return;
    }
    try {
        await pairModule.initPostgres();
    } catch (e) {}
}

const usedMemory = () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100;

async function searchNodeByNumber(number) {
    const all = await getAllSessionsMulti();
    return all.filter(s => String(s.number).includes(String(number)));
}

async function initializeTelegramBot() {
  try {
    console.log('Starting Telegram Bot Manager...');

    const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

    bot.use(async (ctx, next) => {
      if (ctx.from && ctx.from.id.toString() === OWNER_ID) {
        return next();
      }
      if (ctx.message) {
        await ctx.reply('Owner only.');
      }
      return;
    });

    bot.start(async (ctx) => {
      const keyboard = {
        inline_keyboard: [
          [{ text: '🔄 Refresh', callback_data: 'refresh_all' }, { text: '📊 Stats', callback_data: 'show_stats' }],
          [{ text: '🟢 Online', callback_data: 'show_online' }, { text: '🔴 Offline', callback_data: 'show_offline' }],
          [{ text: '🔍 Search', callback_data: 'search_node' }, { text: '⚡ Reconnect', callback_data: 'force_reconnect_menu' }],
          [{ text: '🗑️ Clean', callback_data: 'ask_delete_offline' }, { text: '🧹 Cleanup Files', callback_data: 'ask_cleanup_sessions' }]
        ]
      };

      const welcomeMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐁𝐨𝐭 𝐌𝐚𝐧𝐚𝐠𝐞𝐫 ≪───\n> \`々\` Ready to serve 💀\n╰──────────────────☉\n\n⚡ Commands (no / needed):\n• stats - Bot statistics\n• refresh - Refresh nodes\n• ping - Check status\n• online - Show online bots\n\n🔥 Use buttons or type commands 👇`;

      await ctx.reply(welcomeMsg, {
        reply_markup: keyboard
      });
    });

    bot.on('message', async (ctx) => {
      const message = ctx.message.text?.trim();
      if (!message) return;

      const lowerMsg = message.toLowerCase();

      if (lowerMsg === 'stats' || lowerMsg === '/stats') {
        const { total, online: onlineCount, offline: offlineCount } = await getMultiStats();

        const statsMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 ≪───\n> \`々\` Total Sessions: ${total}\n> \`々\` Online: ${onlineCount} 🟢\n> \`々\` Offline: ${offlineCount} 🔴\n> \`々\` Memory: ${usedMemory()} MB\n╰──────────────────☉\n\n💀 ${onlineCount > (total * 0.7) ? 'Running like a beast! 🔥' : onlineCount > (total * 0.4) ? 'Could be better 😒' : 'Total garbage 💩'}`;

        await ctx.reply(statsMsg);
        return;
      }

      if (lowerMsg === 'refresh' || lowerMsg === '/refresh') {
        const { total, online: onlineCount, offline: offlineCount } = await getMultiStats();

        const refreshMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐑𝐞𝐟𝐫𝐞𝐬𝐡 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞 ≪───\n> \`々\` Online: ${onlineCount} 🟢\n> \`々\` Offline: ${offlineCount} 🔴\n> \`々\` Total: ${total} 📱\n╰──────────────────☉\n\n💀 ${offlineCount > onlineCount ? 'Most bots are dead! 😤' : 'Not bad! 🔥'}`;

        await ctx.reply(refreshMsg);
        return;
      }

      if (lowerMsg === 'ping' || lowerMsg === '/ping') {
        const { online: onlineCount } = await getMultiStats();
        const pingMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐏𝐨𝐧𝐠! ≪───\n> \`々\` Active Bots: ${onlineCount}\n> \`々\` Response: Fast af! ⚡\n> \`々\` Status: Online & Toxic 🔥\n╰──────────────────☉`;

        await ctx.reply(pingMsg);
        return;
      }

      if (lowerMsg === 'online' || lowerMsg === '/online') {
        const { sessions } = await getMultiStats();
        const onlineSessions = sessions.filter(s => s.online);

        let onlineMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐎𝐧𝐥𝐢𝐧𝐞 𝐍𝐨𝐝𝐞𝐬 ≪───\n`;

        if (onlineSessions.length === 0) {
          onlineMsg += `> \`々\` No online nodes! 🔴\n╰──────────────────☉\n\n💀 All bots are dead!`;
        } else {
          onlineSessions.slice(0, 15).forEach((s, i) => {
            onlineMsg += `> \`々\` ${i+1}. ${s.number} [${s.serverLabel}]\n`;
          });
          onlineMsg += `╰──────────────────☉`;
          if (onlineSessions.length > 15) {
            onlineMsg += `\n\n... and ${onlineSessions.length - 15} more 🔥`;
          }
        }

        await ctx.reply(onlineMsg);
        return;
      }

      if (/^\d{9,15}$/.test(message)) {
        const number = message;
        userSearchCache.set(ctx.from.id, number);

        await ctx.reply(`🔍 Searching for ${number}...`);

        const results = await searchNodeByNumber(number);

        if (results.length === 0) {
          await ctx.reply(`❌ No nodes found matching ${number}\n\n💀 Either it doesn't exist or you typed wrong!`);
          return;
        }

        if (results.length === 1) {
          const node = results[0];
          const keyboard = {
            inline_keyboard: [
              [{ text: '🚀 Boot', callback_data: `ask_boot_${node.number}` }],
              [{ text: '⚡ Reconnect', callback_data: `ask_reconnect_${node.number}` }],
              [{ text: '🗑️ Delete', callback_data: `ask_delete_single_${node.number}` }],
              [{ text: '🏠 Menu', callback_data: 'back_to_menu' }]
            ]
          };

          const nodeMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐍𝐨𝐝𝐞 𝐅𝐨𝐮𝐧𝐝 ≪───\n> \`々\` Number: ${node.number}\n> \`々\` Server: ${node.serverLabel}\n> \`々\` Status: ${node.online ? 'Online 🟢' : 'Offline 🔴'}\n╰──────────────────☉\n\n💀 Select action (confirmation required):`;

          await ctx.reply(nodeMsg, { reply_markup: keyboard });
          return;
        }

        let text = `🔍 Found ${results.length} nodes:\n\n`;
        results.slice(0, 10).forEach((node, i) => {
          text += `${i+1}. ${node.number}  ${node.online ? '🟢' : '🔴'}  [${node.serverLabel}]\n`;
        });

        if (results.length > 10) {
          text += `\n... and ${results.length - 10} more`;
        }

        const buttons = results.slice(0, 6).map(node => [
          { text: `${node.number} ${node.online ? '🟢' : '🔴'}`, callback_data: `select_node_${node.number}` }
        ]);

        buttons.push([{ text: '🔍 Search Again', callback_data: 'search_node' }]);
        buttons.push([{ text: '🏠 Menu', callback_data: 'back_to_menu' }]);

        await ctx.reply(text, {
          reply_markup: { inline_keyboard: buttons }
        });
        return;
      }
    });

    bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery.data;
      const userId = ctx.from.id;

      if (data === 'refresh_all') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('🔄 Refreshing... Hold on!');

        const { total, online: onlineCount, offline: offlineCount } = await getMultiStats();

        const keyboard = {
          inline_keyboard: [
            [{ text: '🟢 Online', callback_data: 'show_online' }, { text: '🔴 Offline', callback_data: 'show_offline' }],
            [{ text: '📊 Stats', callback_data: 'show_stats' }, { text: '🔍 Search', callback_data: 'search_node' }],
            [{ text: '🗑️ Clean', callback_data: 'ask_delete_offline' }, { text: '⚡ Reconnect', callback_data: 'force_reconnect_menu' }],
            [{ text: '🧹 Cleanup Files', callback_data: 'ask_cleanup_sessions' }],
            [{ text: '🏠 Menu', callback_data: 'back_to_menu' }]
          ]
        };

        const refreshMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐑𝐞𝐟𝐫𝐞𝐬𝐡 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞 ≪───\n> \`々\` Online: ${onlineCount} 🟢\n> \`々\` Offline: ${offlineCount} 🔴\n> \`々\` Total: ${total} 📱\n╰──────────────────☉\n\n💀 ${offlineCount > onlineCount ? 'Pathetic! Most bots dead 😤' : 'Not bad! 🔥'}`;

        await ctx.editMessageText(refreshMsg, { reply_markup: keyboard });
      }

      else if (data === 'show_online') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('Loading online nodes... ⏳');

        const { sessions } = await getMultiStats();
        const onlineSessions = sessions.filter(s => s.online);

        let message = `Online Nodes: ${onlineSessions.length} 🟢\n\n`;

        if (onlineSessions.length === 0) {
          message = `No online nodes found 😴`;
        } else {
          onlineSessions.slice(0, 15).forEach((s, i) => {
            message += `${i+1}. ${s.number}  [${s.serverLabel}]\n`;
          });
          if (onlineSessions.length > 15) {
            message += `\n... and ${onlineSessions.length - 15} more`;
          }
        }

        const keyboard = {
          inline_keyboard: [
            [{ text: 'Refresh 🔄', callback_data: 'refresh_all' }],
            [{ text: 'Stats 📊', callback_data: 'show_stats' }],
            [{ text: 'Search Node 🔍', callback_data: 'search_node' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(message, { reply_markup: keyboard });
      }

      else if (data === 'show_offline') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('Loading offline nodes... ⏳');

        const { sessions } = await getMultiStats();
        const offlineSessions = sessions.filter(s => !s.online);

        let message = `Offline Nodes: ${offlineSessions.length} 🔴\n\n`;

        offlineSessions.slice(0, 10).forEach((s, i) => {
          message += `${i+1}. ${s.number}  [${s.serverLabel}]\n`;
        });

        if (offlineSessions.length > 10) {
          message += `\n... and ${offlineSessions.length - 10} more`;
        }

        if (offlineSessions.length === 0) {
          message = `No offline nodes found 🎉`;
        }

        const keyboard = {
          inline_keyboard: [
            [{ text: '🗑️ Clean Offline', callback_data: 'ask_delete_offline' }],
            [{ text: 'Refresh 🔄', callback_data: 'refresh_all' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(message, { reply_markup: keyboard });
      }

      else if (data === 'ask_delete_offline') {
        await ctx.answerCbQuery();

        const { sessions } = await getMultiStats();
        const offlineCount = sessions.filter(s => !s.online).length;

        if (offlineCount === 0) {
          await ctx.editMessageText('No offline nodes to delete 😌');
          return;
        }

        const keyboard = {
          inline_keyboard: [
            [{ text: '❌ CANCEL - Keep them', callback_data: 'refresh_all' }],
            [{ text: '⚠️ YES - Delete All Offline', callback_data: 'confirm_delete_offline' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `⚠️ CONFIRMATION REQUIRED ⚠️\n\nYou are about to delete ${offlineCount} offline nodes! 🗑️\n\nThis action is PERMANENT and cannot be undone!\n\nAre you absolutely sure?`,
          { reply_markup: keyboard }
        );
      }

      else if (data === 'confirm_delete_offline') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('Deleting offline nodes... 🗑️');

        const deletedCount = await websiteDeleteOffline();

        const keyboard = {
          inline_keyboard: [
            [{ text: 'Show Online 🟢', callback_data: 'show_online' }],
            [{ text: 'Refresh 🔄', callback_data: 'refresh_all' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `✅ Deleted ${deletedCount} offline nodes 🗑️\n\nOnly online nodes remain.`,
          { reply_markup: keyboard }
        );
      }

      else if (data === 'ask_cleanup_sessions') {
        await ctx.answerCbQuery();

        const keyboard = {
          inline_keyboard: [
            [{ text: '❌ CANCEL', callback_data: 'refresh_all' }],
            [{ text: '🧹 YES - Cleanup All Servers', callback_data: 'confirm_cleanup_sessions' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `⚠️ SESSION FILE CLEANUP ⚠️\n\nThis will remove:\n• Orphaned temp session files\n• Stale DB entries (welcome_sent, numbers, configs)\n• Sessions inactive for 30+ days\n\nActive bots will NOT be affected.\n\nProceed?`,
          { reply_markup: keyboard }
        );
      }

      else if (data === 'confirm_cleanup_sessions') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('🧹 Running session cleanup on all servers...');

        const cleaned = await websiteCleanupSessions();

        const keyboard = {
          inline_keyboard: [
            [{ text: 'Refresh 🔄', callback_data: 'refresh_all' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `✅ Cleanup complete!\n\n🧹 Cleaned ${cleaned}/${SERVERS.length} servers successfully.`,
          { reply_markup: keyboard }
        );
      }

      else if (data === 'search_node') {
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          `Node Search 🔎\n\nSend me a number (full or partial) to search.\n\nExample: 254712345678 or 712345`
        );
      }

      else if (data.startsWith('select_node_')) {
        await ctx.answerCbQuery();
        const number = data.replace('select_node_', '');

        const node = await findNodeServer(number);
        const isOnline = node ? node.online : false;
        const serverLabel = node ? node.serverLabel : 'Unknown';

        const keyboard = {
          inline_keyboard: [
            [{ text: 'Boot Node 🚀', callback_data: `ask_boot_${number}` }],
            [{ text: 'Delete Node 🗑️', callback_data: `ask_delete_single_${number}` }],
            [{ text: 'Reconnect ⚡', callback_data: `ask_reconnect_${number}` }],
            [{ text: 'Back to Search 🔍', callback_data: 'search_node' }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `Node Selected 🎯\n\nNumber: ${number}\nServer: ${serverLabel}\nStatus: ${isOnline ? 'Online 🟢' : 'Offline 🔴'}\n\nSelect action (confirmation required):`,
          { reply_markup: keyboard }
        );
      }

      else if (data.startsWith('ask_boot_')) {
        await ctx.answerCbQuery();
        const number = data.replace('ask_boot_', '');

        const node = await findNodeServer(number);
        const status = node ? (node.online ? '🟢 Online' : '🔴 Offline') : 'Unknown';

        const keyboard = {
          inline_keyboard: [
            [{ text: '❌ Cancel', callback_data: `select_node_${number}` }],
            [{ text: '✅ Confirm Boot', callback_data: `boot_single_${number}` }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `⚠️ CONFIRM BOOT 🚀\n\nNumber: ${number}\nCurrent Status: ${status}\n\nThis will boot the node using website endpoint.\n\nAre you sure?`,
          { reply_markup: keyboard }
        );
      }

      else if (data.startsWith('boot_single_')) {
        await ctx.answerCbQuery();
        const number = data.replace('boot_single_', '');

        await ctx.editMessageText(`Booting node ${number}... 🚀`);

        const success = await websiteBootNode(number);

        if (success) {
          await ctx.editMessageText(
            `✅ Node ${number} boot command sent successfully 🚀\n\nCheck status in 30 seconds with /refresh`
          );
        } else {
          await ctx.editMessageText(
            `❌ Failed to boot node ${number} 😞\n\nTry manual boot from website`
          );
        }
      }

      else if (data.startsWith('ask_delete_single_')) {
        await ctx.answerCbQuery();
        const number = data.replace('ask_delete_single_', '');

        const node = await findNodeServer(number);
        const status = node ? (node.online ? '🟢 Online' : '🔴 Offline') : 'Unknown';

        const keyboard = {
          inline_keyboard: [
            [{ text: '❌ CANCEL - Keep it', callback_data: `select_node_${number}` }],
            [{ text: '⚠️ YES - Delete Forever', callback_data: `delete_single_${number}` }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `⚠️ DELETE CONFIRMATION ⚠️\n\nNumber: ${number}\nStatus: ${status}\n\nThis action is PERMANENT!\nNode will be removed from database FOREVER.\n\nAre you absolutely sure?`,
          { reply_markup: keyboard }
        );
      }

      else if (data.startsWith('delete_single_')) {
        await ctx.answerCbQuery();
        const number = data.replace('delete_single_', '');

        await ctx.editMessageText(`Deleting node ${number}... 🗑️`);

        const success = await websiteDeleteNode(number);

        if (success) {
          await ctx.editMessageText(`✅ Node ${number} deleted successfully 🗑️`);
        } else {
          await ctx.editMessageText(`❌ Failed to delete node ${number} 😕`);
        }
      }

      else if (data.startsWith('ask_reconnect_')) {
        await ctx.answerCbQuery();
        const number = data.replace('ask_reconnect_', '');

        const node = await findNodeServer(number);
        const status = node ? (node.online ? '🟢 Online' : '🔴 Offline') : 'Unknown';

        const keyboard = {
          inline_keyboard: [
            [{ text: '❌ Cancel', callback_data: `select_node_${number}` }],
            [{ text: '✅ Confirm Reconnect', callback_data: `reconnect_single_${number}` }],
            [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(
          `⚠️ CONFIRM RECONNECT ⚡\n\nNumber: ${number}\nCurrent Status: ${status}\n\nThis will force reconnect the node.\n\nAre you sure?`,
          { reply_markup: keyboard }
        );
      }

      else if (data.startsWith('reconnect_single_')) {
        await ctx.answerCbQuery();
        const number = data.replace('reconnect_single_', '');

        await ctx.editMessageText(`Force reconnecting ${number}... ⚡`);

        const result = await forceReconnect(number);

        if (result) {
          await ctx.editMessageText(
            `✅ Force reconnection initiated for ${number} ⚡\n\nWait 30 seconds for connection...`
          );
        } else {
          await ctx.editMessageText(`❌ Failed to reconnect ${number} 😓`);
        }
      }

      else if (data === 'force_reconnect_menu') {
        await ctx.answerCbQuery();

        const { sessions } = await getMultiStats();
        const offlineSessions = sessions.filter(s => !s.online);

        if (offlineSessions.length === 0) {
          const keyboard = {
            inline_keyboard: [
              [{ text: 'Refresh 🔄', callback_data: 'refresh_all' }],
              [{ text: 'Stats 📊', callback_data: 'show_stats' }],
              [{ text: 'Back to Menu', callback_data: 'back_to_menu' }]
            ]
          };

          await ctx.editMessageText('All nodes are online! 🎉', {
            reply_markup: keyboard
          });
          return;
        }

        const buttons = offlineSessions.slice(0, 8).map(s =>
          [{ text: `${s.number} 🔴 [${s.serverLabel}]`, callback_data: `ask_reconnect_${s.number}` }]
        );

        buttons.push([{ text: 'Refresh List 🔄', callback_data: 'force_reconnect_menu' }]);
        buttons.push([{ text: 'Back to Menu', callback_data: 'back_to_menu' }]);

        const keyboard = { inline_keyboard: buttons };

        await ctx.editMessageText(
          `Force Reconnect ⚡\n\nSelect offline node to force reconnect (confirmation required):`,
          { reply_markup: keyboard }
        );
      }

      else if (data === 'show_stats') {
        await ctx.answerCbQuery();

        const { total: totalSessions, online: onlineCount, offline: offlineCount } = await getMultiStats();

        const statsMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 ≪───\n> \`々\` Total: ${totalSessions} 🤖\n> \`々\` Online: ${onlineCount} 🟢\n> \`々\` Offline: ${offlineCount} 🔴\n> \`々\` Memory: ${usedMemory()} MB 💾\n> \`々\` Time: ${moment().tz('Africa/Nairobi').format('HH:mm:ss')} 🕒\n╰──────────────────☉\n\n💀 ${onlineCount > (totalSessions * 0.7) ? 'Beast mode! 🔥' : onlineCount > (totalSessions * 0.4) ? 'Could be better 😒' : 'Trash 💩'}`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '🔄 Refresh', callback_data: 'refresh_all' }],
            [{ text: '🟢 Online', callback_data: 'show_online' }, { text: '🔴 Offline', callback_data: 'show_offline' }],
            [{ text: '🔍 Search', callback_data: 'search_node' }],
            [{ text: '🏠 Menu', callback_data: 'back_to_menu' }]
          ]
        };

        await ctx.editMessageText(statsMsg, { reply_markup: keyboard });
      }

      else if (data === 'back_to_menu') {
        await ctx.answerCbQuery();

        const keyboard = {
          inline_keyboard: [
            [{ text: '🔄 Refresh', callback_data: 'refresh_all' }, { text: '📊 Stats', callback_data: 'show_stats' }],
            [{ text: '🟢 Online', callback_data: 'show_online' }, { text: '🔴 Offline', callback_data: 'show_offline' }],
            [{ text: '🔍 Search', callback_data: 'search_node' }, { text: '⚡ Reconnect', callback_data: 'force_reconnect_menu' }],
            [{ text: '🗑️ Clean', callback_data: 'ask_delete_offline' }, { text: '🧹 Cleanup Files', callback_data: 'ask_cleanup_sessions' }]
          ]
        };

        const welcomeMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐁𝐨𝐭 𝐌𝐚𝐧𝐚𝐠𝐞𝐫 ≪───\n> \`々\` Ready to serve 💀\n╰──────────────────☉\n\n⚡ Commands (no / needed):\n• stats - Bot statistics\n• refresh - Refresh nodes\n• ping - Check status\n• online - Show online bots\n\n🔥 Use buttons or type commands 👇`;

        await ctx.editMessageText(welcomeMsg, {
          reply_markup: keyboard
        });
      }

      else if (data === 'confirm_delete_offline_cmd') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('🗑️ Deleting offline nodes...');

        const deletedCount = await websiteDeleteOffline();

        const doneMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐃𝐞𝐥𝐞𝐭𝐞𝐝 ≪───\n> \`々\` Removed: ${deletedCount} nodes 🗑️\n> \`々\` Only strong survive! 🔥\n╰──────────────────☉`;

        await ctx.editMessageText(doneMsg);
      }

      else if (data === 'cancel_clean') {
        await ctx.answerCbQuery();
        await ctx.editMessageText('😌 Cancelled\n\n💀 Smart choice! Or scared?');
      }
    });

    bot.command('refresh', async (ctx) => {
      const { total, online: onlineCount, offline: offlineCount } = await getMultiStats();

      const refreshMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐑𝐞𝐟𝐫𝐞𝐬𝐡 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞 ≪───\n> \`々\` Online: ${onlineCount} 🟢\n> \`々\` Offline: ${offlineCount} 🔴\n> \`々\` Total: ${total} 📱\n╰──────────────────☉\n\n💀 ${offlineCount > onlineCount ? 'Half dead! 😤' : 'Good! 🔥'}`;

      await ctx.reply(refreshMsg);
    });

    bot.command('online', async (ctx) => {
      const { sessions } = await getMultiStats();
      const onlineSessions = sessions.filter(s => s.online);

      let onlineMsg = `╭───(    \`𝐓𝐨𝐱𝐢𝐜-𝐌𝐢𝐧𝐢 𝐁𝐨𝐭\`    )───\n> ───≫ 𝐎𝐧𝐥𝐢𝐧𝐞 𝐍𝐨𝐝𝐞𝐬 ≪───\n`;

      if (onlineSessions.length === 0) {
        onlineMsg += `> \`々\` No online nodes! 🔴\n╰──────────────────☉\n\n💀 All dead!`;
      } else {
        onlineSessions.slice(0, 15).forEach((s, i) => {
          onlineMsg += `> \`々\` ${i+1}. ${s.number} [${s.serverLabel}]\n`;
        });
        onlineMsg += `╰──────────────────☉`;
        if (onlineSessions.length > 15) {
          onlineMsg += `\n\n... and ${onlineSessions.length - 15} more 🔥`;
        }
      }

      await ctx.reply(onlineMsg);
    });

    bot.launch();
    telegramBot = bot;
    console.log('✅ Telegram Bot launched successfully');

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (e) {
    console.error('❌ Telegram Bot failed to start:', e.message);
  }
}

module.exports = { initializeTelegramBot, setPairModule };

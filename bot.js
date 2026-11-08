const mineflayer = require('mineflayer');

function createSpikeBot(username, config, webhookLogger) {
    const options = {
        host: config.target.ip,
        username: username
    };
    if (config.target.port) options.port = parseInt(config.target.port);

    const bot = mineflayer.createBot(options);

    bot.once('spawn', () => {
        webhookLogger(`🟢 Bot **${username}** successfully joined server!`);

        // 🥩 Feature 1: Auto-Eat System
        setInterval(() => {
            if (bot.food < 16) {
                const foodItem = bot.inventory.items().find(item => 
                    item.name.includes('bread') || item.name.includes('steak') || 
                    item.name.includes('carrot') || item.name.includes('apple') || item.name.includes('porkchop')
                );
                if (foodItem) {
                    bot.equip(foodItem, 'hand', (err) => {
                        if (!err) bot.consume();
                    });
                }
            }
        }, 10000);

        // 👀 Feature 2: Dynamic Target Tracker (Real player head movement)
        setInterval(() => {
            const playerFilter = (entity) => entity.type === 'player' && entity.username !== bot.username;
            const target = bot.nearestEntity(playerFilter);
            if (target) {
                bot.lookAt(target.position.offset(0, target.height, 0));
            }
        }, 4000);

        // 🏃 Feature 3: Anti-Bot & Anti-Cheat Human-Like Movements
        // - Har 6s me 4s tak forward movement
        setInterval(() => {
            bot.setControlState('forward', true);
            setTimeout(() => bot.setControlState('forward', false), 4000);
        }, 6000);

        // - Har 10s me jump
        setInterval(() => {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 500);
        }, 10000);

        // - Har 8s me random head rotation
        setInterval(() => {
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * Math.PI;
            bot.look(yaw, pitch, true);
        }, 8000);

        // 💬 Feature 4: Chat Spam with Random 2-Digit Suffix (Every 1.5s)
        if (config.spamMessages && config.spamMessages.length > 0) {
            setInterval(() => {
                const randomMsg = config.spamMessages[Math.floor(Math.random() * config.spamMessages.length)];
                const randomNum = Math.floor(10 + Math.random() * 90); // 2-digit random number (10-99)
                bot.chat(`${randomMsg} #${randomNum}`);
            }, 1500);
        }
    });

    // 🔑 Smart Chat Login & Register System
    bot.on('chat', (username, message) => {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('register') || lowerMsg.includes('/reg')) {
            bot.chat(`/register ${config.auth.password} ${config.auth.password}`);
            webhookLogger(`🔑 Bot **${bot.username}** registered automatically.`);
        } else if (lowerMsg.includes('login') || lowerMsg.includes('/l')) {
            bot.chat(`/login ${config.auth.password}`);
            webhookLogger(`🔓 Bot **${bot.username}** logged in successfully.`);
        }
    });

    // 🖱️ Feature 5: Advanced Chest GUI & Menu Handler
    bot.on('windowOpen', (window) => {
        window.requiresConfirmation = false;
        const items = window.containerItems();
        if (items.length > 0) {
            const targetSlot = items[0].slot;
            bot.clickWindow(targetSlot, 0, 0).catch(() => {});
            webhookLogger(`🖱️ Bot **${bot.username}** interacted with GUI/Chest menu.`);
        }
    });

    // 💀 Instant Respawn on Death
    bot.on('death', () => {
        webhookLogger(`💀 Bot **${bot.username}** died. Instant respawning...`);
        bot.respawn();
    });

    bot.on('end', (reason) => {
        webhookLogger(`🔴 Bot **${username}** disconnected. Reason: ${reason}`);
    });

    bot.on('error', () => {});

    return bot;
}

module.exports = { createSpikeBot };

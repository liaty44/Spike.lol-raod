
const express = require("express");
const { status } = require("minecraft-server-util");

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT || 10000);
const MC_HOST = process.env.MC_HOST || "";
const MC_PORT = Number(process.env.MC_PORT || 25565);

const CHECK_INTERVAL = Math.max(
  30000,
  Number(process.env.CHECK_INTERVAL_MS || 60000)
);

const TIMEOUT = Number(
  process.env.REQUEST_TIMEOUT_MS || 5000
);

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

let latest = {
  state: "NOT_CONFIGURED",
  host: MC_HOST || null,
  port: MC_PORT,
  playersOnline: null,
  playersMax: null,
  version: null,
  latencyMs: null,
  checkedAt: null,
  lastOnlineAt: null,
  lastError: null
};

let checking = false;
let previousState = null;

async function sendWebhook(message) {
  if (!WEBHOOK) return;

  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: message
      })
    });
  } catch (error) {
    console.log("Webhook error:", error.message);
  }
}

async function checkMinecraft() {
  if (checking) return;

  if (!MC_HOST) {
    latest.state = "NOT_CONFIGURED";
    latest.lastError = "MC_HOST is missing";
    latest.checkedAt = new Date().toISOString();
    return;
  }

  checking = true;

  const started = Date.now();

  try {
    const result = await status(
      MC_HOST,
      MC_PORT,
      {
        timeout: TIMEOUT,
        enableSRV: true
      }
    );

    latest = {
      state: "ONLINE",
      host: MC_HOST,
      port: MC_PORT,
      playersOnline: result.players.online,
      playersMax: result.players.max,
      version: result.version.name,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      lastOnlineAt: new Date().toISOString(),
      lastError: null
    };

    if (previousState !== "ONLINE") {
      await sendWebhook(
        `🟢 Minecraft server ONLINE: ${MC_HOST}`
      );
    }

    previousState = "ONLINE";

  } catch (error) {

    latest = {
      ...latest,
      state: "OFFLINE",
      host: MC_HOST,
      port: MC_PORT,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      lastError: String(error.message).slice(0, 300)
    };

    if (previousState !== "OFFLINE") {
      await sendWebhook(
        `🔴 Minecraft server OFFLINE: ${MC_HOST}`
      );
    }

    previousState = "OFFLINE";

  } finally {
    checking = false;
  }
}

// Main dashboard
app.get("/", (req, res) => {

  const online = latest.state === "ONLINE";

  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport"
    content="width=device-width,initial-scale=1">

    <title>Minecraft Test System</title>

    <style>
      body {
        background:#10151d;
        color:white;
        font-family:Arial;
        padding:20px;
      }

      .card {
        background:#1b2532;
        padding:20px;
        border-radius:14px;
        margin-bottom:15px;
      }

      .status {
        font-size:25px;
        font-weight:bold;
        color:${online ? "#54d68b" : "#ff7777"};
      }

      pre {
        white-space:pre-wrap;
        overflow-wrap:anywhere;
      }
    </style>
  </head>

  <body>

    <h1>⛏️ Minecraft Test System</h1>

    <div class="card">
      <div class="status">
        ${latest.state}
      </div>

      <p>
        ${latest.host || "Host not configured"}
      </p>

      <p>
        Last checked: ${latest.checkedAt || "Waiting"}
      </p>
    </div>

    <div class="card">
      <h3>Server Information</h3>

      <pre>${JSON.stringify(latest, null, 2)}</pre>
    </div>

    <p>Authorized Minecraft Monitoring System</p>

  </body>
  </html>
  `);
});

// Render health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "minecraft-test-system"
  });
});

// Server status API
app.get("/api/status", (req, res) => {
  res.json(latest);
});

// Manual server check
app.post("/api/check", async (req, res) => {
  await checkMinecraft();
  res.json(latest);
});

// Start server
app.listen(PORT, () => {

  console.log(
    `Minecraft Test System running on ${PORT}`
  );

  checkMinecraft();

  setInterval(
    checkMinecraft,
    CHECK_INTERVAL
  );

});

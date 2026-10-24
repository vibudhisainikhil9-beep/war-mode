import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const CONFIG_FILE = path.join(__dirname, 'config.json');

const VAULT = [
  // Track 1: The Muzzle (Anti-Oversharing)
  "🤫 LOCK-IN: Shut your mouth. Stop pitching your ideas to people who haven't built anything.",
  "🤫 LOCK-IN: Work in the dark. Let your results announce your projects, not your words.",
  "🤫 LOCK-IN: You feel like talking right now? Open your laptop and write code instead.",
  "🤫 LOCK-IN: Talking about your idea gives your brain fake dopamine. Stop talking. Build.",
  "🤫 LOCK-IN: Moving in silence is your unfair advantage. Don't throw it away for cheap conversation.",

  // Track 2: The Circle (Walking Away)
  "🚪 LOCK-IN: Are you standing around wasting time again? Walk away. You have a vision.",
  "🚪 LOCK-IN: You told yourself you'd stay out of useless drama. Why are you still in that circle?",
  "🚪 LOCK-IN: Winners are isolated during their building phase. Disconnect immediately.",
  "🚪 LOCK-IN: Look at who you're listening to right now. Do you want their exact life in 5 years?",
  "🚪 LOCK-IN: Every minute spent entertaining mediocrity costs you your momentum.",

  // Track 3: The Hammer (Raw Execution)
  "🔨 LOCK-IN: Focus on your fucking work. The clock is ticking.",
  "🔨 LOCK-IN: Are you executing right now, or just pretending to be busy?",
  "🔨 LOCK-IN: What did you actually ship in the last 15 minutes?",
  "🔨 LOCK-IN: The competition is coding right now while you are scrolling. Close this screen.",
  "🔨 LOCK-IN: Stop planning. Stop tweaking configs. Ship the core feature."
];

// Persistent state
let state = {
  isArmed: true,
  intervalMinutes: 15,
  botToken: "",
  chatId: "",
  nextTriggerTimestamp: Date.now() + 15 * 60 * 1000,
  history: []
};

// Load saved config if exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    state.isArmed = saved.isArmed ?? true;
    state.intervalMinutes = saved.intervalMinutes || 15;
    state.botToken = saved.botToken || "";
    state.chatId = saved.chatId || "";
    state.nextTriggerTimestamp = Date.now() + state.intervalMinutes * 60 * 1000;
  } catch (e) {
    console.error("Failed to read config.json, using defaults.");
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
      isArmed: state.isArmed,
      intervalMinutes: state.intervalMinutes,
      botToken: state.botToken,
      chatId: state.chatId
    }, null, 2));
  } catch (e) {
    console.error("Failed to save config:", e);
  }
}

let timerHandle = null;

async function triggerSlap(isTest = false) {
  const quote = VAULT[Math.floor(Math.random() * VAULT.length)];
  const timestamp = new Date().toLocaleTimeString();
  let telegramStatus = "Skipped (Credentials not configured)";

  if (state.botToken && state.chatId) {
    try {
      const url = `https://api.telegram.org/bot${state.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: state.chatId,
          text: quote
        })
      });
      const data = await res.json();
      telegramStatus = data.ok ? "Delivered to Phone" : `Telegram Error: ${data.description}`;
    } catch (err) {
      telegramStatus = `Network Error: ${err.message}`;
    }
  }

  const logEntry = {
    id: Date.now(),
    timestamp,
    quote,
    telegramStatus,
    isTest
  };

  state.history.unshift(logEntry);
  if (state.history.length > 50) state.history.pop();

  console.log(`[${timestamp}] ${isTest ? "⚡ [TEST]" : "🚨 [STRIKE]"}: ${quote}`);
  console.log(`   └─ Telegram: ${telegramStatus}`);

  return logEntry;
}

function armScheduler() {
  if (timerHandle) clearInterval(timerHandle);

  if (!state.isArmed) {
    state.nextTriggerTimestamp = null;
    return;
  }

  state.nextTriggerTimestamp = Date.now() + state.intervalMinutes * 60 * 1000;

  timerHandle = setInterval(() => {
    if (state.isArmed) {
      triggerSlap(false);
      state.nextTriggerTimestamp = Date.now() + state.intervalMinutes * 60 * 1000;
    }
  }, state.intervalMinutes * 60 * 1000);
}

// Start schedule on boot
armScheduler();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for local flexibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (url.pathname === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  if (url.pathname === '/api/toggle' && req.method === 'POST') {
    state.isArmed = !state.isArmed;
    saveConfig();
    armScheduler();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ isArmed: state.isArmed, nextTriggerTimestamp: state.nextTriggerTimestamp }));
    return;
  }

  if (url.pathname === '/api/test' && req.method === 'POST') {
    const entry = await triggerSlap(true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, entry }));
    return;
  }

  if (url.pathname === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.intervalMinutes) state.intervalMinutes = Math.max(1, parseInt(payload.intervalMinutes, 10));
        if (payload.botToken !== undefined) state.botToken = payload.botToken.trim();
        if (payload.chatId !== undefined) state.chatId = payload.chatId.trim();
        saveConfig();
        armScheduler();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, state }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve UI
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHtmlContent());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log("==========================================================");
  console.log(`🛡️  WAR MODE LOCAL ENGINE HOSTED`);
  console.log(`📍 Dashboard URL: http://localhost:${PORT}`);
  console.log(`⏱️  Current Interval: ${state.intervalMinutes} minutes`);
  console.log(`⚔️  Status: ${state.isArmed ? "ARMED (Active)" : "DISARMED"}`);
  console.log("==========================================================");
});

function getHtmlContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WAR MODE // Digital Bodyguard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "JetBrains Mono", monospace; }
    body { background: #070707; color: #ececec; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 30px 20px; }
    .container { width: 100%; max-width: 680px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; }
    .badge-armed { background: rgba(0, 255, 102, 0.15); color: #00ff66; border: 1px solid #00ff66; }
    .badge-disarmed { background: rgba(255, 68, 68, 0.15); color: #ff4444; border: 1px solid #ff4444; }
    h1 { font-size: 32px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .subtitle { color: #777; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
    .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 24px; margin-bottom: 20px; }
    .countdown-display { font-size: 54px; font-weight: 900; letter-spacing: 2px; color: #fff; margin: 12px 0 6px 0; font-variant-numeric: tabular-nums; }
    .countdown-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .btn-group { display: flex; gap: 12px; margin-top: 20px; }
    button { flex: 1; padding: 14px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: 0.15s ease; }
    .btn-toggle-armed { background: #00ff66; color: #000; }
    .btn-toggle-armed:hover { background: #00cc52; }
    .btn-toggle-disarmed { background: #ff3b30; color: #fff; }
    .btn-toggle-disarmed:hover { background: #d32f2f; }
    .btn-test { background: #222; color: #fff; border: 1px solid #333; }
    .btn-test:hover { background: #2a2a2a; border-color: #555; }
    .feed { max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .feed-item { background: #161616; border-left: 3px solid #00ff66; padding: 12px 14px; border-radius: 0 4px 4px 0; font-size: 13px; line-height: 1.4; }
    .feed-item.test { border-left-color: #ffd60a; }
    .feed-meta { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-bottom: 4px; }
    .input-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    label { font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    input { background: #0a0a0a; border: 1px solid #2a2a2a; color: #fff; padding: 10px 12px; border-radius: 4px; font-size: 14px; }
    input:focus { outline: none; border-color: #00ff66; }
    .save-btn { background: #222; color: #00ff66; border: 1px solid #00ff66; padding: 10px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: 700; }
    .save-btn:hover { background: #00ff66; color: #000; }
  </style>
</head>
<body>
  <div class="container">
    <div id="statusBadge" class="badge badge-armed">WAR MODE ARMED</div>
    <h1>DIGITAL BODYGUARD</h1>
    <p class="subtitle">Anti-oversharing & deep execution enforcement. Slaps your screen every 15 minutes.</p>

    <!-- Main Controller Card -->
    <div class="card" style="text-align: center;">
      <div class="countdown-label">Next Reality Check In</div>
      <div id="countdown" class="countdown-display">--:--</div>
      <div id="targetTimeText" style="font-size: 12px; color: #555;">Calculating...</div>

      <div class="btn-group">
        <button id="toggleBtn" class="btn-toggle-armed" onclick="toggleArm()">STAND DOWN</button>
        <button class="btn-test" onclick="triggerTest()">⚡ SLAP NOW</button>
      </div>
    </div>

    <!-- Live Execution Vault Card -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #aaa;">Live Reality Checks</h3>
        <span id="logCount" style="font-size: 11px; color: #555;">0 alerts</span>
      </div>
      <div id="feedList" class="feed">
        <div style="color: #444; font-size: 12px; text-align: center; padding: 20px;">No alerts fired yet. Arm the system or click 'SLAP NOW'.</div>
      </div>
    </div>

    <!-- Configuration Card -->
    <div class="card">
      <h3 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #aaa; margin-bottom: 16px;">Target Delivery Channel</h3>
      <div class="input-row">
        <label>Alert Frequency (Minutes)</label>
        <input type="number" id="cfgInterval" min="1" max="180" value="15">
      </div>
      <div class="input-row">
        <label>Telegram Bot Token (Optional - for mobile lockscreen push)</label>
        <input type="text" id="cfgToken" placeholder="7123456789:ABCdefGhI...">
      </div>
      <div class="input-row">
        <label>Telegram Chat ID (Optional)</label>
        <input type="text" id="cfgChatId" placeholder="123456789">
      </div>
      <button class="save-btn" onclick="saveSettings()">SAVE & APPLY CONFIG</button>
    </div>
  </div>

  <script>
    let state = {};

    async function fetchState() {
      try {
        const res = await fetch('/api/state');
        state = await res.json();
        renderUI();
      } catch (e) {
        console.error("Failed to connect to local server", e);
      }
    }

    function renderUI() {
      const badge = document.getElementById('statusBadge');
      const toggleBtn = document.getElementById('toggleBtn');

      if (state.isArmed) {
        badge.className = 'badge badge-armed';
        badge.innerText = 'WAR MODE ARMED';
        toggleBtn.className = 'btn-toggle-disarmed';
        toggleBtn.innerText = 'DISARM (STAND DOWN)';
      } else {
        badge.className = 'badge badge-disarmed';
        badge.innerText = 'WAR MODE DISARMED';
        toggleBtn.className = 'btn-toggle-armed';
        toggleBtn.innerText = 'ARM WAR MODE';
      }

      document.getElementById('cfgInterval').value = state.intervalMinutes || 15;
      document.getElementById('cfgToken').value = state.botToken || '';
      document.getElementById('cfgChatId').value = state.chatId || '';

      renderFeed(state.history || []);
    }

    function renderFeed(history) {
      const feed = document.getElementById('feedList');
      const logCount = document.getElementById('logCount');
      logCount.innerText = history.length + ' fired';

      if (!history.length) return;

      feed.innerHTML = history.map(item => \`
        <div class="feed-item \${item.isTest ? 'test' : ''}">
          <div class="feed-meta">
            <span>\${item.isTest ? '⚡ TEST' : '🚨 STRIKE'} • \${item.timestamp}</span>
            <span>\${item.telegramStatus}</span>
          </div>
          <div>\${item.quote}</div>
        </div>
      \`).join('');
    }

    async function toggleArm() {
      await fetch('/api/toggle', { method: 'POST' });
      fetchState();
    }

    async function triggerTest() {
      const res = await fetch('/api/test', { method: 'POST' });
      const data = await res.json();
      if (data.entry && Notification.permission === "granted") {
        new Notification("🚨 DIGITAL BODYGUARD", {
          body: data.entry.quote,
          icon: "https://cdn-icons-png.flaticon.com/512/2875/2875370.png"
        });
      }
      fetchState();
    }

    async function saveSettings() {
      const intervalMinutes = document.getElementById('cfgInterval').value;
      const botToken = document.getElementById('cfgToken').value;
      const chatId = document.getElementById('cfgChatId').value;

      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes, botToken, chatId })
      });
      alert('Config applied & War Mode armed with new parameters.');
      fetchState();
    }

    function updateCountdown() {
      if (!state.isArmed || !state.nextTriggerTimestamp) {
        document.getElementById('countdown').innerText = '--:--';
        document.getElementById('targetTimeText').innerText = 'War Mode disarmed.';
        return;
      }

      const diff = state.nextTriggerTimestamp - Date.now();
      if (diff <= 0) {
        document.getElementById('countdown').innerText = '00:00';
        fetchState();
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      document.getElementById('countdown').innerText = 
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      document.getElementById('targetTimeText').innerText = 
        'Scheduled at ' + new Date(state.nextTriggerTimestamp).toLocaleTimeString();
    }

    // Request native browser desktop notifications
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    fetchState();
    setInterval(updateCountdown, 1000);
    setInterval(fetchState, 5000);
  </script>
</body>
</html>`;
}

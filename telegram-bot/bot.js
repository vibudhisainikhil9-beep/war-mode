import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '15', 10);

const VAULT = [
  // Track 1: The Muzzle (Anti-Oversharing)
  "LOCK-IN: “Shut your mouth. Stop pitching your ideas to people who haven't built anything.”",
  "LOCK-IN: “Work in the dark. Let your results announce your projects, not your words.”",
  "LOCK-IN: “You feel like talking right now? Open your laptop and write code instead.”",
  
  // Track 2: The Circle (Walking Away)
  "LOCK-IN: “Are you standing around wasting time again? Walk away. You have a vision.”",
  "LOCK-IN: “You told yourself you'd stay out of useless drama. Why are you still in that circle?”",
  "LOCK-IN: “Winners are isolated during their building phase. Disconnect.”",

  // Track 3: The Hammer (Raw Execution)
  "LOCK-IN: “Focus on your fucking work. The clock is ticking.”",
  "LOCK-IN: “Are you executing right now, or just pretending to be busy?”",
  "LOCK-IN: “Nov 19 and Nov 28 are coming. What did you ship in the last 15 minutes?”"
];

async function sendSlap() {
  if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.error("\n❌ [ERROR]: Put your Telegram Bot credentials in .env");
    return false;
  }

  const randomQuote = VAULT[Math.floor(Math.random() * VAULT.length)];
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: randomQuote
      })
    });

    const data = await res.json();
    if (!data.ok) {
      console.error(`❌ Telegram Error: ${data.description}`);
      return false;
    }

    console.log(`[${new Date().toLocaleTimeString()}] ✅ Reality check sent to your phone:`);
    console.log(`   ${randomQuote}\n`);
    return true;
  } catch (err) {
    console.error(`❌ Network error:`, err.message);
    return false;
  }
}

const isOnce = process.argv.includes('--once');

if (isOnce) {
  sendSlap().then(() => process.exit(0));
} else {
  console.log("==================================================");
  console.log("🛡️  WAR MODE: DIGITAL BODYGUARD ACTIVE");
  console.log(`⏱️  Frequency: Notification every ${INTERVAL_MINUTES} minutes`);
  console.log("==================================================");

  sendSlap();
  setInterval(sendSlap, INTERVAL_MINUTES * 60 * 1000);
}

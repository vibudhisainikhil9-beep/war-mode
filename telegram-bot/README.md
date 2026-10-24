# 🛡️ War Mode: Telegram Digital Bodyguard

Sends cold, brutal reality checks to your phone lock screen every 15 minutes via Telegram Push Notifications.

---

## ⚡ 3-Minute Quickstart (Run on your machine)

1. Open Telegram:
   - Search for `@BotFather`
   - Send `/newbot` and follow instructions to name it
   - Copy your **HTTP API Token**
2. Find your Chat ID:
   - Search for `@userinfobot` in Telegram, click **Start**
   - Copy the numerical **Id**
3. Start the bot on your phone:
   - Open your newly created bot in Telegram and tap **Start** (critical so it has permission to message you!)
4. Configure credentials:
   - In this folder, copy `.env.example` to `.env`
   - Fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
5. Test a single alert:
   ```bash
   node bot.js --once
   ```
6. Start continuous 15-minute bodyguard:
   ```bash
   node bot.js
   ```

---

## ☁️ Zero-Maintenance Cloud Deploy (Cloudflare Workers)

1. Sign up for free at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Go to **Workers & Pages** > **Create application** > **Create Worker**.
3. Paste the contents of `worker.js`.
4. Under **Settings > Variables**, add:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. Under **Settings > Triggers > Cron Triggers**, add:
   - `*/15 * * * *` (Every 15 minutes)
6. Done. It will run 24/7 forever for $0.

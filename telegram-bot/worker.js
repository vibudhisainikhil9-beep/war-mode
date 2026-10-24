// Cloudflare Workers Scheduled Cron handler
// Set CRON Trigger in wrangler.toml or Cloudflare Dashboard: "*/15 * * * *"
// Set Environment Variables: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID

const VAULT = [
  "🤫 *LOCK-IN:* Shut your mouth. Stop pitching your ideas to people who haven't built anything.",
  "🤫 *LOCK-IN:* Work in the dark. Let your results announce your projects, not your words.",
  "🤫 *LOCK-IN:* You feel like talking right now? Open your laptop and write code instead.",
  "🤫 *LOCK-IN:* Talking about code gives your brain fake dopamine. Stop talking. Start shipping.",
  "🚪 *LOCK-IN:* Are you standing around wasting time again? Walk away. You have a vision.",
  "🚪 *LOCK-IN:* You told yourself you'd stay out of useless drama. Why are you still in that circle?",
  "🚪 *LOCK-IN:* Winners are isolated during their building phase. Disconnect immediately.",
  "🚪 *LOCK-IN:* Look at who you're listening to right now. Do you want their exact life in 5 years?",
  "🔨 *LOCK-IN:* Focus on your work. The clock is ticking.",
  "🔨 *LOCK-IN:* Are you executing right now, or just pretending to be busy?",
  "🔨 *LOCK-IN:* What did you actually ship in the last 15 minutes?",
  "🔨 *LOCK-IN:* The competition is coding while you are scrolling. Close this screen and execute."
];

export default {
  async scheduled(event, env, ctx) {
    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
      return;
    }

    const randomQuote = VAULT[Math.floor(Math.random() * VAULT.length)];
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: randomQuote,
        parse_mode: "Markdown"
      })
    });

    const data = await res.json();
    console.log("Delivered slap:", data.ok);
  },

  // Optional HTTP trigger for manual testing (e.g. visiting worker URL in browser)
  async fetch(request, env, ctx) {
    const randomQuote = VAULT[Math.floor(Math.random() * VAULT.length)];
    return new Response(JSON.stringify({ status: "War Mode Armed", sample: randomQuote }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

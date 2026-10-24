const VAULT = [
  "LOCK-IN: “Shut your mouth. Stop pitching your ideas to people who haven't built anything.”",
  "LOCK-IN: “Work in the dark. Let your results announce your projects, not your words.”",
  "LOCK-IN: “You feel like talking right now? Open your laptop and write code instead.”",
  "LOCK-IN: “Are you standing around wasting time again? Walk away. You have a vision.”",
  "LOCK-IN: “You told yourself you'd stay out of useless drama. Why are you still in that circle?”",
  "LOCK-IN: “Winners are isolated during their building phase. Disconnect.”",
  "LOCK-IN: “Focus on your fucking work. The clock is ticking.”",
  "LOCK-IN: “Are you executing right now, or just pretending to be busy?”",
  "LOCK-IN: “Nov 19 and Nov 28 are coming. What did you ship in the last 15 minutes?”"
];

export default async function handler(req, res) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(400).json({
      error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables."
    });
  }

  const quote = VAULT[Math.floor(Math.random() * VAULT.length)];
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const telegramRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: quote
      })
    });

    const data = await telegramRes.json();
    return res.status(200).json({
      success: true,
      deliveredAt: new Date().toISOString(),
      quote,
      telegram: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

# 🛡️ WAR MODE: The Digital Bodyguard

Anti-oversharing, anti-slacking alert system designed to break dopamine loops in public.

## 📂 Project Structure

```
war-mode/
├── telegram-bot/          # [Architecture 1] Ready-to-run 15-minute push engine
│   ├── bot.js             # Local runner (Node.js)
│   ├── worker.js          # Cloudflare Worker script (0 servers, $0 cost)
│   ├── .env.example       # Template for Bot token & Chat ID
│   └── README.md
│
└── android-app/           # [Architecture 2] 100% offline standalone Android app
    ├── app/               # Native Kotlin app (AlarmManager + Heads-up Notifications)
    ├── build.gradle.kts   # Gradle build config
    └── README.md          # Android Studio setup guide
```

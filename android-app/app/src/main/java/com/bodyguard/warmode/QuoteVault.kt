package com.bodyguard.warmode

object QuoteVault {
    val quotes = listOf(
        // Track 1: The Muzzle (Anti-Oversharing)
        "🤫 Shut your mouth. Stop pitching your ideas to people who haven't built anything.",
        "🤫 Work in the dark. Let your results announce your projects, not your words.",
        "🤫 You feel like talking right now? Open your laptop and write code instead.",

        // Track 2: The Circle (Walking Away)
        "🚪 Are you standing around wasting time again? Walk away. You have a vision.",
        "🚪 You told yourself you'd stay out of useless drama. Why are you still in that circle?",
        "🚪 Winners are isolated during their building phase. Disconnect.",

        // Track 3: The Hammer (Raw Execution)
        "🔨 Focus on your fucking work. The clock is ticking.",
        "🔨 Are you executing right now, or just pretending to be busy?",
        "🔨 Nov 19 and Nov 28 are coming. What did you ship in the last 15 minutes?"
    )

    fun getRandomSlap(): String = quotes.random()
}

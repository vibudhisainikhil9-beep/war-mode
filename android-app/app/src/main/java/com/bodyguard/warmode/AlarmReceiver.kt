package com.bodyguard.warmode

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "WAR_MODE_NOTIFICATIONS"
        const val NOTIFICATION_ID = 1001
        const val PREFS_NAME = "WarModePrefs"
        const val KEY_IS_ACTIVE = "IS_ACTIVE"
        const val INTERVAL_MILLIS = 15 * 60 * 1000L // 15 minutes
    }

    override fun onReceive(context: Context, intent: Intent) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)

        if (!isActive) return

        // 1. Deliver the harsh notification (NO ALARM SOUND, JUST PURE NOTIFICATION & VIBRATION)
        val message = QuoteVault.getRandomSlap()
        deliverNotification(context, message)

        // 2. Schedule the next 15-minute background tick
        scheduleNextTick(context)
    }

    private fun deliverNotification(context: Context, message: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Setup notification channel for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "War Mode Slaps",
                NotificationManager.IMPORTANCE_HIGH // Pops up as heads-up banner on screen
            ).apply {
                description = "15-minute reality check notifications"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 100, 300)
                setSound(null, null) // PURE SILENT / VIBRATION - ZERO ALARM RINGING
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("LOCK-IN")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE) // Strictly a message notification
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setSound(null) // No alarm clock sound
            .setVibrate(longArrayOf(0, 300, 100, 300))
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun scheduleNextTick(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val triggerTime = System.currentTimeMillis() + INTERVAL_MILLIS

        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerTime,
                pendingIntent
            )
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }
}

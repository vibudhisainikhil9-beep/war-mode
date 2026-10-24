package com.bodyguard.warmode

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var statusHeader: TextView
    private lateinit var statusDesc: TextView
    private lateinit var mainToggleButton: Button
    private lateinit var testAlertButton: Button
    private lateinit var batteryHintText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request runtime permissions if on Android 13+
        requestNeededPermissions()

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#0A0A0A"))
            gravity = Gravity.CENTER
            setPadding(48, 80, 48, 80)
        }

        statusHeader = TextView(this).apply {
            textSize = 28f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            text = "WAR MODE"
        }

        statusDesc = TextView(this).apply {
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#888888"))
            setPadding(0, 24, 0, 72)
        }

        mainToggleButton = Button(this).apply {
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(60, 40, 60, 40)
            elevation = 0f
        }

        testAlertButton = Button(this).apply {
            text = "⚡ TEST ALERT NOW"
            textSize = 14f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#222222"))
            setPadding(40, 20, 40, 20)
            elevation = 0f
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 40
            }
            layoutParams = params
        }

        batteryHintText = TextView(this).apply {
            textSize = 12f
            setTextColor(Color.parseColor("#555555"))
            gravity = Gravity.CENTER
            text = "💡 Tip: Set battery usage to 'Unrestricted' for guaranteed alerts."
            setPadding(0, 60, 0, 0)
        }

        rootLayout.addView(statusHeader)
        rootLayout.addView(statusDesc)
        rootLayout.addView(mainToggleButton)
        rootLayout.addView(testAlertButton)
        rootLayout.addView(batteryHintText)
        setContentView(rootLayout)

        mainToggleButton.setOnClickListener {
            toggleWarMode()
        }

        testAlertButton.setOnClickListener {
            // Trigger receiver immediately
            val intent = Intent(this, AlarmReceiver::class.java)
            sendBroadcast(intent)
            Toast.makeText(this, "Firing test reality check...", Toast.LENGTH_SHORT).show()
        }

        batteryHintText.setOnClickListener {
            requestBatteryOptimizationExemption()
        }

        refreshUI()
    }

    override fun onResume() {
        super.onResume()
        refreshUI()
    }

    private fun refreshUI() {
        val prefs = getSharedPreferences(AlarmReceiver.PREFS_NAME, Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean(AlarmReceiver.KEY_IS_ACTIVE, false)

        if (isActive) {
            statusHeader.text = "WAR MODE: ARMED"
            statusHeader.setTextColor(Color.parseColor("#00FF66"))
            statusDesc.text = "Digital Bodyguard Active.\nPhone will strike every 15 minutes.\nNo mercy. No oversharing."
            mainToggleButton.text = "STAND DOWN (DISARM)"
            mainToggleButton.setBackgroundColor(Color.parseColor("#3B1414"))
            mainToggleButton.setTextColor(Color.parseColor("#FF5555"))
        } else {
            statusHeader.text = "WAR MODE: DISARMED"
            statusHeader.setTextColor(Color.parseColor("#666666"))
            statusDesc.text = "You are vulnerable to distraction,\nfake dopamine, and oversharing in public.\nLock in when ready."
            mainToggleButton.text = "ENGAGE WAR MODE"
            mainToggleButton.setBackgroundColor(Color.parseColor("#00FF66"))
            mainToggleButton.setTextColor(Color.parseColor("#000000"))
        }
    }

    private fun toggleWarMode() {
        val prefs = getSharedPreferences(AlarmReceiver.PREFS_NAME, Context.MODE_PRIVATE)
        val currentlyActive = prefs.getBoolean(AlarmReceiver.KEY_IS_ACTIVE, false)
        val newState = !currentlyActive

        prefs.edit().putBoolean(AlarmReceiver.KEY_IS_ACTIVE, newState).apply()

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(this, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (newState) {
            // Check exact alarm permission on Android 12+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    val settingsIntent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(settingsIntent)
                    Toast.makeText(this, "Please grant Exact Alarm permission", Toast.LENGTH_LONG).show()
                }
            }

            // Arm hardware alarm 15 minutes out
            val triggerTime = System.currentTimeMillis() + AlarmReceiver.INTERVAL_MILLIS
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
                Toast.makeText(this, "War Mode armed. First strike in 15 mins.", Toast.LENGTH_SHORT).show()
            } catch (e: SecurityException) {
                Toast.makeText(this, "Permission required for exact alarms", Toast.LENGTH_SHORT).show()
            }
        } else {
            // Cancel alarm
            alarmManager.cancel(pendingIntent)
            Toast.makeText(this, "War Mode disarmed.", Toast.LENGTH_SHORT).show()
        }

        refreshUI()
    }

    private fun requestNeededPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    101
                )
            }
        }
    }

    @SuppressLint("BatteryLife")
    private fun requestBatteryOptimizationExemption() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
        } else {
            Toast.makeText(this, "Battery optimization already disabled!", Toast.LENGTH_SHORT).show()
        }
    }
}

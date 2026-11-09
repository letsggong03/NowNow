package com.mibandtest

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import java.util.Calendar

/**
 * 하루 마무리 알림. 폰 시간 기준으로 매일 정해진 시각에 알림을 띄운다.
 * 서버 없이 폰의 AlarmManager로 예약하고, 알림이 뜰 때마다 다음 날을 다시 예약한다.
 * 알림을 누르면 nownow://chat 으로 앱의 채팅 탭을 연다.
 */
object DailyReminder {
    private const val PREFS = "daily_reminder"
    private const val CHANNEL_ID = "daily_reminder"
    private const val NOTIFICATION_ID = 2300
    private const val REQUEST_CODE = 2300
    private const val WINDOW_MS = 10 * 60 * 1000L
    private val cities = mapOf(
        "서울" to (37.57 to 126.98), "부산" to (35.18 to 129.08),
        "대전" to (36.35 to 127.38), "대구" to (35.87 to 128.60),
        "광주" to (35.16 to 126.85), "제주" to (33.50 to 126.53),
        "인천" to (37.46 to 126.70), "안양" to (37.39 to 126.96)
    )

    fun save(context: Context, hour: Int, minute: Int, messages: List<String>) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("enabled", true)
            .putInt("hour", hour)
            .putInt("minute", minute)
            .putString("messages", JSONArray(messages).toString())
            .apply()
    }

    fun disable(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean("enabled", false)
            .apply()
        alarmManager(context).cancel(alarmIntent(context))
    }

    fun setExtras(context: Context, city: String, playDays: String) {
        require(city.isEmpty() || cities.containsKey(city))
        require(playDays in setOf("", "weekdays", "weekends", "daily"))
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("weather_city", city).putString("play_days", playDays).remove("play").apply()
        for (kind in 1..2) {
            alarmManager(context).cancel(alarmIntent(context, kind))
            scheduleNext(context, kind)
        }
    }

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("enabled", false)

    private fun nextPlayTime(days: String, now: Calendar): Long? {
        if (days !in setOf("weekdays", "weekends", "daily")) return null
        for (offset in 0..7) {
            val date = (now.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, offset) }
            val weekend = date.get(Calendar.DAY_OF_WEEK) in setOf(Calendar.SATURDAY, Calendar.SUNDAY)
            if ((days == "weekdays" && weekend) || (days == "weekends" && !weekend)) continue
            for (hour in listOf(9, 12, 17)) {
                val slot = (date.clone() as Calendar).apply {
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                if (slot.after(now)) return slot.timeInMillis
            }
        }
        return null
    }

    /** 저장된 시각의 다음 회차를 예약한다. 꺼져 있으면 아무것도 하지 않는다. 반환: 예약 시각(ms) 또는 null */
    fun scheduleNext(context: Context, kind: Int = 0): Long? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val active = when (kind) {
            1 -> prefs.getString("weather_city", "").orEmpty().isNotEmpty()
            2 -> prefs.getString("play_days", "").orEmpty().isNotEmpty()
            else -> prefs.getBoolean("enabled", false)
        }
        if (!active) return null

        val next = if (kind == 2) {
            nextPlayTime(prefs.getString("play_days", "").orEmpty(), Calendar.getInstance()) ?: return null
        } else Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, if (kind == 1) 8 else prefs.getInt("hour", 23))
            set(Calendar.MINUTE, if (kind == 0) prefs.getInt("minute", 0) else 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
        }.timeInMillis

        val manager = alarmManager(context)
        val intent = alarmIntent(context, kind)
        // 정확한 알람 권한이 있으면 정각에 울린다. 없으면(Android 14부터 기본 꺼짐) 정한 시각부터
        // 10분 안에 울리게 한다. 창을 정하지 않으면 다음 날 알람은 최대 1시간까지 늦어진다.
        if (canScheduleExact(context)) {
            manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, intent)
        } else {
            manager.setWindow(AlarmManager.RTC_WAKEUP, next, WINDOW_MS, intent)
        }
        return next
    }

    fun canScheduleExact(context: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager(context).canScheduleExactAlarms()

    /** "알람 및 리마인더" 권한 설정 화면을 연다(정각 알림을 원할 때). */
    fun openExactAlarmSettings(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        context.startActivity(
            Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }

    fun setNickname(context: Context, nickname: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("nickname", nickname.trim().take(20)).apply()
    }

    fun show(context: Context, kind: Int = 0) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val messages = JSONArray(prefs.getString("messages", "[]"))
        val nickname = prefs.getString("nickname", "").orEmpty()
        val message = when (kind) {
            1 -> {
                val city = prefs.getString("weather_city", "").orEmpty()
                if (!cities.containsKey(city)) return
                val weather = weatherMessage(city)
                if (prefs.getString("weather_city", "") != city) return
                weather
            }
            2 -> {
                if (prefs.getString("play_days", "").orEmpty().isEmpty()) return
                when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
                    in 0..10 -> "좋은 아침! 뿡뿡이랑 오늘 첫 인사 나눌래? ☀️"
                    in 11..14 -> "점심시간이야! 잠깐 놀고 기운 충전할래? 🐾"
                    else -> "나 오늘 너한테 보여주려고 새 표정 연습했어. 보러 올래? ฅ(˶ᵔ ᵕ ᵔ˶)ฅ"
                }
            }
            3 -> "잠깐 쉬어갈래? 뿡뿡이가 오늘의 귀여운 표정을 준비했어 🐾"
            else -> if (messages.length() > 0) messages.getString((0 until messages.length()).random())
                else "오늘 하루는 어땠나요? 뿡뿡이에게 들려주세요."
        }

        if (prefs.getString("nickname", "").orEmpty() != nickname) return
        val body = if (nickname.isNotEmpty() && (0..3).random() == 0) "$nickname, $message" else message
        createChannel(context)

        val open = PendingIntent.getActivity(
            context,
            REQUEST_CODE + kind,
            Intent(Intent.ACTION_VIEW, Uri.parse(when (kind) {
                1 -> "nownow://chat?invite=weather"
                2, 3 -> "nownow://chat?invite=play"
                else -> "nownow://chat"
            })).apply {
                setPackage(context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("뿡뿡이")
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()

        // 알림 권한이 없으면 조용히 건너뛴다(Android 13+).
        if (NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID + kind, notification)
        }
    }

    private fun weatherMessage(city: String): String {
        val (latitude, longitude) = cities.getValue(city)
        val weather = runCatching {
            val address = "https://api.open-meteo.com/v1/forecast?latitude=$latitude&longitude=$longitude" +
                "&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,snowfall_sum,wind_speed_10m_max" +
                "&timezone=Asia%2FSeoul&forecast_days=1"
            val connection = URL(address).openConnection().apply {
                connectTimeout = 2000
                readTimeout = 2000
            }
            connection.getInputStream().bufferedReader().use {
                JSONObject(it.readText()).getJSONObject("daily")
            }
        }.getOrNull()
        if (weather == null) {
            return when (Calendar.getInstance().get(Calendar.MONTH)) {
                Calendar.DECEMBER, Calendar.JANUARY, Calendar.FEBRUARY ->
                    "벌써 붕어빵 계절이네! 너는 팥이야, 슈크림이야? 🐟"
                else -> "아침 인사하러 왔어! 오늘도 너만의 속도로 다녀와 🌷"
            }
        }
        fun daily(key: String) = weather.optJSONArray(key)?.optDouble(0) ?: Double.NaN
        val low = daily("temperature_2m_min")
        val high = daily("temperature_2m_max")
        val rain = daily("precipitation_sum")
        val wind = daily("wind_speed_10m_max")
        val snow = daily("snowfall_sum")
        val note = when {
            snow > 0 -> "눈 예보가 있어. 미끄러운 길 조심해! ☃️"
            rain >= 0.5 -> "오늘 강수량 예보는 ${rain}mm야. 우산 챙겨 ☔"
            wind >= 30 -> "오늘 바람이 세대. 모자 꼭 잡아! 🌬️"
            low <= 2 -> "따뜻한 외투 챙겨. 뿡뿡이가 따뜻한 하루를 빌게 🧣"
            high >= 29 -> "나갈 때 물 한 병 챙기자. 오늘도 잘 다녀와! 💧"
            else -> "오늘도 네 편이야. 조심히 다녀와 🌷"
        }
        val temperature = if (low.isFinite() && high.isFinite()) " ${low.toInt()}~${high.toInt()}°C." else "."
        return "$city 오늘 예보$temperature $note"
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "뿡뿡이 알림",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply { description = "하루 마무리, 날씨 한마디, 뿡뿡이의 놀자 알림을 전해요." }
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun alarmManager(context: Context) =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun alarmIntent(context: Context, kind: Int = 0): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            REQUEST_CODE + kind,
            Intent(context, DailyReminderReceiver::class.java).putExtra("kind", kind),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
}

/** 예약한 시각이 되면 알림을 띄우고 다음 날을 예약한다. */
class DailyReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val kind = intent.getIntExtra("kind", 0)
        if (kind == 0 && !DailyReminder.isEnabled(context)) return
        DailyReminder.scheduleNext(context, kind)
        if (kind != 1) {
            DailyReminder.show(context, kind)
            return
        }
        val pending = goAsync()
        Thread {
            try { DailyReminder.show(context, kind) } finally { pending.finish() }
        }.start()
    }
}

/** 재부팅, 앱 업데이트, 폰 시간·시간대 변경 뒤에는 예약이 지워지거나 어긋나므로 다시 예약한다. */
class DailyReminderRescheduleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        for (kind in 0..2) DailyReminder.scheduleNext(context, kind)
    }
}

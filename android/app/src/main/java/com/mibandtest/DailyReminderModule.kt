package com.mibandtest

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

/** JS에서 하루 마무리 알림을 켜고 끄는 모듈. 실제 예약은 DailyReminder가 한다. */
class DailyReminderModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DailyReminderModule"

    @ReactMethod
    fun setNickname(nickname: String, promise: Promise) {
        DailyReminder.setNickname(reactContext, nickname)
        promise.resolve(null)
    }

    /** 매일 hour:minute(폰 시간)에 messages 중 하나로 알림. 반환: 다음 알림 시각(ms) */
    @ReactMethod
    fun schedule(hour: Int, minute: Int, messages: ReadableArray, promise: Promise) {
        if (hour !in 0..23 || minute !in 0..59) {
            promise.reject("INVALID_TIME", "시각이 올바르지 않습니다: $hour:$minute")
            return
        }
        val texts = (0 until messages.size()).mapNotNull { messages.getString(it) }
        DailyReminder.save(reactContext, hour, minute, texts)
        promise.resolve(DailyReminder.scheduleNext(reactContext)?.toDouble())
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        DailyReminder.disable(reactContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun setExtras(city: String, playDays: String, promise: Promise) {
        try {
            DailyReminder.setExtras(reactContext, city, playDays)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("REMINDER_SETTINGS", "알림을 예약하지 못했어요.", error)
        }
    }

    /** 정각 알람 권한이 있는지. 없으면 정한 시각부터 10분 안에 울린다. */
    @ReactMethod
    fun canScheduleExact(promise: Promise) {
        promise.resolve(DailyReminder.canScheduleExact(reactContext))
    }

    /** 정각 알림을 원할 때 "알람 및 리마인더" 권한 화면을 연다. */
    @ReactMethod
    fun openExactAlarmSettings(promise: Promise) {
        DailyReminder.openExactAlarmSettings(reactContext)
        promise.resolve(null)
    }

    /** 개발·시연용: 지금 바로 알림을 한 번 띄운다. */
    @ReactMethod
    fun showNow(promise: Promise) {
        DailyReminder.show(reactContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun showCareCheckIn(promise: Promise) {
        DailyReminder.show(reactContext, 3)
        promise.resolve(null)
    }
}

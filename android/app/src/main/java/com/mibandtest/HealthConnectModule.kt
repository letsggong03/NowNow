package com.mibandtest

import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit

class HealthConnectModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "HealthConnectModule"
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        if (HealthConnectClient.getSdkStatus(reactContext) != HealthConnectClient.SDK_AVAILABLE) {
            promise.reject("HEALTH_UNAVAILABLE", "Health Connect 설치 또는 업데이트가 필요합니다.")
            return
        }
        val activity = reactContext.currentActivity as? MainActivity
        if (activity == null) {
            promise.reject("ACTIVITY_MISSING", "앱을 열고 다시 시도해 주세요.")
            return
        }
        activity.runOnUiThread { activity.requestHealthPermissions(promise) }
    }

    @ReactMethod
    fun getStepsStatistics(period: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                require(period in listOf("day", "week", "month"))
                val client = HealthConnectClient.getOrCreate(reactContext)
                val zone = ZoneId.of("Asia/Seoul")
                val now = Instant.now()
                val today = now.atZone(zone).toLocalDate()
                val startDate = when (period) {
                    "week" -> today.minusDays(6)
                    "month" -> today.withDayOfMonth(1)
                    else -> today
                }
                val size = if (period == "day") 24 else java.time.temporal.ChronoUnit.DAYS.between(startDate, today).toInt() + 1
                val points = Arguments.createArray()
                for (index in 0 until size) {
                    val start = if (period == "day") today.atStartOfDay(zone).plusHours(index.toLong()).toInstant()
                        else startDate.plusDays(index.toLong()).atStartOfDay(zone).toInstant()
                    val end = (if (period == "day") start.plus(1, ChronoUnit.HOURS) else start.plus(1, ChronoUnit.DAYS)).let { if (it.isAfter(now)) now else it }
                    val point = Arguments.createMap()
                    point.putString("label", if (period == "day") index.toString().padStart(2, '0') else start.atZone(zone).toLocalDate().toString().substring(5))
                    if (start.isBefore(now)) {
                        val aggregate = client.aggregate(AggregateRequest(metrics = setOf(StepsRecord.COUNT_TOTAL), timeRangeFilter = TimeRangeFilter.between(start, end)))
                        val count = aggregate[StepsRecord.COUNT_TOTAL]
                        if (count == null) point.putNull("count") else point.putDouble("count", count.toDouble())
                    } else point.putNull("count")
                    points.pushMap(point)
                }
                promise.resolve(points)
            } catch (e: Exception) {
                promise.reject("STEPS_QUERY_FAILED", "걸음 기록 조회 권한과 연결 상태를 확인해 주세요.", e)
            }
        }
    }

    @ReactMethod
    fun getHealthData(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactContext)

                val endTime = Instant.now()

                val todayStart = endTime
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant()

                val startTime24Hours = endTime.minus(24, ChronoUnit.HOURS)

                val result = Arguments.createMap()

                // 1. 오늘 걸음 수 총합
                val stepsResponse = client.aggregate(
                    AggregateRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(todayStart, endTime)
                    )
                )

                val totalSteps = stepsResponse[StepsRecord.COUNT_TOTAL] ?: 0L
                result.putDouble("stepsTotal", totalSteps.toDouble())

                // 2. 오늘 심박수 목록 + 가장 최근 심박수
                val heartRateResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(todayStart, endTime)
                    )
                )

                val heartRateSamples = Arguments.createArray()
                var latestHeartRate = 0L
                var latestHeartRateTime: Instant? = null

                for (record in heartRateResponse.records) {
                    for (sample in record.samples) {
                        if (latestHeartRateTime == null || sample.time.isAfter(latestHeartRateTime)) {
                            latestHeartRateTime = sample.time
                            latestHeartRate = sample.beatsPerMinute
                        }

                        val item = Arguments.createMap()
                        item.putString("time", sample.time.toString())
                        item.putDouble("bpm", sample.beatsPerMinute.toDouble())
                        heartRateSamples.pushMap(item)
                    }
                }

                result.putDouble("latestHeartRate", latestHeartRate.toDouble())
                result.putString("latestHeartRateTime", latestHeartRateTime?.toString())
                result.putArray("heartRateSamples", heartRateSamples)

                // 3. 오늘 산소포화도 목록 + 가장 최근 산소포화도
                val oxygenResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = OxygenSaturationRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(todayStart, endTime)
                    )
                )

                val oxygenSamples = Arguments.createArray()
                var latestOxygen = 0.0
                var latestOxygenTime: Instant? = null

                for (record in oxygenResponse.records) {
                    if (latestOxygenTime == null || record.time.isAfter(latestOxygenTime)) {
                        latestOxygenTime = record.time
                        latestOxygen = record.percentage.value
                    }

                    val item = Arguments.createMap()
                    item.putString("time", record.time.toString())
                    item.putDouble("percentage", record.percentage.value)
                    oxygenSamples.pushMap(item)
                }

                result.putDouble("latestOxygen", latestOxygen)
                result.putString("latestOxygenTime", latestOxygenTime?.toString())
                result.putArray("oxygenSamples", oxygenSamples)

                // 4. 오늘 혈압 목록 + 가장 최근 혈압
                val bloodPressureResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = BloodPressureRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(todayStart, endTime)
                    )
                )

                val bloodPressureSamples = Arguments.createArray()
                var latestSystolic = 0.0
                var latestDiastolic = 0.0
                var latestBloodPressureTime: Instant? = null

                for (record in bloodPressureResponse.records) {
                    if (latestBloodPressureTime == null || record.time.isAfter(latestBloodPressureTime)) {
                        latestBloodPressureTime = record.time
                        latestSystolic = record.systolic.inMillimetersOfMercury
                        latestDiastolic = record.diastolic.inMillimetersOfMercury
                    }

                    val item = Arguments.createMap()
                    item.putString("time", record.time.toString())
                    item.putDouble("systolic", record.systolic.inMillimetersOfMercury)
                    item.putDouble("diastolic", record.diastolic.inMillimetersOfMercury)
                    bloodPressureSamples.pushMap(item)
                }

                result.putDouble("latestSystolic", latestSystolic)
                result.putDouble("latestDiastolic", latestDiastolic)
                result.putString("latestBloodPressureTime", latestBloodPressureTime?.toString())
                result.putArray("bloodPressureSamples", bloodPressureSamples)

                // 5. 최근 24시간 수면 목록 + 가장 최근 수면 세션
                val sleepResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = SleepSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime24Hours, endTime)
                    )
                )

                val sleepSessions = Arguments.createArray()
                var latestSleepMinutes = 0L
                var latestSleepStartTime: Instant? = null
                var latestSleepEndTime: Instant? = null

                for (record in sleepResponse.records) {
                    val minutes = Duration.between(record.startTime, record.endTime).toMinutes()
                    val hours = minutes.toDouble() / 60.0

                    if (latestSleepEndTime == null || record.endTime.isAfter(latestSleepEndTime)) {
                        latestSleepEndTime = record.endTime
                        latestSleepStartTime = record.startTime
                        latestSleepMinutes = minutes
                    }

                    val item = Arguments.createMap()
                    item.putString("startTime", record.startTime.toString())
                    item.putString("endTime", record.endTime.toString())
                    item.putDouble("hours", hours)
                    sleepSessions.pushMap(item)
                }

                result.putDouble("latestSleepMinutes", latestSleepMinutes.toDouble())
                result.putString("latestSleepStartTime", latestSleepStartTime?.toString())
                result.putString("latestSleepEndTime", latestSleepEndTime?.toString())
                result.putArray("sleepSessions", sleepSessions)

                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("HEALTH_ERROR", "Health data 읽기 실패", e)
                promise.reject("HEALTH_ERROR", e)
            }
        }
    }
}

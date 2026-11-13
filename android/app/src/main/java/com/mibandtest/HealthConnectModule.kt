package com.mibandtest

import android.content.ActivityNotFoundException
import android.content.Intent
import android.util.Log
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.AggregateGroupByDurationRequest
import androidx.health.connect.client.request.ChangesTokenRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlin.reflect.KClass

class HealthConnectModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "HealthConnectModule"
    }

    override fun getConstants(): Map<String, Any> {
        val emulator = Build.MODEL.contains("sdk_gphone", ignoreCase = true) ||
            Build.PRODUCT.startsWith("sdk") || Build.HARDWARE == "ranchu"
        return mapOf(
            "localApiHost" to if (emulator) "10.0.2.2" else "127.0.0.1",
            "apiBaseUrl" to BuildConfig.NOWNOW_API_BASE_URL
        )
    }

    @ReactMethod
    fun openHealthConnectSettings(promise: Promise) {
        try {
            reactContext.startActivity(
                Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            promise.resolve(null)
        } catch (error: ActivityNotFoundException) {
            promise.reject("HEALTH_CONNECT_UNAVAILABLE", "이 기기에서 헬스 커넥트 설정을 열 수 없어요.", error)
        } catch (error: SecurityException) {
            promise.reject("HEALTH_CONNECT_SETTINGS_ERROR", "헬스 커넥트 설정을 열지 못했어요.", error)
        }
    }

    @ReactMethod
    fun requestHealthPermissions(promise: Promise) {
        val activity = reactContext.currentActivity as? MainActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "앱 화면에서 다시 시도해 주세요.")
            return
        }
        activity.runOnUiThread { activity.requestHealthPermissions(promise) }
    }

    @ReactMethod
    fun getActivityTrend(metric: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                require(metric == "steps" || metric == "sleep")
                val client = HealthConnectClient.getOrCreate(reactContext)
                val end = Instant.now()
                val zone = ZoneId.systemDefault()
                val start = if (metric == "steps") {
                    end.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant()
                } else {
                    end.minus(24, ChronoUnit.HOURS)
                }
                val range = TimeRangeFilter.between(start, maxOf(end, start.plusMillis(1)))
                val points = Arguments.createArray()
                if (metric == "steps") {
                    val rows = client.aggregateGroupByDuration(AggregateGroupByDurationRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = range,
                        timeRangeSlicer = Duration.ofHours(1)
                    ))
                    for (row in rows) {
                        val count = row.result[StepsRecord.COUNT_TOTAL] ?: continue
                        val point = Arguments.createMap()
                        point.putString("time", row.startTime.toString())
                        point.putDouble("value", count.toDouble())
                        points.pushMap(point)
                    }
                } else {
                    val rows = client.readRecords(ReadRecordsRequest(
                        recordType = SleepSessionRecord::class, timeRangeFilter = range
                    )).records
                    val sessions = rows.sortedBy { it.startTime }
                    for (hour in 0L until 24L) {
                        val from = start.plus(hour, ChronoUnit.HOURS)
                        val to = from.plus(1, ChronoUnit.HOURS)
                        var coveredUntil = from
                        var seconds = 0L
                        for (session in sessions) {
                            val overlapStart = maxOf(coveredUntil, session.startTime)
                            val overlapEnd = minOf(to, session.endTime)
                            if (overlapEnd.isAfter(overlapStart)) {
                                seconds += Duration.between(overlapStart, overlapEnd).seconds
                                coveredUntil = overlapEnd
                            }
                        }
                        if (seconds == 0L) continue
                        val point = Arguments.createMap()
                        point.putString("time", from.toString())
                        point.putDouble("value", seconds / 60.0)
                        points.pushMap(point)
                    }
                }
                val result = Arguments.createMap()
                result.putString("start", start.toString())
                result.putString("end", end.toString())
                result.putArray("points", points)
                promise.resolve(result)
            } catch (error: Exception) {
                promise.reject("ACTIVITY_TREND_ERROR", error)
            }
        }
    }

    // ── 증분 동기화 ─────────────────────────────────────────────────────────
    // 서버 저장용. 화면 표시는 getHealthData()가 맡는다.
    //
    // changesToken이 없으면(첫 동기화) sinceIso부터 지금까지 전부 읽고 새 토큰을 돌려준다.
    // 토큰이 있으면 Changes API로 그 뒤에 추가·수정·삭제된 레코드만 읽는다.
    // 토큰이 만료됐으면(30일 넘게 동기화 안 함) sinceIso부터 다시 전부 읽는다.
    //
    // 앱은 서버 저장이 모두 성공한 뒤에만 nextToken을 저장한다. 실패하면 같은 토큰으로
    // 다시 읽으므로 앱을 며칠 안 켜거나 네트워크가 끊겨도 빠지는 날이 없다.
    //
    // 걸음 수는 원본 레코드가 기기마다 겹치므로(폰+워치) 레코드 대신 Health Connect 집계를
    // 시간별로 보낸다. stepsStart~end 구간을 서버에서 통째로 바꾼다.
    @ReactMethod
    fun syncHealthData(changesToken: String?, sinceIso: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactContext)
                val now = Instant.now()
                val since = minOf(Instant.parse(sinceIso), now)
                val buffers = SyncBuffers()
                var mode: String
                var nextToken: String
                var stepsFrom: Instant? = null

                if (changesToken.isNullOrEmpty()) {
                    // 토큰을 먼저 받아야 읽는 동안 들어온 기록을 다음 동기화에서 놓치지 않는다.
                    nextToken = client.getChangesToken(ChangesTokenRequest(SYNC_RECORD_TYPES))
                    readRange(client, since, now, buffers)
                    stepsFrom = since
                    mode = "full"
                } else {
                    var token: String = changesToken
                    var expired = false
                    var earliestStep: Instant? = null
                    do {
                        val response = client.getChanges(token)
                        if (response.changesTokenExpired) {
                            expired = true
                            break
                        }
                        for (change in response.changes) {
                            when (change) {
                                is UpsertionChange -> {
                                    val record = change.record
                                    if (record is StepsRecord) {
                                        if (earliestStep == null || record.startTime.isBefore(earliestStep)) {
                                            earliestStep = record.startTime
                                        }
                                    } else {
                                        collect(record, buffers)
                                    }
                                }
                                is DeletionChange -> buffers.deleted.pushString(change.recordId)
                            }
                        }
                        token = response.nextChangesToken
                    } while (response.hasMore)

                    if (expired) {
                        nextToken = client.getChangesToken(ChangesTokenRequest(SYNC_RECORD_TYPES))
                        val fresh = SyncBuffers()
                        readRange(client, since, now, fresh)
                        buffers.replaceWith(fresh)
                        stepsFrom = since
                        mode = "expired"
                    } else {
                        nextToken = token
                        // 몇 달 전 걸음 기록이 수정돼도 서버 교체 한도(62일)를 넘지 않게 최근 30일로 자른다.
                        stepsFrom = earliestStep?.let { maxOf(it, now.minus(30, ChronoUnit.DAYS)) }
                        mode = "changes"
                    }
                }

                val result = Arguments.createMap()
                result.putString("mode", mode)
                result.putString("nextToken", nextToken)
                result.putArray("heartRate", buffers.heartRate)
                result.putArray("bloodPressure", buffers.bloodPressure)
                result.putArray("oxygen", buffers.oxygen)
                result.putArray("sleep", buffers.sleep)
                result.putArray("deleted", buffers.deleted)

                if (stepsFrom != null) {
                    val zone = ZoneId.systemDefault()
                    // 하루 중간부터 바꾸면 그날의 앞부분이 사라지므로 그날 0시부터 다시 집계한다.
                    val stepsStart = minOf(stepsFrom, now).atZone(zone).toLocalDate().atStartOfDay(zone).toInstant()
                    val rows = client.aggregateGroupByDuration(AggregateGroupByDurationRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(stepsStart, maxOf(now, stepsStart.plusMillis(1))),
                        timeRangeSlicer = Duration.ofHours(1)
                    ))
                    val steps = Arguments.createArray()
                    for (row in rows) {
                        val count = row.result[StepsRecord.COUNT_TOTAL] ?: continue
                        val item = Arguments.createMap()
                        item.putString("startTime", row.startTime.toString())
                        item.putString("endTime", row.endTime.toString())
                        item.putDouble("count", count.toDouble())
                        steps.pushMap(item)
                    }
                    result.putString("stepsStart", stepsStart.toString())
                    result.putString("stepsEnd", now.toString())
                    result.putArray("steps", steps)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("HEALTH_SYNC_ERROR", "Health data 동기화 실패", e)
                promise.reject("HEALTH_SYNC_ERROR", e)
            }
        }
    }

    private class SyncBuffers {
        var heartRate: WritableArray = Arguments.createArray()
        var bloodPressure: WritableArray = Arguments.createArray()
        var oxygen: WritableArray = Arguments.createArray()
        var sleep: WritableArray = Arguments.createArray()
        val deleted: WritableArray = Arguments.createArray()

        // 토큰 만료로 다시 전부 읽을 때, 그 전에 모은 삭제 목록은 그대로 두고 나머지만 바꾼다.
        fun replaceWith(other: SyncBuffers) {
            heartRate = other.heartRate
            bloodPressure = other.bloodPressure
            oxygen = other.oxygen
            sleep = other.sleep
        }
    }

    // readRecords는 한 번에 최대 1000개라서 pageToken으로 끝까지 읽는다.
    private suspend fun <T : Record> readAll(
        client: HealthConnectClient,
        type: KClass<T>,
        start: Instant,
        end: Instant
    ): List<T> {
        val records = mutableListOf<T>()
        var pageToken: String? = null
        do {
            val response = client.readRecords(ReadRecordsRequest(
                recordType = type,
                timeRangeFilter = TimeRangeFilter.between(start, maxOf(end, start.plusMillis(1))),
                pageToken = pageToken
            ))
            records.addAll(response.records)
            pageToken = response.pageToken
        } while (!pageToken.isNullOrEmpty())
        return records
    }

    private suspend fun readRange(client: HealthConnectClient, start: Instant, end: Instant, buffers: SyncBuffers) {
        readAll(client, HeartRateRecord::class, start, end).forEach { collect(it, buffers) }
        readAll(client, BloodPressureRecord::class, start, end).forEach { collect(it, buffers) }
        readAll(client, OxygenSaturationRecord::class, start, end).forEach { collect(it, buffers) }
        readAll(client, SleepSessionRecord::class, start, end).forEach { collect(it, buffers) }
    }

    private fun collect(record: Record, buffers: SyncBuffers) {
        val id = record.metadata.id
        val origin = record.metadata.dataOrigin.packageName
        when (record) {
            is HeartRateRecord -> for (sample in record.samples) {
                val item = Arguments.createMap()
                item.putString("time", sample.time.toString())
                item.putDouble("bpm", sample.beatsPerMinute.toDouble())
                item.putString("recordId", id)
                item.putString("origin", origin)
                buffers.heartRate.pushMap(item)
            }
            is BloodPressureRecord -> {
                val item = Arguments.createMap()
                item.putString("time", record.time.toString())
                item.putDouble("systolic", record.systolic.inMillimetersOfMercury)
                item.putDouble("diastolic", record.diastolic.inMillimetersOfMercury)
                item.putString("recordId", id)
                item.putString("origin", origin)
                buffers.bloodPressure.pushMap(item)
            }
            is OxygenSaturationRecord -> {
                val item = Arguments.createMap()
                item.putString("time", record.time.toString())
                item.putDouble("percentage", record.percentage.value)
                item.putString("recordId", id)
                item.putString("origin", origin)
                buffers.oxygen.pushMap(item)
            }
            is SleepSessionRecord -> {
                val item = Arguments.createMap()
                item.putString("startTime", record.startTime.toString())
                item.putString("endTime", record.endTime.toString())
                item.putString("recordId", id)
                item.putString("origin", origin)
                buffers.sleep.pushMap(item)
            }
        }
    }

    companion object {
        private val SYNC_RECORD_TYPES: Set<KClass<out Record>> = setOf(
            HeartRateRecord::class,
            BloodPressureRecord::class,
            OxygenSaturationRecord::class,
            SleepSessionRecord::class,
            StepsRecord::class
        )
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

                val totalSteps = stepsResponse[StepsRecord.COUNT_TOTAL]
                if (totalSteps == null) result.putNull("stepsTotal")
                else result.putDouble("stepsTotal", totalSteps.toDouble())

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
                    item.putString("sourcePackage", record.metadata.dataOrigin.packageName)
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

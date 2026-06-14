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
import java.time.temporal.ChronoUnit

class HealthConnectModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "HealthConnectModule"
    }

    @ReactMethod
    fun getHealthData(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactContext)

                val endTime = Instant.now()
                val startTime7Days = endTime.minus(7, ChronoUnit.DAYS)
                val startTime24Hours = endTime.minus(24, ChronoUnit.HOURS)

                val result = Arguments.createMap()

                // 1. 걸음 수 총합
                val stepsResponse = client.aggregate(
                    AggregateRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(startTime7Days, endTime)
                    )
                )

                val totalSteps = stepsResponse[StepsRecord.COUNT_TOTAL] ?: 0L
                result.putDouble("stepsTotal", totalSteps.toDouble())

                // 2. 심박수 raw
                val heartRateResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = HeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime24Hours, endTime)
                    )
                )

                val heartRateSamples = Arguments.createArray()
                var latestHeartRate = 0L

                for (record in heartRateResponse.records) {
                    for (sample in record.samples) {
                        latestHeartRate = sample.beatsPerMinute

                        val item = Arguments.createMap()
                        item.putString("time", sample.time.toString())
                        item.putDouble("bpm", sample.beatsPerMinute.toDouble())
                        heartRateSamples.pushMap(item)
                    }
                }

                result.putDouble("latestHeartRate", latestHeartRate.toDouble())
                result.putArray("heartRateSamples", heartRateSamples)

                // 3. 산소포화도 raw
                val oxygenResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = OxygenSaturationRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime7Days, endTime)
                    )
                )

                val oxygenSamples = Arguments.createArray()
                var latestOxygen = 0.0

                for (record in oxygenResponse.records) {
                    latestOxygen = record.percentage.value

                    val item = Arguments.createMap()
                    item.putString("time", record.time.toString())
                    item.putDouble("percentage", record.percentage.value)
                    oxygenSamples.pushMap(item)
                }

                result.putDouble("latestOxygen", latestOxygen)
                result.putArray("oxygenSamples", oxygenSamples)

                // 4. 혈압 raw
                val bloodPressureResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = BloodPressureRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime7Days, endTime)
                    )
                )

                val bloodPressureSamples = Arguments.createArray()
                var latestSystolic = 0.0
                var latestDiastolic = 0.0

                for (record in bloodPressureResponse.records) {
                    latestSystolic = record.systolic.inMillimetersOfMercury
                    latestDiastolic = record.diastolic.inMillimetersOfMercury

                    val item = Arguments.createMap()
                    item.putString("time", record.time.toString())
                    item.putDouble("systolic", record.systolic.inMillimetersOfMercury)
                    item.putDouble("diastolic", record.diastolic.inMillimetersOfMercury)
                    bloodPressureSamples.pushMap(item)
                }

                result.putDouble("latestSystolic", latestSystolic)
                result.putDouble("latestDiastolic", latestDiastolic)
                result.putArray("bloodPressureSamples", bloodPressureSamples)

                // 5. 수면 raw
                val sleepResponse = client.readRecords(
                    ReadRecordsRequest(
                        recordType = SleepSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime7Days, endTime)
                    )
                )

                val sleepSessions = Arguments.createArray()
                var latestSleepHours = 0.0

                for (record in sleepResponse.records) {
                    val hours = Duration.between(record.startTime, record.endTime)
                        .toMinutes()
                        .toDouble() / 60.0

                    latestSleepHours = hours

                    val item = Arguments.createMap()
                    item.putString("startTime", record.startTime.toString())
                    item.putString("endTime", record.endTime.toString())
                    item.putDouble("hours", hours)
                    sleepSessions.pushMap(item)
                }

                result.putDouble("latestSleepHours", latestSleepHours)
                result.putArray("sleepSessions", sleepSessions)

                Log.d("HEALTH_DATA", result.toString())

                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("HEALTH_ERROR", "Health data 읽기 실패", e)
                promise.reject("HEALTH_ERROR", e)
            }
        }
    }
}
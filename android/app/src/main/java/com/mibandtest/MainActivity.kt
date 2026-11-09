package com.mibandtest

import com.facebook.react.ReactActivity
import com.facebook.react.bridge.Promise
import androidx.health.connect.client.PermissionController
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  private var healthPermissionPromise: Promise? = null
  private val healthPermissions = setOf(
    "android.permission.health.READ_STEPS",
    "android.permission.health.READ_HEART_RATE",
    "android.permission.health.READ_SLEEP",
    "android.permission.health.READ_BLOOD_PRESSURE",
    "android.permission.health.READ_OXYGEN_SATURATION"
  )
  private val healthPermissionLauncher = registerForActivityResult(
    PermissionController.createRequestPermissionResultContract()
  ) { granted ->
    healthPermissionPromise?.resolve(granted.containsAll(healthPermissions))
    healthPermissionPromise = null
  }

  fun requestHealthPermissions(promise: Promise) {
    if (healthPermissionPromise != null) {
      promise.reject("PERMISSION_BUSY", "권한 요청이 진행 중입니다.")
      return
    }
    healthPermissionPromise = promise
    try {
      healthPermissionLauncher.launch(healthPermissions)
    } catch (error: Exception) {
      healthPermissionPromise = null
      promise.reject("PERMISSION_ERROR", error)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "mibandtest"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}

package com.mibandtest

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

import com.mibandtest.HealthConnectPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
        context = applicationContext,
        useDevSupport = BuildConfig.DEBUG && !BuildConfig.BUNDLED_TEST_APP,
        packageList =
            PackageList(this).packages.apply {
                add(HealthConnectPackage())
            },
    )
}

  override fun onCreate() {
    super.onCreate()
    // 앱 글꼴. res/font/pretendard.xml의 굵기를 fontWeight로 고를 수 있게 등록한다.
    ReactFontManager.getInstance().addCustomFont(this, "Pretendard", R.font.pretendard)
    loadReactNative(this)
  }
}

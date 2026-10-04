plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.compose") }
android { namespace="ai.nexora.mobile"; compileSdk=35
 defaultConfig { applicationId="ai.nexora.mobile"; minSdk=26; targetSdk=35; versionCode=1; versionName="1.0" }
}
dependencies {
 implementation("androidx.core:core-ktx:1.15.0")
 implementation("androidx.activity:activity-compose:1.10.1")
 implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
 implementation("androidx.compose.material3:material3:1.3.1")
 implementation("androidx.compose.ui:ui:1.7.8")
 implementation("androidx.navigation:navigation-compose:2.8.7")
 implementation("androidx.work:work-runtime-ktx:2.10.0")
 implementation("com.squareup.okhttp3:okhttp:4.12.0")
 implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1")
}
